export interface ActivityGoal {
  value: number;
  goal: number;
  unit: string;
}

export interface Activity {
  steps: ActivityGoal;
  move: ActivityGoal;
  exercise: ActivityGoal;
}
