import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { sanitizeError } from "@/lib/errors";
import { motion } from "framer-motion";
import { Mail, Lock, Loader2, Eye, EyeOff, User, Phone } from "lucide-react";
import { Helmet } from "react-helmet-async";
import logo from "@/assets/logo-optimized.webp";
import { lovable } from "@/integrations/lovable/index";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Preserve a same-origin ?next= redirect (used by the OAuth consent route).
  const rawNext = searchParams.get("next");
  const nextPath = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : null;
  const postAuthTarget = nextPath ?? "/";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if ((event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') && session?.user) {
          if (nextPath) window.location.href = nextPath;
          else navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn("Session expired, clearing stale session");
        supabase.auth.signOut();
        return;
      }
      if (session?.user) {
        if (nextPath) window.location.href = nextPath;
        else navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, nextPath]);

  const validateForm = () => {
    if (!isLogin && !fullName.trim()) {
      toast({ title: "Error", description: "Please enter your name", variant: "destructive" });
      return false;
    }
    if (!isLogin && !phone.trim()) {
      toast({ title: "Error", description: "Please enter your phone number", variant: "destructive" });
      return false;
    }
    if (!isLogin && phone.trim().length > 20) {
      toast({ title: "Error", description: "Phone number is too long", variant: "destructive" });
      return false;
    }
    if (!email.trim()) {
      toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Error", description: "Please enter a valid email", variant: "destructive" });
      return false;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You have successfully logged in." });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: fullName.trim(), phone: phone.trim() },
          }
        });
        if (error) throw error;
        toast({ title: "Account created!", description: "You have successfully signed up." });
      }
    } catch (error: any) {
      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
      <Helmet>
        <title>Sign In — Amruta Hydrogeo Services</title>
        <meta name="description" content="Sign in or create an account to access Amruta Hydrogeo Services." />
        <link rel="canonical" href="https://www.amrutageotech.com/auth" />
        <meta property="og:title" content="Sign In — Amruta Hydrogeo Services" />
        <meta property="og:description" content="Sign in or create an account to access Amruta Hydrogeo Services." />
        <meta property="og:url" content="https://www.amrutageotech.com/auth" />
        <meta name="robots" content="noindex" />
      </Helmet>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-primary/20">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <img src={logo} alt="Amruta Logo" className="w-16 h-16 rounded-full bg-primary p-1" />
            </div>
            <CardTitle className="text-2xl font-serif text-primary">
              {forgotMode ? "Reset Password" : isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {forgotMode
                ? "Enter your email and we'll send you a reset link"
                : isLogin
                  ? "Enter your credentials to access your account"
                  : "Sign up to get started with Amruta Water Solutions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {forgotMode ? (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!email.trim()) {
                  toast({ title: "Error", description: "Please enter your email", variant: "destructive" });
                  return;
                }
                setResetLoading(true);
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth`,
                  });
                  if (error) throw error;
                  toast({ title: "Email sent!", description: "Check your inbox for the password reset link." });
                  setForgotMode(false);
                } catch (error: any) {
                  toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
                } finally {
                  setResetLoading(false);
                }
              }} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={resetLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={resetLoading}>
                  {resetLoading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : "Send Reset Link"}
                </Button>
                <div className="text-center">
                  <button type="button" onClick={() => setForgotMode(false)} className="text-sm text-primary hover:underline">
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            ) : (
              <>
                <form onSubmit={handleAuth} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="text"
                          placeholder="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10"
                          disabled={loading}
                          maxLength={100}
                        />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          type="tel"
                          placeholder="Phone Number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10"
                          disabled={loading}
                          maxLength={20}
                        />
                      </div>
                    </>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {isLogin && (
                    <div className="text-right">
                      <button type="button" onClick={() => setForgotMode(true)} className="text-sm text-primary hover:underline">
                        Forgot password?
                      </button>
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isLogin ? "Signing in..." : "Creating account..."}
                      </>
                    ) : (
                      isLogin ? "Sign In" : "Sign Up"
                    )}
                  </Button>
                </form>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true);
                    try {
                      const { error } = await lovable.auth.signInWithOAuth("google", {
                        redirect_uri: window.location.origin,
                      });
                      if (error) throw error;
                    } catch (error: any) {
                      toast({ title: "Error", description: sanitizeError(error), variant: "destructive" });
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Sign in with Google
                </Button>
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-sm text-primary hover:underline"
                  >
                    {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                  </button>
                </div>
                <div className="mt-4 text-center">
                  <a href="/" className="text-sm text-muted-foreground hover:text-primary">
                    ← Back to Home
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
