import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, CheckCircle2, Cpu, Loader, Lock, Upload, XCircle } from 'lucide-react';
import { getAssessmentById } from '../data/assessmentCatalog';
import {
  analyzeSkillMatch,
  ASSESSMENT_START_REQUESTED_STORAGE_KEY,
  PARSED_RESUME_STORAGE_KEY,
  RESUME_UPLOADED_STORAGE_KEY,
  SELECTED_ASSESSMENT_STORAGE_KEY,
  type SkillMatchResult
} from '../utils/assessmentMatching';
import { clearStoredJobApplication, setActiveExamFlow } from '../utils/examFlow';
import { getApiUrl } from '../lib/api/base';

interface ParsedSkill {
  name: string;
  proficiency: string;
  source: string;
  confidence: number;
  category: string;
}

interface ParsedData {
  name: string;
  email: string;
  phone: string;
  summary: string;
  skills: ParsedSkill[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  experiences: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
  }>;
  aiConfidence: number;
  processingTime: number;
  aiSource?: string;
}

export function AssessmentResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [matchResult, setMatchResult] = useState<SkillMatchResult | null>(null);
  const [error, setError] = useState('');

  const selectedAssessmentId = localStorage.getItem(SELECTED_ASSESSMENT_STORAGE_KEY);
  const selectedAssessment = getAssessmentById(selectedAssessmentId);

  if (!selectedAssessment) {
    return (
      <div className="exam-flow-shell flex items-center justify-center p-6">
        <div className="exam-flow-card-strong max-w-lg w-full p-8 text-center">
          <XCircle className="mx-auto mb-4 h-14 w-14 text-rose-500" />
          <h1 className="exam-flow-title mb-2 text-2xl font-bold">Assessment Not Found</h1>
          <p className="exam-flow-muted mb-6">
            Please choose an assessment first, then upload your resume for skill matching.
          </p>
          <button onClick={() => navigate('/assessments')} className="exam-flow-primary-button">
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

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
      return;
    }

    setError('Please upload a PDF file.');
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    await processResume(selectedFile);
  };

  const processResume = async (selectedFile: File) => {
    setIsProcessing(true);
    setError('');
    setParsedData(null);
    setMatchResult(null);

    const startTime = Date.now();

    try {
      localStorage.removeItem(PARSED_RESUME_STORAGE_KEY);
      localStorage.removeItem(RESUME_UPLOADED_STORAGE_KEY);

      const formData = new FormData();
      formData.append('resume', selectedFile);

      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/resume/analyze'), {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to parse resume: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const processingTime = Date.now() - startTime;

      const nextParsedData: ParsedData = {
        name: data.name || '',
        email: data.email || '',
        phone: data.phone || '',
        summary: data.summary || '',
        projects: Array.isArray(data.projects)
          ? data.projects.map((project: any) => ({
              name: project.name || '',
              description: project.description || '',
              technologies: Array.isArray(project.technologies)
                ? project.technologies
                : Array.isArray(project.techStack)
                  ? project.techStack
                  : []
            }))
          : [],
        experiences: Array.isArray(data.experiences)
          ? data.experiences.map((experience: any) => ({
              company: experience.company || '',
              role: experience.role || '',
              duration: experience.duration || '',
              description: experience.description || ''
            }))
          : [],
        aiConfidence: data.aiConfidence || 0.95,
        aiSource: data.aiSource || 'AI Analysis',
        processingTime,
        skills: Array.isArray(data.skills)
          ? data.skills.map((skill: any) => ({
              name: skill.name || '',
              proficiency: skill.proficiency || 'Intermediate',
              source: skill.source || 'Inferred',
              confidence: skill.confidence || 0.8,
              category: skill.category || 'General'
            }))
          : []
      };

      const nextMatchResult = analyzeSkillMatch(
        selectedAssessment.skills,
        nextParsedData.skills.map((skill) => skill.name)
      );

      setParsedData(nextParsedData);
      setMatchResult(nextMatchResult);

      localStorage.setItem(PARSED_RESUME_STORAGE_KEY, JSON.stringify(nextParsedData));
      localStorage.setItem(RESUME_UPLOADED_STORAGE_KEY, 'true');
    } catch (processingError) {
      console.error('Assessment resume processing error:', processingError);
      setError('Failed to scan the resume. Please make sure the backend is running and upload a valid PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startAssessment = () => {
    localStorage.removeItem(ASSESSMENT_START_REQUESTED_STORAGE_KEY);
    clearStoredJobApplication();
    setActiveExamFlow('assessment');
    navigate('/candidate-verification');
  };

  return (
    <div className="exam-flow-shell p-6">
      <div className="exam-flow-container max-w-4xl">
        <div className="mb-8 text-center">
          <div className="exam-flow-hero-badge mb-4">
            <Cpu className="h-4 w-4" />
            Assessment Resume Check
          </div>
          <h1 className="exam-flow-title mb-3 text-4xl font-bold">{selectedAssessment.title}</h1>
          <p className="exam-flow-muted mx-auto max-w-2xl text-base md:text-lg">
            Upload your resume for this assessment. AI will scan your skills and compare them with the required job
            skills before the test can start.
          </p>
        </div>

        <div className="exam-flow-card-strong p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="exam-flow-title mb-3 text-xl font-semibold">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {selectedAssessment.skills.map((skill) => (
                <span key={skill} className="exam-flow-chip text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {!parsedData && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`exam-flow-upload-zone p-12 text-center ${isDragging ? 'exam-flow-upload-zone-active' : ''}`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    <Loader className="h-16 w-16 animate-spin text-indigo-500" />
                    <Brain className="absolute inset-0 m-auto h-6 w-6 text-indigo-600 dark:text-indigo-200" />
                  </div>
                  <h3 className="exam-flow-title mb-2 text-xl font-semibold">Scanning Resume Skills...</h3>
                  <p className="exam-flow-muted">Checking your resume against this assessment&apos;s required skills.</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/15">
                    <Upload className="h-10 w-10 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <h3 className="exam-flow-title mb-2 text-2xl font-bold">Upload Resume</h3>
                  <p className="exam-flow-muted mb-6">Choose a PDF resume to continue with this assessment.</p>
                  <input
                    id="assessment-resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <label htmlFor="assessment-resume-upload" className="exam-flow-primary-button cursor-pointer">
                    <Upload className="h-5 w-5" />
                    Select Resume PDF
                  </label>
                  {file && <p className="mt-4 text-sm text-indigo-600 dark:text-indigo-300">Selected: {file.name}</p>}
                </>
              )}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-700 dark:border-rose-400/30 dark:bg-rose-500/10 dark:text-rose-200">
              {error}
            </div>
          )}

          {parsedData && matchResult && (
            <div className="mt-6 space-y-6">
              <div
                className={`rounded-3xl border p-6 ${
                  matchResult.isEligible
                    ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-500/10'
                    : 'border-rose-200 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-500/10'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`rounded-2xl p-3 ${
                      matchResult.isEligible ? 'bg-emerald-500/15 dark:bg-emerald-500/20' : 'bg-rose-500/15 dark:bg-rose-500/20'
                    }`}
                  >
                    {matchResult.isEligible ? (
                      <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <Lock className="h-8 w-8 text-rose-600 dark:text-rose-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="exam-flow-title mb-2 text-2xl font-bold">
                      {matchResult.isEligible ? 'Skills Matched' : 'Skills Not Matched'}
                    </h3>
                    <p className="exam-flow-muted mb-4">
                      Resume match score: <span className="font-semibold">{matchResult.matchPercentage}%</span>
                    </p>

                    {matchResult.matched.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm text-emerald-700 dark:text-emerald-200">Matched Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {matchResult.matched.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {matchResult.missing.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm text-rose-700 dark:text-rose-200">Missing Required Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {matchResult.missing.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-rose-100 px-3 py-1.5 text-sm text-rose-700 dark:bg-rose-500/20 dark:text-rose-100"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {matchResult.isEligible ? (
                      <button onClick={startAssessment} className="exam-flow-success-button">
                        Start Test
                      </button>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-rose-700 dark:text-rose-100">
                          This test cannot start because your resume match is below 50% for this assessment.
                        </p>
                        <button onClick={() => navigate('/assessments')} className="exam-flow-secondary-button">
                          Back to Assessments
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="exam-flow-card p-6">
                <h3 className="exam-flow-title mb-3 text-lg font-semibold">AI Scan Summary</h3>
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="exam-flow-stat-card p-4">
                    <p className="exam-flow-muted text-sm">Candidate</p>
                    <p className="exam-flow-title font-semibold">{parsedData.name || 'Unknown'}</p>
                  </div>
                  <div className="exam-flow-stat-card p-4">
                    <p className="exam-flow-muted text-sm">Skills Found</p>
                    <p className="exam-flow-title font-semibold">{parsedData.skills.length}</p>
                  </div>
                  <div className="exam-flow-stat-card p-4">
                    <p className="exam-flow-muted text-sm">AI Confidence</p>
                    <p className="exam-flow-title font-semibold">{Math.round(parsedData.aiConfidence * 100)}%</p>
                  </div>
                </div>

                <div>
                  <p className="exam-flow-muted mb-2 text-sm">Extracted Resume Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {parsedData.skills.map((skill) => (
                      <span key={`${skill.name}-${skill.category}`} className="exam-flow-chip text-sm">
                        {skill.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate('/assessments')} className="exam-flow-outline-button">
            Cancel and go back
          </button>
        </div>
      </div>
    </div>
  );
}
