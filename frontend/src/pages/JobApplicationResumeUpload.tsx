import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Briefcase, CheckCircle2, Cpu, Loader, Lock, Upload, XCircle } from 'lucide-react';
import { analyzeSkillMatch, PARSED_RESUME_STORAGE_KEY, RESUME_UPLOADED_STORAGE_KEY } from '../utils/assessmentMatching';
import { clearStoredJobApplication, getStoredJobApplication, setActiveExamFlow } from '../utils/examFlow';
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

export function JobApplicationResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [matchPercentage, setMatchPercentage] = useState<number | null>(null);
  const [matchedSkills, setMatchedSkills] = useState<string[]>([]);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isEligible, setIsEligible] = useState(false);

  const selectedJob = getStoredJobApplication();
  const MIN_MATCH = 50;

  if (!selectedJob) {
    return (
      <div className="exam-flow-shell flex items-center justify-center p-6">
        <div className="exam-flow-card-strong w-full max-w-lg p-8 text-center">
          <XCircle className="mx-auto mb-4 h-14 w-14 text-rose-500" />
          <h1 className="exam-flow-title mb-2 text-2xl font-bold">Job Not Selected</h1>
          <p className="exam-flow-muted mb-6">
            Choose a job first, then upload your resume to start the job application test flow.
          </p>
          <button onClick={() => navigate('/jobs')} className="exam-flow-primary-button">
            Back to Jobs
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
    setMatchPercentage(null);
    setMatchedSkills([]);
    setMissingSkills([]);

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
        body: formData,
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
                  : [],
            }))
          : [],
        experiences: Array.isArray(data.experiences)
          ? data.experiences.map((experience: any) => ({
              company: experience.company || '',
              role: experience.role || '',
              duration: experience.duration || '',
              description: experience.description || '',
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
              category: skill.category || 'General',
            }))
          : [],
      };

      const matchResult = analyzeSkillMatch(
        selectedJob.skills,
        nextParsedData.skills.map((skill) => skill.name)
      );

      setParsedData(nextParsedData);
      setMatchPercentage(matchResult.matchPercentage);
      setMatchedSkills(matchResult.matched);
      setMissingSkills(matchResult.missing);
      setIsEligible(matchResult.isEligible);

      localStorage.setItem(PARSED_RESUME_STORAGE_KEY, JSON.stringify(nextParsedData));
      localStorage.setItem(RESUME_UPLOADED_STORAGE_KEY, 'true');
    } catch (processingError) {
      console.error('Job resume processing error:', processingError);
      setError('Failed to scan the resume. Please make sure the backend is running and upload a valid PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const startJobFlow = () => {
    setActiveExamFlow('job');
    navigate('/candidate-verification');
  };

  const cancelJobFlow = () => {
    clearStoredJobApplication();
    navigate('/jobs');
  };

  return (
    <div className="exam-flow-shell p-6">
      <div className="exam-flow-container max-w-4xl">
        <div className="mb-8 text-center">
          <div className="exam-flow-hero-badge mb-4">
            <Cpu className="h-4 w-4" />
            Job Application Resume Check
          </div>
          <h1 className="exam-flow-title mb-3 text-4xl font-bold">{selectedJob.title}</h1>
          <p className="exam-flow-muted mx-auto max-w-2xl text-base md:text-lg">
            Upload your resume for this job. AI will scan your skills and use this job&apos;s required skills to build
            the test flow and generate questions.
          </p>
        </div>

        <div className="exam-flow-card-strong p-8 shadow-2xl">
          <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-indigo-200/60 bg-indigo-50/70 dark:border-indigo-400/20 dark:bg-indigo-500/10 p-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <Briefcase className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{selectedJob.company}</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedJob.location} · {selectedJob.type} · {selectedJob.experience}
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{selectedJob.description}</p>
              </div>
            </div>
            <div className="exam-flow-chip text-sm dark:bg-indigo-500/20 dark:text-indigo-200 dark:border-indigo-400/30">{selectedJob.salary}</div>
          </div>

          <div className="mb-6">
            <h2 className="exam-flow-title mb-3 text-xl font-semibold">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {selectedJob.skills.map((skill) => (
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
                  <h3 className="exam-flow-title mb-2 text-xl font-semibold">Scanning Resume for Job Match...</h3>
                  <p className="exam-flow-muted">Checking your resume against the selected job&apos;s required skills.</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/15">
                    <Upload className="h-10 w-10 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <h3 className="exam-flow-title mb-2 text-2xl font-bold">Upload Resume for This Job</h3>
                  <p className="exam-flow-muted mb-6">Choose a PDF resume to continue with this job application.</p>
                  <input
                    id="job-resume-upload"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <label htmlFor="job-resume-upload" className="exam-flow-primary-button cursor-pointer">
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

          {parsedData && (
            <div className="mt-6 space-y-6">
              {/* Match Score Bar */}
              <div className={`rounded-3xl border p-6 ${
                isEligible
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-400/30 dark:bg-emerald-500/10'
                  : 'border-rose-200 bg-rose-50 dark:border-rose-400/30 dark:bg-rose-500/10'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`rounded-2xl p-3 ${
                    isEligible
                      ? 'bg-emerald-500/15 dark:bg-emerald-500/20'
                      : 'bg-rose-500/15 dark:bg-rose-500/20'
                  }`}>
                    {isEligible
                      ? <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-300" />
                      : <XCircle className="h-8 w-8 text-rose-600 dark:text-rose-300" />
                    }
                  </div>
                  <div className="flex-1">
                    <h3 className="exam-flow-title mb-1 text-2xl font-bold">
                      {isEligible ? 'Skills Matched! You are eligible' : 'Skills Not Matched'}
                    </h3>
                    <p className="exam-flow-muted mb-4">
                      Resume match score: <span className={`font-bold text-lg ${
                        isEligible ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'
                      }`}>{matchPercentage ?? 0}%</span>
                      <span className="ml-2 text-sm">(Minimum required: {MIN_MATCH}%)</span>
                    </p>

                    {/* Match Progress Bar */}
                    <div className="mb-5 rounded-full bg-slate-200 dark:bg-slate-700 h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          isEligible
                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600'
                            : 'bg-gradient-to-r from-rose-400 to-rose-600'
                        }`}
                        style={{ width: `${matchPercentage ?? 0}%` }}
                      />
                    </div>

                    {matchedSkills.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-emerald-700 dark:text-emerald-200">
                          Matched Skills ({matchedSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matchedSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-100"
                            >
                              <CheckCircle2 className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {missingSkills.length > 0 && (
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-medium text-rose-700 dark:text-rose-200">
                          Missing Skills ({missingSkills.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {missingSkills.map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-700 dark:bg-rose-500/20 dark:text-rose-100"
                            >
                              <XCircle className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {isEligible ? (
                      <div className="flex flex-wrap gap-3 mt-5">
                        <button onClick={startJobFlow} className="exam-flow-success-button">
                          <Lock className="h-4 w-4" />
                          Proceed to Verification
                        </button>
                        <button onClick={cancelJobFlow} className="exam-flow-secondary-button">
                          Back to Jobs
                        </button>
                      </div>
                    ) : (
                      <div className="mt-5 space-y-3">
                        <div className="rounded-2xl border border-rose-200 bg-rose-100/50 p-4 dark:border-rose-400/20 dark:bg-rose-500/5">
                          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                            Your resume skills do not meet the minimum {MIN_MATCH}% match required for this job.
                            Please improve your skills or try a different job that better matches your profile.
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          <button onClick={() => { setFile(null); setParsedData(null); setMatchPercentage(null); setMatchedSkills([]); setMissingSkills([]); }} className="exam-flow-secondary-button">
                            Upload Different Resume
                          </button>
                          <button onClick={cancelJobFlow} className="exam-flow-secondary-button">
                            Back to Jobs
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Scan Summary */}
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
                    <p className="exam-flow-title font-semibold">{Math.round((parsedData.aiConfidence || 0) * 100)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
