import { ReactNode } from 'react';

interface ProctoringWrapperProps {
  children: ReactNode;
}

export function ProctoringWrapper({ children }: ProctoringWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
