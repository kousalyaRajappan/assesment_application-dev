import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebaseConfig";

const StudentRegistrationForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [otpData, setOtpData] = useState({
    otp: '',
    generatedOtp: '',
    isOtpSent: false,
    isOtpVerified: false,
    otpTimer: 0
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errors, setErrors] = useState({});

  const steps = [
    { 
      id: 'firstName', 
      title: '👋 Welcome! Let\'s start with your first name', 
      subtitle: 'What should we call you?',
      type: 'text', 
      field: 'firstName',
      placeholder: 'Enter your first name'
    },
    { 
      id: 'lastName', 
      title: 'What\'s your last name?', 
      subtitle: 'Please enter your family name',
      type: 'text', 
      field: 'lastName',
      placeholder: 'Enter your last name'
    },
    { 
      id: 'mobile', 
      title: '📱 What\'s your mobile number?', 
      subtitle: 'We need this to verify your account',
      type: 'tel', 
      field: 'mobile',
      placeholder: 'Enter your mobile number'
    },
    { 
      id: 'email', 
      title: '📧 What\'s your email address?', 
      subtitle: 'We\'ll use this to send you important updates',
      type: 'email', 
      field: 'email',
      placeholder: 'Enter your email address'
    },
    { 
      id: 'otp', 
      title: '🔐 Enter the verification code', 
      subtitle: 'We sent a 6-digit code to your mobile',
      type: 'otp', 
      field: 'otp',
      placeholder: 'Enter verification code'
    },
    { 
      id: 'password', 
      title: '🔒 Create a secure password', 
      subtitle: 'Make it strong and confirm it to keep your account safe',
      type: 'password', 
      field: 'password',
      placeholder: 'Enter your password'
    }
  ];

  // Check if email or mobile already exists
  const checkIfUserExists = async (email, mobile) => {
    try {
      // Check email
      const emailQuery = query(collection(db, "students"), where("email", "==", email));
      const emailSnapshot = await getDocs(emailQuery);
      
      // Check mobile
      const mobileQuery = query(collection(db, "students"), where("mobile", "==", mobile));
      const mobileSnapshot = await getDocs(mobileQuery);
      
      return {
        emailExists: !emailSnapshot.empty,
        mobileExists: !mobileSnapshot.empty
      };
    } catch (error) {
      console.error("Error checking user existence:", error);
      return { emailExists: false, mobileExists: false };
    }
  };

  // Save student to Firebase
  const saveStudentToFirebase = async () => {
    setIsSubmitting(true);
    setErrors({});
    
    try {
      // Check if user already exists
      const { emailExists, mobileExists } = await checkIfUserExists(formData.email, formData.mobile);
      
      if (emailExists || mobileExists) {
        setErrors({
          duplicate: `${emailExists ? 'Email' : ''}${emailExists && mobileExists ? ' and ' : ''}${mobileExists ? 'Mobile number' : ''} already registered`
        });
        setIsSubmitting(false);
        return false;
      }

      // Create student document
      const studentData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        fullName: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
        email: formData.email.toLowerCase().trim(),
        mobile: formData.mobile.trim(),
        // Note: In production, hash the password before storing
        password: formData.password, // Consider using bcrypt or similar for hashing
        username: formData.email.toLowerCase().trim(), // Use email as username
        role: 'student',
        isActive: true,
        isEmailVerified: true, // Since we verified mobile, we can set this
        isMobileVerified: true,
        registrationDate: new Date().toISOString(),
        lastLogin: null,
        profilePicture: null,
        dateOfBirth: null,
        address: null,
        coursesEnrolled: [],
        assessmentsTaken: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to Firestore
      const docRef = await addDoc(collection(db, "students"), studentData);
      console.log("Student registered with ID:", docRef.id);
      
      setIsSubmitting(false);
      return true;
    } catch (error) {
      console.error("Error saving student to Firebase:", error);
      setErrors({ 
        firebase: "Failed to save registration. Please try again." 
      });
      setIsSubmitting(false);
      return false;
    }
  };

  // Password strength checker
  const getPasswordStrength = (password) => {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    
    const score = Object.values(checks).filter(Boolean).length;
    return { checks, score };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  // OTP Timer
  useEffect(() => {
    let interval = null;
    if (otpData.otpTimer > 0) {
      interval = setInterval(() => {
        setOtpData(prev => ({
          ...prev,
          otpTimer: prev.otpTimer - 1
        }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpData.otpTimer]);

  // Validation functions
  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateMobile = (mobile) => {
    return /^[6-9]\d{9}$/.test(mobile.replace(/\D/g, ''));
  };

  const validateStep = (step) => {
    const currentStepData = steps[step];
    
    switch (currentStepData.id) {
      case 'firstName':
        return formData.firstName.trim() !== '';
      case 'lastName':
        return formData.lastName.trim() !== '';
      case 'email':
        return formData.email && validateEmail(formData.email);
      case 'mobile':
        return formData.mobile && validateMobile(formData.mobile);
      case 'otp':
        return otpData.isOtpVerified;
      case 'password':
        return formData.password && formData.confirmPassword && passwordStrength.score >= 3 && formData.password === formData.confirmPassword;
      default:
        return true;
    }
  };

  const handleInputChange = (field, value) => {
    if (field === 'mobile') {
      const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({ ...prev, [field]: cleanedValue }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear errors when user starts typing
    if (errors.duplicate || errors.firebase) {
      setErrors({});
    }
  };

  const generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpData(prev => ({
      ...prev,
      generatedOtp: otp,
      isOtpSent: true,
      otpTimer: 60
    }));
    
    alert(`OTP sent to ${formData.mobile}: ${otp}`);
  };

  const verifyOtp = () => {
    if (otpData.otp === otpData.generatedOtp) {
      setOtpData(prev => ({ ...prev, isOtpVerified: true }));
    }
  };

  const handleContinue = async () => {
    const currentStepData = steps[currentStep];
    
    // Auto-send OTP when mobile step is valid
    if (currentStepData.id === 'mobile' && validateStep(currentStep)) {
      generateOtp();
    }
    
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - save to Firebase
        const success = await saveStudentToFirebase();
        if (success) {
          setIsCompleted(true);
        }
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleContinue();
    }
  };

  const resetForm = () => {
    setIsCompleted(false);
    setCurrentStep(0);
    setIsSubmitting(false);
    setFormData({
      firstName: '', lastName: '', mobile: '', email: '', password: '', confirmPassword: ''
    });
    setOtpData({
      otp: '', generatedOtp: '', isOtpSent: false, isOtpVerified: false, otpTimer: 0
    });
    setErrors({});
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="bg-white rounded-3xl shadow-xl p-16 max-w-2xl w-full text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-semibold text-gray-800 mb-4 font-sans">🎉 Welcome aboard, {formData.firstName}!</h1>
            <p className="text-lg text-gray-600 mb-6 font-sans">Your student registration has been completed successfully.</p>
            <p className="text-sm text-gray-500 mb-10 font-sans">
              You can now login with email: <strong>{formData.email}</strong>
            </p>
            <div className="space-x-4">
              <button 
                onClick={() => navigate('/')}
                className="bg-purple-600 text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-purple-700 transition-colors shadow-lg font-sans"
              >
                Go to Login
              </button>
              <button 
                onClick={resetForm}
                className="bg-gray-600 text-white px-8 py-4 rounded-xl text-base font-medium hover:bg-gray-700 transition-colors shadow-lg font-sans"
              >
                Register Another Student
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;
  const canContinue = validateStep(currentStep) && !isSubmitting;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-2xl w-full">
          
          {/* Header */}
          <div className="px-12 pt-12 pb-8 text-center">
            <h1 className="text-2xl font-semibold text-purple-600 mb-2 font-sans">Student Registration System</h1>
            <p className="text-gray-600 text-base font-sans">Comprehensive platform for student enrollment</p>
            
            {/* Back to Login Link */}
            <button
              onClick={() => navigate('/')}
              className="text-purple-600 hover:text-purple-800 text-sm font-medium mt-2 underline"
            >
              ← Back to Login
            </button>
          </div>

          {/* Progress */}
          <div className="px-12 mb-8">
            <div className="text-center mb-4">
              <span className="text-gray-500 text-base font-sans">Step {currentStep + 1} of {steps.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Error Messages */}
          {(errors.duplicate || errors.firebase) && (
            <div className="px-12 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-700 font-medium flex items-center font-sans text-sm">
                  <X className="w-5 h-5 mr-2" />
                  {errors.duplicate || errors.firebase}
                </p>
              </div>
            </div>
          )}

          {/* Question */}
          <div className="px-12 mb-12">
            <h2 className="text-xl font-semibold text-gray-800 mb-3 leading-tight font-sans">
              {currentStepData.title}
            </h2>
            <p className="text-base text-gray-600 font-sans">
              {currentStepData.subtitle}
            </p>
          </div>

          {/* Input Section */}
          <div className="px-12 mb-12">
            {currentStepData.id === 'otp' ? (
              <div>
                {!otpData.isOtpSent ? (
                  <div className="text-center py-8">
                    <p className="text-base text-gray-600 mb-6 font-sans">
                      We'll send a verification code to {formData.mobile}
                    </p>
                    <button
                      onClick={generateOtp}
                      className="bg-purple-600 text-white px-8 py-4 rounded-xl hover:bg-purple-700 transition-colors font-medium text-base shadow-lg font-sans"
                    >
                      Send Verification Code
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Demo OTP Display */}
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-purple-600 font-medium mb-1 font-sans">Demo OTP Code</p>
                          <p className="text-xl font-mono font-bold text-purple-800">{otpData.generatedOtp}</p>
                        </div>
                        <button
                          onClick={() => setOtpData(prev => ({ ...prev, otp: prev.generatedOtp }))}
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors font-medium font-sans text-sm"
                        >
                          Auto Fill
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <input
                        type="text"
                        value={otpData.otp}
                        onChange={(e) => setOtpData(prev => ({ ...prev, otp: e.target.value }))}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg text-center tracking-widest font-mono"
                        placeholder="000000"
                        maxLength="6"
                        autoFocus
                      />
                      <button
                        onClick={verifyOtp}
                        disabled={otpData.isOtpVerified || otpData.otp.length !== 6}
                        className="px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium font-sans text-sm"
                      >
                        {otpData.isOtpVerified ? <Check className="w-6 h-6" /> : 'Verify'}
                      </button>
                    </div>

                    {otpData.isOtpVerified && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <p className="text-green-700 font-medium flex items-center justify-center font-sans text-sm">
                          <Check className="w-5 h-5 mr-2" />
                          Mobile number verified successfully!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : currentStepData.id === 'password' ? (
              <div className="space-y-6">
                {/* Password Field */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-3 font-sans">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg pr-16 font-sans"
                      placeholder="Enter your password"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-base font-medium text-gray-700 mb-3 font-sans">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg pr-16 font-sans"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div className="mt-3">
                      {formData.password === formData.confirmPassword ? (
                        <p className="text-green-600 text-sm flex items-center font-sans">
                          <Check className="w-4 h-4 mr-2" />
                          Passwords match perfectly!
                        </p>
                      ) : (
                        <p className="text-red-500 text-sm flex items-center font-sans">
                          <X className="w-4 h-4 mr-2" />
                          Passwords don't match
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all ${
                            passwordStrength.score >= level
                              ? passwordStrength.score <= 2
                                ? 'bg-red-400'
                                : passwordStrength.score <= 3
                                ? 'bg-yellow-400'
                                : 'bg-green-400'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {Object.entries({
                        '8+ characters': passwordStrength.checks.length,
                        'Uppercase': passwordStrength.checks.uppercase,
                        'Lowercase': passwordStrength.checks.lowercase,
                        'Number': passwordStrength.checks.number,
                        'Special char': passwordStrength.checks.special
                      }).map(([label, met]) => (
                        <span key={label} className={`flex items-center font-sans ${met ? 'text-green-600' : 'text-gray-400'}`}>
                          {met ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />} 
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <input
                type={currentStepData.type}
                value={formData[currentStepData.field]}
                onChange={(e) => handleInputChange(currentStepData.field, e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-6 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-lg font-sans"
                placeholder={currentStepData.placeholder}
                autoFocus
              />
            )}
          </div>

          {/* Continue Button */}
          <div className="px-12 pb-12">
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className={`w-full py-4 rounded-xl font-medium text-lg transition-all shadow-lg font-sans flex items-center justify-center ${
                canContinue 
                  ? 'bg-purple-600 text-white hover:bg-purple-700 hover:shadow-xl' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving Registration...
                </>
              ) : (
                currentStep === steps.length - 1 ? 'Complete Registration' : 'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegistrationForm;