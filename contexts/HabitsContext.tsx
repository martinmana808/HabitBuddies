import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../constants/supabase';
import { Habit, DailyHabits } from '../types/habits';
import { defaultHabits } from '../constants/defaultHabits';
import NetInfo from '@react-native-community/netinfo';

interface HabitsContextType {
  habits: Habit[];
  isLoading: boolean;
  isOnline: boolean;
  toggleHabit: (habitId: string, person: 'martin' | 'elise') => void;
  addHabit: (name: string, person: 'martin' | 'elise' | 'both') => void;
  updateHabit: (id: string, name: string, person: 'martin' | 'elise' | 'both') => void;
  deleteHabit: (id: string) => void;
  reorderHabits: (fromIndex: number, toIndex: number) => void;
  resetDailyHabits: () => void;
}

const HabitsContext = createContext<HabitsContextType | undefined>(undefined);

export const useHabits = () => {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
};

export const HabitsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(false);

  // Check online status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  const STORAGE_KEY = 'dailyHabits';

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const syncHabitsToSupabase = useCallback(async (habitsToSync: Habit[]) => {
    try {
      const todayKey = getTodayKey();
      const { error } = await supabase
        .from('daily_habits')
        .upsert({
          date: todayKey,
          habits: habitsToSync,
          user_id: 'shared' // For now, using a shared user for both
        });
      if (error) {
        console.error('Error syncing to Supabase:', error);
      }
    } catch (error) {
      console.error('Error syncing habits to Supabase:', error);
    }
  }, []);

  const loadHabitsFromSupabase = useCallback(async () => {
    try {
      const todayKey = getTodayKey();
      const { data, error } = await supabase
        .from('daily_habits')
        .select('habits')
        .eq('date', todayKey)
        .eq('user_id', 'shared')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading from Supabase:', error);
        return null;
      }

      return data?.habits || null;
    } catch (error) {
      console.error('Error loading habits from Supabase:', error);
      return null;
    }
  }, []);

  const loadHabits = useCallback(async () => {
    try {
      const todayKey = getTodayKey();
      let habitsToLoad = defaultHabits;

      // Try to load from Supabase first if online
      if (isOnline) {
        const supabaseHabits = await loadHabitsFromSupabase();
        if (supabaseHabits) {
          habitsToLoad = supabaseHabits;
        }
      }

      // Fallback to AsyncStorage
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: DailyHabits = JSON.parse(stored);
        if (data.date === todayKey) {
          habitsToLoad = data.habits;
        }
      }

      // If it's a new day, reset with default habits
      const storedDate = stored ? JSON.parse(stored).date : null;
      if (storedDate !== todayKey) {
        habitsToLoad = defaultHabits;
      }

      setHabits(habitsToLoad);
      await saveHabits(habitsToLoad);
      setIsOnline(false); // Mark as offline since Supabase failed
    } catch (error) {
      console.error('Error loading habits:', error);
      setHabits(defaultHabits);
    } finally {
      setIsLoading(false);
    }
  }, [isOnline, loadHabitsFromSupabase]);

  const saveHabits = useCallback(async (habitsToSave: Habit[]) => {
    try {
      const data: DailyHabits = {
        date: getTodayKey(),
        habits: habitsToSave,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      // Also sync to Supabase if online
      if (isOnline) {
        await syncHabitsToSupabase(habitsToSave);
      }
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  }, [isOnline, syncHabitsToSupabase]);

  const toggleHabit = useCallback((habitId: string, person: 'martin' | 'elise') => {
    setHabits(prev => {
      const updated = prev.map(habit =>
        habit.id === habitId
          ? {
              ...habit,
              completed: {
                ...habit.completed,
                [person]: !habit.completed[person],
              },
            }
          : habit
      );
      saveHabits(updated);
        syncHabitsToSupabase(updated);
      }
      return updated;
    });
  }, [saveHabits, isOnline]);

  const addHabit = useCallback((name: string, person: 'martin' | 'elise' | 'both') => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      person,
      completed: { martin: false, elise: false },
    };
    setHabits(prev => {
      const updated = [...prev, newHabit];
      saveHabits(updated);
      return updated;
    });
  }, [saveHabits]);

  const updateHabit = useCallback((id: string, name: string, person: 'martin' | 'elise' | 'both') => {
    setHabits(prev => {
      const updated = prev.map(habit =>
        habit.id === id ? { ...habit, name, person } : habit
      );
      saveHabits(updated);
      return updated;
    });
  }, [saveHabits]);

  const deleteHabit = useCallback((id: string) => {
    setHabits(prev => {
      const updated = prev.filter(habit => habit.id !== id);
      saveHabits(updated);
      return updated;
    });
  }, [saveHabits]);

  const reorderHabits = useCallback((fromIndex: number, toIndex: number) => {
    setHabits(prev => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      saveHabits(updated);
      return updated;
    });
  }, [saveHabits]);

  const resetDailyHabits = useCallback(() => {
    setHabits(defaultHabits);
    saveHabits(defaultHabits);
    // Sync to Supabase if online
    if (isOnline) {
      syncHabitsToSupabase(defaultHabits);
    }
  }, [saveHabits, isOnline]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const value: HabitsContextType = {
    habits,
    isLoading,
    isOnline,
    toggleHabit,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    resetDailyHabits,
  };

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
};
