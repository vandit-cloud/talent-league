export const SELECTED_ASSESSMENT_STORAGE_KEY = 'selectedAssessment';
export const ASSESSMENT_START_REQUESTED_STORAGE_KEY = 'assessmentStartRequested';
export const PARSED_RESUME_STORAGE_KEY = 'parsedResumeData';
export const RESUME_UPLOADED_STORAGE_KEY = 'resumeUploaded';

const SKILL_ALIASES: Record<string, string> = {
  'aws': 'aws',
  'ci cd': 'cicd',
  'ci/cd': 'cicd',
  'c#': 'csharp',
  'c++': 'cplusplus',
  'docker': 'docker',
  'express.js': 'express',
  'javascript': 'javascript',
  'js': 'javascript',
  'k8s': 'kubernetes',
  'ml ops': 'mlops',
  'mongodb': 'mongodb',
  'mongo db': 'mongodb',
  'node': 'nodejs',
  'node.js': 'nodejs',
  'node js': 'nodejs',
  'postgres': 'postgresql',
  'postgresql': 'postgresql',
  'postgre sql': 'postgresql',
  'react.js': 'react',
  'redux toolkit': 'redux',
  'tf': 'tensorflow',
  'ts': 'typescript'
};

export interface SkillMatchResult {
  matched: string[];
  missing: string[];
  matchPercentage: number;
  isEligible: boolean;
}

const MINIMUM_ASSESSMENT_MATCH_PERCENTAGE = 50;

export const normalizeSkillName = (skill: string) => {
  const normalized = skill
    .trim()
    .toLowerCase()
    .replace(/[^\w#+./\s-]/g, '')
    .replace(/\s+/g, ' ');

  return SKILL_ALIASES[normalized] ?? normalized.replace(/[./\s-]/g, '');
};

const skillNamesMatch = (requiredSkill: string, resumeSkill: string) => {
  const normalizedRequired = normalizeSkillName(requiredSkill);
  const normalizedResume = normalizeSkillName(resumeSkill);

  if (normalizedRequired === normalizedResume) {
    return true;
  }

  if (normalizedRequired.length < 4 || normalizedResume.length < 4) {
    return false;
  }

  return (
    normalizedRequired.includes(normalizedResume) ||
    normalizedResume.includes(normalizedRequired)
  );
};

export const analyzeSkillMatch = (requiredSkills: string[], resumeSkills: string[]): SkillMatchResult => {
  const matched = requiredSkills.filter((requiredSkill) =>
    resumeSkills.some((resumeSkill) => skillNamesMatch(requiredSkill, resumeSkill))
  );

  const missing = requiredSkills.filter((requiredSkill) =>
    !resumeSkills.some((resumeSkill) => skillNamesMatch(requiredSkill, resumeSkill))
  );

  const matchPercentage = requiredSkills.length === 0
    ? 100
    : Math.round((matched.length / requiredSkills.length) * 100);

  return {
    matched,
    missing,
    matchPercentage,
    isEligible: matchPercentage >= MINIMUM_ASSESSMENT_MATCH_PERCENTAGE
  };
};

export const getStoredResumeSkills = () => {
  const rawResumeData = localStorage.getItem(PARSED_RESUME_STORAGE_KEY);

  if (!rawResumeData) {
    return [];
  }

  try {
    const parsedResume = JSON.parse(rawResumeData);
    return Array.isArray(parsedResume.skills)
      ? parsedResume.skills.map((skill: { name?: string }) => skill.name).filter(Boolean)
      : [];
  } catch {
    return [];
  }
};

export const hasUploadedResume = () => localStorage.getItem(RESUME_UPLOADED_STORAGE_KEY) === 'true';
