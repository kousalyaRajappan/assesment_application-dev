import React, { useState, useRef } from "react";
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Plus,
  Trash2,
  Play,
  CheckCircle,
  Upload,
  Mic,
  Github,
  Type,
  Settings,
  Check,
} from "lucide-react";

const AssessmentSystem = () => {
  const [currentUser, setCurrentUser] = useState("admin");
  const [assessments, setAssessments] = useState([
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Basic JavaScript concepts and syntax",
      scheduledDate: "2025-08-20",
      scheduledTime: "10:00",
      duration: 60,
      status: "scheduled",
      questions: [
        {
          id: 1,
          question: "Explain the difference between let and var in JavaScript",
          answerTypes: ["text"],
          answer: {},
        },
        {
          id: 2,
          question:
            "Create a simple React component and record yourself explaining it",
          answerTypes: ["text", "github", "audio"],
          answer: {},
        },
      ],
    },
    {
      id: 2,
      title: "React Components",
      description: "Understanding React functional and class components",
      scheduledDate: "2025-08-22",
      scheduledTime: "14:00",
      duration: 45,
      status: "draft",
      questions: [],
    },
  ]);

  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [studentSubmissions, setStudentSubmissions] = useState({});

  // Refs for uncontrolled inputs
  const titleRef = useRef();
  const descriptionRef = useRef();
  const dateRef = useRef();
  const timeRef = useRef();
  const durationRef = useRef();
  const questionRef = useRef();

  // State for question form
  const [selectedAnswerTypes, setSelectedAnswerTypes] = useState(["text"]);

  const answerTypes = [
    {
      value: "text",
      label: "Text Answer",
      icon: Type,
      color: "blue",
      description: "Written response",
    },
    {
      value: "audio",
      label: "Audio Recording",
      icon: Mic,
      color: "red",
      description: "Voice recording (Max 5 min + Playback)",
    },
    {
      value: "github",
      label: "GitHub Link",
      icon: Github,
      color: "gray",
      description: "Repository link",
    },
    {
      value: "image",
      label: "Image Upload",
      icon: Upload,
      color: "green",
      description: "Image file",
    },
  ];

  const createAssessment = () => {
    const title = titleRef.current?.value;
    const description = descriptionRef.current?.value;
    const scheduledDate = dateRef.current?.value;
    const scheduledTime = timeRef.current?.value;
    const duration = parseInt(durationRef.current?.value) || 60;

    if (title && scheduledDate) {
      const assessment = {
        id: Date.now(),
        title,
        description,
        scheduledDate,
        scheduledTime,
        duration,
        status: "draft",
        questions: [],
      };
      setAssessments([...assessments, assessment]);

      // Clear form
      if (titleRef.current) titleRef.current.value = "";
      if (descriptionRef.current) descriptionRef.current.value = "";
      if (dateRef.current) dateRef.current.value = "";
      if (timeRef.current) timeRef.current.value = "";
      if (durationRef.current) durationRef.current.value = "60";

      setCurrentView("dashboard");
    }
  };

  const deleteAssessment = (id) => {
    setAssessments(assessments.filter((a) => a.id !== id));
  };

  const addQuestion = (assessmentId) => {
    const question = questionRef.current?.value;

    if (question && selectedAnswerTypes.length > 0) {
      const newQuestion = {
        id: Date.now(),
        question,
        answerTypes: selectedAnswerTypes,
        answer: {},
      };

      setAssessments((prev) =>
        prev.map((a) =>
          a.id === assessmentId
            ? {
                ...a,
                questions: [...a.questions, newQuestion],
              }
            : a
        )
      );

      // Update selectedAssessment as well
      if (selectedAssessment && selectedAssessment.id === assessmentId) {
        setSelectedAssessment((prev) => ({
          ...prev,
          questions: [...prev.questions, newQuestion],
        }));
      }

      // Clear form
      if (questionRef.current) questionRef.current.value = "";
      setSelectedAnswerTypes(["text"]);
    }
  };

  const removeQuestion = (assessmentId, questionId) => {
    setAssessments((prev) =>
      prev.map((a) =>
        a.id === assessmentId
          ? {
              ...a,
              questions: a.questions.filter((q) => q.id !== questionId),
            }
          : a
      )
    );

    // Update selectedAssessment as well
    if (selectedAssessment && selectedAssessment.id === assessmentId) {
      setSelectedAssessment((prev) => ({
        ...prev,
        questions: prev.questions.filter((q) => q.id !== questionId),
      }));
    }
  };

  const toggleAssessmentStatus = (id) => {
    setAssessments(
      assessments.map((a) =>
        a.id === id
          ? { ...a, status: a.status === "draft" ? "scheduled" : "draft" }
          : a
      )
    );
  };

  const toggleAnswerType = (type) => {
    setSelectedAnswerTypes((prev) => {
      if (prev.includes(type)) {
        return prev.filter((t) => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Assessment Dashboard
        </h1>
        <button
          onClick={() => setCurrentView("create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="text-blue-600" size={24} />
            <h3 className="font-semibold text-gray-900">Total Assessments</h3>
          </div>
          <p className="text-3xl font-bold text-blue-600">
            {assessments.length}
          </p>
        </div>

        <div className="bg-green-50 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="text-green-600" size={24} />
            <h3 className="font-semibold text-gray-900">Scheduled</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {assessments.filter((a) => a.status === "scheduled").length}
          </p>
        </div>

        <div className="bg-purple-50 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-purple-600" size={24} />
            <h3 className="font-semibold text-gray-900">Submissions</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            {Object.keys(studentSubmissions).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Assessments
          </h2>
        </div>
        <div className="divide-y">
          {assessments.map((assessment) => (
            <div
              key={assessment.id}
              className="p-6 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {assessment.title}
                </h3>
                <p className="text-gray-600 text-sm mb-2">
                  {assessment.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {assessment.scheduledDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={16} />
                    {assessment.duration} min
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      assessment.status === "scheduled"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {assessment.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedAssessment(assessment);
                    setCurrentView("manage");
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Settings size={20} />
                </button>
                <button
                  onClick={() => toggleAssessmentStatus(assessment.id)}
                  className={`px-3 py-1 rounded-lg text-sm ${
                    assessment.status === "draft"
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  } transition-colors`}
                >
                  {assessment.status === "draft" ? "Publish" : "Unpublish"}
                </button>
                <button
                  onClick={() => deleteAssessment(assessment.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const CreateAssessment = () => {
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedDuration, setSelectedDuration] = useState("60");

    const getQuickDate = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date.toISOString().split("T")[0];
    };

    const formatDate = (dateString) => {
      if (!dateString) return "";
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    };

    const formatTime = (timeString) => {
      if (!timeString) return "";
      const [hours, minutes] = timeString.split(":");
      const hour12 = hours % 12 || 12;
      const ampm = hours >= 12 ? "PM" : "AM";
      return `${hour12}:${minutes} ${ampm}`;
    };

    const handleQuickSchedule = (days, time) => {
      const date = getQuickDate(days);
      setSelectedDate(date);
      setSelectedTime(time);
      if (dateRef.current) dateRef.current.value = date;
      if (timeRef.current) timeRef.current.value = time;
    };

    const getDurationDisplay = (duration = selectedDuration) => {
      const dur = parseInt(duration);
      if (dur < 60) {
        return `${dur} minutes`;
      } else if (dur < 1440) {
        const hours = Math.floor(dur / 60);
        const minutes = dur % 60;
        return minutes > 0
          ? `${hours}h ${minutes}m`
          : `${hours} hour${hours > 1 ? "s" : ""}`;
      } else if (dur < 10080) {
        const days = Math.floor(dur / 1440);
        return `${days} day${days > 1 ? "s" : ""}`;
      } else {
        const weeks = Math.floor(dur / 10080);
        return `${weeks} week${weeks > 1 ? "s" : ""}`;
      }
    };

    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Assessment
          </h1>
          <p className="text-gray-600">
            Set up a new assessment for your students
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-8 space-y-8">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                ref={titleRef}
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Assessment title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                ref={durationRef}
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <optgroup label="Minutes/Hours">
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                  <option value="90">1.5 hours</option>
                  <option value="120">2 hours</option>
                  <option value="180">3 hours</option>
                </optgroup>
                <optgroup label="Days">
                  <option value="1440">1 day (24 hours)</option>
                  <option value="2880">2 days</option>
                  <option value="4320">3 days</option>
                  <option value="7200">5 days (1 week)</option>
                  <option value="10080">1 week</option>
                  <option value="20160">2 weeks</option>
                  <option value="43200">1 month</option>
                </optgroup>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose how long students have to complete this assessment
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              ref={descriptionRef}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="What will students be assessed on?"
            />
          </div>

          {/* Smart Scheduling */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Assessment Schedule
            </label>

            {/* Quick Options */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleQuickSchedule(1, "09:00")}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
              >
                <div className="text-sm font-medium text-gray-900">
                  Tomorrow
                </div>
                <div className="text-xs text-gray-500">Opens 9:00 AM</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSchedule(7, "10:00")}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
              >
                <div className="text-sm font-medium text-gray-900">
                  Next Week
                </div>
                <div className="text-xs text-gray-500">Opens 10:00 AM</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSchedule(30, "14:00")}
                className="p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
              >
                <div className="text-sm font-medium text-gray-900">
                  Next Month
                </div>
                <div className="text-xs text-gray-500">Opens 2:00 PM</div>
              </button>
            </div>

            {/* Custom Date/Time */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    📅 Start Date
                  </label>
                  <input
                    ref={dateRef}
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    🕒 Start Time
                  </label>
                  <input
                    ref={timeRef}
                    type="time"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700">
                  💡 <strong>How it works:</strong> Students can start the
                  assessment from the start date/time and have the selected
                  duration to complete it.
                </p>
              </div>
            </div>

            {/* Preview */}
            {selectedDate && selectedTime && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
                <div className="text-center">
                  <div className="text-sm text-gray-600">Assessment Window</div>
                  <div className="text-lg font-semibold text-blue-600">
                    Opens: {formatDate(selectedDate)} at{" "}
                    {formatTime(selectedTime)}
                  </div>
                  <div className="text-sm text-green-600 mt-1">
                    Duration: {getDurationDisplay()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={createAssessment}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              Create Assessment
            </button>
            <button
              onClick={() => setCurrentView("dashboard")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const ManageAssessment = () => {
    if (!selectedAssessment) return null;

    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Manage Assessment
          </h1>
          <h2 className="text-xl text-gray-600">{selectedAssessment.title}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900">
                  Questions
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {selectedAssessment.questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="bg-gray-50 border border-gray-200 rounded-xl p-6"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="bg-blue-600 text-white text-sm px-3 py-1 rounded-full font-medium">
                          Q{index + 1}
                        </span>
                        <h4 className="text-lg font-medium text-gray-900">
                          Question {index + 1}
                        </h4>
                      </div>
                      <button
                        onClick={() =>
                          removeQuestion(selectedAssessment.id, question.id)
                        }
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <p className="text-gray-900 text-lg leading-relaxed">
                        {question.question}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        Answer Types Required:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {question.answerTypes.map((type) => {
                          const answerType = answerTypes.find(
                            (t) => t.value === type
                          );
                          const Icon = answerType?.icon || Type;
                          return (
                            <div
                              key={type}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              <Icon size={16} />
                              {answerType?.label}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {selectedAssessment.questions.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <BookOpen
                      className="mx-auto mb-4 text-gray-400"
                      size={48}
                    />
                    <h3 className="text-lg font-medium mb-2">
                      No questions added yet
                    </h3>
                    <p>Use the form on the right to add your first question.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Add Question
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Question Text
                  </label>
                  <textarea
                    ref={questionRef}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder="Enter your question here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Answer Types Required
                  </label>
                  <p className="text-sm text-gray-500 mb-4">
                    Select one or more answer types for this question
                  </p>

                  <div className="space-y-3">
                    {answerTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedAnswerTypes.includes(
                        type.value
                      );

                      return (
                        <div
                          key={type.value}
                          onClick={() => toggleAnswerType(type.value)}
                          className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`p-2 rounded-lg ${
                                  isSelected
                                    ? "bg-blue-100 text-blue-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                <Icon size={18} />
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {type.label}
                                </h4>
                                <p className="text-sm text-gray-500">
                                  {type.description}
                                </p>
                              </div>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={() => addQuestion(selectedAssessment.id)}
                  disabled={selectedAnswerTypes.length === 0}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  <Plus size={18} />
                  Add Question
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Assessment Info
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      selectedAssessment.status === "scheduled"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedAssessment.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions:</span>
                  <span className="font-medium">
                    {selectedAssessment.questions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {selectedAssessment.duration} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Scheduled:</span>
                  <span className="font-medium">
                    {selectedAssessment.scheduledDate}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentView("dashboard")}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  const StudentDashboard = () => {
    const availableAssessments = assessments.filter(
      (a) => a.status === "scheduled"
    );
    const submittedAssessments = Object.keys(studentSubmissions);

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">My Assessments</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="text-blue-600" size={24} />
              <h3 className="font-semibold text-gray-900">Available</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {availableAssessments.length}
            </p>
          </div>

          <div className="bg-green-50 p-6 rounded-xl">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="text-green-600" size={24} />
              <h3 className="font-semibold text-gray-900">Completed</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {submittedAssessments.length}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Available Assessments
            </h2>
          </div>
          <div className="divide-y">
            {availableAssessments.map((assessment) => {
              const isSubmitted = submittedAssessments.includes(
                assessment.id.toString()
              );

              return (
                <div
                  key={assessment.id}
                  className="p-6 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {assessment.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-2">
                      {assessment.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={16} />
                        {assessment.scheduledDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={16} />
                        {assessment.duration} min
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen size={16} />
                        {assessment.questions.length} questions
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isSubmitted ? (
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
                        Submitted
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedAssessment(assessment);
                          setCurrentView("take");
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors"
                      >
                        <Play size={16} />
                        Start Assessment
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {availableAssessments.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No assessments available at this time.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const TakeAssessment = () => {
    const [answers, setAnswers] = useState({});
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isRecording, setIsRecording] = useState({});
    const [recordingTime, setRecordingTime] = useState({});
    const [isPlaying, setIsPlaying] = useState({});
    const [playbackTime, setPlaybackTime] = useState({});
    const [uploadedFiles, setUploadedFiles] = useState({});
    const answerRefs = useRef({});
    const fileInputRefs = useRef({});
    const recordingTimers = useRef({});
    const playbackTimers = useRef({});

    if (!selectedAssessment) return null;

    const currentQuestion = selectedAssessment.questions[currentQuestionIndex];

    const startRecording = async (questionId) => {
      // In sandboxed environments like Claude.ai, we'll use simulation
      setIsRecording((prev) => ({ ...prev, [questionId]: true }));
      setRecordingTime((prev) => ({ ...prev, [questionId]: 0 }));

      // Start timer that updates every second
      recordingTimers.current[questionId] = setInterval(() => {
        setRecordingTime((prev) => {
          const currentTime = (prev[questionId] || 0) + 1;

          // Auto-stop at 5 minutes (300 seconds)
          if (currentTime >= 300) {
            stopRecording(questionId);
            return prev;
          }

          return { ...prev, [questionId]: currentTime };
        });
      }, 1000);
    };

    const stopRecording = (questionId) => {
      // Clear the timer
      if (recordingTimers.current[questionId]) {
        clearInterval(recordingTimers.current[questionId]);
        delete recordingTimers.current[questionId];
      }

      const finalTime = recordingTime[questionId] || 0;
      setIsRecording((prev) => ({ ...prev, [questionId]: false }));

      // Save the recording with duration info
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          audio: `demo_audio_recording_${finalTime}s`,
        },
      }));
    };

    const startPlayback = (questionId, duration) => {
      setIsPlaying((prev) => ({ ...prev, [questionId]: true }));
      setPlaybackTime((prev) => ({ ...prev, [questionId]: 0 }));

      // Simulate playback with timer
      playbackTimers.current[questionId] = setInterval(() => {
        setPlaybackTime((prev) => {
          const currentTime = (prev[questionId] || 0) + 1;

          // Auto-stop when playback completes
          if (currentTime >= duration) {
            stopPlayback(questionId);
            return prev;
          }

          return { ...prev, [questionId]: currentTime };
        });
      }, 1000);
    };

    const stopPlayback = (questionId) => {
      if (playbackTimers.current[questionId]) {
        clearInterval(playbackTimers.current[questionId]);
        delete playbackTimers.current[questionId];
      }
      setIsPlaying((prev) => ({ ...prev, [questionId]: false }));
      setPlaybackTime((prev) => ({ ...prev, [questionId]: 0 }));
    };

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const handleFileUpload = (questionId, file) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setUploadedFiles((prev) => ({
            ...prev,
            [questionId]: {
              file: file,
              url: e.target.result,
              name: file.name,
            },
          }));
          setAnswers((prev) => ({
            ...prev,
            [questionId]: {
              ...prev[questionId],
              image: file.name,
            },
          }));
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please select a valid image file (PNG, JPG, GIF, etc.)");
      }
    };

    const nextQuestion = () => {
      // Clean up any active recording and playback timers
      Object.keys(recordingTimers.current).forEach((questionId) => {
        if (recordingTimers.current[questionId]) {
          clearInterval(recordingTimers.current[questionId]);
          delete recordingTimers.current[questionId];
        }
      });
      Object.keys(playbackTimers.current).forEach((questionId) => {
        if (playbackTimers.current[questionId]) {
          clearInterval(playbackTimers.current[questionId]);
          delete playbackTimers.current[questionId];
        }
      });

      // Save current answers before moving to next question
      if (currentQuestion) {
        const currentAnswers = { ...(answers[currentQuestion.id] || {}) };
        currentQuestion.answerTypes.forEach((type) => {
          const ref = answerRefs.current[`${currentQuestion.id}_${type}`];
          if (ref && ref.value) {
            currentAnswers[type] = ref.value;
          }
        });
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: currentAnswers,
        }));
      }

      if (currentQuestionIndex < selectedAssessment.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    };

    const prevQuestion = () => {
      // Clean up any active recording and playback timers
      Object.keys(recordingTimers.current).forEach((questionId) => {
        if (recordingTimers.current[questionId]) {
          clearInterval(recordingTimers.current[questionId]);
          delete recordingTimers.current[questionId];
        }
      });
      Object.keys(playbackTimers.current).forEach((questionId) => {
        if (playbackTimers.current[questionId]) {
          clearInterval(playbackTimers.current[questionId]);
          delete playbackTimers.current[questionId];
        }
      });

      // Save current answers before moving to previous question
      if (currentQuestion) {
        const currentAnswers = { ...(answers[currentQuestion.id] || {}) };
        currentQuestion.answerTypes.forEach((type) => {
          const ref = answerRefs.current[`${currentQuestion.id}_${type}`];
          if (ref && ref.value) {
            currentAnswers[type] = ref.value;
          }
        });
        setAnswers((prev) => ({
          ...prev,
          [currentQuestion.id]: currentAnswers,
        }));
      }

      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(currentQuestionIndex - 1);
      }
    };

    const handleSubmit = () => {
      // Clean up any active recording and playback timers before submitting
      Object.keys(recordingTimers.current).forEach((questionId) => {
        if (recordingTimers.current[questionId]) {
          clearInterval(recordingTimers.current[questionId]);
          delete recordingTimers.current[questionId];
        }
      });
      Object.keys(playbackTimers.current).forEach((questionId) => {
        if (playbackTimers.current[questionId]) {
          clearInterval(playbackTimers.current[questionId]);
          delete playbackTimers.current[questionId];
        }
      });

      // Collect all answers from refs before submitting
      const finalAnswers = { ...answers };
      selectedAssessment.questions.forEach((question) => {
        const questionAnswers = { ...(finalAnswers[question.id] || {}) };
        question.answerTypes.forEach((type) => {
          const ref = answerRefs.current[`${question.id}_${type}`];
          if (ref && ref.value) {
            questionAnswers[type] = ref.value;
          }
        });
        if (Object.keys(questionAnswers).length > 0) {
          finalAnswers[question.id] = questionAnswers;
        }
      });

      setStudentSubmissions({
        ...studentSubmissions,
        [selectedAssessment.id]: {
          submittedAt: new Date().toISOString(),
          answers: finalAnswers,
        },
      });
      alert("Assessment submitted successfully!");
      setCurrentView("dashboard");
    };

    const AnswerInputSection = ({ question, answerType }) => {
      const answerTypeInfo = answerTypes.find((t) => t.value === answerType);
      const Icon = answerTypeInfo?.icon || Type;
      const refKey = `${question.id}_${answerType}`;
      const currentAnswer = answers[question.id]?.[answerType] || "";

      switch (answerType) {
        case "text":
          return (
            <div className="bg-white border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon size={20} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {answerTypeInfo?.label}
                  </h4>
                  <p className="text-sm text-gray-600">
                    You can include links in your text response
                  </p>
                </div>
              </div>
              <textarea
                ref={(el) => (answerRefs.current[refKey] = el)}
                defaultValue={currentAnswer}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Type your answer here... You can include links like https://example.com"
              />
              <div className="mt-2 text-xs text-gray-500">
                💡 Tip: Include links by typing the full URL (e.g.,
                https://example.com)
              </div>
            </div>
          );

        case "audio":
          const isCurrentlyRecording = isRecording[question.id];
          const hasAudioRecording = answers[question.id]?.audio;
          const currentRecordingTime = recordingTime[question.id] || 0;
          const isCurrentlyPlaying = isPlaying[question.id];
          const currentPlaybackTime = playbackTime[question.id] || 0;
          const maxTime = 300; // 5 minutes
          const timeRemaining = maxTime - currentRecordingTime;

          // Extract duration from recorded audio filename
          const getRecordedDuration = (audioString) => {
            if (!audioString) return 0;
            const match = audioString.match(/demo_audio_recording_(\d+)s/);
            return match ? parseInt(match[1]) : 0;
          };

          const recordedDuration = getRecordedDuration(hasAudioRecording);

          return (
            <div className="bg-white border-2 border-red-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Icon size={20} className="text-red-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {answerTypeInfo?.label}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Record your voice explanation (Demo Mode - Max 5 minutes)
                  </p>
                </div>
              </div>

              <div className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center">
                <Mic
                  className={`mx-auto mb-4 ${
                    isCurrentlyRecording
                      ? "text-red-600 animate-pulse"
                      : "text-red-400"
                  }`}
                  size={48}
                />

                {isCurrentlyRecording ? (
                  <div>
                    <p className="text-red-600 mb-2 font-medium">
                      🔴 Recording in progress...
                    </p>

                    {/* Recording Timer */}
                    <div className="mb-4">
                      <div className="text-2xl font-mono font-bold text-red-600 mb-2">
                        {formatTime(currentRecordingTime)}
                      </div>
                      <div className="text-sm text-red-500 mb-3">
                        Time remaining: {formatTime(timeRemaining)}
                      </div>

                      {/* Progress bar */}
                      <div className="w-48 h-3 bg-red-200 rounded-full mx-auto overflow-hidden">
                        <div
                          className="h-full bg-red-600 rounded-full transition-all duration-1000"
                          style={{
                            width: `${(currentRecordingTime / maxTime) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-red-500 mt-2">
                        Recording will auto-stop at 5:00
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => stopRecording(question.id)}
                      className="bg-red-600 text-white px-8 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium text-lg"
                    >
                      ⏹️ Stop Recording
                    </button>
                  </div>
                ) : hasAudioRecording ? (
                  <div>
                    <div className="mb-4 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="text-yellow-600">⚠️</div>
                        <p className="text-yellow-800 font-semibold">
                          DEMO MODE - NO ACTUAL AUDIO
                        </p>
                      </div>
                      <p className="text-yellow-700 text-sm">
                        This is a visual simulation only. In a real assessment
                        system, you would hear your actual recorded voice when
                        clicking play. The interface below shows exactly how
                        audio playback would work.
                      </p>
                    </div>

                    <p className="text-green-600 mb-4 font-medium">
                      ✅ Audio interface recorded successfully
                    </p>

                    <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                          <Mic size={24} className="text-white" />
                        </div>
                        <div>
                          <p className="text-green-700 font-medium">
                            Voice Recording Interface (Demo)
                          </p>
                          <p className="text-sm text-green-600">
                            Duration: {formatTime(recordedDuration)}
                          </p>
                          <p className="text-xs text-green-600">
                            Visual simulation completed
                          </p>
                        </div>
                      </div>

                      {/* Demo Audio Player Controls */}
                      <div className="bg-white rounded-lg p-4 border-2 border-dashed border-gray-300">
                        <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                          <p className="text-red-700 font-semibold text-center mb-1">
                            🔇 NO SOUND - VISUAL DEMO ONLY
                          </p>
                          <p className="text-xs text-red-600 text-center">
                            This button simulates audio playback but produces no
                            sound. In a real system, you would hear your
                            recorded voice.
                          </p>
                        </div>

                        <div className="flex items-center justify-center gap-4 mb-3">
                          {isCurrentlyPlaying ? (
                            <button
                              onClick={() => stopPlayback(question.id)}
                              className="w-12 h-12 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                              <div className="w-3 h-3 bg-white rounded-sm"></div>
                              <div className="w-3 h-3 bg-white rounded-sm ml-1"></div>
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                startPlayback(question.id, recordedDuration)
                              }
                              className="w-12 h-12 bg-gray-400 hover:bg-gray-500 rounded-full flex items-center justify-center text-white transition-colors"
                            >
                              <div className="w-0 h-0 border-l-4 border-l-white border-t-2 border-t-transparent border-b-2 border-b-transparent ml-1"></div>
                            </button>
                          )}

                          <div className="flex-1">
                            <div className="text-sm font-mono text-gray-700 mb-1">
                              {isCurrentlyPlaying
                                ? `${formatTime(
                                    currentPlaybackTime
                                  )} / ${formatTime(recordedDuration)} (SILENT)`
                                : `0:00 / ${formatTime(
                                    recordedDuration
                                  )} (VISUAL ONLY)`}
                            </div>
                            {/* Playback Progress Bar */}
                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-500 rounded-full transition-all"
                                style={{
                                  width:
                                    recordedDuration > 0
                                      ? `${
                                          (currentPlaybackTime /
                                            recordedDuration) *
                                          100
                                        }%`
                                      : "0%",
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>

                        <div className="text-center">
                          <p className="text-xs text-gray-600">
                            {isCurrentlyPlaying
                              ? "🔇 Visual simulation running (no audio output)"
                              : "🔇 Click to see interface simulation (no sound)"}
                          </p>
                        </div>
                      </div>

                      {/* Enhanced Visual Feedback */}
                      {isCurrentlyPlaying ? (
                        <div className="mt-3">
                          <div className="flex items-center justify-center gap-1 mb-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(
                              (i) => (
                                <div
                                  key={i}
                                  className="w-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{
                                    height: `${Math.random() * 32 + 12}px`,
                                    animationDelay: `${i * 100}ms`,
                                    animationDuration: "0.8s",
                                  }}
                                ></div>
                              )
                            )}
                          </div>
                          <p className="text-xs text-gray-600 text-center">
                            📊 Visual waveform (no audio)
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 mt-3">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                            <div
                              key={i}
                              className="w-2 bg-gray-400 rounded-full"
                              style={{ height: `${Math.random() * 24 + 8}px` }}
                            ></div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={() => startRecording(question.id)}
                        className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                      >
                        🎤 Record Again
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">
                      Click to start recording your audio answer
                    </p>
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700 mb-2">
                        📝 <strong>Demo Mode:</strong> This simulates audio
                        recording functionality.
                      </p>
                      <p className="text-xs text-blue-600">
                        • Maximum recording time: 5 minutes
                        <br />
                        • Real-time timer and progress tracking
                        <br />
                        • Playback feature to review recordings
                        <br />• Manual stop or auto-stop at time limit
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => startRecording(question.id)}
                      className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
                    >
                      🎤 Start Recording (Max 5 min)
                    </button>
                  </div>
                )}
              </div>
            </div>
          );

        case "github":
          return (
            <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Icon size={20} className="text-gray-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {answerTypeInfo?.label}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Share your code repository
                  </p>
                </div>
              </div>
              <input
                ref={(el) => (answerRefs.current[refKey] = el)}
                type="url"
                defaultValue={currentAnswer}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://github.com/username/repository"
              />
              <div className="mt-2 text-xs text-gray-500">
                💡 Tip: Make sure your repository is public so it can be
                accessed for review
              </div>
              {currentAnswer && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Repository link:</p>
                  <a
                    href={currentAnswer}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium break-all"
                  >
                    {currentAnswer}
                  </a>
                </div>
              )}
            </div>
          );

        case "image":
          const uploadedFile = uploadedFiles[question.id];

          return (
            <div className="bg-white border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Icon size={20} className="text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {answerTypeInfo?.label}
                  </h4>
                  <p className="text-sm text-gray-600">Upload an image file</p>
                </div>
              </div>

              <div className="border-2 border-dashed border-green-300 rounded-lg p-8 text-center">
                {uploadedFile ? (
                  <div>
                    <div className="mb-4">
                      <img
                        src={uploadedFile.url}
                        alt="Uploaded"
                        className="max-h-48 mx-auto rounded-lg shadow-sm"
                      />
                    </div>
                    <p className="text-green-600 mb-4 font-medium">
                      ✅ {uploadedFile.name}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRefs.current[question.id]?.click()
                      }
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Upload Different Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="mx-auto mb-4 text-green-400" size={48} />
                    <p className="text-gray-600 mb-4">
                      Drag and drop an image or click to browse
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        fileInputRefs.current[question.id]?.click()
                      }
                      className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      📁 Choose Image File
                    </button>
                  </div>
                )}

                <input
                  ref={(el) => (fileInputRefs.current[question.id] = el)}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      handleFileUpload(question.id, file);
                    }
                  }}
                  className="hidden"
                />

                <div className="mt-4 text-xs text-gray-500">
                  💡 Supported formats: PNG, JPG, GIF, WebP (Max size: 10MB)
                </div>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">
              {selectedAssessment.title}
            </h1>
            <span className="text-sm text-gray-500">
              {currentQuestionIndex + 1} of{" "}
              {selectedAssessment.questions.length}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) /
                    selectedAssessment.questions.length) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {currentQuestion && (
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border p-8">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-blue-600 text-white text-sm px-4 py-2 rounded-full font-medium">
                    Question {currentQuestionIndex + 1}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {currentQuestion.answerTypes.map((type) => {
                      const answerType = answerTypes.find(
                        (t) => t.value === type
                      );
                      const Icon = answerType?.icon || Type;
                      return (
                        <div
                          key={type}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700"
                        >
                          <Icon size={12} />
                          {answerType?.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 leading-relaxed">
                  {currentQuestion.question}
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              {currentQuestion.answerTypes.map((answerType) => (
                <AnswerInputSection
                  key={answerType}
                  question={currentQuestion}
                  answerType={answerType}
                />
              ))}
            </div>

            <div className="flex justify-between pt-6">
              <button
                onClick={prevQuestion}
                disabled={currentQuestionIndex === 0}
                className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Previous
              </button>

              <div className="flex gap-3">
                {currentQuestionIndex ===
                selectedAssessment.questions.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    Submit Assessment
                  </button>
                ) : (
                  <button
                    onClick={nextQuestion}
                    className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Next Question
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentView = () => {
    if (currentUser === "admin") {
      switch (currentView) {
        case "create":
          return <CreateAssessment />;
        case "manage":
          return <ManageAssessment />;
        default:
          return <AdminDashboard />;
      }
    } else {
      switch (currentView) {
        case "take":
          return <TakeAssessment />;
        default:
          return <StudentDashboard />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <BookOpen className="text-blue-600" size={28} />
              <h1 className="text-xl font-bold text-gray-900">
                Assessment System
              </h1>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setCurrentUser("admin");
                    setCurrentView("dashboard");
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentUser === "admin"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Admin
                </button>
                <button
                  onClick={() => {
                    setCurrentUser("student");
                    setCurrentView("dashboard");
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentUser === "student"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Student
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default AssessmentSystem;
