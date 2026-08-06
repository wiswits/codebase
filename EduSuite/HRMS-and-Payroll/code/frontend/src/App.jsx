// frontend/src/App.jsx
import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';

const API_URL = 'https://hrms-portal-backend-neha.onrender.com';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <ThemeProvider>
      <ToastProvider>
        {isAuthenticated ? (
          <Dashboard user={user} onLogout={handleLogout} />
        ) : (
          <Login onLogin={handleLogin} />
        )}
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;