import type { ComponentType } from 'react';
import { CalendarWidgetNoTouch } from '../components/Widgets/CalendarWidgetNoTouch';

export interface TabConfig {
  id: string;
  label: string;
  component: ComponentType;
}

// Tab rotation interval in seconds (10 minutes)
export const ROTATION_INTERVAL_SECONDS = 600;

// Configure your tabs here
// Add new tabs by importing the widget component and adding to this array
// Using CalendarWidgetNoTouch for reTerminal E1002 (no touch screen support)
export const tabs: TabConfig[] = [
  {
    id: 'calendar',
    label: 'Calendar',
    component: CalendarWidgetNoTouch,
  },
  // Future tabs can be added here:
  // { id: 'weather', label: 'Weather', component: WeatherWidget },
  // { id: 'tasks', label: 'Tasks', component: TasksWidget },
];
