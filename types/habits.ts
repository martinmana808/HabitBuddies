export type Person = 'martin' | 'elise' | 'both';

export interface Habit {
  id: string;
  name: string;
  person: Person;
  completed: {
    martin: boolean;
    elise: boolean;
  };
}

export interface DailyHabits {
  date: string; // YYYY-MM-DD
  habits: Habit[];
}
