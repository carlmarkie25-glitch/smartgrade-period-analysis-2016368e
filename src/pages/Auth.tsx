import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, Lock, LogIn, Mail } from "lucide-react";
import logo from "@/assets/logo.png";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            user_id: data.user.id,
            full_name: fullName,
            email: email,
          });

        if (profileError) throw profileError;

        toast({
          title: "Account created!",
          description: "Please wait for an administrator to assign your role before signing in.",
        });

        setEmail("");
        setPassword("");
        setFullName("");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans text-[#001540] bg-[#001540] min-h-screen flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#D4AF37]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#002366]/30 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="w-full max-w-5xl bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[3rem] overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10 shadow-2xl">
        {/* Brand Side */}
        <div className="md:w-1/2 bg-[#002366] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 z-0 opacity-20">
            <img src="/glassbackground.png" alt="Campus" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-[#001540] to-[#002366] opacity-90 z-0"></div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-10 hover:text-[#D4AF37] transition-colors font-medium">
              <ArrowLeft className="w-4 h-4" /> Back to Website
            </Link>
          </div>
          
          <div className="relative z-10 my-8 md:my-0">
            <h1 className="font-serif text-4xl md:text-5xl mb-6 leading-tight">Welcome to the Academy Portal</h1>
            <p className="text-white/60 text-lg leading-relaxed">Access your personalized learning environment, grades, and faculty resources.</p>
          </div>
          
          <div className="relative z-10 flex items-center gap-4 mt-8 md:mt-0">
            <div className="w-12 h-12 bg-[#D4AF37] p-2 rounded-xl flex items-center justify-center">
              <img src="/IMG_E0751.JPG" alt="Logo" className="h-full w-full object-contain mix-blend-multiply" />
            </div>
            <div>
              <span className="block font-bold">GLA Portal</span>
              <span className="text-white/40 text-sm italic">Excellence through Innovation</span>
            </div>
          </div>
        </div>

        {/* Login Side */}
        <div className="md:w-1/2 p-8 md:p-12 lg:p-20 flex flex-col justify-center bg-white/5 backdrop-blur-md">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-3xl font-serif mb-2 text-white">Secure Login</h2>
            <p className="text-white/40 mb-8 text-sm">Please enter your institutional credentials.</p>
            
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/5 border border-white/10 rounded-xl p-1">
                <TabsTrigger value="signin" className="rounded-lg  ">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg  ">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-0">
                <form onSubmit={handleSignIn} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 pl-12 text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-white/20" 
                        placeholder="your.email@example.com" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input 
                        type="password" 
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 pl-12 text-white focus:border-[#D4AF37] outline-none transition-all" 
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer">
                      <input type="checkbox" className="w-4 h-4 rounded border-slate-200 text-[#D4AF37] focus:ring-[#D4AF37]" />
                      Remember me
                    </label>
                    <a href="#" className="text-sm font-bold text-[#002366] hover:text-[#D4AF37] transition-colors">Forgot Password?</a>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#002366] text-white p-4 rounded-2xl font-bold hover:bg-[#D4AF37] hover:text-[#001540] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Authenticating..." : "Enter Portal"} <LogIn className="w-5 h-5" />
                  </button>
                  
                  <div className="pt-8 border-t border-slate-100 text-center">
                    <p className="text-sm text-slate-500 mb-2">Are you a prospective student?</p>
                    <Link to="/#admissions" className="text-[#D4AF37] font-bold hover:underline">Apply for Admission</Link>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <form onSubmit={handleSignUp} className="space-y-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input 
                        type="text" 
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 pl-12 text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-white/20" 
                        placeholder="John Doe" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input 
                        type="email" 
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 pl-12 text-white focus:border-[#D4AF37] outline-none transition-all placeholder:text-white/20" 
                        placeholder="your.email@example.com" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                      <input 
                        type="password" 
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border-2 border-white/10 rounded-2xl p-4 pl-12 text-white focus:border-[#D4AF37] outline-none transition-all" 
                        placeholder="••••••••" 
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-[#002366] text-white p-4 rounded-2xl font-bold hover:bg-[#D4AF37] hover:text-[#001540] transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? "Creating account..." : "Create Account"} <User className="w-5 h-5" />
                  </button>
                  <p className="text-xs text-slate-500 text-center mt-2">
                    After signing up, an administrator will assign your role.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
