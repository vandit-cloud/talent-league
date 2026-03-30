export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
  avatar?: string;
  company?: string;
  contactInfo: {
    phone?: string;
    location?: string;
  };
  onboardingComplete: boolean;
}

export interface Candidate {
  userId: string;
  skills: Skill[];
  experience: number;
  projects: Project[];
  education: Education[];
  certifications: string[];
  uploadedFiles: UploadedFile[];
  leagueScore: number;
  league: League;
  abilityScore: number;
}

export interface Recruiter {
  userId: string;
  companyInfo: {
    name: string;
    industry: string;
    size: string;
  };
  hiringRoles: string[];
  jobPosts: string[];
}

export interface Skill {
  name: string;
  proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience: number;
  category: 'technical' | 'soft';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  skills: string[];
  role: string;
  duration: string;
}

export interface Education {
  degree: string;
  institution: string;
  year: number;
  field: string;
}

export interface UploadedFile {
  id: string;
  userId: string;
  type: 'resume' | 'portfolio' | 'certification' | 'project';
  fileUrl: string;
  filename: string;
  uploadedAt: string;
}

export interface Job {
  id: string;
  recruiterId: string;
  recruiterName: string;
  companyName: string;
  title: string;
  description: string;
  requiredSkills: string[];
  optionalSkills: string[];
  level: 'Entry' | 'Mid' | 'Senior' | 'Lead';
  experienceRange: {
    min: number;
    max: number;
  };
  salary?: {
    min: number;
    max: number;
  };
  createdAt: string;
}

export interface Assessment {
  id: string;
  candidateId: string;
  questions: Question[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  status: 'pending' | 'in-progress' | 'completed';
  assignedAt: string;
  completedAt?: string;
  score?: number;
}

export interface Question {
  id: string;
  questionText: string;
  skills: string[];
  format: 'mcq' | 'coding' | 'scenario';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options?: string[];
  correctAnswer?: string;
  userAnswer?: string;
}

export interface ExamResult {
  candidateId: string;
  assessmentId: string;
  score: number;
  consistency: number;
  abilityScore: number;
  skillPerformance: {
    skill: string;
    score: number;
    questionsAttempted: number;
  }[];
  difficultyReached: 'Easy' | 'Medium' | 'Hard';
  timeSpent: number;
  completedAt: string;
  resumeVsReality: {
    claimValidation: number;
    exaggerationScore: number;
    underclaimedSkills: string[];
  };
  antiCheating: {
    suspicious: boolean;
    anomaliesDetected: string[];
    trustScore: number;
  };
}

export interface JDParsing {
  roleTitle: string;
  seniority: 'Intern' | 'Junior' | 'Entry' | 'Mid' | 'Senior' | 'Lead';
  department: string;
  industry: string;
  workType: 'Remote' | 'Hybrid' | 'Onsite';
  experienceRange: { min: number; max: number };
  mandatorySkills: string[];
  optionalSkills: string[];
  skillDepth: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'>;
  qualityIssues: string[];
}

export interface ResumeParsing {
  skills: {
    name: string;
    proficiency: 'Basic' | 'Intermediate' | 'Advanced' | 'Expert';
    evidenceBacked: boolean;
    suspicionScore: number;
  }[];
  projects: {
    name: string;
    complexity: number;
    role: string;
    techStack: string[];
    ownership: number;
    innovation: number;
  }[];
  experience: {
    duration: number;
    internships: number;
    freelance: number;
    gaps: number;
  };
  hiddenSkills: string[];
  transferableSkills: string[];
}

export interface SkillMatch {
  candidateId: string;
  jobId: string;
  directMatch: number;
  gapAnalysis: {
    missingSkills: string[];
    weakSkills: string[];
    criticalGaps: string[];
    trainableGaps: string[];
    learningCurveEstimate: number;
  };
  matchScore: {
    overall: number;
    requiredSkillsMatch: number;
    optionalSkillsMatch: number;
    depthMatch: number;
    recencyWeight: number;
  };
  provenSkills: string[];
  unverifiedSkills: string[];
}

export interface AdaptiveExam {
  candidateId: string;
  strategy: {
    skillsToVerify: string[];
    depthValidation: boolean;
    antiExaggeration: boolean;
    multiSkillCoverage: boolean;
  };
  difficultyAdjustment: {
    currentLevel: number;
    accuracyBasedEscalation: boolean;
    failureBasedReduction: boolean;
    ceilingReached: boolean;
  };
  antiGaming: {
    guessPatternDetection: boolean;
    randomization: boolean;
    crossVerification: boolean;
  };
}

export interface AntiCheating {
  assessmentId: string;
  candidateId: string;
  identityVerification: boolean;
  livenessDetection: boolean;
  deviceFingerprint: string;
  lockdownBrowser: boolean;
  screenMonitoring: boolean;
  audioAnomalies: string[];
  copyPasteDetections: number;
  ipDuplicate: boolean;
  plagiarismScore: number;
  behavioralAnomalies: string[];
  typingDynamics: {
    averageSpeed: number;
    consistency: number;
  };
  timeAnomalies: boolean;
  cheatLikelihood: number;
  humanReviewRequired: boolean;
}

export interface LeagueRanking {
  candidateId: string;
  league: League;
  tier: number;
  percentile: number;
  abilityScore: number;
  rawScore: number;
  normalizedScore: number;
  cohortRanking: number;
  history: {
    date: string;
    league: League;
    score: number;
  }[];
  growthVelocity: number;
  promotionProgress: number;
}

export type League = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';

export interface CandidateMatch {
  candidateId: string;
  jobId: string;
  skillMatchScore: number;
  leagueComparison: string;
  missingSkills: string[];
  riskIndicators: string[];
  overallScore: number;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'assessment' | 'league_update' | 'job_match' | 'message';
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
}

export interface SalaryInsight {
  candidateId: string;
  league: League;
  recommendedSalary: {
    min: number;
    max: number;
  };
  skillPremiums: {
    skill: string;
    premium: number;
  }[];
  marketComparison: number;
}
