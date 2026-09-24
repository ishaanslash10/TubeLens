"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { login, signup, saveUsername } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/client";

export function LoginFlow({ next, initialError, initialSetup }: { next: string; initialError?: string; initialSetup?: boolean }) {
  const [view, setView] = useState<'login' | 'setup'>(initialSetup ? 'setup' : 'login');
  const [error, setError] = useState(initialError || "");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (action: 'login' | 'signup', formData: FormData) => {
    setIsLoading(true);
    setError("");
    
    const result = action === 'login' ? await login(formData) : await signup(formData);
    
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else if (result.success) {
      if (result.needsUsername) {
        setView('setup');
        setIsLoading(false);
      } else {
        router.push(next);
        router.refresh();
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError("");
    const supabase = createClient();
    
    // Determine the origin for the redirect
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      }
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    }
    // Note: successful OAuth redirects the browser, so we don't clear isLoading
  };

  const handleSaveUsername = async (formData: FormData) => {
    setIsLoading(true);
    setError("");
    
    const result = await saveUsername(formData);
    
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push(next);
      router.refresh();
    }
  };

  return (
    <div className="w-full max-w-sm space-y-8 relative z-10">
      <AnimatePresence mode="wait">
        {view === 'login' ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="space-y-2 text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-balance text-primary">
                Welcome to your workspace.
              </h1>
              <p className="text-muted-foreground text-xs">
                Sign in to continue to TubeLens
              </p>
            </div>

            <form action={(f) => handleAuth('login', f)} className="space-y-4 glass-panel p-6 rounded-2xl">
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric/20 focus:border-electric/15 transition-all motion-fluid duration-200 border border-white/[0.06] placeholder:text-muted-foreground/40"
                  style={{ background: 'rgba(7, 11, 20, 0.5)' }}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric/20 focus:border-electric/15 transition-all motion-fluid duration-200 border border-white/[0.06] placeholder:text-muted-foreground/40"
                  style={{ background: 'rgba(7, 11, 20, 0.5)' }}
                />
              </div>

              {error && (
                <div className="text-red-400 text-xs p-3 rounded-xl text-center font-medium border border-red-500/10" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                  {error}
                </div>
              )}

              <div className="pt-2 space-y-2.5 flex flex-col">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 items-center justify-center rounded-xl text-sm font-medium text-white transition-all motion-fluid duration-300 border border-electric/25 hover:border-electric/40 hover:shadow-blue-glow disabled:opacity-50"
                  style={{ background: 'rgba(59, 130, 246, 0.12)' }}
                >
                  {isLoading ? "Please wait..." : "Sign In"}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.preventDefault();
                    const form = e.currentTarget.form;
                    if (form) handleAuth('signup', new FormData(form));
                  }}
                  className="w-full h-10 items-center justify-center rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 transition-all motion-fluid duration-300 border border-white/[0.06] hover:border-white/[0.1] hover:bg-white/[0.03] disabled:opacity-50"
                >
                  Create Account
                </button>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-white/[0.06]"></div>
                <span className="flex-shrink-0 mx-4 text-[10px] uppercase tracking-widest text-slate-500 font-medium">or</span>
                <div className="flex-grow border-t border-white/[0.06]"></div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-sm font-medium text-slate-200 transition-all motion-fluid duration-300 border border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.03] focus:outline-none disabled:opacity-50"
                style={{ background: 'rgba(7, 11, 20, 0.4)' }}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="setup"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="space-y-2 text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-balance text-primary">
                Choose your username.
              </h1>
              <p className="text-muted-foreground text-xs">
                This is how you'll appear across TubeLens.
              </p>
            </div>

            <form action={handleSaveUsername} className="space-y-4 glass-panel p-6 rounded-2xl">
              <div className="space-y-1.5">
                <input
                  type="text"
                  name="username"
                  required
                  placeholder="e.g. alexander"
                  className="w-full rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-electric/20 focus:border-electric/15 transition-all motion-fluid duration-200 border border-white/[0.06] placeholder:text-muted-foreground/40"
                  style={{ background: 'rgba(7, 11, 20, 0.5)' }}
                />
              </div>

              {error && (
                <div className="text-red-400 text-xs p-3 rounded-xl text-center font-medium border border-red-500/10" style={{ background: 'rgba(239, 68, 68, 0.05)' }}>
                  {error}
                </div>
              )}

              <div className="pt-2 flex flex-col">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-10 items-center justify-center rounded-xl text-sm font-medium text-white transition-all motion-fluid duration-300 border border-electric/25 hover:border-electric/40 hover:shadow-blue-glow disabled:opacity-50"
                  style={{ background: 'rgba(59, 130, 246, 0.12)' }}
                >
                  {isLoading ? "Saving..." : "Continue →"}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
