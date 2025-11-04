import { Stack } from 'expo-router';
import { HabitsProvider } from '../contexts/HabitsContext';

export default function RootLayout() {
  return (
    <HabitsProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Habit Buddies',
            headerStyle: {
              backgroundColor: '#6366f1',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
      </Stack>
    </HabitsProvider>
  );
}
