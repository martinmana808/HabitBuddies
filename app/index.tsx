import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHabits } from '../contexts/HabitsContext';
import { colors } from '../constants/colors';
import { Person } from '../types/habits';

const { width: screenWidth } = Dimensions.get('window');

export default function Index() {
  const { habits, isLoading, toggleHabit, addHabit, updateHabit, deleteHabit, reorderHabits } = useHabits();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [habitName, setHabitName] = useState('');
  const [habitPerson, setHabitPerson] = useState<Person>('both');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [panResponders, setPanResponders] = useState<any[]>([]);

  const scrollViewRef = useRef<ScrollView>(null);
  const panValues = useRef<Animated.Value[]>([]);

  const getPersonColor = (person: Person) => {
    switch (person) {
      case 'martin':
        return colors.martin;
      case 'elise':
        return colors.elise;
      case 'both':
        return colors.both;
    }
  };

  const getPersonName = (person: Person) => {
    switch (person) {
      case 'martin':
        return 'Martin';
      case 'elise':
        return 'Elise';
      case 'both':
        return 'Both';
    }
  };

  const calculateProgress = () => {
    if (habits.length === 0) return { martin: 0, elise: 0 };

    let martinCompleted = 0;
    let eliseCompleted = 0;
    let martinTotal = 0;
    let eliseTotal = 0;

    habits.forEach(habit => {
      if (habit.person === 'martin' || habit.person === 'both') {
        martinTotal++;
        if (habit.completed.martin) martinCompleted++;
      }
      if (habit.person === 'elise' || habit.person === 'both') {
        eliseTotal++;
        if (habit.completed.elise) eliseCompleted++;
      }
    });

    return {
      martin: martinTotal > 0 ? Math.round((martinCompleted / martinTotal) * 100) : 0,
      elise: eliseTotal > 0 ? Math.round((eliseCompleted / eliseTotal) * 100) : 0,
    };
  };

  const progress = calculateProgress();

  const openAddModal = () => {
    setEditingHabit(null);
    setHabitName('');
    setHabitPerson('both');
    setModalVisible(true);
  };

  const openEditModal = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setEditingHabit(habitId);
      setHabitName(habit.name);
      setHabitPerson(habit.person);
      setModalVisible(true);
    }
  };

  const handleSaveHabit = () => {
    if (habitName.trim()) {
      if (editingHabit) {
        updateHabit(editingHabit, habitName.trim(), habitPerson);
      } else {
        addHabit(habitName.trim(), habitPerson);
      }
      setModalVisible(false);
    }
  };

  const handleDeleteHabit = () => {
    if (editingHabit) {
      Alert.alert(
        'Delete Habit',
        'Are you sure you want to delete this habit?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              deleteHabit(editingHabit);
              setModalVisible(false);
            },
          },
        ]
      );
    }
  };

  const startDrag = useCallback((index: number) => {
    setDraggingIndex(index);
  }, []);

  const handleDragMove = useCallback((gestureState: any, index: number) => {
    if (draggingIndex === null) return;

    const { dy } = gestureState;
    const itemHeight = 60; // Approximate height of each habit row
    const newIndex = Math.max(0, Math.min(habits.length - 1, draggingIndex + Math.round(dy / itemHeight)));

    if (newIndex !== draggingIndex) {
      reorderHabits(draggingIndex, newIndex);
      setDraggingIndex(newIndex);
    }
  }, [draggingIndex, habits.length, reorderHabits]);

  const endDrag = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  useEffect(() => {
    const responders = habits.map((_, index) => {
      return PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => startDrag(index),
        onPanResponderMove: (_, gestureState) => handleDragMove(gestureState, index),
        onPanResponderRelease: endDrag,
        onPanResponderTerminate: endDrag,
      });
    });
    setPanResponders(responders);
  }, [habits, startDrag, handleDragMove, endDrag]);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <Text style={{ fontSize: 18, color: colors.text }}>Loading habits...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header with Progress */}
      <View style={{ padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Today's Progress</Text>
          <TouchableOpacity
            onPress={openAddModal}
            style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, color: colors.martin, fontWeight: '600' }}>Martin</Text>
              <Text style={{ fontSize: 14, color: colors.martin, fontWeight: '600' }}>{progress.martin}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
              <View
                style={{
                  height: 8,
                  width: `${progress.martin}%`,
                  backgroundColor: colors.martin,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>

          <View style={{ flex: 1, marginLeft: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 14, color: colors.elise, fontWeight: '600' }}>Elise</Text>
              <Text style={{ fontSize: 14, color: colors.elise, fontWeight: '600' }}>{progress.elise}%</Text>
            </View>
            <View style={{ height: 8, backgroundColor: colors.border, borderRadius: 4 }}>
              <View
                style={{
                  height: 8,
                  width: `${progress.elise}%`,
                  backgroundColor: colors.elise,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Table Header */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flex: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.text }}>Habit</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.martin }}>Martin</Text>
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.elise }}>Elise</Text>
        </View>
      </View>

      {/* Habits List */}
      <ScrollView ref={scrollViewRef} style={{ flex: 1 }}>
        {habits.map((habit, index) => {
          const isDragging = draggingIndex === index;
          const panResponder = panResponders[index];

          return (
            <View
              key={habit.id}
              {...(panResponder && panResponder.panHandlers)}
              style={{
                flexDirection: 'row',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: isDragging ? colors.surface : colors.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                opacity: isDragging ? 0.8 : 1,
              }}
            >
              <TouchableOpacity
                style={{ flex: 2, justifyContent: 'center' }}
                onPress={() => openEditModal(habit.id)}
                onLongPress={() => startDrag(index)}
                delayLongPress={500}
              >
                <Text style={{ fontSize: 16, color: getPersonColor(habit.person), fontWeight: '500' }}>
                  {habit.name}
                </Text>
              </TouchableOpacity>

              {/* Martin Checkbox - Always rendered for alignment */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {(habit.person === 'martin' || habit.person === 'both') ? (
                  <TouchableOpacity
                    onPress={() => toggleHabit(habit.id, 'martin')}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: colors.martin,
                      backgroundColor: habit.completed.martin ? colors.martin : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {habit.completed.martin && (
                      <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  // Invisible placeholder to maintain alignment
                  <View style={{ width: 32, height: 32 }} />
                )}
              </View>

              {/* Elise Checkbox - Always rendered for alignment */}
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                {(habit.person === 'elise' || habit.person === 'both') ? (
                  <TouchableOpacity
                    onPress={() => toggleHabit(habit.id, 'elise')}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderColor: colors.elise,
                      backgroundColor: habit.completed.elise ? colors.elise : 'transparent',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    {habit.completed.elise && (
                      <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>✓</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  // Invisible placeholder to maintain alignment
                  <View style={{ width: 32, height: 32 }} />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20, width: screenWidth * 0.9, minHeight: 420 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
              {editingHabit ? 'Edit Habit' : 'Add New Habit'}
            </Text>

            <TextInput
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 8,
                padding: 12,
                fontSize: 16,
                marginBottom: 20,
              }}
              placeholder="Habit name"
              value={habitName}
              onChangeText={setHabitName}
            />

            <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 12 }}>Who does this habit?</Text>
            <View style={{ flexDirection: 'row', marginBottom: 30 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: habitPerson === 'martin' ? colors.martin : colors.border,
                  backgroundColor: habitPerson === 'martin' ? colors.martin + '20' : 'transparent',
                  marginRight: 8,
                  alignItems: 'center',
                }}
                onPress={() => setHabitPerson('martin')}
              >
                <Text style={{ fontSize: 16, color: habitPerson === 'martin' ? colors.martin : colors.text }}>Martin</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: habitPerson === 'both' ? colors.both : colors.border,
                  backgroundColor: habitPerson === 'both' ? colors.both + '20' : 'transparent',
                  marginHorizontal: 4,
                  alignItems: 'center',
                }}
                onPress={() => setHabitPerson('both')}
              >
                <Text style={{ fontSize: 16, color: habitPerson === 'both' ? colors.both : colors.text }}>Both</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: habitPerson === 'elise' ? colors.elise : colors.border,
                  backgroundColor: habitPerson === 'elise' ? colors.elise + '20' : 'transparent',
                  marginLeft: 8,
                  alignItems: 'center',
                }}
                onPress={() => setHabitPerson('elise')}
              >
                <Text style={{ fontSize: 16, color: habitPerson === 'elise' ? colors.elise : colors.text }}>Elise</Text>
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: colors.border,
                    padding: 12,
                    borderRadius: 8,
                    marginRight: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={{ fontSize: 16, color: colors.text }}>Cancel</Text>
                </TouchableOpacity>

                {editingHabit && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: colors.error,
                      padding: 12,
                      borderRadius: 8,
                      marginLeft: 8,
                      alignItems: 'center',
                    }}
                    onPress={handleDeleteHabit}
                  >
                    <Text style={{ fontSize: 16, color: 'white' }}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: colors.primary,
                  padding: 16,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={handleSaveHabit}
              >
                <Text style={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
