import { Component } from '@angular/core';
import { ACTIVITY, DAILY_FOCUS, FOLLOWED_TRAINERS } from '../../shared/constants/today';
import { ActivityGoal } from '../../shared/interfaces/activity.interface';

@Component({
  selector: 'app-today',
  styleUrl: './today.scss',
  templateUrl: './today.html',
})
export class Today {
  protected readonly dailyFocus = DAILY_FOCUS;
  protected readonly activity = ACTIVITY;
  protected readonly trainers = FOLLOWED_TRAINERS;

  protected readonly activityLabel = `Activity: ${[
    this.activity.steps,
    this.activity.move,
    this.activity.exercise,
  ]
    .map((goal) => `${goal.value} of ${goal.goal} ${goal.unit}`)
    .join(', ')}`;

  protected percentOf(goal: ActivityGoal): number {
    return Math.min(100, Math.round((goal.value / goal.goal) * 100));
  }
}
