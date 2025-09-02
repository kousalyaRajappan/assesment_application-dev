import React from 'react';
import AssessmentSystem from './assessment-management-preview.tsx';
import StudentRegistrationForm from './student_registration_form_latest.tsx';
import LoginForm from './LoginForm';
import { BrowserRouter, Routes, Route } from "react-router-dom";



function App() {
  
  return (
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<AssessmentSystem />} />
        <Route path='/register' element={<StudentRegistrationForm/>}/>
        
        <Route path="/admin" element={<AssessmentSystem role="admin" />} />
            <Route path="/student" element={<AssessmentSystem role="student" />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;