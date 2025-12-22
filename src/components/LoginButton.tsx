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
      className="bg-[hsl(var(--destructive))] flex w-[140px] items-center justify-center gap-3 text-base font-medium text-white whitespace-nowrap leading-none mt-[34px] px-6 py-4 rounded-lg hover:bg-[hsl(var(--destructive))]/90 transition-colors"
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
