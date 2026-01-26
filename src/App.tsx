import { useState, useEffect } from 'react';
import { RotationManager } from './components/Rotation/RotationManager';
import { DebugOverlay } from './components/Debug/DebugOverlay';
import { DiagnosticPage } from './pages/DiagnosticPage';

function App() {
  const [showDebug, setShowDebug] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Simple routing
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Toggle debug overlay with keyboard shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebug(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Route to diagnostic page
  if (currentPath === '/diagnostic') {
    return <DiagnosticPage />;
  }

  return (
    <>
      <RotationManager />
      {showDebug && <DebugOverlay />}

      {/* Debug toggle button - visible on error or double-click corner */}
      <div
        onDoubleClick={() => setShowDebug(true)}
        className="fixed bottom-0 right-0 w-16 h-16 cursor-pointer"
        title="Double-click to open debug console"
      />
    </>
  );
}

export default App;
