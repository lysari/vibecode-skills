import { Activity } from '../interfaces/activity.interface';
import { DailyFocus } from '../interfaces/daily-focus.interface';
import { Trainer } from '../interfaces/trainer.interface';

export const DAILY_FOCUS: DailyFocus = {
  title: 'Power Sculpt',
  coach: 'Coach Kathy',
  minutes: 20,
};

export const ACTIVITY: Activity = {
  steps: { value: 3280, goal: 8000, unit: 'steps' },
  move: { value: 460, goal: 500, unit: 'kcal' },
  exercise: { value: 20, goal: 30, unit: 'min' },
};

export const FOLLOWED_TRAINERS: Trainer[] = [
  { id: 'kathy', name: 'Kathy Moore', specialty: 'Strength', classCount: 42 },
  { id: 'marco', name: 'Marco Diaz', specialty: 'HIIT', classCount: 31 },
  { id: 'aya', name: 'Aya Tanaka', specialty: 'Yoga', classCount: 58 },
  { id: 'sam', name: 'Sam Okafor', specialty: 'Cycling', classCount: 24 },
];
