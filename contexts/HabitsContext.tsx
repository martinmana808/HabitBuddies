import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, DailyHabits } from '../types/habits';
import { defaultHabits } from '../constants/defaultHabits';

interface HabitsContextType {
  habits: Habit[];
  isLoading: boolean;
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

  const STORAGE_KEY = 'dailyHabits';

  const getTodayKey = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  };

  const loadHabits = useCallback(async () => {
    try {
      const todayKey = getTodayKey();
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data: DailyHabits = JSON.parse(stored);
        if (data.date === todayKey) {
          setHabits(data.habits);
        } else {
          // New day, reset with default habits
          setHabits(defaultHabits);
          await saveHabits(defaultHabits);
        }
      } else {
        setHabits(defaultHabits);
        await saveHabits(defaultHabits);
      }
    } catch (error) {
      console.error('Error loading habits:', error);
      setHabits(defaultHabits);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveHabits = useCallback(async (habitsToSave: Habit[]) => {
    try {
      const data: DailyHabits = {
        date: getTodayKey(),
        habits: habitsToSave,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving habits:', error);
    }
  }, []);

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
      return updated;
    });
  }, [saveHabits]);

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
  }, [saveHabits]);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const value: HabitsContextType = {
    habits,
    isLoading,
    toggleHabit,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    resetDailyHabits,
  };

  return <HabitsContext.Provider value={value}>{children}</HabitsContext.Provider>;
};
