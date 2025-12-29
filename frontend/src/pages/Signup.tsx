import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { apiRequest, getPublicFaculties } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [faculty, setFaculty] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [facultiesList, setFacultiesList] = useState<{ id: number; name: string }[]>([]);

  // Fetch faculties on mount
  React.useEffect(() => {
    const loadFaculties = async () => {
      try {
        const data = await getPublicFaculties();
        setFacultiesList(data);
      } catch (err) {
        console.error('Failed to load faculties:', err);
      }
    };
    loadFaculties();
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: firstName,
        surname: surname,
        faculty_id: parseInt(faculty, 10), // Faculty selector now returns ID as string
        email: email,
        password: password,
        role_id: 3, // Default researcher role
      };

      const data = await apiRequest<{ token: string; user: any }>(
        "/api/auth/signup",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      console.log("Signup success:", data);

      // Store token
      localStorage.setItem("token", data.token);
      localStorage.setItem("userProfile", JSON.stringify(data.user));

      toast({
        title: "Success",
        description: "Account created successfully",
      });

      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Signup failed",
        description: err.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative w-full overflow-hidden bg-slate-50 flex items-center justify-center p-4">
      {/* --- Background Shapes for Glassmorphism --- */}

      {/* Top Left Blob - Soft Blue/Purple */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-200/40 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '8s' }} />

      {/* Bottom Right Blob - Soft Gold/Orange */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-100/60 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '10s' }} />

      {/* Center/Random Blob - Very subtle */}
      <div className="absolute top-[40%] right-[30%] w-[300px] h-[300px] bg-pink-100/30 rounded-full blur-[80px]" />

      {/* Back to Home - Absolute Top Left */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      {/* --- Glass Card --- */}
      <div className="relative z-10 w-full max-w-2xl">
        <div className="bg-white/60 backdrop-blur-xl border border-white/60 shadow-2xl rounded-2xl p-8 md:p-12">

          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-8">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/add812aefd9d169f2f4caedfddba8f4a03e99dbb?placeholderIfAbsent=true"
              alt="Final International University Logo"
              className="w-40 h-auto mb-6"
            />
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Create Account</h1>
            <p className="text-slate-500 mt-2 text-center">
              Join the Final International University Ethics Committee
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-700 font-medium">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="bg-white/50 border-white/50 focus:bg-white transition-all h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="surname" className="text-slate-700 font-medium">Surname</Label>
                <Input
                  id="surname"
                  type="text"
                  placeholder="Doe"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  required
                  className="bg-white/50 border-white/50 focus:bg-white transition-all h-11"
                />
              </div>
            </div>

            {/* Faculty Selection */}
            <div className="space-y-2">
              <Label htmlFor="faculty" className="text-slate-700 font-medium">Faculty</Label>
              <Select value={faculty} onValueChange={setFaculty} required>
                <SelectTrigger id="faculty" className="bg-white/50 border-white/50 focus:bg-white transition-all h-11">
                  <SelectValue placeholder={facultiesList.length === 0 ? "Loading..." : "Select your faculty"} />
                </SelectTrigger>
                <SelectContent>
                  {facultiesList.length === 0 ? (
                    <div className="p-2 text-sm text-slate-500 text-center">Loading faculties...</div>
                  ) : (
                    facultiesList.map((fac) => (
                      <SelectItem key={fac.id} value={String(fac.id)}>
                        {fac.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.name@fiu.edu.tr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/50 border-white/50 focus:bg-white transition-all h-11"
              />
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-white/50 border-white/50 focus:bg-white transition-all h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-700 font-medium">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-white/50 border-white/50 focus:bg-white transition-all h-11"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 mt-2"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          {/* Footer / Login Link */}
          <div className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-600 font-semibold hover:text-indigo-700 hover:underline transition-colors"
            >
              Log in
            </button>
          </div>
        </div>

        {/* Terms text below card */}
        <p className="text-center text-xs text-slate-400 mt-6">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Signup;