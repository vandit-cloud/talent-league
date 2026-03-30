import type { ElementType } from 'react';
import { Briefcase, Code, Cpu, Database, Globe } from 'lucide-react';

export interface AssessmentJob {
  id: string;
  title: string;
  company: string;
  type: string;
  duration: string;
  questions: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  skills: string[];
  icon: ElementType;
  color: string;
  description: string;
}

export const assessmentJobs: AssessmentJob[] = [
  {
    id: '1',
    title: 'Full Stack Python Developer',
    company: 'TechCorp Solutions',
    type: 'Technical Assessment',
    duration: '60 min',
    questions: 25,
    difficulty: 'Medium',
    skills: ['Python', 'React', 'Node.js', 'PostgreSQL', 'Docker'],
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    description: 'Complete full stack assessment covering Python backend, React frontend, and database design.'
  },
  {
    id: '2',
    title: 'Senior Backend Engineer',
    company: 'DataDriven Inc',
    type: 'Technical Assessment',
    duration: '90 min',
    questions: 30,
    difficulty: 'Hard',
    skills: ['Python', 'FastAPI', 'Microservices', 'Redis', 'Kafka'],
    icon: Database,
    color: 'from-purple-500 to-pink-500',
    description: 'Advanced backend assessment focusing on system design, APIs, and distributed systems.'
  },
  {
    id: '3',
    title: 'Frontend React Developer',
    company: 'InnovateTech',
    type: 'Technical Assessment',
    duration: '45 min',
    questions: 20,
    difficulty: 'Medium',
    skills: ['React', 'TypeScript', 'CSS', 'Redux', 'Jest'],
    icon: Globe,
    color: 'from-emerald-500 to-teal-500',
    description: 'Frontend-focused assessment on React ecosystem, state management, and UI testing.'
  },
  {
    id: '4',
    title: 'Machine Learning Engineer',
    company: 'AI Solutions Ltd',
    type: 'Technical Assessment',
    duration: '75 min',
    questions: 28,
    difficulty: 'Hard',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'ML Ops', 'AWS'],
    icon: Cpu,
    color: 'from-orange-500 to-red-500',
    description: 'ML assessment covering model development, deployment, and production systems.'
  },
  {
    id: '5',
    title: 'DevOps Engineer',
    company: 'CloudFirst Systems',
    type: 'Technical Assessment',
    duration: '50 min',
    questions: 22,
    difficulty: 'Medium',
    skills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform'],
    icon: Briefcase,
    color: 'from-indigo-500 to-purple-500',
    description: 'Infrastructure and DevOps assessment on cloud platforms and automation.'
  },
  {
    id: '6',
    title: 'JavaScript Full Stack',
    company: 'StartupXYZ',
    type: 'Technical Assessment',
    duration: '55 min',
    questions: 24,
    difficulty: 'Easy',
    skills: ['JavaScript', 'Node.js', 'Express', 'MongoDB', 'React'],
    icon: Code,
    color: 'from-yellow-500 to-orange-500',
    description: 'JavaScript-focused assessment for full stack development roles.'
  }
];

export const getAssessmentById = (assessmentId: string | null) => {
  if (!assessmentId) {
    return null;
  }

  return assessmentJobs.find((job) => job.id === assessmentId) ?? null;
};
