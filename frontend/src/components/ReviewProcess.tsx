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
    <section className="self-stretch min-h-[232px] w-full mt-16 max-md:max-w-full max-md:mt-10">
      <div className="flex w-full flex-col items-center text-[rgba(30,41,57,1)] text-base font-normal text-center justify-center px-[70px] py-px max-md:max-w-full max-md:px-5">
        <h2 className="z-10">Review Process</h2>
      </div>
      <div 
        className="flex w-full items-stretch gap-5 whitespace-nowrap flex-wrap justify-between mt-12 px-12 py-px max-md:max-w-full max-md:mt-10 max-md:px-5"
        role="list"
        aria-label="Ethics review process steps"
      >
        {processSteps.map((step, index) => (
          <ProcessStep
            key={index}
            stepNumber={step.stepNumber}
            title={step.title}
            subtitle={step.subtitle}
          />
        ))}
      </div>
    </section>
  );
};
