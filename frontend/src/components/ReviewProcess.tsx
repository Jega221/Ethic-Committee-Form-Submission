import React from 'react';
import { ProcessStep } from './ProcessStep';

const processSteps = [
  { stepNumber: '1', title: 'Researcher', subtitle: 'Submission' },
  { stepNumber: '2', title: 'Faculty', subtitle: 'Review' },
  { stepNumber: '3', title: 'Ethics', subtitle: 'Committee' },
  { stepNumber: '4', title: 'Dean', subtitle: 'Review' },
  { stepNumber: '5', title: 'Final', subtitle: 'Approval' },
];

export const ReviewProcess: React.FC = () => {
  return (
    <section className="w-full mt-16 max-md:mt-10">
      <div className="text-center mb-8">
        <h2 className="text-foreground text-lg font-medium">Review Process</h2>
      </div>
      <div
        className="flex items-start justify-center flex-wrap gap-y-6 px-4"
        role="list"
        aria-label="Ethics review process steps"
      >
        {processSteps.map((step, index) => (
          <ProcessStep
            key={index}
            stepNumber={step.stepNumber}
            title={step.title}
            subtitle={step.subtitle}
            showConnector={index < processSteps.length - 1}
          />
        ))}
      </div>
    </section>
  );
};
