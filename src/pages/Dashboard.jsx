/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Brain, MessageCircle } from "lucide-react";
import useAuthStore from "../store/authStore";
import { api } from "../utils/api";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorMessage from "../components/ErrorMessage";
import ResumeAnalysis from "../components/ResumeAnalysis";
import ChatBox from "../components/ChatBox";

const Dashboard = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadExistingAnalysis = async () => {
      try {
        const response = await api.getSummaries();
        if (isMounted && response?.summaries?.length > 0) {
          setAnalysis(response.summaries[0]);
          setActiveTab("analysis");
        }
      } catch (err) {
        if (isMounted) console.warn("No existing analysis found:", err.message);
      }
    };

    if (user?.email) {
      loadExistingAnalysis();
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      setError("Please upload a PDF file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await api.analyzeResume(file);
      setAnalysis(response.analysis);
      setActiveTab("analysis");
    } catch (err) {
      setError(err.message || "Failed to analyze resume");
    } finally {
      setUploading(false);
    }
  };

  const handleStartChat = () => {
    if (!analysis) {
      setError("Please upload and analyze a resume first");
      return;
    }
    setShowChat(true);
  };

  // Show loading while user is not ready
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center sm:text-left"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2">
            Welcome back, {user?.email?.split("@")[0] || "User"}!
          </h1>
          <p className="text-neutral-600 text-sm sm:text-base">
            Upload your resume to get AI-powered career insights and analysis
          </p>
        </motion.div>

        {/* Error Message */}
        <ErrorMessage error={error} onClose={() => setError(null)} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Section */}
          <div className="lg:col-span-2">
            {activeTab === "upload" && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sm:p-8"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 mb-2">
                    Upload Your Resume
                  </h2>
                  <p className="text-neutral-600 text-sm sm:text-base">
                    Get instant AI analysis and career recommendations
                  </p>
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 sm:p-12 text-center hover:border-primary-400 transition-colors duration-200">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="resume-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center space-y-4"
                  >
                    <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-neutral-600" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-neutral-900 mb-1">
                        {uploading ? "Analyzing your resume..." : "Choose PDF file"}
                      </p>
                      <p className="text-sm text-neutral-600">
                        {uploading
                          ? "Our AI is analyzing your resume..."
                          : "Drag and drop or click to upload"}
                      </p>
                    </div>
                    {uploading && <LoadingSpinner size="large" />}
                  </label>
                </div>

                {/* Features */}
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Brain className="w-4 h-4 text-secondary-600" />
                    </div>
                    <h3 className="font-medium text-neutral-900 mb-1">AI Analysis</h3>
                    <p className="text-sm text-neutral-600">
                      Advanced AI extracts key insights from your resume
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-medium text-neutral-900 mb-1">Career Chat</h3>
                    <p className="text-sm text-neutral-600">
                      Get personalized career advice from our AI assistant
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <h3 className="font-medium text-neutral-900 mb-1">Smart Insights</h3>
                    <p className="text-sm text-neutral-600">
                      Detailed analysis of skills, experience, and opportunities
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "analysis" && analysis && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <ResumeAnalysis analysis={analysis} />
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 text-center sm:text-left">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <button
                  onClick={() => setActiveTab("upload")}
                  className={`w-full text-left px-4 py-3 border-dashed border rounded-lg transition-colors duration-200 ${
                    activeTab === "upload"
                      ? "bg-primary-50 text-primary-700 border border-primary-200"
                      : "hover:bg-neutral-50 text-neutral-700"
                  }`}
                >
                  <div className="flex items-center space-x-3 justify-center sm:justify-start">
                    <Upload className="w-5 h-5" />
                    <span>Upload New Resume</span>
                  </div>
                </button>

                {analysis && (
                  <button
                    onClick={() => setActiveTab("analysis")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                      activeTab === "analysis"
                        ? "bg-primary-50 text-primary-700 border border-primary-200"
                        : "hover:bg-neutral-50 text-neutral-700"
                    }`}
                  >
                    <div className="flex items-center space-x-3 justify-center sm:justify-start">
                      <FileText className="w-5 h-5" />
                      <span>View Analysis</span>
                    </div>
                  </button>
                )}

                {analysis && (
                  <button
                    onClick={handleStartChat}
                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-secondary-50 text-secondary-700 border border-secondary-200 transition-colors duration-200"
                  >
                    <div className="flex items-center space-x-3 justify-center sm:justify-start">
                      <MessageCircle className="w-5 h-5" />
                      <span>Chat with AI</span>
                    </div>
                  </button>
                )}
              </div>

              {analysis && (
                <div className="mt-6 pt-6 border-t border-neutral-200 text-center sm:text-left">
                  <h4 className="font-medium text-neutral-900 mb-3">
                    Recent Analysis
                  </h4>
                  <div className="text-sm text-neutral-600 space-y-1">
                    <p>
                      <span className="font-medium">File:</span>{" "}
                      {analysis.resume_title}
                    </p>
                    <p>
                      <span className="font-medium">Experience:</span>{" "}
                      {analysis.experience_level}
                    </p>
                    <p>
                      <span className="font-medium">Sentiment:</span>{" "}
                      {analysis.sentiment}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      <AnimatePresence>
        {showChat && (
          <ChatBox analysis={analysis} onClose={() => setShowChat(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
