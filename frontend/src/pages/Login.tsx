import * as React from 'react';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/api';
import fiuLogo from '@/assets/fiu-login-logo.png';
import fiuImage from '@/assets/fiu-image.jpg';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const body = {
        email: email,
        password: password,
      };

      const data = await apiRequest<{ token: string; user: any }>(
        "/api/auth/login",
        {
          method: "POST",
          body: JSON.stringify(body),
        }
      );

      localStorage.setItem("token", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));

      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.name}!`,
      });

      // Role-based redirection
      const role = data.user.role;
      if (role === 'admin' || role === 6) {
        navigate("/admin");
      } else if (role === 'super_admin' || role === 1) {
        navigate("/super-admin");
      } else if (role === 5) {
        navigate("/rector");
      } else if (role === 4) {
        navigate("/faculty");
      } else if (role === 2) {
        navigate("/committee");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: err.message || "Invalid credentials. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden font-sans">
      {/* Left side: Image & Welcome (Hidden on mobile) */}
      <div className="hidden md:flex md:w-3/5 relative overflow-hidden bg-[#1a0b4b]">
        {/* Background Image */}
        <img
          src={fiuImage}
          alt="FIU Campus"
          className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a0b4b]/80 via-transparent to-[#f5a623]/20" />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16 text-white max-w-2xl">
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Welcome to <br />
            <span className="text-[#f5a623] mt-20 block">Ethics Committee</span>
          </h1>
          <p className="text-lg text-slate-100 leading-relaxed mb-8 font-medium">
            Advancing research integrity at Final International University.
            Our digital portal for ethical review process, supporting
            academic excellence and professional standards across all disciplines.
          </p>
          <div className="h-1 w-20 bg-[#f5a623] rounded-full" />
        </div>

        {/* Floating Decorative Shapes */}
        <div className="absolute bottom-[-10%] left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute top-[10%] right-[-5%] w-48 h-48 bg-[#f5a623]/20 rounded-full blur-2xl" />
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header/Mobile Nav */}
        <div className="p-6 md:p-8 flex justify-between items-center">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-slate-500 hover:text-[#1a0b4b] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
          <img src={fiuLogo} alt="FIU Logo" className="h-12 object-contain block md:hidden" />
        </div>

        <div className="flex-1 flex flex-col justify-center items-center px-8 pb-12">
          <div className="w-full max-w-md">
            {/* Form Header */}
            <div className="text-center mb-10">
              <img src={fiuLogo} alt="FIU Logo" className="h-16 mx-auto mb-6 hidden md:block" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2 uppercase tracking-wide">User Login</h2>
              <p className="text-slate-500 text-sm">Log in to accessibility your ethics committee portal</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-[#1a0b4b] transition-colors" />
                  </div>
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 bg-slate-50 border-slate-200 rounded-xl pl-12 pr-4 focus-visible:ring-[#1a0b4b] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-[#1a0b4b] transition-colors" />
                  </div>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 bg-slate-50 border-slate-200 rounded-xl pl-12 pr-4 focus-visible:ring-[#1a0b4b] transition-all"
                  />
                </div>
              </div>



              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-[#1a0b4b] to-[#3a2b8b] text-white text-lg font-bold rounded-xl hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Authenticating...
                  </>
                ) : 'LOGIN'}
              </button>
            </form>

            <div className="mt-10 pt-6 border-t border-slate-100 text-center">
              <p className="text-slate-600">
                Don't have an account?{' '}
                <Link to="/signup" className="text-[#1a0b4b] font-bold hover:underline">
                  Sign up here
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center">
          <p className="text-xs text-slate-400">
            © 2025 Final International University. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
