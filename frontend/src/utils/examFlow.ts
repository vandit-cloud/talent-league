import type { JobPosting } from '../data/jobCatalog';

export type ActiveExamFlow = 'resume' | 'assessment' | 'job';

export const ACTIVE_EXAM_FLOW_STORAGE_KEY = 'activeExamFlow';
export const SELECTED_JOB_APPLICATION_STORAGE_KEY = 'selectedJobApplication';

export const setActiveExamFlow = (flow: ActiveExamFlow) => {
  localStorage.setItem(ACTIVE_EXAM_FLOW_STORAGE_KEY, flow);
};

export const getActiveExamFlow = (): ActiveExamFlow | null => {
  const flow = localStorage.getItem(ACTIVE_EXAM_FLOW_STORAGE_KEY);
  if (flow === 'resume' || flow === 'assessment' || flow === 'job') {
    return flow;
  }
  return null;
};

export const storeSelectedJobApplication = (job: JobPosting) => {
  localStorage.setItem(SELECTED_JOB_APPLICATION_STORAGE_KEY, JSON.stringify(job));
};

export const getStoredJobApplication = (): JobPosting | null => {
  const raw = localStorage.getItem(SELECTED_JOB_APPLICATION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as JobPosting;
  } catch {
    return null;
  }
};

export const clearStoredJobApplication = () => {
  localStorage.removeItem(SELECTED_JOB_APPLICATION_STORAGE_KEY);
};
