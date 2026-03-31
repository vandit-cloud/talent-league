import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Camera,
  Eye,
  Users,
  Mic,
  Monitor,
  Lock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Clock,
  Hand,
  Scan,
  Focus,
  MousePointerClick,
  Loader,
  Mail,
  Smartphone,
  Download
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import { getAssessmentById } from "../data/assessmentCatalog";
import { useAuth } from "../context/AuthContext";
import { getApiUrl } from "../lib/api/base";
import { SELECTED_ASSESSMENT_STORAGE_KEY } from "../utils/assessmentMatching";
import { getActiveExamFlow, getStoredJobApplication } from "../utils/examFlow";

interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  skills: Array<{
    name: string;
    proficiency: string;
    category: string;
    source?: string;
    confidence?: number;
  }>;
}

export default function ProctoringRules() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [candidateData, setCandidateData] = useState<ParsedResumeData | null>(null);
  const activeFlow = getActiveExamFlow();
  const selectedJob = getStoredJobApplication();
  const selectedAssessmentId = localStorage.getItem(SELECTED_ASSESSMENT_STORAGE_KEY);
  const selectedAssessment = getAssessmentById(selectedAssessmentId);
  const activeQuestionContext =
    activeFlow === 'job' && selectedJob
      ? {
          id: `job-${selectedJob.id}`,
          title: selectedJob.title,
          skills: selectedJob.skills,
        }
      : activeFlow === 'assessment' && selectedAssessment
        ? {
            id: selectedAssessment.id,
            title: selectedAssessment.title,
            skills: selectedAssessment.skills,
          }
        : selectedAssessment
          ? {
              id: selectedAssessment.id,
              title: selectedAssessment.title,
              skills: selectedAssessment.skills,
            }
          : selectedJob
            ? {
                id: `job-${selectedJob.id}`,
                title: selectedJob.title,
                skills: selectedJob.skills,
              }
            : null;

  const storeActiveMcqToken = (link?: string) => {
    if (!link) {
      return;
    }

    const token = link.split('/').filter(Boolean).pop();
    if (token) {
      localStorage.setItem('activeMcqToken', token);
    }
  };

  // Load candidate data from localStorage (parsed resume data)
  useEffect(() => {
    const storedData = localStorage.getItem('parsedResumeData');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        setCandidateData(parsed);
      } catch (e) {
        console.error('Failed to parse resume data:', e);
      }
    }
  }, []);

  const handleStartTest = async () => {
    const isJobFlow = activeFlow === 'job';
    const candidateEmail = isJobFlow
      ? (user?.email || candidateData?.email || '')
      : (candidateData?.email || '');
    const candidateName = isJobFlow
      ? (user?.name || candidateData?.name || 'Candidate')
      : (candidateData?.name || 'Candidate');

    if (!candidateEmail) {
      alert(
        isJobFlow
          ? "No logged-in email found. Please update your profile email before starting the job test."
          : "No candidate email found. Please upload your resume first."
      );
      return;
    }

    // Prepare skills array - ensure it's properly formatted
    let skillsToSend: Array<{
      name: string;
      proficiency: string;
      category: string;
      source?: string;
      confidence?: number;
    }> = [];
    if (activeQuestionContext?.skills.length) {
      skillsToSend = activeQuestionContext.skills.map((skill) => ({
        name: skill,
        proficiency: 'Required',
        category: 'Job Requirement',
        source: activeFlow === 'job' ? 'Job' : 'Assessment',
        confidence: 1
      }));
    } else if (candidateData?.skills && Array.isArray(candidateData.skills)) {
      skillsToSend = candidateData.skills.map((skill: any) => ({
        name: skill.name || skill.skill || 'Unknown Skill',
        proficiency: skill.proficiency || 'Intermediate',
        category: skill.category || 'General',
        source: skill.source || 'Inferred',
        confidence: skill.confidence || 0.8
      }));
    }

    const payloadResumeData = isJobFlow
      ? {
          name: candidateName,
          email: candidateEmail,
          phone: user?.contactInfo?.phone || '',
          skills: skillsToSend,
        }
      : candidateData;

    setLoading(true);
    try {
      // Create MCQ test and send email
      const response = await axios.post(getApiUrl("/mcq/create"), {
        candidateEmail: candidateEmail,
        candidateName: candidateName,
        skills: skillsToSend,
        assessmentId: activeQuestionContext?.id,
        assessmentTitle: activeQuestionContext?.title,
        requiredSkills: activeQuestionContext?.skills || [],
        resumeData: payloadResumeData
      });

      if (response.data?.success) {
        const emailWasSent = !!response.data.emailSent;
        const link: string | undefined = response.data.testLink;
        const previewUrl: string | undefined = response.data.previewUrl;
        setEmailSent(emailWasSent);
        storeActiveMcqToken(link);

        if (emailWasSent) {
          alert(`✅ MCQ Test link sent to ${candidateEmail}!\n\nPlease check your Inbox and Spam folders.\n\nIf it doesn't arrive within 2 minutes, look for the 'Continue in Browser' option or contact support.`);
          setTimeout(() => {
            navigate("/monitoring-camera");
          }, 1000);
        } else if (previewUrl) {
          try { window.open(previewUrl, '_blank'); } catch {}
          alert(`📧 Email couldn't be sent directly.\n\nI've opened an email preview for you.\nYou can copy the test link from there.`);
          setTimeout(() => {
            navigate("/monitoring-camera");
          }, 1000);
        } else if (link) {
          try { await navigator.clipboard.writeText(link); } catch {}
          alert(`⚠️ Test created but email failed to send.\n\nYour UNIQUE test link has been COPIED to your clipboard:\n\n${link}\n\nYou can proceed to the camera monitoring now.`);
          setTimeout(() => {
            navigate("/monitoring-camera");
          }, 1000);
        } else {
          alert('❌ MCQ test created, but no link was returned. Please try again or check your connection.');
          setTimeout(() => {
            navigate("/monitoring-camera");
          }, 1000);
        }
      }
    } catch (error: any) {
      console.error('Error creating MCQ test:', error);
      console.error('Request payload:', {
        candidateEmail: candidateEmail,
        candidateName: candidateName,
        skills: skillsToSend,
        assessmentId: activeQuestionContext?.id,
        assessmentTitle: activeQuestionContext?.title,
        requiredSkills: activeQuestionContext?.skills || [],
        resumeData: payloadResumeData
      });
      alert("Failed to send test link: " + (error.response?.data?.message || error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const rules = [
    {
      icon: <Camera className="w-6 h-6 text-blue-500" />,
      title: "Camera Must Be On",
      description: "Your webcam must remain active throughout the exam. Face should be clearly visible at all times."
    },
    {
      icon: <Eye className="w-6 h-6 text-purple-500" />,
      title: "Keep Eyes on Screen",
      description: "Looking away from the screen for more than 2 seconds will trigger a warning. Constant side-gazing is not allowed."
    },
    {
      icon: <Hand className="w-6 h-6 text-emerald-500" />,
      title: "Hands Must Be Visible",
      description: "Both hands should remain on the desk and visible in the camera frame throughout the exam."
    },
    {
      icon: <Scan className="w-6 h-6 text-orange-500" />,
      title: "Proper Positioning",
      description: "Face must be centered, shoulders visible, and maintain 40-90cm distance from the screen."
    },
    {
      icon: <Users className="w-6 h-6 text-red-500" />,
      title: "No Other People",
      description: "No other person should be visible in the camera frame. Multiple faces detection will result in violation."
    },
    {
      icon: <Mic className="w-6 h-6 text-amber-500" />,
      title: "No Talking",
      description: "Voice activity detection is active. Speaking or whispering during the exam is prohibited."
    },
    {
      icon: <Monitor className="w-6 h-6 text-cyan-500" />,
      title: "No Tab Switching",
      description: "Switching tabs or windows is strictly prohibited and will result in immediate violation."
    },
    {
      icon: <MousePointerClick className="w-6 h-6 text-pink-500" />,
      title: "No Copy-Paste",
      description: "Copy, paste, cut, and right-click functions are disabled during the exam."
    },
    {
      icon: <Lock className="w-6 h-6 text-indigo-500" />,
      title: "Fullscreen Required",
      description: "Exam must be taken in fullscreen mode. Exiting fullscreen will trigger a violation."
    },
    {
      icon: <Focus className="w-6 h-6 text-teal-500" />,
      title: "Stay Focused",
      description: "Head pose and gaze tracking are active. Looking away constantly will be flagged."
    }
  ];

  const violations = [
    { level: "High", examples: "Multiple faces, Tab switching, Talking, External help", consequence: "Immediate termination after 3 violations" },
    { level: "Medium", examples: "Hands not visible, Looking away >2s, Face occlusion", consequence: "Warning issued, recorded in report" },
    { level: "Low", examples: "Face not centered, Too close/far from screen", consequence: "Gentle reminder to adjust position" }
  ];

  return (
    <div className="exam-flow-shell">
      <div className="exam-flow-container max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="exam-flow-title text-3xl sm:text-4xl font-bold mb-3">
            Exam Rules & Proctoring Guidelines
          </h1>
          <p className="exam-flow-muted text-lg max-w-2xl mx-auto">
            Please read and understand all rules before starting the exam. 
            Violations are automatically detected by our AI proctoring system.
          </p>
        </div>

        {/* Important Notice */}
        <div className="exam-flow-card rounded-2xl p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-100 rounded-xl">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-amber-800 mb-2">
                Important: AI-Powered Proctoring Active
              </h2>
              <p className="text-amber-700">
                This exam uses advanced AI monitoring including face detection, gaze tracking, 
                voice detection, and motion analysis. All activities are recorded and analyzed in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Rules Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {rules.map((rule, index) => (
            <div 
              key={index}
              className="exam-flow-card rounded-xl p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 rounded-xl shrink-0">
                  {rule.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">{rule.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{rule.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Violation Levels */}
        <div className="exam-flow-card rounded-2xl shadow-sm p-6 mb-10">
          <h2 className="exam-flow-title text-xl font-bold mb-6 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            Violation Levels & Consequences
          </h2>
          <div className="space-y-4">
            {violations.map((v, index) => (
              <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl bg-slate-50">
                <div className={`px-4 py-2 rounded-lg font-semibold text-sm shrink-0 ${
                  v.level === "High" ? "bg-red-100 text-red-700" :
                  v.level === "Medium" ? "bg-amber-100 text-amber-700" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {v.level} Severity
                </div>
                <div className="flex-1">
                  <p className="text-slate-700 font-medium">{v.examples}</p>
                  <p className="text-slate-500 text-sm">{v.consequence}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pre-Exam Checklist */}
        <div className="exam-flow-card rounded-2xl p-6 mb-10">
          <h2 className="exam-flow-title text-xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-indigo-500" />
            Before You Start - Checklist
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              "Ensure stable internet connection",
              "Test your camera and microphone",
              "Find a quiet, well-lit room",
              "Clear your desk except for allowed items",
              "Inform others not to disturb you",
              "Have your ID ready for verification",
              "Close all other applications",
              "Ensure phone is silent and away"
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-400 flex items-center justify-center shrink-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                </div>
                <span className="text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Exam Duration Info */}
        <div className="exam-flow-muted flex items-center justify-center gap-2 mb-8">
          <Clock className="w-5 h-5" />
          <span>Exam Duration: <strong>30 Minutes</strong></span>
          <span className="mx-2">|</span>
          <span>Questions: <strong>25 MCQs</strong></span>
        </div>

        {/* Mobile App QR Code */}
        <div className="exam-flow-card rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative flex-shrink-0">
              <div className="p-6 bg-white rounded-2xl shadow-lg">
                <QRCodeSVG
                  value="https://github.com/vandit-cloud/TalentLeague-apk/releases/download/v1.0.0/Talent-League.apk"
                  size={200}
                  level="M"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#000000"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
                <Download className="w-5 h-5 text-indigo-400" />
                <h3 className="text-xl font-bold exam-flow-title">Install TalentLeague App</h3>
              </div>
              <p className="exam-flow-muted text-sm leading-relaxed mb-3">
                Phase 1 (MCQ Test) will be taken on your <strong>mobile phone</strong>.
                Scan the QR code below with your phone camera to download and install the TalentLeague app.
              </p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
                  Step 1: Scan QR code
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300">
                  <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                  Step 2: Install APK
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
                  Step 3: Open app & login
                </span>
              </div>
              <p className="exam-flow-muted text-xs mt-3 opacity-70">
                Android only. You may need to enable "Install from unknown sources" in your phone settings.
              </p>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleStartTest}
            disabled={loading || emailSent}
            className="group relative inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xl font-bold rounded-2xl shadow-lg hover:shadow-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader className="w-6 h-6 animate-spin" />
                <span>Sending Test Link...</span>
              </>
            ) : emailSent ? (
              <>
                <Mail className="w-6 h-6" />
                <span>Check Your Email</span>
              </>
            ) : (
              <>
                <span>Start Test</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          <p className="exam-flow-muted text-sm">
            {emailSent 
              ? "Test link sent! Check your email and click the link to begin."
              : "By clicking 'Start Test', you agree to follow all exam rules and proctoring guidelines"}
          </p>
        </div>
      </div>
    </div>
  );
}
