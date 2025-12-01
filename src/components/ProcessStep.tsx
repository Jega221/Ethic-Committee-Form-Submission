import React from 'react';

interface ProcessStepProps {
  stepNumber: string;
  title: string;
  subtitle: string;
}

export const ProcessStep: React.FC<ProcessStepProps> = ({ stepNumber, title, subtitle }) => {
  return (
    <div className="flex flex-col items-center w-24" role="listitem">
      <div
        className="bg-white shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.1)] self-stretch flex min-h-24 items-center text-[rgba(231,0,11,1)] w-full justify-center h-24 rounded-[22369600px] border-[rgba(231,0,11,1)] border-solid border-4"
        aria-label={`Step ${stepNumber}: ${title} ${subtitle}`}
      >
        <div className="self-stretch flex w-[9px] flex-col items-stretch justify-center my-auto py-px">
          <div className="z-10 font-normal text-base">
            {stepNumber}
          </div>
        </div>
      </div>
      <div className="text-[rgba(16,24,40,1)] text-base font-normal text-center mt-3.5">
        {title}
      </div>
      <div className="text-[rgba(74,85,101,1)] text-sm leading-none text-center mt-[5px]">
        {subtitle}
      </div>
    </div>
  );
};
