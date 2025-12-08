import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="flex flex-col items-center text-center">
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/add812aefd9d169f2f4caedfddba8f4a03e99dbb?placeholderIfAbsent=true"
        alt="Final International University Logo"
        className="aspect-[3.82] object-contain w-[488px] max-w-full"
      />
      <h1 className="text-[rgba(16,24,40,1)] text-base font-bold mt-[46px] max-md:mt-10">
        FIU Ethics Committee
      </h1>
      <h2 className="text-[rgba(16,24,40,1)] text-xl font-bold leading-[1.4] mt-4 max-md:max-w-full">
        Ethic Committee Portal for Final International University
      </h2>
      <p className="text-[rgba(16,24,40,1)] text-base font-bold leading-6 w-[647px] mt-8 max-md:max-w-full">
        Welcome to the Final International University Ethics Committee Portal.
        This system manages research ethics applications and reviews for our
        academic community.
      </p>
    </header>
  );
};