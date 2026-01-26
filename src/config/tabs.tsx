import type { ComponentType } from 'react';
import { CalendarWidget } from '../components/Widgets/CalendarWidget';

export interface TabConfig {
  id: string;
  label: string;
  component: ComponentType;
}

// Tab rotation interval in seconds (10 minutes)
export const ROTATION_INTERVAL_SECONDS = 600;

// Configure your tabs here
// Add new tabs by importing the widget component and adding to this array
export const tabs: TabConfig[] = [
  {
    id: 'calendar',
    label: 'Calendar',
    component: CalendarWidget,
  },
  // Future tabs can be added here:
  // { id: 'weather', label: 'Weather', component: WeatherWidget },
  // { id: 'tasks', label: 'Tasks', component: TasksWidget },
];
