import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import profileService from "../../services/profileService";

const TestPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState(null);
  const [error, setError] = useState(null);
  const [currentSection, setCurrentSection] = useState("mcqs"); // 'mcqs' or 'theory'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({ mcqs: {}, theory: {} });
  const [timeRemaining, setTimeRemaining] = useState(20 * 60); // 20 minutes in seconds
  const [testStarted, setTestStarted] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const timerIntervalRef = useRef(null);
  const questionRef = useRef(null);

  // Handle test completion - defined early so it can be used in useEffect
  const handleTestComplete = useCallback(() => {
    setTestCompleted(true);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    // Here you can submit answers to backend if needed
    alert("Test completed! Your answers have been saved.");
  }, []);

  // Prevent text selection, copying, and screenshots
  useEffect(() => {
    if (!testStarted) return;

    const preventSelection = (e) => {
      e.preventDefault();
      return false;
    };

    const preventCopy = (e) => {
      e.preventDefault();
      return false;
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      alert("⚠️ Screenshots and copying are not allowed during the test!");
      return false;
    };

    // Prevent screenshot keyboard shortcuts
    const preventScreenshot = (e) => {
      // Print Screen key
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        alert("⚠️ Screenshots are not allowed during the test!");
        return false;
      }

      // Windows: Win + Print Screen
      if (e.key === "PrintScreen" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        alert("⚠️ Screenshots are not allowed during the test!");
        return false;
      }

      // Mac: Cmd + Shift + 3/4/5
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5")) {
        e.preventDefault();
        alert("⚠️ Screenshots are not allowed during the test!");
        return false;
      }

      // Windows: Alt + Print Screen
      if (e.key === "PrintScreen" && e.altKey) {
        e.preventDefault();
        alert("⚠️ Screenshots are not allowed during the test!");
        return false;
      }

      // F12 (Developer Tools)
      if (e.key === "F12" || e.keyCode === 123) {
        e.preventDefault();
        alert("⚠️ Developer tools are disabled during the test!");
        return false;
      }

      // Ctrl+Shift+I (Developer Tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        alert("⚠️ Developer tools are disabled during the test!");
        return false;
      }

      // Ctrl+Shift+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
        e.preventDefault();
        alert("⚠️ Developer tools are disabled during the test!");
        return false;
      }

      // Ctrl+Shift+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        alert("⚠️ Developer tools are disabled during the test!");
        return false;
      }

      // Ctrl+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key === "U") {
        e.preventDefault();
        alert("⚠️ Viewing page source is not allowed during the test!");
        return false;
      }

      // Ctrl+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && e.key === "S") {
        e.preventDefault();
        alert("⚠️ Saving the page is not allowed during the test!");
        return false;
      }

      // Ctrl+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === "P") {
        e.preventDefault();
        alert("⚠️ Printing is not allowed during the test!");
        return false;
      }
    };

    // Detect if user tries to open DevTools
    const detectDevTools = () => {
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        alert("⚠️ Developer tools detected! Please close them to continue the test.");
        // Log to backend if needed
        console.warn("DevTools detected during test");
      }
    };

    // Detect tab/window switching (common before screenshots)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switched or window minimized - likely screenshot attempt
        alert("⚠️ WARNING: Tab switching detected! This may indicate a screenshot attempt. Please stay on this page.");
        // Log the event
        console.warn("Tab visibility changed - possible screenshot attempt");
      }
    };

    // Detect window blur (user clicked away)
    const handleBlur = () => {
      alert("⚠️ WARNING: Window focus lost! This may indicate a screenshot attempt. Please stay focused on the test window.");
      console.warn("Window blur detected - possible screenshot attempt");
    };

    // Detect window resize (some screenshot tools trigger this)
    const handleResize = () => {
      // Check if resize is suspicious (very small change might be screenshot tool)
      const timeSinceStart = Date.now();
      console.warn("Window resize detected during test");
    };

    // Monitor for DevTools opening
    let devToolsCheckInterval;
    if (testStarted && !testCompleted) {
      devToolsCheckInterval = setInterval(detectDevTools, 500); // Check more frequently
    }

    // Add visibility and blur listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("resize", handleResize);

    // Detect if user tries to use browser's screenshot feature
    const handleBeforeUnload = (e) => {
      if (testStarted && !testCompleted) {
        const message = "⚠️ WARNING: Leaving this page during the test is not allowed!";
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    // Prevent drag and drop
    const preventDrag = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener("selectstart", preventSelection);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("keydown", preventScreenshot);
    document.addEventListener("dragstart", preventDrag);
    document.addEventListener("drop", preventDrag);

    // Disable text selection via CSS
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.body.style.mozUserSelect = "none";
    document.body.style.msUserSelect = "none";

    return () => {
      document.removeEventListener("selectstart", preventSelection);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("paste", preventCopy);
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("keydown", preventScreenshot);
      document.removeEventListener("dragstart", preventDrag);
      document.removeEventListener("drop", preventDrag);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (devToolsCheckInterval) {
        clearInterval(devToolsCheckInterval);
      }
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      document.body.style.mozUserSelect = "";
      document.body.style.msUserSelect = "";
    };
  }, [testStarted, testCompleted]);

  // Timer effect
  useEffect(() => {
    if (testStarted && !testCompleted && timeRemaining > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [testStarted, testCompleted, timeRemaining]);

  // Auto-complete when time runs out
  useEffect(() => {
    if (testStarted && !testCompleted && timeRemaining === 0) {
      handleTestComplete();
    }
  }, [timeRemaining, testStarted, testCompleted, handleTestComplete]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Load test data
  useEffect(() => {
    const loadTest = async () => {
      try {
        setLoading(true);
        const response = await profileService.generateTest();
        if (response.success && response.data) {
          setTestData(response.data);
        } else {
          setError("Failed to load test. Please try again.");
        }
      } catch (err) {
        console.error("Error loading test:", err);
        setError(err.message || "Failed to load test. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    loadTest();
  }, []);

  const handleStartTest = () => {
    setTestStarted(true);
  };

  const handleMCQAnswer = (questionIndex, answer) => {
    setAnswers((prev) => ({
      ...prev,
      mcqs: {
        ...prev.mcqs,
        [questionIndex]: answer,
      },
    }));
  };

  const handleTheoryAnswer = (questionIndex, answer) => {
    setAnswers((prev) => ({
      ...prev,
      theory: {
        ...prev.theory,
        [questionIndex]: answer,
      },
    }));
  };

  const handleNextQuestion = () => {
    if (currentSection === "mcqs") {
      const mcqs = testData?.test?.mcqs || [];
      if (currentQuestionIndex < mcqs.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Move to theory section
        setCurrentSection("theory");
        setCurrentQuestionIndex(0);
      }
    } else {
      const theory = testData?.test?.theory || [];
      if (currentQuestionIndex < theory.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        // Test completed
        handleTestComplete();
      }
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSection === "theory" && currentQuestionIndex === 0) {
      // Move back to MCQs
      const mcqs = testData?.test?.mcqs || [];
      setCurrentSection("mcqs");
      setCurrentQuestionIndex(mcqs.length - 1);
    }
  };

  const handleSubmitTest = () => {
    if (window.confirm("Are you sure you want to submit the test? You cannot change your answers after submission.")) {
      handleTestComplete();
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center bg-white rounded-lg shadow-md p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2">Error Loading Test</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/freelancer")}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
          >
            Go Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!testData || !testData.test) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-gray-600">No test data available.</p>
        </div>
      </div>
    );
  }

  const mcqs = testData.test.mcqs || [];
  const theory = testData.test.theory || [];
  const totalQuestions = mcqs.length + theory.length;

  // Calculate current question number
  const currentQuestionNumber =
    currentSection === "mcqs" ? currentQuestionIndex + 1 : mcqs.length + currentQuestionIndex + 1;

  if (!testStarted) {
    return (
      <div className="relative max-w-4xl mx-auto p-6" style={{ minHeight: "100vh" }}>
        {/* Watermark for instructions page */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            color: "rgba(0,0,0,0.08)",
            transform: "rotate(-45deg)",
            transformOrigin: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ marginBottom: "40px" }}>
              CONFIDENTIAL • {user?.email || "TEST"} • {new Date().toISOString()} • STUDIESHQ
            </div>
          ))}
        </div>
        <div className="relative z-10 bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-center">Freelancer Assessment Test</h1>

          <div className="space-y-4 mb-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h2 className="font-semibold text-blue-900 mb-2">Test Instructions</h2>
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                <li>You have a maximum of 20 minutes to complete this test</li>
                <li>The test consists of {mcqs.length} multiple choice questions and {theory.length} theory/coding questions</li>
                <li>Questions cannot be copied or selected</li>
                <li>You can navigate between questions using Next/Previous buttons</li>
                <li>Make sure to answer all questions before submitting</li>
                <li>Once you submit, you cannot change your answers</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h2>
              <ul className="list-disc list-inside space-y-2 text-yellow-800">
                <li>Text selection and copying are disabled during the test</li>
                <li>Screenshots are strictly prohibited and will be detected</li>
                <li>Developer tools and keyboard shortcuts are disabled</li>
                <li>The timer will start as soon as you click "Start Test"</li>
                <li>The test will auto-submit when time runs out</li>
                <li>Any attempt to take screenshots or use prohibited tools may result in test disqualification</li>
              </ul>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h2 className="font-semibold text-red-900 mb-2">🚫 Prohibited Actions</h2>
              <ul className="list-disc list-inside space-y-2 text-red-800">
                <li>Taking screenshots (Print Screen, Cmd+Shift+3/4, etc.)</li>
                <li>Opening Developer Tools (F12, Ctrl+Shift+I)</li>
                <li>Copying or saving page content</li>
                <li>Using any screen capture software</li>
                <li>Switching to other applications during the test</li>
              </ul>
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleStartTest}
              className="bg-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (testCompleted) {
    return (
      <div className="relative max-w-4xl mx-auto p-6" style={{ minHeight: "100vh" }}>
        {/* Watermark for completion page */}
        <div
          className="fixed inset-0 pointer-events-none z-0"
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            color: "rgba(0,0,0,0.08)",
            transform: "rotate(-45deg)",
            transformOrigin: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} style={{ marginBottom: "40px" }}>
              TEST COMPLETED • {user?.email || "TEST"} • {new Date().toISOString()} • STUDIESHQ
            </div>
          ))}
        </div>
        <div className="relative z-10 bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-3xl font-bold mb-4">Test Completed!</h1>
          <p className="text-gray-600 mb-6">Your answers have been saved successfully.</p>
          <button
            onClick={() => navigate("/freelancer")}
            className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Get current question
  const currentQuestion =
    currentSection === "mcqs"
      ? mcqs[currentQuestionIndex]
      : theory[currentQuestionIndex];

  // Generate watermark text with user identification
  const watermarkText = user?.email 
    ? `CONFIDENTIAL TEST - ${user.email} - ${new Date().toISOString()} - STUDIESHQ`
    : `CONFIDENTIAL TEST - ${new Date().toISOString()} - STUDIESHQ`;

  return (
    <>
      {/* Add CSS animation for pulsing warning */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        .screenshot-warning {
          animation: pulse 2s infinite;
        }
      `}</style>
      <div className="relative max-w-5xl mx-auto p-6" style={{ minHeight: "100vh" }}>
      {/* Watermark Text Pattern - Fixed to viewport, covers entire screen */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          fontFamily: "monospace",
          fontSize: "16px",
          color: "rgba(0,0,0,0.12)",
          transform: "rotate(-45deg)",
          transformOrigin: "center",
          whiteSpace: "nowrap",
          zIndex: 1,
          overflow: "hidden",
          width: "200vw",
          height: "200vh",
          left: "-50vw",
          top: "-50vh",
        }}
      >
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i} style={{ marginBottom: "40px", marginLeft: `${i * 2}px` }}>
            {watermarkText} • {watermarkText} • {watermarkText} • {watermarkText} • {watermarkText} • {watermarkText}
          </div>
        ))}
      </div>

      {/* Additional watermark layer - more visible */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          fontFamily: "monospace",
          fontSize: "12px",
          color: "rgba(255,0,0,0.08)",
          transform: "rotate(45deg)",
          transformOrigin: "center",
          whiteSpace: "nowrap",
          zIndex: 1,
          overflow: "hidden",
          width: "200vw",
          height: "200vh",
          left: "-50vw",
          top: "-50vh",
        }}
      >
        {Array.from({ length: 80 }).map((_, i) => (
          <div key={i} style={{ marginBottom: "50px", marginLeft: `${i * 3}px` }}>
            CONFIDENTIAL • {user?.email || "TEST"} • STUDIESHQ • {new Date().toISOString()}
          </div>
        ))}
      </div>

      {/* Dense watermark text overlay for screenshots */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          color: "rgba(0,0,0,0.06)",
          fontSize: "9px",
          fontFamily: "monospace",
          padding: "15px",
          lineHeight: "1.1",
          wordBreak: "break-all",
          zIndex: 1,
        }}
      >
        {Array.from({ length: 300 }).map((_, i) => (
          <span key={i} style={{ display: "inline-block", margin: "0 3px" }}>
            {user?.email || "TEST"} {new Date().toISOString()} CONFIDENTIAL STUDIESHQ
          </span>
        ))}
      </div>

      {/* Screenshot Warning Banner - Always visible during test */}
      {testStarted && !testCompleted && (
        <div 
          className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-3 z-50 screenshot-warning"
          style={{
            boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            fontSize: "14px",
            fontWeight: "bold",
          }}
        >
          <strong>⚠️ WARNING:</strong> Screenshots and screen recording are strictly prohibited. Any attempt will be logged and may result in test disqualification. This page is monitored.
        </div>
      )}

      {/* Additional overlay warning when tab is not active */}
      {testStarted && !testCompleted && typeof document !== 'undefined' && document.hidden && (
        <div 
          className="fixed inset-0 bg-red-900 bg-opacity-95 text-white flex items-center justify-center z-[100]"
          style={{
            backdropFilter: "blur(10px)",
          }}
        >
          <div className="text-center p-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-3xl font-bold mb-4">TAB SWITCHING DETECTED</h2>
            <p className="text-xl mb-4">Please return to the test window immediately.</p>
            <p className="text-lg">Screenshot attempts are being monitored and logged.</p>
          </div>
        </div>
      )}

      {/* Main Content - Relative positioning to appear above watermarks */}
      <div className="relative" style={{ zIndex: 10, marginTop: testStarted && !testCompleted ? "40px" : "0" }}>
      {/* Timer and Progress Bar */}
      <div 
        className="bg-white rounded-lg shadow-md p-4 mb-6"
        style={{
          backdropFilter: "blur(0.5px)",
          WebkitBackdropFilter: "blur(0.5px)",
          zIndex: 20,
          position: "sticky",
          top: testStarted && !testCompleted ? "40px" : "0",
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-4">
            <div className={`text-2xl font-bold ${timeRemaining < 300 ? "text-red-600" : "text-gray-800"}`}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
            <div className="text-sm text-gray-600">
              Question {currentQuestionNumber} of {totalQuestions}
            </div>
          </div>
          <button
            onClick={handleSubmitTest}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
          >
            Submit Test
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${(currentQuestionNumber / totalQuestions) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Question Section */}
      <div 
        className="rounded-lg shadow-md p-8 mb-6"
        style={{
          position: "relative",
          backdropFilter: "blur(0.5px)",
          WebkitBackdropFilter: "blur(0.5px)",
          zIndex: 15,
          overflow: "hidden",
          backgroundColor: "rgba(255,255,255,0.3)",
          backgroundImage: `
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px),
            repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)
          `,
        }}
      >
        {/* Hard watermark overlay - Multiple dense layers on question card */}
        {/* Layer 1: Diagonal watermark - Dense */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            fontFamily: "monospace",
            fontSize: "16px",
            color: "rgba(0,0,0,0.25)",
            transform: "rotate(-45deg)",
            transformOrigin: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            zIndex: 0,
            width: "300%",
            height: "300%",
            left: "-100%",
            top: "-100%",
          }}
        >
          {Array.from({ length: 150 }).map((_, i) => (
            <div key={`diag1-${i}`} style={{ marginBottom: "30px", marginLeft: `${i * 3}px` }}>
              {watermarkText} • {watermarkText} • {watermarkText} • {watermarkText} • {watermarkText} • {watermarkText}
            </div>
          ))}
        </div>

        {/* Layer 2: Reverse diagonal watermark - Dense and more visible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            fontFamily: "monospace",
            fontSize: "16px",
            color: "rgba(255,0,0,0.3)",
            transform: "rotate(45deg)",
            transformOrigin: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            zIndex: 0,
            width: "300%",
            height: "300%",
            left: "-100%",
            top: "-100%",
          }}
        >
          {Array.from({ length: 150 }).map((_, i) => (
            <div key={`diag2-${i}`} style={{ marginBottom: "32px", marginLeft: `${i * 4}px` }}>
              CONFIDENTIAL • {user?.email || "TEST"} • {new Date().toISOString()} • STUDIESHQ • CONFIDENTIAL • {user?.email || "TEST"}
            </div>
          ))}
        </div>

        {/* Layer 3: Horizontal dense watermark - Very dense and more visible */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            color: "rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            zIndex: 0,
            padding: "15px",
            lineHeight: "1.1",
          }}
        >
          {Array.from({ length: 200 }).map((_, i) => (
            <div key={`horiz-${i}`} style={{ marginBottom: "12px" }}>
              {user?.email || "TEST"} {new Date().toISOString()} CONFIDENTIAL STUDIESHQ • {user?.email || "TEST"} {new Date().toISOString()} CONFIDENTIAL STUDIESHQ • {user?.email || "TEST"} {new Date().toISOString()}
            </div>
          ))}
        </div>

        {/* Layer 4: Vertical watermark pattern - Dense */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            color: "rgba(0,0,255,0.15)",
            transform: "rotate(90deg)",
            transformOrigin: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            zIndex: 0,
            width: "300%",
            height: "300%",
            left: "-100%",
            top: "-100%",
          }}
        >
          {Array.from({ length: 120 }).map((_, i) => (
            <div key={`vert-${i}`} style={{ marginBottom: "35px", marginLeft: `${i * 5}px` }}>
              {user?.email || "TEST"} • STUDIESHQ • {new Date().toISOString()} • CONFIDENTIAL • {user?.email || "TEST"}
            </div>
          ))}
        </div>

        {/* Layer 5: Random character noise to confuse OCR */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            fontFamily: "monospace",
            fontSize: "8px",
            color: "rgba(128,128,128,0.12)",
            transform: "rotate(-30deg)",
            transformOrigin: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            zIndex: 0,
            width: "300%",
            height: "300%",
            left: "-100%",
            top: "-100%",
          }}
        >
          {Array.from({ length: 100 }).map((_, i) => {
            const randomChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
            const noise = Array.from({ length: 50 }, () => randomChars[Math.floor(Math.random() * randomChars.length)]).join("");
            return (
              <div key={`noise-${i}`} style={{ marginBottom: "25px", marginLeft: `${i * 6}px` }}>
                {noise} {user?.email || "TEST"} {noise} {new Date().toISOString()} {noise}
              </div>
            );
          })}
        </div>

        {/* Layer 6: Overlapping text patterns */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            fontFamily: "monospace",
            fontSize: "9px",
            color: "rgba(255,0,255,0.1)",
            transform: "rotate(30deg)",
            transformOrigin: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            zIndex: 0,
            width: "300%",
            height: "300%",
            left: "-100%",
            top: "-100%",
          }}
        >
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={`overlap-${i}`} style={{ marginBottom: "28px", marginLeft: `${i * 7}px` }}>
              {user?.email || "TEST"} {new Date().toISOString()} CONFIDENTIAL STUDIESHQ {user?.email || "TEST"} {new Date().toISOString()}
            </div>
          ))}
        </div>

        {/* Layer 7: Dense micro-text overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            fontFamily: "monospace",
            fontSize: "7px",
            color: "rgba(0,0,0,0.12)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            zIndex: 0,
            padding: "10px",
            lineHeight: "0.9",
            wordBreak: "break-all",
          }}
        >
          {Array.from({ length: 300 }).map((_, i) => (
            <span key={`micro-${i}`} style={{ display: "inline-block", margin: "0 2px" }}>
              {user?.email || "TEST"}{new Date().toISOString()}CONFIDENTIALSTUDIESHQ
            </span>
          ))}
        </div>
        {/* Section Indicator */}
        <div className="mb-4" style={{ position: "relative", zIndex: 10 }}>
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded">
            {currentSection === "mcqs" ? "Multiple Choice Question" : theory[currentQuestionIndex]?.category === "coding" ? "Coding Question" : "Theory Question"}
          </span>
        </div>

        {/* Question */}
        <div
          ref={questionRef}
          className="mb-6 text-lg font-medium text-gray-800 select-none relative"
          style={{
            userSelect: "none",
            WebkitUserSelect: "none",
            MozUserSelect: "none",
            msUserSelect: "none",
            position: "relative",
            zIndex: 10,
            backgroundColor: "rgba(255,255,255,0.2)",
            padding: "15px",
            borderRadius: "4px",
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px),
              repeating-linear-gradient(90deg, transparent, transparent 5px, rgba(0,0,0,0.05) 5px, rgba(0,0,0,0.05) 10px)
            `,
          }}
        >
          {/* Additional watermark directly on question text */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              color: "rgba(0,0,0,0.15)",
              transform: "rotate(-20deg)",
              transformOrigin: "center",
              whiteSpace: "nowrap",
              overflow: "hidden",
              zIndex: 1,
              padding: "5px",
            }}
          >
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={`q-watermark-${i}`} style={{ marginBottom: "20px" }}>
                {user?.email || "TEST"} {new Date().toISOString()} CONFIDENTIAL
              </div>
            ))}
          </div>
          <p className="leading-relaxed relative z-10" style={{ 
            textShadow: "0 0 2px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.7), 1px 1px 1px rgba(0,0,0,0.1)",
            fontWeight: "600",
            letterSpacing: "0.3px",
            color: "rgba(0,0,0,0.9)",
          }}>
            {currentQuestion.question}
          </p>
        </div>

        {/* Answer Section */}
        {currentSection === "mcqs" ? (
          <div className="space-y-3" style={{ position: "relative", zIndex: 10 }}>
            {currentQuestion.options?.map((option, index) => {
              const answerKey = `mcqs_${currentQuestionIndex}`;
              const isSelected = answers.mcqs[currentQuestionIndex] === option;
              return (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"
                  }`}
                  style={{
                    backgroundColor: isSelected ? "rgba(59, 130, 246, 0.15)" : "rgba(255,255,255,0.25)",
                    position: "relative",
                    zIndex: 10,
                    backgroundImage: `
                      repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(0,0,0,0.04) 8px, rgba(0,0,0,0.04) 16px)
                    `,
                  }}
                >
                  <input
                    type="radio"
                    name={answerKey}
                    value={option}
                    checked={isSelected}
                    onChange={() => handleMCQAnswer(currentQuestionIndex, option)}
                    className="mr-3 h-4 w-4 text-primary focus:ring-primary"
                    style={{ position: "relative", zIndex: 11 }}
                  />
                  {/* Watermark on each option */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      fontFamily: "monospace",
                      fontSize: "9px",
                      color: "rgba(0,0,0,0.12)",
                      transform: "rotate(-15deg)",
                      transformOrigin: "center",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      zIndex: 1,
                      padding: "5px",
                    }}
                  >
                    {Array.from({ length: 10 }).map((_, j) => (
                      <div key={`opt-watermark-${index}-${j}`} style={{ marginBottom: "25px" }}>
                        {user?.email || "TEST"} {new Date().toISOString()}
                      </div>
                    ))}
                  </div>
                  <span className="text-gray-700 relative z-10" style={{ 
                    textShadow: "0 0 2px rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.7), 1px 1px 1px rgba(0,0,0,0.1)",
                    fontWeight: "500",
                    letterSpacing: "0.2px",
                    color: "rgba(0,0,0,0.9)",
                  }}>
                    {option}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <div style={{ position: "relative", zIndex: 10 }}>
            <textarea
              value={answers.theory[currentQuestionIndex] || ""}
              onChange={(e) => handleTheoryAnswer(currentQuestionIndex, e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.8)",
                position: "relative",
                zIndex: 10,
                textShadow: "0 0 1px rgba(255,255,255,0.9)",
              }}
            />
            <p className="text-sm text-gray-500 mt-2" style={{ position: "relative", zIndex: 10 }}>
              {answers.theory[currentQuestionIndex]?.length || 0} characters
            </p>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center bg-white rounded-lg shadow-md p-4">
        <button
          onClick={handlePreviousQuestion}
          disabled={currentSection === "mcqs" && currentQuestionIndex === 0}
          className={`px-6 py-2 rounded ${
            currentSection === "mcqs" && currentQuestionIndex === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          ← Previous
        </button>

        <div className="text-sm text-gray-600">
          Section: {currentSection === "mcqs" ? "MCQs" : "Theory"} ({currentQuestionIndex + 1} /{" "}
          {currentSection === "mcqs" ? mcqs.length : theory.length})
        </div>

        <button
          onClick={handleNextQuestion}
          className="bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark"
        >
          {currentSection === "theory" && currentQuestionIndex === theory.length - 1
            ? "Complete Test"
            : "Next →"}
        </button>
      </div>

      {/* Question Navigation Overview */}
      <div className="mt-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="font-semibold mb-3">Question Navigation</h3>
        <div className="flex flex-wrap gap-2">
          {/* MCQ indicators */}
          {mcqs.map((_, index) => (
            <button
              key={`mcq-${index}`}
              onClick={() => {
                setCurrentSection("mcqs");
                setCurrentQuestionIndex(index);
              }}
              className={`w-10 h-10 rounded ${
                currentSection === "mcqs" && currentQuestionIndex === index
                  ? "bg-primary text-white"
                  : answers.mcqs[index]
                  ? "bg-green-200 text-green-800"
                  : "bg-gray-200 text-gray-600"
              } hover:bg-primary hover:text-white transition-colors`}
            >
              {index + 1}
            </button>
          ))}
          {/* Theory indicators */}
          {theory.map((_, index) => (
            <button
              key={`theory-${index}`}
              onClick={() => {
                setCurrentSection("theory");
                setCurrentQuestionIndex(index);
              }}
              className={`w-10 h-10 rounded ${
                currentSection === "theory" && currentQuestionIndex === index
                  ? "bg-primary text-white"
                  : answers.theory[index]
                  ? "bg-green-200 text-green-800"
                  : "bg-gray-200 text-gray-600"
              } hover:bg-primary hover:text-white transition-colors`}
            >
              {mcqs.length + index + 1}
            </button>
          ))}
        </div>
        <div className="mt-3 flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
            <span>Answered</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-200 rounded mr-2"></div>
            <span>Not Answered</span>
          </div>
        </div>
      </div>
      </div>
    </div>
    </>
  );
};

export default TestPage;

