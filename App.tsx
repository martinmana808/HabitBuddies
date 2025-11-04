import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { HabitsProvider } from './contexts/HabitsContext';
import Index from './app/index';

export default function App() {
  return (
    <SafeAreaProvider>
      <HabitsProvider>
        <Index />
      </HabitsProvider>
    </SafeAreaProvider>
  );
}
