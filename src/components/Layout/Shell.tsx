import type { ReactNode } from 'react';

interface ShellProps {
  children: ReactNode;
  activeTabLabel?: string;
  tabs?: { id: string; label: string }[];
  activeTabId?: string;
}

export function Shell({ children, tabs, activeTabId }: ShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Header with tab indicators */}
      {tabs && tabs.length > 1 && (
        <header className="bg-slate-800 text-white px-4 py-2">
          <nav className="flex gap-4">
            {tabs.map((tab) => (
              <span
                key={tab.id}
                className={`text-sm font-medium px-3 py-1 rounded ${
                  tab.id === activeTabId
                    ? 'bg-white text-slate-800'
                    : 'text-slate-300'
                }`}
              >
                {tab.label}
              </span>
            ))}
          </nav>
        </header>
      )}

      {/* Main content */}
      <main className="flex-1 p-4">
        {children}
      </main>

      {/* Footer with timestamp */}
      <footer className="bg-slate-100 border-t border-slate-200 px-4 py-2 text-xs text-slate-500">
        Last updated: {new Date().toLocaleTimeString()}
      </footer>
    </div>
  );
}
