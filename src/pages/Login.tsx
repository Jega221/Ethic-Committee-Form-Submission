import * as React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import fiuLogo from '@/assets/fiu-login-logo.png';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      console.log('Login attempt:', { email });
      // Redirect to dashboard after successful login
      navigate('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#f5f7fa] relative px-4 py-8">
      {/* Back to Home - Top Left */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-[#1e2939] hover:opacity-70 transition-opacity"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-base">Back to Home</span>
      </button>

      {/* Content Container */}
      <div className="flex flex-col items-center pt-12">
        {/* Logo */}
        <div className="flex justify-center mb-12">
          <div className="bg-[#f5f7fa] p-4">
            <img
              src={fiuLogo}
              alt="Final International University Logo"
              className="w-64 object-contain"
            />
          </div>
        </div>

        {/* Login Form */}
        <div className="flex flex-col items-center">
          <h1 className="text-base font-normal text-[#1e2939] mb-2">
            FIU Ethics Committee
          </h1>
          <h2 className="text-xl font-normal text-[#000000] mb-8">
            login into your final account
          </h2>

          <form onSubmit={handleLogin} className="w-full max-w-[280px] flex flex-col gap-4">
            <Input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-14 bg-white border border-[#d0d5dd] rounded-lg px-4 text-base placeholder:text-[#98a2b3]"
            />
            
            <Input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-14 bg-white border border-[#d0d5dd] rounded-lg px-4 text-base placeholder:text-[#98a2b3]"
            />

            <button
              type="submit"
              disabled={isLoading}
              className="h-14 bg-black text-white text-base font-medium rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 mt-2"
            >
              {isLoading ? 'Loading...' : 'LOGIN'}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 w-full max-w-[280px] my-6">
            <div className="flex-1 h-px bg-[#e4e7ec]" />
            <span className="text-sm text-[#98a2b3]">or</span>
            <div className="flex-1 h-px bg-[#e4e7ec]" />
          </div>

          {/* Sign up link */}
          <p className="text-base text-[#000000]">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-[#000000] underline hover:opacity-70 transition-opacity"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
