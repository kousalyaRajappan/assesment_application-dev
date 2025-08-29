import React, { useState } from 'react';

function LoginForm({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)'
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          padding: '32px 40px',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(37,99,235,0.15)',
          minWidth: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <img src="https://img.icons8.com/fluency/96/000000/lock.png" alt="Login" style={{ marginBottom: 16 }} />
        <h2 style={{ marginBottom: 24, color: '#2563eb', fontWeight: 700 }}>Assessment System Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 16,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 16
          }}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{
            width: '100%',
            padding: 10,
            marginBottom: 24,
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            fontSize: 16
          }}
          required
        />
        <button
          type="submit"
          style={{
            width: '100%',
            padding: 12,
            background: 'linear-gradient(90deg, #2563eb 60%, #38bdf8 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(37,99,235,0.10)'
          }}
        >
          Login
        </button>
      </form>
    </div>
  );
}
export default LoginForm;