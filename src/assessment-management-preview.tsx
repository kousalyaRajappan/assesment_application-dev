import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, addDoc, getDocs, updateDoc, doc, arrayUnion, deleteDoc, getDoc, query, where } from "firebase/firestore";


import { db } from "./firebaseConfig";
import { useNavigate } from 'react-router-dom';

const AssessmentManagementSystem = () => {
  // State management
  const [currentUser, setCurrentUser] = useState(""); // "admin" or "student"
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState(['john_doe', 'jane_smith', 'alice_johnson', 'bob_wilson', 'emma_davis']);
  const [currentAssessmentId, setCurrentAssessmentId] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [currentTimer, setCurrentTimer] = useState(null);

  // UI State
  const [currentView, setCurrentView] = useState('login');
  const [adminActiveTab, setAdminActiveTab] = useState('create-assessment');
  const [studentActiveTab, setStudentActiveTab] = useState('available-assessments');
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showQuestionsViewModal, setShowQuestionsViewModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedAssessmentForQuestions, setSelectedAssessmentForQuestions] = useState(null);
  const [activePreset, setActivePreset] = useState(null);

  // Form state
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [gradingScores, setGradingScores] = useState({});
  const [selectedAnswerTypes, setSelectedAnswerTypes] = useState(['text']);
  const [selectedTextLimit, setSelectedTextLimit] = useState(null);


  const [dbStudents, setDbStudents] = useState([]);
  const [studentSearchEmail, setStudentSearchEmail] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  // Fetch assessments from Firestore
  const fetchAssessments = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "assessments"));
      const list = querySnapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          firebaseId: doc.id, // Firestore auto ID
          ...data,
          questions: data.questions ? Object.values(data.questions) : [],
          submissions: data.submissions || []
        };
      });

      setAssessments(list); // 👈 set state here
      console.log("Fetched assessments from Firestore:", list);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      alert("Failed to fetch assessments. Check console for details.");
    }
  }, []);

  // Fetch assessments when user logs in / role changes
  useEffect(() => {

    fetchAssessments();

  }, [fetchAssessments]);

  // Fetch again if student changes
  useEffect(() => {

    fetchAssessments();

  }, [fetchAssessments]);

  // Refs for form inputs
  const userRoleRef = useRef();
  const usernameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const assessmentTitleRef = useRef();
  const assessmentDescriptionRef = useRef();
  const maxScoreRef = useRef();
  const startDateRef = useRef();
  const endDateRef = useRef();
  const newStudentNameRef = useRef();
  const questionTextRef = useRef();
  const questionPointsRef = useRef();
  const questionInstructionsRef = useRef();

  // Authentication functions
  const login = async () => {
    // const role = userRoleRef.current?.value;
    const email = emailRef.current?.value;
    const password = passwordRef.current?.value;

    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    try {
      let user = null;


      // Static admin credentials
      if (email === 'admin' && password === 'admin123') {

        user = {
          username: 'admin',
          email: 'admin',
          role: 'admin',
          name: 'Administrator'
        };
        setCurrentView('admin');

      } else {


        // Query students collection from Firebase
        const studentQuery = query(
          collection(db, "students"),
          where("email", "==", email.toLowerCase())
        );

        const querySnapshot = await getDocs(studentQuery);

        if (querySnapshot.empty) {
          alert('No account found with this email address');
          return;
        }

        const studentDoc = querySnapshot.docs[0];
        const studentData = studentDoc.data();

        // Check if account is active
        // if (!studentData.isActive) {
        //   alert('Your account has been deactivated. Please contact administrator.');
        //   return;
        // }

        // Verify password
        if (studentData.password !== password) {
          alert('Incorrect password');
          return;
        }

        // Update last login timestamp
        await updateDoc(doc(db, "students", studentDoc.id), {
          lastLogin: new Date().toISOString()
        });

        // Set user data from database
        user = {
          id: studentDoc.id,
          username: studentData.fullName, // or studentData.username if you have it
          email: studentData.email,
          role: studentData.role || 'student',
          name: studentData.fullName,
          firstName: studentData.firstName,
          lastName: studentData.lastName
        };
        setCurrentView('student');


      }
      if (user) {
        setCurrentUser(user);




        // Clear form
        if (userRoleRef.current) userRoleRef.current.value = '';
        if (emailRef.current) emailRef.current.value = '';
        if (passwordRef.current) passwordRef.current.value = '';

      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }

  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('login');
    if (userRoleRef.current) userRoleRef.current.value = '';
    if (usernameRef.current) usernameRef.current.value = '';
    if (passwordRef.current) passwordRef.current.value = '';
  };

  // Admin functions
  const updateAdminStats = () => {
    // Count submissions from Firebase data structure
    let totalSubmissions = 0;

    assessments.forEach(assessment => {
      if (assessment.submissions) {
        // Count unique students who have submitted for this assessment
        const uniqueStudents = new Set();
        Object.values(assessment.submissions).forEach(submission => {
          if (submission.studentName) {
            uniqueStudents.add(submission.studentName);
          }
        });
        totalSubmissions += uniqueStudents.size;
      }
    });

    return {
      totalAssessments: assessments.length,
      totalQuestions: assessments.reduce((sum, assessment) => sum + (assessment.questions ? assessment.questions.length : 0), 0),
      totalSubmissions: totalSubmissions, // ✅ Now counts from Firebase data
      totalStudents: students.length
    };
  };
  const getSelectedStudents = () => {
    const selectedItems = document.querySelectorAll('#studentAssignmentList .student-item.selected');
    return Array.from(selectedItems).map(item => item.getAttribute('data-student'));
  };

  const clearStudentSelection = () => {
    document.querySelectorAll('#studentAssignmentList .student-item').forEach(item => {
      item.classList.remove('selected');
    });
    updateSelectionSummary();
  };

  const updateSelectionSummary = () => {
    const selectedStudents = getSelectedStudents();
    const summaryElement = document.getElementById('selectionSummary');

    if (summaryElement) {
      if (selectedStudents.length === 0) {
        summaryElement.textContent = 'No students selected - assessment will be available to ALL students';
        summaryElement.style.color = '#28a745';
      } else {
        summaryElement.textContent = `Selected: ${selectedStudents.join(', ')} (${selectedStudents.length} students)`;
        summaryElement.style.color = '#007bff';
      }
    }
  };

  const toggleStudentSelection = (studentName) => {
    const item = document.querySelector(`#studentAssignmentList [data-student="${studentName}"]`);
    if (item) {
      item.classList.toggle('selected');
      updateSelectionSummary();
    }
  };

  const selectAllStudents = () => {
    document.querySelectorAll('#studentAssignmentList .student-item').forEach(item => {
      item.classList.add('selected');
    });
    updateSelectionSummary();
  };

  const createAssessment = async () => {
    const title = assessmentTitleRef.current?.value.trim();
    const description = assessmentDescriptionRef.current?.value.trim();
    const startDate = startDateRef.current?.value;
    const endDate = endDateRef.current?.value;
    const maxScore = maxScoreRef.current?.value;

    if (!title) {
      alert('Please enter an assessment title');
      assessmentTitleRef.current?.focus();
      return;
    }

    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (endDateTime <= startDateTime) {
      alert('End date must be after start date!');
      return;
    }

    const assignedStudents = getSelectedStudents();
    const assessment = {
      id: 'assessment_' + Date.now(),
      title,
      description: description || 'No description provided',
      startDate,
      endDate,
      maxScore: parseInt(maxScore) || 100,
      createdBy: currentUser.username,
      assignedStudents: assignedStudents,
      questions: []
    };


    try {
      // 🔥 Save to Firestore
      // setAssessments([...assessments, assessment]);
      try {
        const docRef = await addDoc(collection(db, "assessments"), assessment);
        console.log("Assessment added with ID:", docRef.id);
        alert("Assessment saved successfully!"); // should now show
        // setAssessments([...assessments, { ...assessment, firebaseId: docRef.id }]);
      } catch (error) {
        console.error("Error adding assessment:", error);
        alert("Could not save assessment. Please try again.");
      }

      // Also update local state so UI reacts immediately
      setAssessments((prev) => [...prev, assessment]);
      setCurrentAssessmentId(assessment.id);

      // Clear form
      if (assessmentTitleRef.current) assessmentTitleRef.current.value = "";
      if (assessmentDescriptionRef.current) assessmentDescriptionRef.current.value = "";
      if (maxScoreRef.current) maxScoreRef.current.value = "100";
      clearStudentSelection();
      setSmartDefaults();
      fetchAssessments();
      setActivePreset(null);

      alert("Assessment created successfully!");
      setAdminActiveTab("manage-assessments");
    } catch (error) {
      console.error("Error creating assessment:", error);
      alert("Failed to save assessment. Please try again.");
    }
    // setAssessments(prev => [...prev, assessment]);
    // setCurrentAssessmentId(assessment.id);

    // // Clear form
    // if (assessmentTitleRef.current) assessmentTitleRef.current.value = '';
    // if (assessmentDescriptionRef.current) assessmentDescriptionRef.current.value = '';
    // if (maxScoreRef.current) maxScoreRef.current.value = '100';
    // clearStudentSelection();
    // setSmartDefaults();
    // setActivePreset(null);

    // alert('Assessment created successfully!');
    // setAdminActiveTab('manage-assessments');
  };

  const addStudent = () => {
    const newStudentName = newStudentNameRef.current?.value.trim();
    if (!newStudentName) {
      alert('Please enter a student name');
      return;
    }

    if (students.includes(newStudentName)) {
      alert('Student already exists');
      return;
    }

    setStudents(prev => [...prev, newStudentName]);
    if (newStudentNameRef.current) newStudentNameRef.current.value = '';
    alert('Student added successfully!');
  };

  const removeStudent = (studentName) => {
    if (window.confirm(`Are you sure you want to remove student "${studentName}"?`)) {
      setStudents(prev => prev.filter(s => s !== studentName));
    }
  };

  const deleteAssessment = async (assessmentId) => {
    if (!window.confirm("Are you sure you want to delete this assessment?")) return;

    try {
      // 1️⃣ Delete from Firestore
      await deleteDoc(doc(db, "assessments", assessmentId));

      // 2️⃣ Update local state
      setAssessments(prev => prev.filter(a => a.firebaseId !== assessmentId));
      setSubmissions(prev => prev.filter(s => s.assessmentId !== assessmentId));

      alert("Assessment deleted successfully!");
    } catch (error) {
      console.error("Error deleting assessment:", error);
      alert("Failed to delete assessment, see console for details.");
    }

  };

  // Question management functions
  const addQuestionToAssessment = (assessmentId, fileId) => {
    console.log("assessment id", fileId, assessmentId);
    setCurrentAssessmentId(assessmentId);
    setFileId(fileId)
    setSelectedAnswerTypes(['text']);
    setSelectedTextLimit(null);
    setShowQuestionModal(true);
  };

  const closeQuestionModal = () => {
    setShowQuestionModal(false);
    setSelectedAnswerTypes(['text']);
    setSelectedTextLimit(null);
    // setCurrentAssessmentId(null);
    if (questionTextRef.current) questionTextRef.current.value = '';
    if (questionPointsRef.current) questionPointsRef.current.value = '10';
    if (questionInstructionsRef.current) questionInstructionsRef.current.value = '';
  };

  const addQuestion = async () => {
    console.log("custom fileId:", fileId, "firebaseId:", currentAssessmentId);

    const text = questionTextRef.current?.value?.trim();
    const points = questionPointsRef.current?.value;
    const instructions = questionInstructionsRef.current?.value?.trim();

    if (!text || !points) {
      alert("Please fill in required fields");
      return;
    }

    if (selectedAnswerTypes.length === 0) {
      alert("Please select at least one answer type");
      return;
    }

    const question = {
      id: "q_" + Date.now(),
      text,
      types: [...selectedAnswerTypes],
      textLimit: selectedTextLimit,
      points: parseInt(points),
      instructions: instructions || "",
    };

    try {
      // ✅ Always use Firestore doc id (firebaseId)
      const assessmentRef = doc(db, "assessments", currentAssessmentId);
      await updateDoc(assessmentRef, {
        questions: arrayUnion(question),
      });

      // ✅ Update local state (match by firebaseId)
      setAssessments((prev) =>
        prev.map((a) =>
          a.firebaseId === currentAssessmentId
            ? { ...a, questions: [...(a.questions || []), question] }
            : a
        )
      );

      // ✅ Also update selectedAssessmentForQuestions if it's the same doc
      if (selectedAssessmentForQuestions?.firebaseId === currentAssessmentId) {
        setSelectedAssessmentForQuestions((prev) => ({
          ...prev!,
          questions: [...(prev?.questions || []), question],
        }));
      }

      closeQuestionModal();
      alert("Question added successfully!");
    } catch (error) {
      console.error("Error adding question:", error);
      alert("Failed to add question. Please try again.");
    }
  };

  const toggleAnswerType = (type) => {
    setSelectedAnswerTypes(prev => {
      if (prev.includes(type)) {
        const newTypes = prev.filter(t => t !== type);
        if ((type === 'text' || type === 'code') && !newTypes.some(t => t === 'text' || t === 'code')) {
          setSelectedTextLimit(null);
        }
        return newTypes;
      } else {
        return [...prev, type];
      }
    });
  };

  const selectTextLimit = (limit) => {
    setSelectedTextLimit(prev => prev === limit ? null : limit);
  };

  const viewAssessmentQuestions = async (assessmentId) => {

    try {
      const assessmentRef = doc(db, "assessments", assessmentId);
      const assessmentSnap = await getDoc(assessmentRef);

      if (!assessmentSnap.exists()) {
        alert("Assessment not found in database!");
        return;
      }

      const data = assessmentSnap.data();
      console.log("Raw Firestore data:", data); // 👈 check structure here

      const questions = data?.questions ?? [];

      if (questions.length === 0) {
        alert("No questions found for this assessment");
        return;
      }

      console.log("Fetched questions:", questions);

      setSelectedAssessmentForQuestions({
        firebaseId: assessmentId,
        id: assessmentSnap.id,
        ...data,
        questions: questions,
      });
      setShowQuestionsViewModal(true);
    } catch (error) {
      console.error("Error fetching questions:", error);
      alert("Failed to load questions. Check console for details.");
    }
    // const assessment = assessments.find(a => a.id === assessmentId);
    // if (!assessment || !assessment.questions || assessment.questions.length === 0) {
    //   alert('No questions found for this assessment');
    //   return;
    // }
    // setSelectedAssessmentForQuestions(assessment);
    // setShowQuestionsViewModal(true);
  };

  const closeQuestionsViewModal = () => {
    setShowQuestionsViewModal(false);
    setSelectedAssessmentForQuestions(null);
  };

  const deleteQuestion = async (firebaseId, questionId) => {
    console.log("question id", fileId, questionId, selectedAssessmentForQuestions.firebaseId);
    if (!firebaseId) {
      alert("Error: Missing firebaseId");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      // ✅ Find assessment by firebaseId
      const assessment = assessments.find((a) => a.firebaseId === firebaseId);
      if (!assessment) {
        alert("Assessment not found");
        return;
      }

      // ✅ Remove question locally
      const updatedQuestions = (assessment.questions || []).filter(
        (q) => q.id !== questionId
      );

      // ✅ Update Firestore (always use firebaseId)
      const assessmentRef = doc(db, "assessments", firebaseId);
      await updateDoc(assessmentRef, {
        questions: updatedQuestions,
      });

      // ✅ Update local state
      setAssessments((prev) =>
        prev.map((a) =>
          a.firebaseId === firebaseId ? { ...a, questions: updatedQuestions } : a
        )
      );

      // ✅ Update selectedAssessmentForQuestions if it's the same doc
      if (selectedAssessmentForQuestions?.firebaseId === firebaseId) {
        setSelectedAssessmentForQuestions((prev) => ({
          ...prev!,
          questions: updatedQuestions,
        }));
      }

      alert("Question deleted successfully!");
    } catch (error) {
      console.error("Error deleting question:", error);
      alert("Failed to delete question. Please try again.");
    }
  }

  const activateAssessmentNow = async (assessmentId) => {
    console.log('firebase assessment id', assessmentId);
    // log all ids in state

    const assessment = assessments.find(a => a.firebaseId === assessmentId);
    if (!assessment) {
      alert('Error: Assessment not found!');
      return;
    }

    const now = new Date();


    console.log("assessment status", assessment.status);


    if (assessment.status === "scheduled") {
      alert(`Assessment "${assessment.title}" is already scheduled!`);
      return;
    }
    // if (now >= currentStart && now <= currentEnd) {
    //   alert(`Assessment "${assessment.title}" is already active!`);
    //   return;
    // }

    if (window.confirm(`scheduled "${assessment.title}" immediately?`)) {
      const newStartDate = new Date(now.getTime() - 60000).toISOString();

      // 1. Update state
      setAssessments(prev =>
        prev.map(a =>
          a.firebaseId === assessmentId
            ? { ...a, startDate: newStartDate, status: "scheduled" }
            : a
        )
      );

      // 2. Update Firestore
      try {
        const assessmentRef = doc(db, "assessments", assessmentId);
        await updateDoc(assessmentRef, {
          startDate: newStartDate,
          status: "scheduled"
        });
        alert(`Assessment "${assessment.title}" is now scheduled!`);
      } catch (error) {
        console.error("Error activating assessment:", error);
        alert("Failed to activate assessment. See console for details.");
      }

    }
  };

  // Updated assignToAllStudents function
  const assignToAllStudents = async (assessmentFirebaseId) => {
    console.log("assign to all students");
    const assessment = assessments.find(a => a.firebaseId === assessmentFirebaseId);
    if (!assessment) {
      alert('Error: Assessment not found!');
      return;
    }

    if (window.confirm(`Make "${assessment.title}" available to ALL students?`)) {
      try {
        // Update Firestore - empty array or null means all students
        const assessmentRef = doc(db, "assessments", assessmentFirebaseId);
        await updateDoc(assessmentRef, {
          assignedStudents: [], // Empty array means all students
          updatedAt: new Date().toISOString()
        });

        // Update local state
        setAssessments(prev => prev.map(a => {
          if (a.firebaseId === assessmentFirebaseId) {
            return {
              ...a,
              assignedStudents: []
            };
          }
          return a;
        }));

        alert(`Assessment "${assessment.title}" is now available to ALL students!`);
      } catch (error) {
        console.error("Error updating assessment:", error);
        alert("Failed to update assessment. Please try again.");
      }
    }
  };

  // Updated assignToSpecificStudents function
  const assignToSpecificStudents = async (assessmentFirebaseId) => {
    const assessment = assessments.find(a => a.firebaseId === assessmentFirebaseId);
    if (!assessment) {
      alert('Error: Assessment not found!');
      return;
    }

    // Get active students for selection
    const activeStudents = dbStudents.filter(student => student.isActive);

    if (activeStudents.length === 0) {
      alert('No active students available for assignment.');
      return;
    }

    // For demo purposes, let's assign to first 3 students
    // In a real implementation, you'd want to show a selection modal
    const specificStudents = activeStudents.slice(0, Math.min(3, activeStudents.length)).map(s => s.email);

    if (window.confirm(`Assign "${assessment.title}" to specific students: ${specificStudents.join(', ')}?`)) {
      try {
        // Update Firestore
        const assessmentRef = doc(db, "assessments", assessmentFirebaseId);
        await updateDoc(assessmentRef, {
          assignedStudents: specificStudents,
          updatedAt: new Date().toISOString()
        });

        // Update local state
        setAssessments(prev => prev.map(a => {
          if (a.firebaseId === assessmentFirebaseId) {
            return {
              ...a,
              assignedStudents: specificStudents
            };
          }
          return a;
        }));

        alert(`Assessment "${assessment.title}" is now assigned to: ${specificStudents.join(', ')}`);
      } catch (error) {
        console.error("Error updating assessment:", error);
        alert("Failed to update assessment. Please try again.");
      }
    }
  };



  // Grading functions
  // UPDATED: gradeSubmission function to work with new data structure
  const gradeSubmission = (submissionId) => {
    const allSubmissions = extractAllSubmissionsFromAssessments();
    const submission = allSubmissions.find(s => s.id === submissionId);

    if (!submission) {
      alert('Submission not found');
      return;
    }

    const assessment = assessments.find(a => a.firebaseId === submission.firebaseAssessmentId);
    if (!assessment) {
      alert('Assessment not found');
      return;
    }

    // CRITICAL: Initialize grading scores for ALL questions
    const initialGradingScores = {};
    assessment.questions.forEach(question => {
      // Check if this question already has a score
      const existingScore = submission.scores ? submission.scores[question.id] : 0;
      initialGradingScores[question.id] = existingScore || 0;
    });

    console.log('Initializing grading with scores for ALL questions:', initialGradingScores);

    setSelectedSubmission(submission);
    setGradingScores(initialGradingScores); // Initialize ALL question scores
    setShowGradingModal(true);
  };

  // ULTIMATE FIX: Completely rewritten saveGrades 
 const saveGrades = async () => {
  if (!selectedSubmission) return;

  const assessment = assessments.find(a => a.firebaseId === selectedSubmission.firebaseAssessmentId);
  if (!assessment) {
    alert('Assessment not found');
    return;
  }

  const studentEmail = selectedSubmission.studentId;
  const sanitizedEmail = studentEmail.replace('@', '_').replace(/\./g, '_');

  if (!studentEmail) {
    alert('Student email not found in submission');
    return;
  }

  console.log('=== SAVING GRADES TO NESTED STRUCTURE ===');
  console.log('Student:', studentEmail);

  // Calculate total score
  let totalScore = 0;
  const gradedQuestions = {};

  assessment.questions.forEach((question, index) => {
    const score = parseInt(gradingScores[question.id]) || 0;
    totalScore += score;
    
    gradedQuestions[question.id] = score;
    console.log(`Question ${index + 1} (${question.id}): ${score}/${question.points} points`);
  });

  try {
    // Get current assessment data
    const assessmentRef = doc(db, "assessments", selectedSubmission.firebaseAssessmentId);
    const currentDoc = await getDoc(assessmentRef);
    const currentData = currentDoc.data();
    const updatedSubmissions = { ...currentData.submissions };

    // Update the student's submission with grades nested under each question
    if (updatedSubmissions[sanitizedEmail]) {
      const studentSubmission = { ...updatedSubmissions[sanitizedEmail] };
      
      // Add grades to each question
      const updatedQuestions = { ...studentSubmission.questions };
      
      assessment.questions.forEach(question => {
        const questionId = question.id;
        const questionGrade = gradedQuestions[questionId];
        
        if (updatedQuestions[questionId]) {
          // Add grade to existing question data
          updatedQuestions[questionId] = {
            ...updatedQuestions[questionId],
            grade: questionGrade,
            maxPoints: question.points,
            graded: true,
            gradedAt: new Date().toISOString()
          };
        } else {
          // Create question entry with grade (in case question wasn't submitted)
          updatedQuestions[questionId] = {
            answers: {},
            grade: questionGrade,
            maxPoints: question.points,
            graded: true,
            gradedAt: new Date().toISOString()
          };
        }
      });

      // Update the student's complete submission
      updatedSubmissions[sanitizedEmail] = {
        ...studentSubmission,
        questions: updatedQuestions,
        totalScore: totalScore,
        maxScore: assessment.maxScore,
        graded: true,
        gradedAt: new Date().toISOString(),
        gradingComplete: true
      };

      console.log('Updated student submission with nested grades:', updatedSubmissions[sanitizedEmail]);
    } else {
      alert('Student submission not found');
      return;
    }

    // Update Firestore
    await updateDoc(assessmentRef, {
      submissions: updatedSubmissions,
      lastGradedAt: new Date().toISOString()
    });

    // Update local state
    setAssessments(prev =>
      prev.map(a =>
        a.firebaseId === selectedSubmission.firebaseAssessmentId
          ? { ...a, submissions: updatedSubmissions }
          : a
      )
    );

    console.log(`Successfully saved nested grades for: ${selectedSubmission.studentName}`);
    console.log(`Total: ${totalScore}/${assessment.maxScore} points`);

    setShowGradingModal(false);
    setSelectedSubmission(null);
    setGradingScores({});

    const percentage = ((totalScore / assessment.maxScore) * 100).toFixed(1);
    alert(`Graded successfully!\nStudent: ${selectedSubmission.studentName}\nTotal: ${totalScore}/${assessment.maxScore} points (${percentage}%)`);

  } catch (error) {
    console.error("Error saving nested grades:", error);
    alert("Failed to save grades. Please try again.");
  }
};
  const closeGradingModal = () => {
    setShowGradingModal(false);
    setSelectedSubmission(null);
    setGradingScores({});
  };

  const handleScoreChange = (questionId, score) => {
    setGradingScores(prev => ({
      ...prev,
      [questionId]: score
    }));
  };

  // Student functions
  const loadStudentAssessments = () => {
    if (!currentUser) return [];

    console.log("current user", currentUser);
    return assessments.filter(assessment => {
      return !assessment.assignedStudents ||
        assessment.assignedStudents.length === 0 ||
        assessment.assignedStudents.includes(currentUser.email);
    });
  };

  const takeAssessment = (assessmentFirebaseId, assessmentId) => {
  console.log("Taking assessment:", assessmentFirebaseId, assessmentId);
  
  const assessment = assessments.find(a => a.id === assessmentId);
  if (!assessment || !assessment.questions) {
    alert('Assessment not found or has no questions');
    return;
  }

  const now = new Date();
  const end = new Date(assessment.endDate);

  if (now > end) {
    alert('This assessment has ended');
    return;
  }

  // Check if student has existing answers (for continuation)
  const currentStudentEmail = currentUser?.email;
  const sanitizedEmail = currentStudentEmail.replace('@', '_').replace(/\./g, '_');
  const existingSubmission = assessment.submissions?.[sanitizedEmail];

  // Pre-fill answers if they exist
  const prefilledAnswers = {};
  
  if (existingSubmission && existingSubmission.questions) {
    console.log("Found existing submission, pre-filling answers:", existingSubmission.questions);
    
    // Convert existing answers back to the form field format
    Object.entries(existingSubmission.questions).forEach(([questionId, questionData]) => {
      if (questionData.answers) {
        Object.entries(questionData.answers).forEach(([answerType, answerValue]) => {
          const fieldName = `${questionId}_${answerType}`;
          prefilledAnswers[fieldName] = answerValue;
          console.log(`Pre-filling field ${fieldName} with:`, answerValue);
        });
      }
    });
  }

  console.log("Pre-filled answers object:", prefilledAnswers);

  // Set the assessment state
  setCurrentAssessmentId(assessmentFirebaseId);
  setFileId(assessmentId);
  setAssessmentAnswers(prefilledAnswers); // Pre-fill with existing answers
  setShowAssessmentModal(true);
  startTimer(end);

  // Show continuation message if there are pre-filled answers
  if (Object.keys(prefilledAnswers).length > 0) {
    const questionCount = Object.keys(existingSubmission.questions).length;
    setTimeout(() => {
      alert(`Continuing your assessment...\nYour previous answers to ${questionCount} questions have been loaded.`);
    }, 500);
  }
};

  const startTimer = (endDate) => {
    const updateTimer = () => {
      const now = new Date();
      const timeLeft = endDate - now;

      if (timeLeft <= 0) {
        const element = document.getElementById('timeRemaining');
        if (element) element.textContent = "Time's up!";
        alert('Time\'s up! Submitting your assessment automatically...');
        submitAssessmentWithAnswers();
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      const element = document.getElementById('timeRemaining');
      if (element) {
        element.textContent = `${hours}h ${minutes}m ${seconds}s`;
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    setCurrentTimer(timer);
  };


// Complete submission system based on student email
// Much cleaner submission system - ONE record per student per assessment
const submitAssessmentWithAnswers = async () => {
  try {
    if (!currentAssessmentId) {
      alert("No assessment ID found");
      return;
    }

    const assessment = assessments.find((a) => a.id === fileId);
    if (!assessment) {
      alert("Assessment not found");
      return;
    }

    const studentEmail = currentUser.email;
    const sanitizedEmail = studentEmail.replace('@', '_').replace(/\./g, '_');
    
    // Consolidate all question answers for this student
    const studentQuestions = {};

    assessment.questions.forEach((question) => {
      const questionAnswers = {};
      let hasAnyAnswer = false;

      question.types.forEach((type) => {
        const fieldName = `${question.id}_${type}`;
        const answer = assessmentAnswers[fieldName];

        if (answer && answer.toString().trim()) {
          questionAnswers[type] = answer.toString().trim();
          hasAnyAnswer = true;
        }
      });

      if (hasAnyAnswer) {
        // Store answers under question ID
        studentQuestions[question.id] = {
          answers: questionAnswers,
          submittedAt: new Date().toISOString(),
        };
      }
    });

    // Create ONE submission record per student (using email as key)
    const studentSubmissionKey = sanitizedEmail;  // Clean key: alice_example_com
    
    const studentSubmissionData = {
      studentId: studentEmail,
      studentName: currentUser.username,
      assessmentId: fileId,
      firebaseAssessmentId: currentAssessmentId,
      questions: studentQuestions,                    // All question answers nested here
      submittedAt: new Date().toISOString(),
      questionsAnswered: Object.keys(studentQuestions).length,
      totalQuestions: assessment.questions.length,
      isDraft: false,
      submissionComplete: true
    };

    console.log('Creating single submission for student:', studentEmail);
    console.log('Questions answered:', Object.keys(studentQuestions));

    // Get current assessment and merge submissions
    const assessmentRef = doc(db, "assessments", currentAssessmentId);
    const currentDoc = await getDoc(assessmentRef);
    const currentData = currentDoc.data();
    const existingSubmissions = currentData.submissions || {};

    // Add/Update this student's submission
    const updatedSubmissions = {
      ...existingSubmissions,
      [studentSubmissionKey]: studentSubmissionData
    };

    await updateDoc(assessmentRef, {
      submissions: updatedSubmissions,
      updatedAt: new Date().toISOString(),
    });

    // Update local state
    setAssessments((prev) =>
      prev.map((a) =>
        a.firebaseId === currentAssessmentId
          ? { ...a, submissions: updatedSubmissions }
          : a
      )
    );

    // Update local submissions state
    let submission = submissions.find(
      (s) =>
        s.assessmentId === fileId &&
        s.studentName === currentUser.username
    );

    if (!submission) {
      submission = {
        id: "sub_" + Date.now(),
        assessmentId: fileId,
        studentName: currentUser.username,
        studentEmail: studentEmail,
        answers: studentQuestions,
        submittedAt: new Date().toISOString(),
        isDraft: false,
      };
      setSubmissions((prev) => [...prev, submission]);
    } else {
      submission.answers = studentQuestions;
      submission.isDraft = false;
      submission.submittedAt = new Date().toISOString();
      setSubmissions((prev) =>
        prev.map((s) => (s.id === submission.id ? submission : s))
      );
    }

    setShowAssessmentModal(false);
    if (currentTimer) {
      clearInterval(currentTimer);
      setCurrentTimer(null);
    }

    alert(`SUBMISSION SUCCESS!\n${currentUser.username} (${studentEmail})\nAnswered: ${Object.keys(studentQuestions).length}/${assessment.questions.length} questions`);
    
  } catch (error) {
    console.error("Error during submission:", error);
    alert(`Error during submission: ${error.message}`);
  }
};
  const closeAssessmentModal = () => {
    setShowAssessmentModal(false);
    if (currentTimer) {
      clearInterval(currentTimer);
      setCurrentTimer(null);
    }
  };

  const handleAnswerChange = (fieldName, value) => {
    setAssessmentAnswers(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Student view functions
 // Updated viewMyAnswers function
const viewMyAnswers = (submissionId) => {
  console.log('Looking for submission with ID:', submissionId);
  
  // Get submissions using the updated extraction function
  const mySubmissions = extractSubmissionsFromAssessments();
  console.log('Available submissions:', mySubmissions.map(s => s.id));
  
  const submission = mySubmissions.find(s => s.id === submissionId);

  if (!submission) {
    console.error('Submission not found. Available IDs:', mySubmissions.map(s => s.id));
    alert(`Submission not found. Looking for: ${submissionId}`);
    return;
  }

  const assessment = assessments.find(a => a.firebaseId === submission.firebaseAssessmentId);
  if (!assessment) {
    alert('Assessment not found');
    return;
  }

  console.log("Found submission data:", submission);
  console.log("Submission answers:", submission.answers);

  setSelectedSubmission({
    ...submission,
    assessment: assessment
  });
  setShowAssessmentModal(true);
};


  const viewDetailedResults = (submissionId) => {
    // Use the same data extraction method
    const mySubmissions = extractSubmissionsFromAssessments();
    const submission = mySubmissions.find(s => s.id === submissionId);

    if (!submission) {
      alert('Submission not found');
      return;
    }

    const assessment = assessments.find(a => a.firebaseId === submission.firebaseAssessmentId);
    if (!assessment) {
      alert('Assessment not found');
      return;
    }

    if (!submission.graded) {
      alert('This submission hasn\'t been graded yet.');
      return;
    }

    setSelectedSubmission({
      ...submission,
      assessment: assessment,
      showDetailedResults: true
    });
    setShowAssessmentModal(true);
  };

  const formatAnswerForStudent = (answer, type, label) => {
    if (!answer) return `<p><strong>${label}:</strong> <em>No answer provided</em></p>`;

    let formattedAnswer = '';

    switch (type.toLowerCase()) {
      case 'text':
      case 'code':
        formattedAnswer = `
          <div style="margin-bottom: 15px;">
            <p><strong>${label.toUpperCase()}:</strong></p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; white-space: pre-wrap; font-family: ${type === 'code' ? 'monospace' : 'inherit'};">
              ${answer}
            </div>
            <small style="color: #666;">Length: ${answer.length} characters</small>
          </div>
        `;
        break;
      case 'file':
        formattedAnswer = `
          <div style="margin-bottom: 15px;">
            <p><strong>FILE UPLOAD:</strong></p>
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3;">
              📎 ${answer}
            </div>
          </div>
        `;
        break;
      case 'url':
        formattedAnswer = `
          <div style="margin-bottom: 15px;">
            <p><strong>URL LINK:</strong></p>
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
              🔗 <a href="${answer}" target="_blank" style="color: #1976d2; text-decoration: none;">${answer}</a>
            </div>
          </div>
        `;
        break;
      case 'voice':
        formattedAnswer = `
          <div style="margin-bottom: 15px;">
            <p><strong>VOICE RECORDING:</strong></p>
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              🎤 ${answer}
            </div>
          </div>
        `;
        break;
      default:
        formattedAnswer = `
          <div style="margin-bottom: 15px;">
            <p><strong>${label.toUpperCase()}:</strong></p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea;">
              ${answer}
            </div>
          </div>
        `;
    }

    return formattedAnswer;
  };

  // Date/Time utility functions
  const setSmartDefaults = () => {
    const now = new Date();
    const tomorrow9AM = new Date(now);
    tomorrow9AM.setDate(tomorrow9AM.getDate() + 1);
    tomorrow9AM.setHours(9, 0, 0, 0);

    const oneWeekLater = new Date(tomorrow9AM);
    oneWeekLater.setDate(oneWeekLater.getDate() + 7);
    oneWeekLater.setHours(17, 0, 0, 0);

    if (startDateRef.current && endDateRef.current) {
      startDateRef.current.value = tomorrow9AM.toISOString().slice(0, 16);
      endDateRef.current.value = oneWeekLater.toISOString().slice(0, 16);
    }
  };

  const setQuickPreset = (presetType) => {
    setActivePreset(presetType);

    const now = new Date();
    let startDate, endDate;

    switch (presetType) {
      case 'now-1hour':
        startDate = new Date(now);
        endDate = new Date(now.getTime() + 60 * 60 * 1000);
        break;
      case 'now-1day':
        startDate = new Date(now);
        endDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'tomorrow-1week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() + 1);
        startDate.setHours(9, 0, 0, 0);
        endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        endDate.setHours(17, 0, 0, 0);
        break;
      default:
        return;
    }

    if (startDateRef.current && endDateRef.current) {
      startDateRef.current.value = startDate.toISOString().slice(0, 16);
      endDateRef.current.value = endDate.toISOString().slice(0, 16);
    }
  };

  // Render Login Section
  const renderLogin = () => (
    <div className="card">
      <div className="header">
        <h1>🎓 Assessment Management System</h1>
        <p>Comprehensive platform for creating and managing assessments</p>
        {/* <div className="demo-info">
          <p style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
            🚀 <strong>Try the Demo:</strong>
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                userRoleRef.current.value = 'admin';
                usernameRef.current.value = 'admin';
                passwordRef.current.value = 'password';
              }}
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              Admin Demo
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                userRoleRef.current.value = 'student';
                usernameRef.current.value = 'john_doe';
                passwordRef.current.value = 'password';
              }}
              style={{ fontSize: '12px', padding: '8px 16px' }}
            >
              Student Demo
            </button>
          </div>
        </div> */}
      </div>

      <div style={{ maxWidth: '400px', margin: '0 auto' }}>
        {/* <div className="form-group">
          <label htmlFor="userRole">Select Role:</label>
          <select ref={userRoleRef} id="userRole">
            <option value="">Choose your role</option>
            <option value="admin">Administrator</option>
            <option value="student">Student</option>
          </select>
        </div> */}

        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input ref={emailRef} type="text" id="email" placeholder="Enter your Email" />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input ref={passwordRef} type="password" id="password" placeholder="Enter your password" />
        </div>

        <button className="btn" onClick={login} style={{ width: '100%' }}>Login</button>
        <div class="auth-toggle">
          <p>New Student?
            <button
              onClick={showStudentRegistration}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'inherit',
                fontFamily: 'inherit',
                padding: '0',
                marginLeft: '5px'
              }}
              onMouseOver={(e) => e.target.style.color = '#5a6fd8'}
              onMouseOut={(e) => e.target.style.color = '#667eea'}
            >
              Register with Mobile OTP
            </button>
          </p>

        </div>

      </div>

    </div>
  );
  const showStudentRegistration = () => {
    navigate('/register');
  };
  // Render Admin Dashboard
  const renderAdminDashboard = () => {
    const stats = updateAdminStats();

    return (
      <div className="card">
        <div className="header">
          <h1>Administrator Dashboard</h1>
          <button className="btn btn-secondary" onClick={logout}>Logout</button>
        </div>

        <div className="grid">
          <div className="stats-card">
            <div className="stats-number">{stats.totalAssessments}</div>
            <div>Total Assessments</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{stats.totalQuestions}</div>
            <div>Total Questions</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{stats.totalSubmissions}</div>
            <div>Total Submissions</div>
          </div>
          <div className="stats-card">
            <div className="stats-number">{stats.totalStudents}</div>
            <div>Active Students</div>
          </div>
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab ${adminActiveTab === 'create-assessment' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab('create-assessment')}
          >
            Create Assessment
          </button>
          <button
            className={`nav-tab ${adminActiveTab === 'manage-students' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab('manage-students')}
          >
            Manage Students
          </button>
          <button
            className={`nav-tab ${adminActiveTab === 'manage-assessments' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab('manage-assessments')}
          >
            Manage Assessments
          </button>
          <button
            className={`nav-tab ${adminActiveTab === 'grade-submissions' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab('grade-submissions')}
          >
            Grade Submissions
          </button>
          <button
            className={`nav-tab ${adminActiveTab === 'view-results' ? 'active' : ''}`}
            onClick={() => setAdminActiveTab('view-results')}
          >
            View Results
          </button>
        </div>

        {adminActiveTab === 'create-assessment' && renderCreateAssessment()}
        {adminActiveTab === 'manage-students' && renderManageStudents()}
        {adminActiveTab === 'manage-assessments' && renderManageAssessments()}
        {adminActiveTab === 'grade-submissions' && renderGradeSubmissions()}
        {adminActiveTab === 'view-results' && renderViewResults()}
      </div>
    );
  };

  // Render Create Assessment Tab
  // Render Create Assessment Tab
  const renderCreateAssessment = () => {
    // Only show active students
    const activeStudents = dbStudents.filter(student => student.isActive);

    return (
      <div>
        <h3>Create New Assessment</h3>

        <div className="form-group">
          <label htmlFor="assessmentTitle">Assessment Title:</label>
          <input ref={assessmentTitleRef} type="text" id="assessmentTitle" placeholder="Enter assessment title" />
        </div>

        <div className="form-group">
          <label htmlFor="assessmentDescription">Description:</label>
          <textarea ref={assessmentDescriptionRef} id="assessmentDescription" rows="3" placeholder="Enter assessment description"></textarea>
        </div>

        <div className="form-group">
          <label htmlFor="maxScore">Maximum Score:</label>
          <input ref={maxScoreRef} type="number" id="maxScore" placeholder="Enter maximum score" defaultValue="100" style={{ width: '150px' }} />
        </div>

        <div className="schedule-section">
          <h4>📅 Schedule</h4>

          <div className="quick-presets">
            <label>Quick Setup:</label>
            <div className="preset-buttons">
              <button
                type="button"
                className={`preset-btn ${activePreset === 'now-1hour' ? 'active' : ''}`}
                onClick={() => setQuickPreset('now-1hour')}
              >
                Now → 1 Hour
              </button>
              <button
                type="button"
                className={`preset-btn ${activePreset === 'now-1day' ? 'active' : ''}`}
                onClick={() => setQuickPreset('now-1day')}
              >
                Now → 1 Day
              </button>
              <button
                type="button"
                className={`preset-btn ${activePreset === 'tomorrow-1week' ? 'active' : ''}`}
                onClick={() => setQuickPreset('tomorrow-1week')}
              >
                Tomorrow → 1 Week
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
            <div className="form-group">
              <label htmlFor="startDate">Start Date:</label>
              <input ref={startDateRef} type="datetime-local" id="startDate" />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date:</label>
              <input ref={endDateRef} type="datetime-local" id="endDate" />
            </div>
          </div>
        </div>

        <div className="student-selection">
          <label><strong>👥 Assign to Students:</strong></label>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '10px' }}>
            Select students who can take this assessment (leave none selected for ALL students)
          </p>

          <div className="student-list" id="studentAssignmentList">
            {activeStudents.length === 0 ? (
              <p style={{ color: 'red' }}>⚠️ No active students available</p>
            ) : (
              activeStudents.map(student => (
                <div
                  key={student.id}
                  className="student-item"
                  data-student={student.email}
                  onClick={() => toggleStudentSelection(student.email)}
                >
                  {student.fullName}
                </div>
              ))
            )}
          </div>

          <div id="selectionSummary" style={{
            margin: '10px 0',
            padding: '8px',
            background: '#f8f9fa',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            No students selected - assessment will be available to ALL students
          </div>

          <div style={{ marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={selectAllStudents}>
              Select All
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearStudentSelection}>
              Clear All
            </button>
          </div>
        </div>

        <button className="btn" onClick={createAssessment}>Create Assessment</button>
      </div>
    );
  };

  const fetchStudents = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const studentsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setDbStudents(studentsList);
      console.log("Fetched students from database:", studentsList);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  }, []);

  // Call fetchStudents when admin dashboard loads
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      fetchStudents();
    }
  }, [currentUser, fetchStudents]);

  // Add student by email search
  const addStudentByEmail = async () => {
    if (!studentSearchEmail.trim()) {
      alert('Please enter an email address');
      return;
    }

    setIsSearching(true);

    try {
      const studentQuery = query(
        collection(db, "students"),
        where("email", "==", studentSearchEmail.toLowerCase().trim())
      );

      const querySnapshot = await getDocs(studentQuery);

      if (querySnapshot.empty) {
        alert('No student found with this email address');
        setIsSearching(false);
        return;
      }

      const studentDoc = querySnapshot.docs[0];
      const studentData = studentDoc.data();

      // Check if already in the list
      if (dbStudents.some(s => s.id === studentDoc.id)) {
        alert('Student is already in the list');
        setIsSearching(false);
        return;
      }

      // Add to local state
      setDbStudents(prev => [...prev, { id: studentDoc.id, ...studentData }]);
      setStudentSearchEmail('');
      alert(`Added student: ${studentData.fullName} (${studentData.email})`);

    } catch (error) {
      console.error("Error searching for student:", error);
      alert('Error searching for student');
    }

    setIsSearching(false);
  };
  const toggleStudentStatus = async (studentId, currentStatus) => {
    const action = currentStatus ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${action} this student?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, "students", studentId), {
        isActive: !currentStatus,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setDbStudents(prev =>
        prev.map(student =>
          student.id === studentId
            ? { ...student, isActive: !currentStatus }
            : student
        )
      );

      alert(`Student ${action}d successfully!`);

    } catch (error) {
      console.error(`Error ${action}ing student:`, error);
      alert(`Failed to ${action} student`);
    }
  };
  // Render Manage Students Tab
  // Updated renderManageStudents function
  const renderManageStudents = () => (
    <div>
      <h3>Manage Students</h3>

      {/* Search and Add Student */}
      <div className="form-group">
        <label htmlFor="studentSearch">Add Student by Email:</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="email"
            id="studentSearch"
            placeholder="Enter student email address"
            value={studentSearchEmail}
            onChange={(e) => setStudentSearchEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addStudentByEmail()}
          />
          <button
            className="btn"
            onClick={addStudentByEmail}
            disabled={isSearching}
          >
            {isSearching ? 'Searching...' : 'Add Student'}
          </button>
        </div>
        <small style={{ color: '#666', fontSize: '12px' }}>
          Search for registered students by their email address
        </small>
      </div>

      {/* Refresh Students Button */}
      <div style={{ marginBottom: '20px' }}>
        <button className="btn btn-secondary" onClick={fetchStudents}>
          🔄 Refresh Student List
        </button>
      </div>

      {/* Students List */}
      <div>
        <h4>Registered Students ({dbStudents.length})</h4>

        {dbStudents.length === 0 ? (
          <div className="question-card">
            <h4>No Students Found</h4>
            <p>No students are registered in the system yet.</p>
          </div>
        ) : (
          dbStudents.map(student => (
            <div key={student.id} className="question-card">
              <div className="question-header">
                <div>
                  <h4>👤 {student.fullName || `${student.firstName} ${student.lastName}`}</h4>
                  <div className="question-meta">
                    <strong>Email:</strong> {student.email}<br />
                    <strong>Status:</strong>
                    <span style={{
                      color: student.isActive ? '#28a745' : '#dc3545',
                      fontWeight: 'bold',
                      marginLeft: '5px'
                    }}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span><br />
                    <strong>Registered:</strong> {new Date(student.registrationDate || student.createdAt).toLocaleDateString()}<br />
                    {student.lastLogin && (
                      <><strong>Last Login:</strong> {new Date(student.lastLogin).toLocaleString()}<br /></>
                    )}
                  </div>
                </div>
                <div>
                  <button
                    className={`btn ${student.isActive ? 'btn-warning' : 'btn-success'}`}
                    onClick={() => toggleStudentStatus(student.id, student.isActive)}
                  >
                    {student.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Statistics */}
      <div style={{
        background: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h4>Student Statistics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#667eea' }}>
              {dbStudents.length}
            </div>
            <div>Total Students</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>
              {dbStudents.filter(s => s.isActive).length}
            </div>
            <div>Active Students</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#dc3545' }}>
              {dbStudents.filter(s => !s.isActive).length}
            </div>
            <div>Inactive Students</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#6f42c1' }}>
              {dbStudents.filter(s => s.lastLogin).length}
            </div>
            <div>Have Logged In</div>
          </div>
        </div>
      </div>
    </div>
  );
  const isAssignedToAllStudents = (assignedStudents, allDbStudents) => {
    // If no specific assignment, it means all students
    if (!assignedStudents || assignedStudents.length === 0) {
      return true;
    }

    // Get active students from database
    const activeStudents = allDbStudents.filter(student => student.isActive);

    if (activeStudents.length === 0) {
      return false;
    }

    // Convert assigned emails to usernames for comparison
    const assignedUsernames = assignedStudents.map(email => {
      const student = allDbStudents.find(s => s.email === email);
      return student ? (student.username || student.fullName || student.email) : email;
    });

    // Get active student usernames
    const activeStudentUsernames = activeStudents.map(student =>
      student.username || student.fullName || student.email
    );

    // Debug logs
    console.log('Assigned emails:', assignedStudents);
    console.log('Converted to usernames:', assignedUsernames);
    console.log('Active student usernames from DB:', activeStudentUsernames);

    // Check if assigned usernames array contains ALL active student usernames
    return activeStudentUsernames.length === assignedUsernames.length &&
      activeStudentUsernames.every(username => assignedUsernames.includes(username));
  };

  // Helper function to display student names properly
  const getDisplayStudentNames = (assignedStudents, dbStudents) => {
    if (!assignedStudents || assignedStudents.length === 0) {
      return [];
    }

    // Convert emails to display names
    return assignedStudents.map(email => {
      const student = dbStudents.find(s => s.email === email);
      return student ? student.fullName : email;
    });
  };
  // Render Manage Assessments Tab
  const renderManageAssessments = () => (
    <div>
      <h3>Manage Assessments</h3>

      {assessments.length === 0 ? (
        <div className="question-card">
          <h4>No Assessments Found</h4>
          <p>You haven't created any assessments yet.</p>
          <button className="btn" onClick={() => setAdminActiveTab('create-assessment')}>
            Create Your First Assessment
          </button>
        </div>
      ) : (
        assessments.map(assessment => {
          const now = new Date();
          const start = new Date(assessment.startDate);
          const end = new Date(assessment.endDate);

          let statusClass = 'status-pending';

          if (now >= start && now <= end) {
            statusClass = 'status-open';
          } else if (now > end) {
            statusClass = 'status-closed';
          }

          // Use the helper function to check if assigned to all students
          const isAssignedToAll = isAssignedToAllStudents(assessment.assignedStudents, dbStudents);
          const displayNames = getDisplayStudentNames(assessment.assignedStudents, dbStudents);

          return (
            <div key={assessment.id} className="question-card">
              <div className="question-header">
                <h4>📝 {assessment.title}</h4>
                <span className={`status-badge ${statusClass}`}>{assessment.status}</span>
              </div>
              <p>{assessment.description}</p>
              <div className="question-meta">
                <strong>Duration:</strong> {new Date(assessment.startDate).toLocaleString()} - {new Date(assessment.endDate).toLocaleString()}<br />
                <strong>Max Score:</strong> {assessment.maxScore} points<br />
                <strong>Questions:</strong> {assessment.questions ? assessment.questions.length : 0}<br />
                <strong>Assigned to:</strong> {
                  isAssignedToAll
                    ? <span style={{ color: '#28a745', fontWeight: 'bold' }}>ALL STUDENTS</span>
                    : displayNames.length > 0
                      ? displayNames.join(', ') // 👈 SHOWS USERNAMES INSTEAD OF EMAILS
                      : <span style={{ color: '#dc3545', fontWeight: 'bold' }}>NO STUDENTS ASSIGNED</span>
                }
              </div>
              <div style={{ marginTop: '15px' }}>
                <button
                  className="btn"
                  onClick={() => addQuestionToAssessment(assessment.firebaseId, assessment.id)}
                >
                  Add Question
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => viewAssessmentQuestions(assessment.firebaseId)}
                >
                  View Questions
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => activateAssessmentNow(assessment.firebaseId)}
                >
                  🚀 Activate Now
                </button>
                {isAssignedToAll ? (
                  <button
                    className="btn btn-success"
                    onClick={() => assignToSpecificStudents(assessment.firebaseId)}
                  >
                    Assign to Specific Students
                  </button>
                ) : (
                  <button
                    className="btn btn-success"
                    onClick={() => assignToAllStudents(assessment.firebaseId)}
                  >
                    Assign to All Students
                  </button>
                )}
                <button
                  className="btn btn-danger"
                  onClick={() => deleteAssessment(assessment.firebaseId)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // Render Grade Submissions Tab
const renderGradeSubmissions = () => {
    const allSubmissions = extractAllSubmissionsFromAssessments();

    return (
      <div>
        <h3>Grade Submissions</h3>
        
       

        {/* Summary Statistics */}
        {allSubmissions.length > 0 && (
          <div className="stats-summary" style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <strong>Summary:</strong> {allSubmissions.length} total submissions | {allSubmissions.filter(s => s.graded).length} graded | {allSubmissions.filter(s => !s.graded).length} pending
          </div>
        )}

        {/* No Submissions State */}
        {allSubmissions.length === 0 ? (
          <div className="question-card">
            <h4>No Submissions Found</h4>
            <p>There are currently no student submissions in the system.</p>
          </div>
        ) : (
          /* Submissions List */
          <div className="submissions-container">
            {allSubmissions.map(submission => {
              // Find assessment using firebaseAssessmentId
              const assessment = assessments.find(a => a.firebaseId === submission.firebaseAssessmentId);
              
              // Skip if assessment not found
              if (!assessment) {
                console.warn(`Assessment not found for submission ${submission.id}`);
                return null;
              }

              const answerCount = submission.answers ? Object.keys(submission.answers).length : 0;
              const isGraded = submission.graded;
              const submissionDate = new Date(submission.submittedAt);

              return (
                <div key={submission.id} className="question-card">
                  {/* Header Section */}
                  <div className="question-header">
                    <h4>📋 {assessment.title} - {submission.studentName}</h4>
                    <span className={`status-badge ${isGraded ? 'status-open' : 'status-pending'}`}>
                      {isGraded ? 'Graded' : 'Pending'}
                    </span>
                  </div>

                  {/* Submission Details */}
                  <div className="question-meta">
                    <div><strong>Submitted:</strong> {submissionDate.toLocaleString()}</div>
                    <div><strong>Status:</strong> {submission.isDraft ? 'Draft' : 'Final Submission'}</div>
                    <div><strong>Answers:</strong> {answerCount} questions answered</div>
                    <div><strong>Total Score:</strong> {submission.totalScore} / {assessment.maxScore}</div>
                    
                    {/* Show individual question scores if graded
                    {isGraded && Object.keys(submission.questionScores).length > 0 && (
                      <div style={{ marginTop: '8px' }}>
                        <strong>Question Breakdown:</strong>
                        <div style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
                          {Object.entries(submission.questionScores).map(([questionId, score]) => (
                            <div key={questionId}>Question {questionId}: {score} points</div>
                          ))}
                        </div>
                      </div>
                    )} */}
                    
                    {submission.submissionNotes && (
                      <div><strong>Notes:</strong> {submission.submissionNotes}</div>
                    )}
                  </div>

                  {/* Time Information */}
                  {submission.timeSpent && (
                    <div className="time-info" style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                      <strong>Time Spent:</strong> {Math.round(submission.timeSpent / 60)} minutes
                    </div>
                  )}

                  {/* Action Section */}
                  <div style={{ marginTop: '15px' }}>
                    {!isGraded ? (
                      <button 
                        className="btn btn-primary" 
                        onClick={() => gradeSubmission(submission.id)}
                      >
                        Grade Submission
                      </button>
                    ) : (
                      <div style={{ 
                        padding: '8px 12px', 
                        backgroundColor: '#d4edda', 
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        color: '#155724',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        ✅ Grade Already Submitted
                      </div>
                    )}
                  </div>

                  {/* Grade Display for Completed Submissions */}
                  {isGraded && submission.feedback && (
                    <div className="grade-feedback" style={{ 
                      marginTop: '15px', 
                      padding: '10px', 
                      backgroundColor: '#e8f5e8', 
                      borderRadius: '5px',
                      borderLeft: '4px solid #28a745'
                    }}>
                      <strong>Feedback:</strong>
                      <div style={{ marginTop: '5px' }}>{submission.feedback}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render View Results Tab
 // Render View Results Tab
const renderViewResults = () => {
  const allSubmissions = extractAllSubmissionsFromAssessments();
  const gradedSubmissions = allSubmissions.filter(s => s.graded);

  return (
    <div>
      <h3>Assessment Results</h3>

      {gradedSubmissions.length === 0 ? (
        <p>No graded submissions yet.</p>
      ) : (
        gradedSubmissions.map(submission => {
          const assessment = assessments.find(a => a.firebaseId === submission.firebaseAssessmentId);
          if (!assessment) return null;

          // Use totalScore instead of submission.score
          const percentage = ((submission.totalScore / assessment.maxScore) * 100).toFixed(1);

          return (
            <div key={submission.id} className="question-card">
              <div className="question-header">
                <h4>📊 {assessment.title} - {submission.studentName}</h4>
                <span className="status-badge status-open">{percentage}%</span>
              </div>
              <div className="question-meta">
                <strong>Score:</strong> {submission.totalScore} / {assessment.maxScore}<br />
                <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}<br />
                <strong>Graded:</strong> {new Date(submission.gradedAt).toLocaleString()}
                
                {/* Optional: Show question breakdown
                {Object.keys(submission.questionScores).length > 0 && (
                  <div style={{ marginTop: '10px' }}>
                    <strong>Question Breakdown:</strong>
                    <div style={{ marginLeft: '10px', fontSize: '14px', color: '#666' }}>
                      {Object.entries(submission.questionScores).map(([questionId, score]) => (
                        <div key={questionId}>Question {questionId}: {score} points</div>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

  // Render Student Dashboard
  const renderStudentDashboard = () => (
    <div className="card">
      <div className="header">
        <h1>🎓 Student Dashboard</h1>
        <p>Welcome, <span>{currentUser?.username}</span>!</p>
        <button className="btn btn-secondary" onClick={logout}>Logout</button>
      </div>

      <div className="nav-tabs">
        <button
          className={`nav-tab ${studentActiveTab === 'available-assessments' ? 'active' : ''}`}
          onClick={() => setStudentActiveTab('available-assessments')}
        >
          Available Assessments
        </button>
        <button
          className={`nav-tab ${studentActiveTab === 'my-submissions' ? 'active' : ''}`}
          onClick={() => setStudentActiveTab('my-submissions')}
        >
          My Submissions
        </button>
        <button
          className={`nav-tab ${studentActiveTab === 'results' ? 'active' : ''}`}
          onClick={() => setStudentActiveTab('results')}
        >
          Results
        </button>
      </div>

      {studentActiveTab === 'available-assessments' && renderAvailableAssessments()}
      {studentActiveTab === 'my-submissions' && renderMySubmissions()}
      {studentActiveTab === 'results' && renderStudentResults()}
    </div>
  );

 const renderAvailableAssessments = () => {
  const myAssessments = loadStudentAssessments();
  const now = new Date();

  return (
    <div>
      <h3>Available Assessments</h3>

      {myAssessments.length === 0 ? (
        <div className="question-card">
          <h4>No Assessments Available</h4>
          <p>You currently have no assessments assigned to you.</p>
        </div>
      ) : (
        myAssessments.map(assessment => {
          const start = new Date(assessment.startDate);
          const end = new Date(assessment.endDate);

          let status = 'Scheduled';
          let statusClass = 'status-pending';
          let actionButton = '';

          // Check if current student has submitted this assessment
          const currentStudentEmail = currentUser.email;
          const sanitizedEmail = currentStudentEmail.replace('@', '_').replace(/\./g, '_');
          
          const currentStudentSubmission = assessment.submissions && assessment.submissions[sanitizedEmail];
          const hasSubmitted = currentStudentSubmission && currentStudentSubmission.questions;
          
          // Check if student completed ALL questions
          const totalQuestions = assessment.questions ? assessment.questions.length : 0;
          const questionsAnswered = hasSubmitted ? Object.keys(currentStudentSubmission.questions).length : 0;
          const isCompleted = hasSubmitted && (questionsAnswered === totalQuestions);

          // Check if assessment is graded
          const gradesKey = `GRADES_${sanitizedEmail}`;
          const isGraded = assessment.submissions && assessment.submissions[gradesKey];
          const gradeData = isGraded ? assessment.submissions[gradesKey] : null;

          if (now >= start && now <= end) {
            status = 'Active';
            statusClass = 'status-open';

            if (isCompleted) {
              // Student has completed all questions
              if (isGraded) {
                const percentage = ((gradeData.totalScore / assessment.maxScore) * 100).toFixed(1);
                actionButton = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="status-badge status-open">
                      ✅ Completed & Graded ({gradeData.totalScore}/{assessment.maxScore} - {percentage}%)
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => viewMyAnswers(`sub_${assessment.id}_${sanitizedEmail}`)}
                    >
                      View Results
                    </button>
                  </div>
                );
              } else {
                actionButton = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="status-badge status-open">
                      ✅ Assessment Completed - Awaiting Grade
                    </span>
                    <button
                      className="btn btn-secondary"
                      onClick={() => viewMyAnswers(`sub_${assessment.id}_${sanitizedEmail}`)}
                    >
                      Review My Answers
                    </button>
                  </div>
                );
              }
            } else if (hasSubmitted && questionsAnswered < totalQuestions) {
              // Student has partial submission - allow continue
              actionButton = (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    color: '#ffc107', 
                    fontWeight: 'bold', 
                    fontSize: '14px' 
                  }}>
                    📝 In Progress ({questionsAnswered}/{totalQuestions} questions)
                  </span>
                  <button 
                    className="btn btn-warning" 
                    onClick={() => takeAssessment(assessment.firebaseId, assessment.id)}
                  >
                    Continue Assessment
                  </button>
                </div>
              );
            } else {
              // Fresh start - no submission yet
              actionButton = (
                <button 
                  className="btn" 
                  onClick={() => takeAssessment(assessment.firebaseId, assessment.id)}
                >
                  Take Assessment
                </button>
              );
            }
          } else if (now > end) {
            status = 'Closed';
            statusClass = 'status-closed';
            
            if (isCompleted && isGraded) {
              const percentage = ((gradeData.totalScore / assessment.maxScore) * 100).toFixed(1);
              actionButton = (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="status-badge status-closed">
                    Assessment Ended - Final Score: {gradeData.totalScore}/{assessment.maxScore} ({percentage}%)
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => viewMyAnswers(`sub_${assessment.id}_${sanitizedEmail}`)}
                  >
                    View Results
                  </button>
                </div>
              );
            } else if (isCompleted) {
              actionButton = (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="status-badge status-closed">
                    Assessment Ended - Completed, Awaiting Grade
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => viewMyAnswers(`sub_${assessment.id}_${sanitizedEmail}`)}
                  >
                    Review Answers
                  </button>
                </div>
              );
            } else if (hasSubmitted) {
              actionButton = (
                <span className="status-badge status-closed">
                  Assessment Ended - Partial Submission ({questionsAnswered}/{totalQuestions} questions)
                </span>
              );
            } else {
              actionButton = (
                <span className="status-badge status-closed">
                  Assessment Ended - Not Submitted
                </span>
              );
            }
          } else {
            // Assessment not started yet
            actionButton = (
              <button className="btn btn-secondary" disabled>
                Not Started Yet
              </button>
            );
          }

          return (
            <div key={assessment.id} className="question-card">
              <div className="question-header">
                <h4>📝 {assessment.title}</h4>
                <span className={`status-badge ${statusClass}`}>{status}</span>
              </div>
              <p>{assessment.description}</p>
              <div className="question-meta">
                <strong>Duration:</strong> {new Date(assessment.startDate).toLocaleString()} - {new Date(assessment.endDate).toLocaleString()}<br />
                <strong>Max Score:</strong> {assessment.maxScore} points<br />
                <strong>Questions:</strong> {totalQuestions}
                
                {/* Show submission details if student has submitted */}
                {hasSubmitted && (
                  <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>Your Progress:</strong><br />
                    <small>
                      Questions Answered: {questionsAnswered}/{totalQuestions}<br />
                      Last Updated: {new Date(currentStudentSubmission.submittedAt).toLocaleString()}<br />
                      Status: {isCompleted ? 'Completed' : 'In Progress'}
                      {isGraded && isCompleted && (
                        <><br />Grade: {gradeData.totalScore}/{assessment.maxScore} points</>
                      )}
                    </small>
                  </div>
                )}
              </div>
              <div style={{ marginTop: '15px' }}>
                {actionButton}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

// Helper function to check if student completed an assessment
const hasStudentCompletedAssessment = (assessment, studentEmail) => {
  if (!assessment.submissions || !studentEmail) return false;
  
  const sanitizedEmail = studentEmail.replace('@', '_').replace(/\./g, '_');
  const studentSubmission = assessment.submissions[sanitizedEmail];
  
  if (!studentSubmission || !studentSubmission.questions) return false;
  
  const totalQuestions = assessment.questions ? assessment.questions.length : 0;
  const questionsAnswered = Object.keys(studentSubmission.questions).length;
  
  return questionsAnswered === totalQuestions;
};

// Helper function to get student's assessment progress
const getStudentAssessmentProgress = (assessment, studentEmail) => {
  if (!assessment.submissions || !studentEmail) return null;
  
  const sanitizedEmail = studentEmail.replace('@', '_').replace(/\./g, '_');
  const studentSubmission = assessment.submissions[sanitizedEmail];
  
  if (!studentSubmission) return null;
  
  const totalQuestions = assessment.questions ? assessment.questions.length : 0;
  const questionsAnswered = studentSubmission.questions ? Object.keys(studentSubmission.questions).length : 0;
  
  const gradesKey = `GRADES_${sanitizedEmail}`;
  const gradeData = assessment.submissions[gradesKey];
  
  return {
    submitted: true,
    questionsAnswered: questionsAnswered,
    totalQuestions: totalQuestions,
    isCompleted: questionsAnswered === totalQuestions,
    isGraded: !!gradeData,
    gradeData: gradeData,
    submittedAt: studentSubmission.submittedAt,
    submissionData: studentSubmission
  };
};

const extractAllSubmissionsFromAssessments = () => {
  const allSubmissions = [];

  assessments.forEach(assessment => {
    if (!assessment.submissions) return;

    Object.entries(assessment.submissions).forEach(([key, data]) => {
      // Skip any non-student records (if they exist)
      if (!data.studentId || !data.questions) return;

      const submission = {
        id: `sub_${assessment.id}_${key}`,
        assessmentId: assessment.id,
        firebaseAssessmentId: assessment.firebaseId,
        assessmentTitle: assessment.title,
        assessmentMaxScore: assessment.maxScore,
        studentId: data.studentId,
        studentName: data.studentName,
        answers: data.questions,                    // Questions with answers AND grades
        submittedAt: data.submittedAt,
        questionsAnswered: Object.keys(data.questions).length,
        isDraft: data.isDraft || false,
        graded: data.graded || false,
        totalScore: data.totalScore || 0,
        gradedAt: data.gradedAt,
        questionScores: {}                          // Will be populated below
      };

      // Extract individual question scores from nested structure
      Object.entries(data.questions).forEach(([questionId, questionData]) => {
        if (questionData.grade !== undefined) {
          submission.questionScores[questionId] = questionData.grade;
        }
      });

      // Also add scores property for compatibility
      submission.scores = submission.questionScores;

      allSubmissions.push(submission);
    });
  });

  console.log('Extracted submissions with nested grades:', allSubmissions);
  return allSubmissions;
};

// Updated student extraction function
const extractSubmissionsFromAssessments = () => {
  const currentStudentEmail = currentUser?.email;
  if (!currentStudentEmail) return [];

  const mySubmissions = [];
  const sanitizedEmail = currentStudentEmail.replace('@', '_').replace(/\./g, '_');

  assessments.forEach(assessment => {
    if (!assessment.submissions) return;

    const submissionData = assessment.submissions[sanitizedEmail];

    if (submissionData && submissionData.questions) {
      const submission = {
        id: `sub_${assessment.id}_${sanitizedEmail}`,
        assessmentId: assessment.id,
        firebaseAssessmentId: assessment.firebaseId,
        assessmentTitle: assessment.title,
        assessmentMaxScore: assessment.maxScore,
        studentId: currentStudentEmail,
        studentName: currentUser.username,
        answers: submissionData.questions,          // Questions with answers AND grades
        submittedAt: submissionData.submittedAt,
        questionsAnswered: Object.keys(submissionData.questions).length,
        graded: submissionData.graded || false,
        totalScore: submissionData.totalScore || 0,
        gradedAt: submissionData.gradedAt,
        isDraft: false,
        questionScores: {},
        scores: {}
      };

      // Extract individual question grades from nested structure
      Object.entries(submissionData.questions).forEach(([questionId, questionData]) => {
        if (questionData.grade !== undefined) {
          submission.questionScores[questionId] = questionData.grade;
          submission.scores[questionId] = questionData.grade;
        }
      });

      // Set overall score from nested data
      submission.score = submissionData.totalScore || 0;

      mySubmissions.push(submission);
    }
  });

  return mySubmissions;
};

// Helper function to get grade for specific question
const getQuestionGrade = (assessment, studentEmail, questionId) => {
  const sanitizedEmail = studentEmail.replace('@', '_').replace(/\./g, '_');
  const studentSubmission = assessment.submissions?.[sanitizedEmail];
  
  if (studentSubmission && studentSubmission.questions && studentSubmission.questions[questionId]) {
    return studentSubmission.questions[questionId].grade;
  }
  
  return null;
};

// Helper function to get all grades for a student
const getAllGradesForStudent = (assessment, studentEmail) => {
  const sanitizedEmail = studentEmail.replace('@', '_').replace(/\./g, '_');
  const studentSubmission = assessment.submissions?.[sanitizedEmail];
  
  if (!studentSubmission || !studentSubmission.questions) {
    return {};
  }

  const grades = {};
  Object.entries(studentSubmission.questions).forEach(([questionId, questionData]) => {
    if (questionData.grade !== undefined) {
      grades[questionId] = questionData.grade;
    }
  });

  return grades;
};

  const renderMySubmissions = () => {
    const mySubmissions = extractSubmissionsFromAssessments();

    return (
      <div>
        <h3>My Submissions</h3>

        {mySubmissions.length === 0 ? (
          <div className="question-card">
            <h4>No Submissions Yet</h4>
            <p>You haven't submitted any assessments yet.</p>
            <button
              className="btn"
              onClick={() => setStudentActiveTab('available-assessments')}
            >
              View Available Assessments
            </button>
          </div>
        ) : (
          mySubmissions.map(submission => {
            const status = submission.isDraft ? 'Draft' : 'Submitted';
            const statusClass = submission.isDraft ? 'status-pending' : 'status-open';

            // Count answered questions
            const answeredQuestions = submission.answers ? Object.keys(submission.answers).length : 0;

            return (
              <div key={submission.id} className="question-card">
                <div className="question-header">
                  <h4>📋 {submission.assessmentTitle}</h4>
                  <span className={`status-badge ${statusClass}`}>{status}</span>
                </div>
                <div className="question-meta">
                  <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}<br />
                  <strong>Status:</strong> {submission.graded ? 'Graded' : 'Pending Review'}<br />
                  <strong>Questions Answered:</strong> {answeredQuestions}<br />
                  {submission.score !== undefined && (
                    <><strong>Score:</strong> {submission.score} / {submission.assessmentMaxScore}<br /></>
                  )}
                  <strong>Submission ID:</strong> {submission.id}
                </div>

                {/* Show preview of answers */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '10px',
                  borderRadius: '5px',
                  margin: '10px 0',
                  maxHeight: '100px',
                  overflow: 'hidden'
                }}>
                  <strong>Answer Preview:</strong>
                  {submission.answers && Object.keys(submission.answers).length > 0 ? (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {Object.entries(submission.answers).slice(0, 2).map(([questionId, answerData]) => {
                        // Handle different answer data structures
                        let preview = '';
                        if (typeof answerData === 'object' && answerData.answers) {
                          // New structure: answerData.answers contains the actual answers
                          const answers = Object.values(answerData.answers);
                          preview = answers[0] ? String(answers[0]).substring(0, 100) + '...' : 'No answer';
                        } else if (typeof answerData === 'object') {
                          // Direct object with answer types
                          const answers = Object.values(answerData);
                          preview = answers[0] ? String(answers[0]).substring(0, 100) + '...' : 'No answer';
                        } else if (typeof answerData === 'string') {
                          preview = answerData.substring(0, 100) + '...';
                        } else {
                          preview = 'Answer provided';
                        }

                        return (
                          <div key={questionId}>
                            <strong>Q:</strong> {preview}
                          </div>
                        );
                      })}
                      {Object.keys(submission.answers).length > 2 && (
                        <div style={{ fontStyle: 'italic' }}>
                          ...and {Object.keys(submission.answers).length - 2} more answers
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#dc3545', fontStyle: 'italic' }}>
                      No answers found
                    </div>
                  )}
                </div>

                <div style={{ marginTop: '15px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => viewMyAnswers(submission.id)}
                  >
                    👁️ View My Answers
                  </button>
                  {submission.isDraft && (
                    <button
                      className="btn btn-warning"
                      onClick={() => takeAssessment(submission.firebaseAssessmentId, submission.assessmentId)}
                    >
                      📝 Continue Editing
                    </button>
                  )}
                  {submission.graded && (
                    <button
                      className="btn"
                      onClick={() => viewDetailedResults(submission.id)}
                    >
                      📊 View Results
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    );
  };

  // Render My Submissions
  // const renderMySubmissions = () => {
  //   const mySubmissions = submissions.filter(s => s.studentName === currentUser?.username);

  //   return (
  //     <div>
  //       <h3>My Submissions</h3>

  //       {mySubmissions.length === 0 ? (
  //         <p>No submissions yet.</p>
  //       ) : (
  //         mySubmissions.map(submission => {
  //           const assessment = assessments.find(a => a.id === submission.assessmentId);
  //           if (!assessment) return null;

  //           const status = submission.isDraft ? 'Draft' : 'Submitted';
  //           const statusClass = submission.isDraft ? 'status-pending' : 'status-open';

  //           return (
  //             <div key={submission.id} className="question-card">
  //               <div className="question-header">
  //                 <h4>📋 {assessment.title}</h4>
  //                 <span className={`status-badge ${statusClass}`}>{status}</span>
  //               </div>
  //               <div className="question-meta">
  //                 <strong>Last Modified:</strong> {new Date(submission.lastModified || submission.submittedAt).toLocaleString()}<br />
  //                 <strong>Status:</strong> {submission.graded ? 'Graded' : 'Pending Review'}
  //                 {submission.score !== undefined && <><br /><strong>Score:</strong> {submission.score} / {assessment.maxScore}</>}
  //               </div>
  //               <div style={{ marginTop: '15px' }}>
  //                 <button className="btn btn-secondary" onClick={() => viewMyAnswers(submission.id)}>
  //                   👁️ View My Answers
  //                 </button>
  //                 {submission.isDraft && (
  //                   <button className="btn btn-warning" onClick={() => takeAssessment(assessment.firebaseId,assessment.id)}>
  //                     📝 Continue Editing
  //                   </button>
  //                 )}
  //               </div>
  //             </div>
  //           );
  //         })
  //       )}
  //     </div>
  //   );
  // };

  // Render Student Results Tab
  const renderStudentResults = () => {
    // Use the same data extraction method as other functions
    const myAllSubmissions = extractSubmissionsFromAssessments();
    const myGradedSubmissions = myAllSubmissions.filter(s => s.graded);

    return (
      <div>
        <h3>My Results</h3>

        {myAllSubmissions.length === 0 ? (
          <div className="question-card">
            <h4>No Results Yet</h4>
            <p>You haven't submitted any assessments yet.</p>
            <button className="btn" onClick={() => setStudentActiveTab('available-assessments')}>
              View Available Assessments
            </button>
          </div>
        ) : (
          <>
            {myGradedSubmissions.length === 0 && (
              <div className="question-card">
                <h4>Submissions Under Review</h4>
                <p>You have {myAllSubmissions.length} submission(s) that are being graded.</p>
                <p>Check back later for your results!</p>
              </div>
            )}
            {myAllSubmissions.map(submission => {
              // UPDATED: Use firebaseAssessmentId to find assessment
              const assessment = assessments.find(a => a.firebaseId === submission.firebaseAssessmentId);
              if (!assessment) return null;

              let percentage = 'Pending';
              let gradeClass = 'status-pending';
              let statusText = 'Awaiting Grade';

              if (submission.graded) {
                percentage = ((submission.score / assessment.maxScore) * 100).toFixed(1) + '%';
                if (parseFloat(percentage) >= 80) gradeClass = 'status-open';
                else if (parseFloat(percentage) < 60) gradeClass = 'status-closed';
                statusText = 'Graded';
              }

              return (
                <div key={submission.id} className="question-card">
                  <div className="question-header">
                    <h4>📊 {assessment.title}</h4>
                    <span className={`status-badge ${gradeClass}`}>{percentage}</span>
                  </div>
                  <div className="question-meta">
                    <strong>Status:</strong> {statusText}<br />
                    {submission.graded && (
                      <>
                        <strong>Score:</strong> {submission.score} / {assessment.maxScore}<br />
                        <strong>Graded:</strong> {new Date(submission.gradedAt).toLocaleString()}<br />
                      </>
                    )}
                    <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}<br />
                    <strong>Draft:</strong> {submission.isDraft ? 'Yes' : 'No'}
                  </div>
                  <div style={{ marginTop: '15px' }}>
                    <button className="btn btn-secondary" onClick={() => viewMyAnswers(submission.id)}>
                      👁️ View My Answers
                    </button>
                    {submission.graded ? (
                      <button className="btn" onClick={() => viewDetailedResults(submission.id)}>
                        📊 Detailed Results
                      </button>
                    ) : (
                      <button className="btn btn-warning" onClick={() => alert('This submission is still being graded.')}>
                        ⏳ Pending Grade
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    );
  };


  // Render Assessment Taking Modal
  const renderAssessmentModal = () => {
    if (!showAssessmentModal) return null;

    // Check if we're viewing a submission or taking an assessment
    if (selectedSubmission && selectedSubmission.assessment) {
      const submission = selectedSubmission;
      const assessment = submission.assessment;

      if (submission.showDetailedResults) {
        // Detailed results view (same as before, but with corrected answer access)
        const totalPossible = assessment.maxScore;
        const totalEarned = submission.score;
        const percentage = ((totalEarned / totalPossible) * 100).toFixed(1);

        let questionsCorrect = 0;

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              width: '95%',
              maxWidth: '1000px',
              maxHeight: '90%',
              overflowY: 'auto'
            }}>
              <div className="header">
                <h3>📊 Detailed Results: {assessment.title}</h3>
                <button className="btn btn-secondary" onClick={() => setShowAssessmentModal(false)} style={{ float: 'right' }}>
                  Close
                </button>
              </div>
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '10px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <h2 style={{ margin: 0, fontSize: '2.5em' }}>{percentage}%</h2>
                <p style={{ margin: '5px 0', fontSize: '1.2em' }}>{totalEarned} / {totalPossible} points</p>
                <p style={{ margin: 0 }}>Graded on {new Date(submission.gradedAt).toLocaleString()}</p>
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {assessment.questions.map((question, index) => {
                  const questionNum = index + 1;
                  const questionScore = submission.scores ? submission.scores[question.id] || 0 : 0;

                  // FIXED: Access answers correctly based on Firebase structure
                  const questionAnswers = submission.answers && submission.answers[question.id]
                    ? submission.answers[question.id].answers || submission.answers[question.id]
                    : null;

                  const questionPercentage = ((questionScore / question.points) * 100).toFixed(1);

                  if (questionScore === question.points) questionsCorrect++;

                  let scoreClass = 'status-pending';
                  if (questionScore === question.points) scoreClass = 'status-open';
                  else if (questionScore === 0) scoreClass = 'status-closed';

                  return (
                    <div key={question.id} className="question-card">
                      <div className="question-header">
                        <h4>Question {questionNum}</h4>
                        <span className={`status-badge ${scoreClass}`}>
                          {questionScore}/{question.points} ({questionPercentage}%)
                        </span>
                      </div>
                      <p><strong>Question:</strong> {question.text}</p>
                      {question.instructions && <p><em>Instructions: {question.instructions}</em></p>}

                      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                        <strong>My Answer:</strong><br />
                        {questionAnswers && typeof questionAnswers === 'object' && Object.keys(questionAnswers).length > 0 ? (
                          Object.entries(questionAnswers).map(([type, answer]) => {
                            if (answer && answer.toString().trim()) {
                              return (
                                <div key={type} dangerouslySetInnerHTML={{
                                  __html: formatAnswerForStudent(answer, type, type)
                                }} />
                              );
                            }
                            return null;
                          })
                        ) : questionAnswers && typeof questionAnswers === 'string' && questionAnswers.trim() ? (
                          <div dangerouslySetInnerHTML={{
                            __html: formatAnswerForStudent(questionAnswers, 'text', 'Answer')
                          }} />
                        ) : (
                          <p style={{ color: '#dc3545', fontStyle: 'italic' }}>No answer submitted</p>
                        )}
                      </div>
                      <div style={{
                        marginTop: '15px',
                        padding: '10px',
                        background: scoreClass === 'status-open' ? '#d4edda' : scoreClass === 'status-closed' ? '#f8d7da' : '#fff3cd',
                        borderRadius: '5px'
                      }}>
                        <strong>Score: {questionScore} / {question.points} points</strong>
                        {questionScore === question.points ? ' ✅ Perfect!' : questionScore > 0 ? ' ✓ Partial Credit' : ' ❌ No Points'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary stats */}
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
                <h4>🎯 Performance Summary</h4>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '15px',
                  marginTop: '15px'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#667eea' }}>{percentage}%</div>
                    <div>Overall Score</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>{questionsCorrect}</div>
                    <div>Perfect Scores</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff' }}>{assessment.questions.length}</div>
                    <div>Total Questions</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#6f42c1' }}>{totalEarned}</div>
                    <div>Points Earned</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      } else {
        // FIXED: View answers modal with correct answer access
        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              background: 'white',
              padding: '30px',
              borderRadius: '15px',
              width: '95%',
              maxWidth: '900px',
              maxHeight: '90%',
              overflowY: 'auto'
            }}>
              <div className="header">
                <h3>👁️ My Answers: {assessment.title}</h3>
                <button className="btn btn-secondary" onClick={() => setShowAssessmentModal(false)} style={{ float: 'right' }}>
                  Close
                </button>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <p><strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}</p>
                <p><strong>Status:</strong> {submission.isDraft ? 'Draft' : 'Final Submission'}</p>
                {submission.graded ? (
                  <p><strong>Score:</strong> {submission.score} / {assessment.maxScore}</p>
                ) : (
                  <p><strong>Status:</strong> Pending Review</p>
                )}
                <p><strong>Submission ID:</strong> {submission.id}</p>
              </div>
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {assessment.questions.map((question, index) => {
                  const questionNum = index + 1;

                  // FIXED: Access answers correctly based on your Firebase structure
                  // The submission.answers contains the submissionsObj from submitAssessmentWithAnswers
                  const questionAnswers = submission.answers && submission.answers[question.id]
                    ? submission.answers[question.id].answers || submission.answers[question.id]
                    : null;

                  console.log(`Question ${question.id} answers:`, questionAnswers); // Debug log

                  return (
                    <div key={question.id} className="question-card">
                      <h4>❓ Question {questionNum} ({question.points} points)</h4>
                      <p><strong>Question:</strong> {question.text}</p>
                      {question.instructions && <p><em>Instructions: {question.instructions}</em></p>}
                      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                        <strong>My Answers:</strong><br />
                        {questionAnswers && typeof questionAnswers === 'object' && Object.keys(questionAnswers).length > 0 ? (
                          Object.entries(questionAnswers).map(([type, answer]) => {
                            if (answer && answer.toString().trim()) {
                              return (
                                <div key={type} style={{ marginBottom: '10px' }}>
                                  <strong>{type.toUpperCase()}:</strong>
                                  <div style={{
                                    background: '#fff',
                                    padding: '10px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    marginTop: '5px',
                                    whiteSpace: 'pre-wrap'
                                  }}>
                                    {answer}
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })
                        ) : questionAnswers && typeof questionAnswers === 'string' && questionAnswers.trim() ? (
                          <div style={{
                            background: '#fff',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            marginTop: '5px',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {questionAnswers}
                          </div>
                        ) : (
                          <div style={{
                            color: '#dc3545',
                            fontStyle: 'italic',
                            background: '#f8d7da',
                            padding: '10px',
                            borderRadius: '5px',
                            margin: '10px 0'
                          }}>
                            <p>⚠️ No answer submitted for this question</p>
                          </div>
                        )}
                      </div>
                      {/* Show score if graded */}
                      {submission.graded && submission.scores && submission.scores[question.id] !== undefined && (
                        <div style={{
                          marginTop: '15px',
                          padding: '10px',
                          background: '#e3f2fd',
                          borderRadius: '5px'
                        }}>
                          <strong>Score:</strong> {submission.scores[question.id]} / {question.points} points ({((submission.scores[question.id] / question.points) * 100).toFixed(1)}%)
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }
    }

    // Original assessment taking modal (unchanged)
    if (!currentAssessmentId) return null;

    const assessment = assessments.find(a => a.id === fileId);
    if (!assessment) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          width: '95%',
          maxWidth: '900px',
          maxHeight: '90%',
          overflowY: 'auto'
        }}>
          <div className="header">
            <h2>📝 {assessment.title}</h2>
            <button className="btn btn-secondary" onClick={closeAssessmentModal} style={{ float: 'right' }}>
              Close
            </button>
          </div>
          <p>{assessment.description}</p>
          <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '15px 0' }}>
            <strong>⏰ Time Remaining:</strong> <span id="timeRemaining"></span><br />
            <strong>🎯 Total Points:</strong> {assessment.maxScore}
          </div>

          <div>
            {assessment.questions?.map((question, index) => (
              <div key={question.id} className="question-card">
                <h4>❓ Question {index + 1} ({question.points} points)</h4>
                <p>{question.text}</p>
                {question.instructions && <p><em>Instructions: {question.instructions}</em></p>}

                {question.types?.map(type => (
                  <div key={type} className="answer-input-group">
                    <h5>{type.charAt(0).toUpperCase() + type.slice(1)} Answer:</h5>
                    {type === 'text' || type === 'code' ? (
                      <textarea
                        rows="4"
                        placeholder="Enter your answer here..."
                        style={{ fontFamily: type === 'code' ? 'monospace' : 'inherit' }}
                        value={assessmentAnswers[`${question.id}_${type}`] || ''}
                        onChange={(e) => handleAnswerChange(`${question.id}_${type}`, e.target.value)}
                      />
                    ) : type === 'file' ? (
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleAnswerChange(`${question.id}_${type}`, `${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
                          }
                        }}
                      />
                    ) : type === 'url' ? (
                      <input
                        type="url"
                        placeholder="https://github.com/username/repository"
                        value={assessmentAnswers[`${question.id}_${type}`] || ''}
                        onChange={(e) => handleAnswerChange(`${question.id}_${type}`, e.target.value)}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Enter your answer"
                        value={assessmentAnswers[`${question.id}_${type}`] || ''}
                        onChange={(e) => handleAnswerChange(`${question.id}_${type}`, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              className="btn"
              onClick={submitAssessmentWithAnswers}
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                fontSize: '18px',
                padding: '18px 35px',
                fontWeight: 'bold'
              }}
            >
              🎯 SUBMIT ASSESSMENT
            </button>
          </div>
        </div>
      </div>
    );
  };
  // Render Grading Modal
  // FIXED: renderGradingModal to show ALL questions and handle scoring properly
  const renderGradingModal = () => {
    if (!showGradingModal || !selectedSubmission) return null;

    // FIXED: Find assessment using firebaseAssessmentId, not assessmentId
    const assessment = assessments.find(a => a.firebaseId === selectedSubmission.firebaseAssessmentId);
    if (!assessment) {
      console.error("Assessment not found for submission:", selectedSubmission);
      return null;
    }

    console.log("Grading assessment:", assessment);
    console.log("Selected submission for grading:", selectedSubmission);

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          width: '95%',
          maxWidth: '900px',
          maxHeight: '90%',
          overflowY: 'auto'
        }}>
          <h3>📊 Grade Submission: {assessment.title}</h3>
          <p><strong>Student:</strong> {selectedSubmission.studentName}</p>
          <div style={{
            background: '#e3f2fd',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            <strong>Instructions:</strong> Grade each question individually. Total score will be calculated automatically.
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', margin: '20px 0' }}>
            {assessment.questions.map((question, index) => {
              // FIXED: Get question answers from correct location
              let questionAnswers = {};

              if (selectedSubmission.answers && selectedSubmission.answers[question.id]) {
                if (selectedSubmission.answers[question.id].answers) {
                  questionAnswers = selectedSubmission.answers[question.id].answers;
                } else {
                  questionAnswers = selectedSubmission.answers[question.id];
                }
              }

              // Get current score for this question (if previously graded)
              const currentScore = gradingScores[question.id] || 0;

              console.log(`Question ${question.id} answers for grading:`, questionAnswers);

              return (
                <div key={question.id} className="question-card">
                  <div className="question-header">
                    <h4>❓ Question {index + 1} ({question.points} points)</h4>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Question ID: {question.id}
                    </div>
                  </div>
                  <p><strong>Question:</strong> {question.text}</p>
                  {question.instructions && <p><em>Instructions: {question.instructions}</em></p>}

                  <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', margin: '10px 0' }}>
                    <strong>Student Answers:</strong><br />
                    {questionAnswers && typeof questionAnswers === 'object' && Object.keys(questionAnswers).length > 0 ? (
                      Object.entries(questionAnswers).map(([type, answer]) => (
                        <div key={type} style={{ marginBottom: '10px' }}>
                          <strong>{type.toUpperCase()}:</strong>
                          <div style={{
                            background: '#fff',
                            padding: '10px',
                            borderRadius: '4px',
                            border: '1px solid #ddd',
                            marginTop: '5px',
                            whiteSpace: 'pre-wrap',
                            fontFamily: type === 'code' ? 'monospace' : 'inherit'
                          }}>
                            {answer || 'No answer provided'}
                          </div>
                        </div>
                      ))
                    ) : questionAnswers && typeof questionAnswers === 'string' && questionAnswers.trim() ? (
                      <div style={{
                        background: '#fff',
                        padding: '10px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        marginTop: '5px',
                        whiteSpace: 'pre-wrap'
                      }}>
                        {questionAnswers}
                      </div>
                    ) : (
                      <div style={{ color: '#dc3545', fontStyle: 'italic' }}>
                        ⚠️ No answer found for this question
                      </div>
                    )}
                  </div>

                  {/* FIXED: Scoring input for EVERY question */}
                  <div style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: '#e8f5e8',
                    borderRadius: '8px',
                    border: '2px solid #28a745'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div>
                        <label style={{ fontWeight: 'bold', marginBottom: '5px' }}>Score for Question {index + 1}:</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <input
                            type="number"
                            min="0"
                            max={question.points}
                            style={{
                              width: '80px',
                              padding: '8px',
                              border: '2px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '16px',
                              fontWeight: 'bold'
                            }}
                            value={currentScore}
                            onChange={(e) => handleScoreChange(question.id, e.target.value)}
                            placeholder="0"
                          />
                          <span style={{ fontWeight: 'bold' }}>/ {question.points} points</span>
                          <span style={{
                            marginLeft: '10px',
                            color: currentScore == question.points ? '#28a745' : currentScore > 0 ? '#ffc107' : '#dc3545',
                            fontWeight: 'bold'
                          }}>
                            ({question.points > 0 ? ((currentScore / question.points) * 100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      </div>
                      <div style={{
                        fontSize: '24px',
                        color: currentScore == question.points ? '#28a745' : currentScore > 0 ? '#ffc107' : '#dc3545'
                      }}>
                        {currentScore == question.points ? '✅' : currentScore > 0 ? '🔶' : '❌'}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Show total score preview */}
          <div style={{
            background: '#667eea',
            color: 'white',
            padding: '15px',
            borderRadius: '8px',
            marginTop: '20px',
            textAlign: 'center'
          }}>
            <h4 style={{ margin: 0 }}>
              Total Score Preview: {
                Object.values(gradingScores).reduce((sum, score) => sum + parseInt(score || 0), 0)
              } / {assessment.maxScore} points
            </h4>
            <p style={{ margin: '5px 0 0 0' }}>
              ({((Object.values(gradingScores).reduce((sum, score) => sum + parseInt(score || 0), 0) / assessment.maxScore) * 100).toFixed(1)}%)
            </p>
          </div>

          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={closeGradingModal}>Cancel</button>
            <button
              className="btn"
              onClick={saveGrades}
              style={{ marginLeft: '10px' }}
            >
              💾 Save Grades for All Questions
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Question Creation Modal
  const renderQuestionModal = () => {
    if (!showQuestionModal) return null;

    const answerTypes = [
      { value: 'text', label: '📝 Text Answer', description: 'Written response' },
      { value: 'file', label: '📎 File Upload', description: 'Image file' },
      { value: 'url', label: '🔗 URL Link', description: 'Repository link' },
      { value: 'voice', label: '🎤 Voice Recording', description: 'Audio recording' },
      { value: 'code', label: '💻 Code Snippet', description: 'Programming code' }
    ];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '90%',
          overflowY: 'auto'
        }}>
          <h3>➕ Add Question to Assessment</h3>

          <div className="form-group">
            <label htmlFor="questionText">Question:</label>
            <textarea ref={questionTextRef} id="questionText" rows="3" placeholder="Enter your question"></textarea>
          </div>

          <div className="form-group">
            <label><strong>Answer Types (Select one or more):</strong></label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '10px',
              marginTop: '10px'
            }}>
              {answerTypes.map(type => (
                <div
                  key={type.value}
                  style={{
                    background: selectedAnswerTypes.includes(type.value) ? '#e3f2fd' : 'white',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    border: selectedAnswerTypes.includes(type.value) ? '2px solid #667eea' : '2px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    fontSize: '12px'
                  }}
                  onClick={() => toggleAnswerType(type.value)}
                >
                  <div>{type.label}</div>
                  <div style={{ color: '#666', fontSize: '10px' }}>{type.description}</div>
                </div>
              ))}
            </div>
          </div>

          {(selectedAnswerTypes.includes('text') || selectedAnswerTypes.includes('code')) && (
            <div className="form-group">
              <label><strong>Text Minimum Requirements:</strong></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                {[50, 100, 200, 500, 1000].map(limit => (
                  <div
                    key={limit}
                    style={{
                      background: selectedTextLimit === limit ? '#667eea' : '#f8f9fa',
                      color: selectedTextLimit === limit ? 'white' : '#333',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      fontSize: '12px'
                    }}
                    onClick={() => selectTextLimit(limit)}
                  >
                    Min {limit} chars
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="questionPoints">Points:</label>
            <input ref={questionPointsRef} type="number" id="questionPoints" placeholder="Points for this question" defaultValue="10" />
          </div>

          <div className="form-group">
            <label htmlFor="questionInstructions">Additional Instructions:</label>
            <textarea ref={questionInstructionsRef} id="questionInstructions" rows="2" placeholder="Any specific instructions for this question"></textarea>
          </div>

          <div style={{ textAlign: 'right', marginTop: '20px' }}>
            <button className="btn btn-secondary" onClick={closeQuestionModal}>Cancel</button>
            <button className="btn" onClick={addQuestion}>Add Question</button>
          </div>
        </div>
      </div>
    );
  };

  // Render Questions View Modal
  const renderQuestionsViewModal = () => {
    if (!showQuestionsViewModal || !selectedAssessmentForQuestions) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.8)',
        zIndex: 1001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '15px',
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90%',
          overflowY: 'auto'
        }}>
          <h3>❓ Questions for: {selectedAssessmentForQuestions.title}</h3>

          {selectedAssessmentForQuestions.questions && selectedAssessmentForQuestions.questions.length > 0 ? (
            selectedAssessmentForQuestions.questions.map((question, index) => (
              <div key={question.id} className="question-card">
                <h4>Question {index + 1} ({question.points} points)</h4>
                <p><strong>Answer Types:</strong> {question.types.join(', ')}</p>
                {question.textLimit && <p><strong>Text Minimum:</strong> {question.textLimit} characters</p>}
                <p><strong>Question:</strong> {question.text}</p>
                {question.instructions && <p><strong>Instructions:</strong> {question.instructions}</p>}
                <button
                  className="btn btn-danger"
                  onClick={() => deleteQuestion(selectedAssessmentForQuestions.firebaseId, question.id)}
                  style={{ marginTop: '10px' }}
                >
                  Delete Question
                </button>
              </div>
            ))
          ) : (
            <p>No questions added yet.</p>
          )}

          <button className="btn btn-secondary" onClick={closeQuestionsViewModal}>Close</button>
        </div>
      </div>
    );
  };

  // Initialize defaults on mount
  useEffect(() => {
    setTimeout(() => {
      setSmartDefaults();
    }, 100);
  }, [currentView]);

  return (
    <div style={{
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      minHeight: '100vh',
      color: '#333'
    }}>
      <style>
        {`
          .card {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            margin: 20px;
            max-width: 1200px;
            margin: 20px auto;
          }

          .header {
            text-align: center;
            margin-bottom: 30px;
          }

          .header h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
            color: #555;
          }

          input, select, textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s;
          }

          input:focus, select:focus, textarea:focus {
            border-color: #667eea;
            outline: none;
          }

          .btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            transition: transform 0.2s;
            margin: 5px;
          }

          .btn:hover {
            transform: translateY(-2px);
          }

          .btn-secondary {
            background: #6c757d;
          }

          .btn-danger {
            background: #dc3545;
          }

          .btn-success {
            background: #28a745;
          }

          .btn-warning {
            background: #ffc107;
            color: #212529;
          }

          .nav-tabs {
            display: flex;
            margin-bottom: 20px;
            border-bottom: 2px solid #e0e0e0;
            flex-wrap: wrap;
          }

          .nav-tab {
            padding: 12px 24px;
            background: none;
            border: none;
            cursor: pointer;
            font-weight: 600;
            color: #666;
            border-bottom: 3px solid transparent;
            transition: all 0.3s;
          }

          .nav-tab.active {
            color: #667eea;
            border-bottom-color: #667eea;
          }

          .question-card {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 15px;
            transition: border-color 0.3s;
          }

          .question-card:hover {
            border-color: #667eea;
          }

          .question-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
          }

          .question-meta {
            font-size: 12px;
            color: #666;
            margin-bottom: 10px;
          }

          .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
          }

          .status-open {
            background: #d4edda;
            color: #155724;
          }

          .status-closed {
            background: #f8d7da;
            color: #721c24;
          }

          .status-pending {
            background: #fff3cd;
            color: #856404;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
          }

          .stats-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
          }

          .stats-number {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .student-selection {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
          }

          .student-list {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 10px;
          }

          .student-item {
            background: white;
            padding: 10px 15px;
            border-radius: 8px;
            border: 2px solid #e0e0e0;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 500;
            user-select: none;
          }

          .student-item:hover {
            border-color: #667eea;
            background: #f8f9ff;
            transform: translateY(-1px);
          }

          .student-item.selected {
            border-color: #667eea;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }

          .schedule-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #667eea;
          }

          .schedule-section h4 {
            color: #667eea;
            margin-bottom: 15px;
          }

          .preset-buttons {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 10px;
            margin-top: 10px;
          }

          .preset-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.3s ease;
          }

          .preset-btn:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
          }

          .preset-btn.active {
            background: #28a745;
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
          }

          .answer-input-group {
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
          }

          .answer-input-group h5 {
            color: #667eea;
            margin-bottom: 10px;
          }

          .demo-info {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #28a745;
          }

          @media (max-width: 768px) {
            .card {
              margin: 10px;
              padding: 20px;
            }
          }
        `}
      </style>
      <div style={{ padding: '20px' }}>
        {currentView === 'login' && renderLogin()}
        {currentView === 'admin' && renderAdminDashboard()}
        {currentView === 'student' && renderStudentDashboard()}
        {renderAssessmentModal()}
        {renderGradingModal()}
        {renderQuestionModal()}
        {renderQuestionsViewModal()}
      </div>
    </div>
  );
};

export default AssessmentManagementSystem;