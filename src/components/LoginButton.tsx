import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LoginButton: React.FC = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <button
      onClick={handleLogin}
      className="bg-[rgba(231,0,11,1)] flex w-[92px] items-stretch gap-2 text-sm text-white whitespace-nowrap leading-none mt-[34px] px-4 py-3.5 rounded-lg hover:bg-[rgba(207,0,10,1)] transition-colors"
      aria-label="Login to Ethics Committee Portal"
    >
      <img
        src="https://api.builder.io/api/v1/image/assets/TEMP/ba4abfb0d7480a835ac7613769e292fb80df4bf0?placeholderIfAbsent=true"
        alt=""
        className="aspect-[1] object-contain w-4 shrink-0 my-auto"
        aria-hidden="true"
      />
      <span>Login</span>
    </button>
  );
};
