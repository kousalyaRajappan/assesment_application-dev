import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleMessage = (event) => {

     
      console.log(event.data?.type);
      if (event.data?.type === "LOGIN_SUCCESS") {
        console.log("LOGIN_SUCCESS detected, role:", event.data.role);
        localStorage.setItem("role", JSON.stringify(event.data.role));

        if (event.data.role === "admin") {
          const adminUser = { role: "admin", username: event.data.admin?.username };

          localStorage.setItem("currentUser", JSON.stringify(adminUser));
          navigate("/admin");
        } else if (event.data.role === "student") {
          localStorage.setItem("currentUser", JSON.stringify(event.data.student));
          console.log("Student logged in, data:", event.data.student);
          navigate("/student");
        }
      } else if (event.data?.type === "LOGIN_FAILED") {
      // handle failed login
      console.log("Login failed, staying on login page");
      navigate("/"); // stay on login
    }


    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2563eb 0%, #38bdf8 100%)'
    }}>
      <iframe
        src="/assessment_management_app_v2.html"
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
