import React, { useState } from 'react';
import { ToastProvider } from './components/ui/Toast';
import { Home } from './pages/Home';
import { EditorPage } from './pages/EditorPage';
import { getCurrentUser } from './lib/auth';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getCurrentUser());

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleUserReady = () => {
    setIsAuthenticated(true);
  };

  return (
    <ToastProvider>
      {isAuthenticated ? (
        <EditorPage onLogout={handleLogout} />
      ) : (
        <Home onSelectDocument={() => {}} onUserReady={handleUserReady} />
      )}
    </ToastProvider>
  );
};

export default App;