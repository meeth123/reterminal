import { useRotation } from '../../hooks/useRotation';
import { tabs, ROTATION_INTERVAL_SECONDS } from '../../config/tabs';
import { Shell } from '../Layout/Shell';

export function RotationManager() {
  const { activeIndex } = useRotation({
    totalItems: tabs.length,
    intervalSeconds: ROTATION_INTERVAL_SECONDS,
    enabled: tabs.length > 1,
  });

  const activeTab = tabs[activeIndex];
  const ActiveComponent = activeTab.component;

  return (
    <Shell tabs={tabs} activeTabId={activeTab.id}>
      <ActiveComponent />
    </Shell>
  );
}
