import React from 'react';

function LoginForm() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)'
    }}>
      <iframe
        src="/enhanced_assessment_system.html"
        title="Enhanced Assessment System"
        style={{
          width: 1200,
          height: 900,
          border: 'none',
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(37,99,235,0.15)'
        }}
      />
    </div>
  );
}

export default LoginForm;