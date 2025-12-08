import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ProcessStepProps {
  stepNumber: string;
  title: string;
  subtitle: string;
  showConnector?: boolean;
}

export const ProcessStep: React.FC<ProcessStepProps> = ({ stepNumber, title, subtitle, showConnector = false }) => {
  return (
    <div className="flex items-center" role="listitem">
      <div className="flex flex-col items-center w-24">
        <div
          className="bg-white shadow-lg flex items-center justify-center w-20 h-20 rounded-full border-4 border-[hsl(var(--destructive))]"
          aria-label={`Step ${stepNumber}: ${title} ${subtitle}`}
        >
          <span className="text-[hsl(var(--destructive))] font-semibold text-xl">
            {stepNumber}
          </span>
        </div>
        <div className="text-foreground text-sm font-medium text-center mt-3">
          {title}
        </div>
        <div className="text-muted-foreground text-xs text-center mt-1">
          {subtitle}
        </div>
      </div>
      {showConnector && (
        <div className="flex items-center mx-2 -mt-8 max-md:hidden">
          <div className="w-8 h-0.5 bg-[hsl(var(--destructive))]" />
          <ArrowRight className="w-5 h-5 text-[hsl(var(--destructive))] -ml-1" />
        </div>
      )}
    </div>
  );
};
