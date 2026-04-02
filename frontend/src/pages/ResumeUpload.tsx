import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, Loader, Brain, Code, Sparkles, Zap, Target, TrendingUp, Briefcase, GraduationCap, User, Mail, Phone, Cpu } from 'lucide-react';
import { getApiUrl } from '../lib/api/base';
import { clearStoredJobApplication, setActiveExamFlow } from '../utils/examFlow';

interface ParsedSkill {
  name: string;
  proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  source: 'Verified' | 'Claimed' | 'Inferred';
  confidence: number;
  category: string;
}

interface ParsedProject {
  name: string;
  description: string;
  technologies: string[];
  complexity: 'Low' | 'Medium' | 'High';
  rating: number;
  ratingReason?: string;
  impact: string;
  duration: string;
}

interface ParsedInternship {
  company: string;
  role: string;
  duration: string;
  description: string;
  technologies: string[];
  rating: number;
  ratingReason?: string;
}

interface ParsedAchievement {
  title: string;
  description: string;
  year: string;
}

interface ParsedExperience {
  company: string;
  role: string;
  duration: string;
  location?: string;
  description: string;
  achievements: string[];
}

interface ParsedEducation {
  degree: string;
  institution: string;
  year: string;
  gpa?: string;
  location?: string;
  honors?: string;
}

interface ParsedCertification {
  name: string;
  issuer: string;
  year: string;
}

interface ParsedLanguage {
  language: string;
  proficiency: string;
}

