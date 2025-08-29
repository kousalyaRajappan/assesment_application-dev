import React, { useState } from 'react';
import AssessmentSystem from './AssessmentSystem';
import LoginForm from './LoginForm';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState('');

  const handleLogin = (username, password) => {
    // Only allow admin/admin@123 to access admin module
    if (username === 'admin' && password === 'admin@123') {
      setIsAuthenticated(true);
      setRole('admin');
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div>
      {!isAuthenticated ? (
        <LoginForm onLogin={handleLogin} />
      ) : (
        <AssessmentSystem role={role} />
      )}
    </div>
  );
}

export default App;