interface AssessmentQuestion {
  id: string;
  type: 'technical' | 'project' | 'experience';
  skill?: string;
  project?: string;
  company?: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ParsedData {
  name: string;
  email: string;
  phone: string;
  location?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  summary: string;
  skills: ParsedSkill[];
  projects: ParsedProject[];
  internships?: ParsedInternship[];
  experiences: ParsedExperience[];
  education: ParsedEducation[];
  achievements?: ParsedAchievement[];
  certifications?: ParsedCertification[];
  languages?: ParsedLanguage[];
  interests?: string[];
  aiConfidence: number;
  processingTime: number;
  aiSource?: string;
  assessmentQuestions?: AssessmentQuestion[];
  parsedAt?: string;
}

export function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);


  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'application/pdf' || droppedFile.name.endsWith('.pdf'))) {
      setFile(droppedFile);
      await processResume(droppedFile);
    } else {
      alert('Please upload a PDF file');
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      await processResume(selectedFile);
    }
  };

  const processResume = async (file: File) => {
    setIsProcessing(true);
    setParsedData(null); // Clear old data
    const startTime = Date.now();
    
    try {
      // Clear old stored data
      localStorage.removeItem('parsedResumeData');
      localStorage.removeItem('resumeUploaded');
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('resume', file);

      // Call backend AI API for resume parsing
      console.log('📤 Sending resume to backend...', file.name);
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/resume/analyze'), {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Failed to parse resume: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('📊 Received data:', data);
      const processingTime = Date.now() - startTime;

      // Transform API response to match ParsedData format
      const parsedData: ParsedData = {
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        location: data.location || "",
        linkedin: data.linkedin || "",
        portfolio: data.portfolio || "",
        summary: data.summary || "",
        aiConfidence: data.aiConfidence || 0.95,
        aiSource: data.aiSource || "AI Analysis",
        processingTime,
        // Handle different response structures
        skills: Array.isArray(data.skills) ? data.skills.map((s: any) => ({
          name: s.name || "",
          proficiency: s.proficiency || "Intermediate",
          source: s.source || "Inferred",
          confidence: s.confidence || 0.8,
          category: s.category || "General"
        })) : [],
        projects: Array.isArray(data.projects) ? data.projects.map((p: any) => ({
          name: p.name || "",
          description: p.description || "",
          technologies: Array.isArray(p.technologies) ? p.technologies : 
                       Array.isArray(p.techStack) ? p.techStack : [],
          complexity: p.complexity || "Medium",
          rating: p.rating || 0,
          ratingReason: p.ratingReason || "",
          impact: p.impact || "",
          duration: p.duration || ""
        })) : [],
        experiences: Array.isArray(data.experiences) ? data.experiences.map((e: any) => ({
          company: e.company || "",
          role: e.role || "",
          duration: e.duration || "",
          location: e.location || "",
          description: e.description || "",
          achievements: Array.isArray(e.achievements) ? e.achievements : []
        })) : [],
        education: Array.isArray(data.education) ? data.education.map((e: any) => ({
          degree: e.degree || "",
          institution: e.institution || "",
          year: e.year || "",
          gpa: e.gpa || "",
          location: e.location || "",
          honors: e.honors || ""
        })) : [],
        certifications: Array.isArray(data.certifications) ? data.certifications.map((c: any) => ({
          name: c.name || "",
          issuer: c.issuer || "",
          year: c.year || ""
        })) : [],
        languages: Array.isArray(data.languages) ? data.languages.map((l: any) => ({
          language: l.language || "",
          proficiency: l.proficiency || ""
        })) : [],
        interests: Array.isArray(data.interests) ? data.interests : []
      };

      setParsedData(parsedData);
      localStorage.setItem('parsedResumeData', JSON.stringify(parsedData));
      localStorage.setItem('resumeUploaded', 'true');
    } catch (error) {
      console.error('Error processing resume:', error);
      alert('Failed to parse resume. Please check that the backend server is running and the OpenAI API key is valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="resume-upload-page exam-flow-shell p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="exam-flow-hero-badge mb-4">
            <Cpu className="w-5 h-5" />
            <span className="text-sm font-medium">Powered by Advanced AI</span>
          </div>
          <h1 className="exam-flow-title mb-2 text-4xl font-bold">AI Resume Scanner</h1>
          <p className="exam-flow-muted mx-auto max-w-2xl text-base md:text-lg">
            Our AI model extracts skills, projects, experience, and education from your resume with high accuracy. 
            Get instant insights and detailed analysis.
          </p>
        </div>

        {/* Upload Section */}
        {!parsedData && (
          <div className="exam-flow-card-strong mb-6 p-8 shadow-2xl">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`exam-flow-upload-zone rounded-2xl border-4 p-12 text-center transition-all ${isDragging
                ? 'exam-flow-upload-zone-active border-indigo-500'
                : 'border-gray-400'
                }`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <Loader className="w-16 h-16 text-purple-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-200" />
                    </div>
                  </div>
                  <h3 className="exam-flow-title mb-2 text-xl font-semibold">AI is analyzing your resume...</h3>
                  <p className="exam-flow-muted">Extracting skills, projects, experience & education</p>
                  <div className="mt-4 flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-300">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Using advanced NLP models</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/15">
                    <Upload className="w-10 h-10 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <h3 className="exam-flow-title mb-2 text-2xl font-bold">Upload Your Resume</h3>
                  <p className="exam-flow-muted mb-2">Drag & drop your PDF resume or click to browse</p>
                  <p className="exam-flow-muted mb-6 text-sm">Our AI will extract skills, projects, and experience automatically</p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label
                    htmlFor="resume-upload"
                    className="exam-flow-primary-button cursor-pointer"
                  >
                    <Upload className="w-5 h-5" />
                    Select PDF File
                  </label>
                  {file && <p className="mt-4 text-sm text-purple-400">Selected: {file.name}</p>}
                </>
              )}
            </div>
            
            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="exam-flow-soft-card flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="exam-flow-title font-medium">Smart Extraction</p>
                  <p className="exam-flow-muted text-sm">AI-powered parsing</p>
                </div>
              </div>
              <div className="exam-flow-soft-card flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="exam-flow-title font-medium">High Accuracy</p>
                  <p className="exam-flow-muted text-sm">95%+ precision rate</p>
                </div>
              </div>
              <div className="exam-flow-soft-card flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="exam-flow-title font-medium">Instant Results</p>
                  <p className="exam-flow-muted text-sm">Under 3 seconds</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Parsed Data Display */}
        {parsedData && (
          <div className="space-y-6">
            {/* AI Analysis Success Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Sparkles className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-green-800 mb-1">AI Resume Analysis Complete!</h3>
                  <p className="text-green-700 mb-2">
                    Extracted {parsedData.skills.length} skills, {parsedData.projects.length} projects, and {parsedData.experiences.length} work experiences
                  </p>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <span className="flex items-center gap-1 text-green-600">
                      <Target className="w-4 h-4" />
                      AI Confidence: {(parsedData.aiConfidence * 100).toFixed(0)}%
                    </span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <Cpu className="w-4 h-4" />
                      Source: {parsedData.aiSource}
                    </span>
                    <span className="flex items-center gap-1 text-green-600">
                      <Zap className="w-4 h-4" />
                      Processed in {(parsedData.processingTime / 1000).toFixed(1)}s
                    </span>
                    {parsedData.assessmentQuestions && (
                      <span className="flex items-center gap-1 text-purple-600">
                        <Brain className="w-4 h-4" />
                        {parsedData.assessmentQuestions.length} Questions Generated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Summary */}
            {parsedData.summary && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                  <User className="w-6 h-6 mr-2 text-blue-600" />
                  Professional Summary
                </h2>
                <p className="text-gray-700 leading-relaxed">{parsedData.summary}</p>
              </div>
            )}

            {/* Candidate Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                <FileText className="w-6 h-6 mr-2 text-blue-600" />
                Personal Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold">{parsedData.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold">{parsedData.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold">{parsedData.phone}</p>
                  </div>
                </div>
                {parsedData.location && (
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold">{parsedData.location}</p>
                    </div>
                  </div>
                )}
                {parsedData.linkedin && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600">LinkedIn</p>
                      <a href={`https://${parsedData.linkedin.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline">
                        {parsedData.linkedin}
                      </a>
                    </div>
                  </div>
                )}
                {parsedData.github && (
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-800" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <div>
                      <p className="text-sm text-gray-600">GitHub</p>
                      <a href={`https://${parsedData.github.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-800 hover:underline">
                        {parsedData.github}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Internships / Training */}
            {parsedData.internships && parsedData.internships.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                  <Briefcase className="w-6 h-6 mr-2 text-orange-600" />
                  Internships & Training ({parsedData.internships.length})
                </h2>
                <div className="space-y-4">
                  {parsedData.internships.map((internship, index) => (
                    <div key={index} className="border border-orange-200 rounded-lg p-4 hover:shadow-md transition hover:border-orange-300">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-lg text-orange-700">{internship.role}</h3>
                          <p className="text-orange-600 font-medium">{internship.company}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 rounded-full text-sm font-bold">
                            ⭐ {internship.rating || '5'}/10
                          </span>
                          <span className="text-sm text-gray-500">{internship.duration}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-2">{internship.description}</p>
                      {internship.ratingReason && (
                        <p className="text-sm text-orange-600 mb-2 italic">💡 {internship.ratingReason}</p>
                      )}
                      {internship.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {internship.technologies.map((tech, i) => (
                            <span key={i} className="px-2 py-1 bg-orange-50 text-orange-700 rounded text-xs">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work Experience */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                <Briefcase className="w-6 h-6 mr-2 text-indigo-600" />
                Work Experience ({parsedData.experiences.length})
              </h2>
              <div className="space-y-4">
                {parsedData.experiences.map((exp, index) => (
                  <div key={index} className="border-l-4 border-indigo-500 pl-4 py-2">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-lg">{exp.role}</h3>
                      <span className="text-sm text-gray-500">{exp.duration}</span>
                    </div>
                    <p className="text-indigo-600 font-medium mb-2">{exp.company}</p>
                    <p className="text-gray-700 mb-2">{exp.description}</p>
                    {exp.achievements.length > 0 && (
                      <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                        {exp.achievements.map((achievement, i) => (
                          <li key={i}>{achievement}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Skills */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                <Brain className="w-6 h-6 mr-2 text-purple-600" />
                AI-Extracted Skills ({parsedData.skills.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {parsedData.skills.map((skill, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{skill.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        skill.proficiency === 'Expert' ? 'bg-purple-100 text-purple-700' :
                        skill.proficiency === 'Advanced' ? 'bg-green-100 text-green-700' :
                        skill.proficiency === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                      }`}>
                        {skill.proficiency}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{skill.category}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        skill.source === 'Verified' ? 'bg-green-50 text-green-600' :
                        skill.source === 'Inferred' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-gray-100 text-gray-600'
                      }`}>
                        {skill.source}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full"
                          style={{ width: `${skill.confidence * 100}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{(skill.confidence * 100).toFixed(0)}% confidence</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Extracted Projects */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                <Code className="w-6 h-6 mr-2 text-indigo-600" />
                Projects ({parsedData.projects.length})
              </h2>
              <div className="space-y-4">
                {parsedData.projects.map((project, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition hover:border-indigo-300">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-lg text-indigo-700">{project.name}</h3>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-700 rounded-full text-sm font-bold">
                          ⭐ {project.rating || '5'}/10
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.complexity === 'High' ? 'bg-red-100 text-red-700' :
                          project.complexity === 'Medium' ? 'bg-orange-100 text-orange-700' :
                            'bg-green-100 text-green-700'
                        }`}>
                          {project.complexity}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2 leading-relaxed">{project.description}</p>
                    {project.ratingReason && (
                      <p className="text-sm text-indigo-600 mb-3 italic">💡 {project.ratingReason}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        {project.duration}
                      </span>
                      {project.impact && (
                        <span className="text-green-600 font-medium flex items-center gap-1">
                          <Sparkles className="w-4 h-4" />
                          {project.impact}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, i) => (
                        <span key={i} className="px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI-Generated Assessment Questions */}
            {parsedData.assessmentQuestions && parsedData.assessmentQuestions.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-purple-200">
                <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                  <Target className="w-6 h-6 mr-2 text-purple-600" />
                  AI-Generated Assessment Questions ({parsedData.assessmentQuestions.length})
                </h2>
                <p className="text-gray-600 mb-4 text-sm">
                  Based on your skills and projects, we've generated personalized questions to assess your expertise.
                </p>
                <div className="space-y-3">
                  {parsedData.assessmentQuestions.map((q, index) => (
                    <div key={q.id} className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-8 h-8 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              q.type === 'technical' ? 'bg-blue-100 text-blue-700' :
                              q.type === 'project' ? 'bg-green-100 text-green-700' :
                                'bg-orange-100 text-orange-700'
                            }`}>
                              {q.type === 'technical' ? 'Technical' : q.type === 'project' ? 'Project' : 'Experience'}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              q.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                              q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-green-100 text-green-700'
                            }`}>
                              {q.difficulty}
                            </span>
                            {q.skill && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                {q.skill}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 font-medium">{q.question}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {parsedData.achievements && parsedData.achievements.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                  <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  Achievements ({parsedData.achievements.length})
                </h2>
                <div className="space-y-3">
                  {parsedData.achievements.map((achievement, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <span className="text-2xl">🏆</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{achievement.title}</h3>
                        {achievement.description && (
                          <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                        )}
                        {achievement.year && (
                          <span className="text-xs text-yellow-600 font-medium">{achievement.year}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                <GraduationCap className="w-6 h-6 mr-2 text-teal-600" />
                Education
              </h2>
              <div className="space-y-4">
                {parsedData.education.map((edu, index) => (
                  <div key={index} className="border-l-4 border-teal-500 pl-4">
                    <h3 className="font-bold text-lg">{edu.degree}</h3>
                    <p className="text-teal-600">{edu.institution}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>Graduated: {edu.year}</span>
                      {edu.gpa && <span>GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Verify Candidate Button */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Ready for Identity Verification?</h2>
              <p className="mb-6 text-blue-100">Complete the verification process to proceed with your assessment</p>
              <button
                onClick={() => {
                  clearStoredJobApplication();
                  setActiveExamFlow('resume');
                  navigate('/candidate-verification');
                }}
                className="px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition transform hover:scale-105"
              >
                Verify Candidate
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
