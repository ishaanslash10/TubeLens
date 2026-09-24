"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, Play, Search, Video, NotebookPen, BrainCircuit, Network, BookOpen, Lightbulb, ChevronRight, Sparkles, Languages, CheckCircle2, MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { User } from "@supabase/supabase-js";
import { UserMenu } from "./user-menu";

export function LandingPage({ user }: { user?: User | null }) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnteringUrl, setIsEnteringUrl] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when URL entry is activated
  useEffect(() => {
    if (isEnteringUrl && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEnteringUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setIsLoading(true);
    const videoId = extractVideoId(url);
    if (videoId) {
      router.push(`/workspace/${videoId}`);
    } else {
      setIsLoading(false);
    }
  };

  const extractVideoId = (url: string) => {
    try {
      const parsed = new URL(url);
      if (parsed.hostname.includes("youtube.com")) return parsed.searchParams.get("v");
      if (parsed.hostname.includes("youtu.be")) return parsed.pathname.slice(1);
      return null;
    } catch {
      return null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col text-foreground font-sans overflow-x-hidden relative">

      {/* ══════════════════════════════════
          NAVBAR — floating glass bar
          ══════════════════════════════════ */}
      <header className="fixed top-0 left-0 right-0 h-14 z-50 px-5 lg:px-10 flex items-center justify-between border-b border-white/[0.04]" style={{ background: 'rgba(7, 11, 20, 0.6)', backdropFilter: 'blur(20px)' }}>
        <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-primary/90">
          <img src="/tubelens.png" alt="TubeLens Logo" className="h-5 w-auto object-contain opacity-80" />
          TubeLens
        </div>
        
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
          <Link href="#how-it-works" className="hover:text-slate-300 transition-colors motion-fluid duration-200 px-1 py-0.5">How it works</Link>
          <Link href="#features" className="hover:text-slate-300 transition-colors motion-fluid duration-200 px-1 py-0.5">Features</Link>
          <Link href="#learning" className="hover:text-slate-300 transition-colors motion-fluid duration-200 px-1 py-0.5">Learning</Link>
        </nav>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsEnteringUrl(true)}
            className="flex items-center gap-2 text-xs font-medium text-white px-4 py-2 rounded-lg transition-all motion-fluid duration-300 border border-electric/20 hover:border-electric/40 hover:shadow-blue-glow"
            style={{ background: 'rgba(59, 130, 246, 0.1)' }}
          >
            Start Learning
          </button>
          
          <div className="hidden sm:flex items-center pl-3 border-l border-white/[0.06] ml-1">
            <AnimatePresence mode="wait">
              {user ? (
                <motion.div
                  key="user-menu"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <UserMenu user={user} />
                </motion.div>
              ) : (
                <motion.div
                  key="login-link"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link href="/login" className="text-[11px] font-medium text-muted-foreground hover:text-slate-300 transition-colors motion-fluid duration-200 px-2 py-1">Sign In</Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full pt-14 relative z-10">
        
        {/* ══════════════════════════════════
            HERO SECTION
            ══════════════════════════════════ */}
        <section className="w-full px-5 lg:px-10 py-20 lg:py-28 max-w-[1400px] mx-auto flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="flex-1 space-y-7 max-w-xl relative z-20">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-electric mb-3 block glow-blue-subtle">
                AI-Powered Learning Workspace
              </span>
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.08]">
                FROM WATCHING <br/>
                <span className="text-slate-500 italic font-light">TO UNDERSTANDING</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-base text-slate-400 leading-relaxed text-pretty"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            >
              Transform YouTube videos into interactive learning experiences.
              Explore ideas, ask questions, take notes, and build deeper understanding in one structured workspace.
            </motion.p>

            <motion.div 
              className="pt-2 h-16"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {!isEnteringUrl ? (
                  <motion.div
                    key="cta-button"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <button
                      onClick={() => setIsEnteringUrl(true)}
                      className="group flex items-center gap-3 h-12 px-6 font-medium rounded-xl transition-all motion-fluid duration-300 border border-electric/20 hover:border-electric/40 text-white hover:shadow-blue-glow-lg text-sm"
                      style={{ background: 'rgba(59, 130, 246, 0.1)' }}
                    >
                      Start a learning session
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform motion-fluid" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="url-input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    onSubmit={handleSubmit}
                    className="relative flex items-center w-full max-w-lg glass-panel rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-electric/15 transition-all motion-fluid duration-300"
                  >
                    <div className="pl-4 text-muted-foreground">
                      <Video className="h-4 w-4 text-electric/50" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste any YouTube link here..."
                      className="w-full h-12 bg-transparent border-none pl-3 pr-24 text-sm focus:outline-none focus:ring-0 placeholder:text-muted-foreground/40 text-slate-200"
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
                      {url.trim() && (
                        <button
                          type="button"
                          onClick={() => setUrl("")}
                          className="p-2 text-muted-foreground hover:text-slate-300 rounded-lg transition-colors motion-fluid"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading || !url.trim()}
                        className="h-full px-4 text-sm font-medium rounded-lg transition-all motion-fluid duration-200 disabled:opacity-30 flex items-center justify-center min-w-[72px] border border-electric/20 hover:border-electric/40 text-white hover:shadow-blue-glow"
                        style={{ background: 'rgba(59, 130, 246, 0.15)' }}
                      >
                        {isLoading ? (
                          <div className="h-3.5 w-3.5 border-[1.5px] border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <ArrowRight className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <motion.div 
            className="flex-1 w-full lg:w-auto relative z-10"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          >
            {/* Hero Visual — UI mockup */}
            <div className="relative aspect-[4/3] lg:aspect-square max-h-[520px] w-full rounded-2xl glass-panel overflow-hidden flex flex-col p-3 gap-3 transition-all duration-700 hover:shadow-blue-glow-lg group">
              {/* Window chrome dots */}
              <div className="flex items-center gap-2 px-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
                <div className="h-1.5 w-1.5 rounded-full bg-white/10" />
              </div>
              
              <div className="flex-1 flex flex-col gap-3">
                {/* Video area */}
                <div className="w-full h-1/2 bg-black rounded-xl overflow-hidden relative cursor-pointer border border-white/[0.04]">
                  <img src="https://images.unsplash.com/photo-1633431305705-c243ec1663b3?w=800&q=80" alt="" className="object-cover w-full h-full opacity-50 group-hover:opacity-60 transition-opacity duration-700" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-10 w-10 rounded-full glass-panel flex items-center justify-center group-hover:shadow-blue-glow transition-all motion-fluid duration-300">
                      <Play className="h-4 w-4 text-white ml-0.5 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Split panels */}
                <div className="flex-1 flex gap-3 min-h-0">
                  <div className="flex-1 glass-surface rounded-xl p-3 flex flex-col gap-2 border border-white/[0.04]">
                    <div className="h-3 w-20 bg-white/[0.06] rounded" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 w-full bg-white/[0.04] rounded" />
                      <div className="h-2.5 w-4/5 bg-white/[0.04] rounded" />
                      <div className="h-2.5 w-5/6 bg-white/[0.04] rounded" />
                    </div>
                    <div className="mt-auto h-16 rounded-lg p-2.5 border border-electric/10" style={{ background: 'rgba(59, 130, 246, 0.04)' }}>
                      <div className="h-2.5 w-14 bg-electric/15 rounded mb-1.5" />
                      <div className="h-2 w-full bg-electric/10 rounded" />
                    </div>
                  </div>
                  
                  <div className="w-2/5 glass-surface rounded-xl flex flex-col overflow-hidden border border-white/[0.04]">
                    <div className="p-2.5 border-b border-white/[0.04] flex items-center gap-1.5" style={{ background: 'rgba(59, 130, 246, 0.03)' }}>
                      <Sparkles className="h-2.5 w-2.5 text-electric/50" />
                      <div className="h-2.5 w-12 bg-white/[0.06] rounded" />
                    </div>
                    <div className="p-2.5 space-y-2">
                      <div className="self-end h-5 w-3/4 bg-white/[0.06] rounded ml-auto" />
                      <div className="self-start h-10 w-5/6 glass-panel rounded p-2">
                        <div className="h-2 w-full bg-white/[0.08] rounded mb-1.5" />
                        <div className="h-2 w-2/3 bg-white/[0.08] rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ══════════════════════════════════
            PRODUCT STORY — 4-step flow
            ══════════════════════════════════ */}
        <section className="w-full relative py-20 z-10">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-14 text-center lg:text-left text-balance">
              WATCH. EXPLORE. <br className="hidden lg:block"/>
              QUESTION. <span className="text-electric glow-blue-subtle">UNDERSTAND.</span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { num: "01", title: "WATCH", desc: "View the original video in a clean, distraction-free environment.", icon: Play },
                { num: "02", title: "EXPLORE", desc: "Navigate concepts, read transcripts, and highlight key ideas.", icon: CompassIcon },
                { num: "03", title: "QUESTION", desc: "Ask the AI companion anything about the content at any moment.", icon: MessageSquare },
                { num: "04", title: "UNDERSTAND", desc: "Connect ideas and build lasting knowledge through active learning.", icon: BrainCircuit }
              ].map((step, i) => (
                <div key={i} className="flex flex-col gap-3 group cursor-pointer p-5 -m-5 rounded-2xl hover:bg-white/[0.02] transition-all motion-fluid duration-300">
                  <div className="text-[10px] font-mono text-muted-foreground">{step.num}</div>
                  <div className="h-10 w-10 rounded-xl glass-panel flex items-center justify-center mb-3 group-hover:shadow-blue-glow group-hover:border-electric/15 transition-all motion-fluid duration-300">
                    <step.icon className="h-4 w-4 text-slate-400 group-hover:text-electric transition-colors duration-300" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-primary">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            PRODUCT SHOWCASE — workspace
            ══════════════════════════════════ */}
        <section id="features" className="w-full py-20 lg:py-28 relative z-10">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-10 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-5">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-balance">
                Your video becomes a <span className="text-electric glow-blue-subtle">learning workspace.</span>
              </h2>
              <p className="text-base text-slate-400">
                TubeLens surrounds standard video playback with a suite of analytical tools. Transcript sync, instant concept lookup, and persistent notes make learning intentional.
              </p>
              <button 
                onClick={() => setIsEnteringUrl(true)}
                className="group flex items-center gap-2 text-sm font-medium text-electric-bright hover:text-white transition-colors motion-fluid duration-200 pt-2"
              >
                Explore the workspace <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform motion-fluid" />
              </button>
            </div>
            
            <div className="flex-[1.5] w-full">
              <div className="aspect-[16/10] glass-panel rounded-2xl transition-all duration-700 hover:shadow-blue-glow-lg flex flex-col p-2 overflow-hidden cursor-default">
                <div className="flex-1 flex gap-2">
                  <div className="flex-[2] glass-surface rounded-xl flex flex-col border border-white/[0.04]">
                    <div className="h-2/3 bg-black rounded-t-xl relative border-b border-white/[0.04]">
                      <div className="absolute bottom-2 left-2 right-2 h-0.5 bg-white/10 rounded">
                        <div className="h-full w-1/3 bg-electric/50 rounded" />
                      </div>
                    </div>
                    <div className="flex-1 p-3 flex gap-3">
                      <div className="w-1/2 space-y-1.5">
                        <div className="h-2.5 w-full bg-white/[0.06] rounded" />
                        <div className="h-2.5 w-4/5 bg-white/[0.06] rounded" />
                      </div>
                      <div className="w-1/2 rounded-lg p-2 border border-electric/10" style={{ background: 'rgba(59, 130, 246, 0.04)' }}>
                        <div className="h-2 w-10 bg-electric/15 rounded mb-1.5" />
                        <div className="h-1.5 w-full bg-electric/10 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-[1] glass-surface rounded-xl flex flex-col border border-white/[0.04]">
                    <div className="p-2.5 border-b border-white/[0.04] flex items-center justify-between" style={{ background: 'rgba(59, 130, 246, 0.02)' }}>
                      <div className="h-2.5 w-14 bg-white/[0.08] rounded" />
                      <div className="h-2.5 w-2.5 bg-white/[0.08] rounded-full" />
                    </div>
                    <div className="flex-1 p-2.5 space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex gap-1.5"><div className="w-5 h-2 bg-white/[0.08] rounded" /><div className="flex-1 h-2 bg-white/[0.04] rounded" /></div>
                        <div className="flex gap-1.5"><div className="w-5 h-2 bg-white/[0.08] rounded" /><div className="flex-1 h-2 bg-white/[0.04] rounded" /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            AI COMPANION showcase
            ══════════════════════════════════ */}
        <section className="w-full relative py-20 lg:py-28 border-y border-white/[0.04] z-10">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-10 flex flex-col lg:flex-row-reverse items-center gap-12 lg:gap-20">
            <div className="flex-1 space-y-5">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-balance">
                A thinking partner for <span className="text-electric glow-blue-subtle">every video.</span>
              </h2>
              <p className="text-base text-slate-400">
                Don't just read summaries. Question the content. Ask for explanations, challenge concepts, and connect ideas across domains.
              </p>
              
              <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {["Explain this simply", "Give me an example", "Connect this to history", "Challenge my understanding"].map((q, i) => (
                  <button key={i} className="group px-3.5 py-2.5 rounded-xl text-xs font-medium text-slate-400 flex items-center justify-between hover:text-slate-200 transition-all motion-fluid duration-200 cursor-pointer border border-white/[0.06] hover:border-electric/15 hover:bg-electric/[0.03]">
                    {q}
                    <ChevronRight className="h-3 w-3 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all motion-fluid" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full flex justify-center">
              <div className="w-full max-w-sm h-[440px] glass-panel rounded-2xl transition-all duration-700 hover:shadow-blue-glow-lg flex flex-col overflow-hidden">
                <div className="h-12 border-b border-white/[0.04] flex items-center px-4 gap-2" style={{ background: 'rgba(7, 11, 20, 0.4)' }}>
                  <BrainCircuit className="h-4 w-4 text-electric" />
                  <span className="font-medium text-xs text-slate-300">AI Companion</span>
                </div>
                <div className="flex-1 p-3.5 flex flex-col gap-3 overflow-hidden">
                  <div className="self-end p-2.5 rounded-2xl rounded-tr-md max-w-[80%] text-xs border border-electric/10 text-slate-300" style={{ background: 'rgba(59, 130, 246, 0.06)' }}>
                    Why is this concept important?
                  </div>
                  <div className="self-start glass-panel p-3 rounded-2xl rounded-tl-md max-w-[90%] text-xs text-slate-300">
                    <p className="mb-1.5">It matters because it forms the foundation of...</p>
                    <div className="h-2 w-3/4 bg-white/[0.06] rounded mt-1.5" />
                    <div className="h-2 w-5/6 bg-white/[0.06] rounded mt-1.5" />
                  </div>
                  <div className="self-end p-2.5 rounded-2xl rounded-tr-md max-w-[80%] text-xs mt-2 border border-electric/10 text-slate-300" style={{ background: 'rgba(59, 130, 246, 0.06)' }}>
                    Can you give a practical example?
                  </div>
                  <div className="self-start glass-panel p-3 rounded-2xl rounded-tl-md max-w-[90%] text-xs flex items-center gap-2 text-muted-foreground">
                    <div className="h-1.5 w-1.5 bg-electric rounded-full animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
                    Thinking...
                  </div>
                </div>
                <div className="p-3 border-t border-white/[0.04]" style={{ background: 'rgba(7, 11, 20, 0.3)' }}>
                  <div className="h-10 w-full glass-panel rounded-xl flex items-center px-3.5 cursor-text">
                    <div className="h-3 w-1/3 bg-white/[0.08] rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            NOTES + TRANSCRIPT showcase
            ══════════════════════════════════ */}
        <section className="w-full py-20 lg:py-28 relative z-10">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-10 space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-3">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">From watching to reading to <span className="text-electric glow-blue-subtle">thinking.</span></h2>
              <p className="text-slate-400 text-sm">Seamlessly transition between modalities to reinforce learning.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Notes */}
              <div className="glass-panel rounded-2xl p-7 lg:p-10 flex flex-col items-center transition-all duration-700 group cursor-default hover:shadow-blue-glow-lg">
                <div className="w-full max-w-xs rounded-xl border border-white/[0.06] p-4 space-y-3 group-hover:shadow-blue-glow transition-all motion-fluid duration-500" style={{ background: 'rgba(7, 11, 20, 0.5)' }}>
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                      <NotebookPen className="h-3 w-3" /> Notes
                    </div>
                    <CheckCircle2 className="h-3 w-3 text-emerald-400/60" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-xs text-slate-200">Key Insight: Architecture</h4>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      The separation of concerns allows for independent scaling. This is critical for...
                    </p>
                    <div className="flex gap-1.5 pt-1">
                      <span className="px-1.5 py-0.5 text-[10px] rounded border border-white/[0.06] text-slate-400" style={{ background: 'rgba(59, 130, 246, 0.06)' }}>#design</span>
                      <span className="px-1.5 py-0.5 text-[10px] rounded border border-white/[0.06] text-slate-400" style={{ background: 'rgba(59, 130, 246, 0.06)' }}>#scaling</span>
                    </div>
                  </div>
                </div>
                <h3 className="mt-8 text-lg font-bold text-primary">Structured Knowledge</h3>
                <p className="text-center text-muted-foreground mt-2 text-xs max-w-xs">Write notes alongside the video. They sync with timestamps automatically.</p>
              </div>

              {/* Transcript */}
              <div className="glass-panel rounded-2xl p-7 lg:p-10 flex flex-col items-center transition-all duration-700 group cursor-default hover:shadow-blue-glow-lg">
                <div className="w-full max-w-xs rounded-xl border border-white/[0.06] flex flex-col h-56 overflow-hidden group-hover:shadow-blue-glow transition-all motion-fluid duration-500" style={{ background: 'rgba(7, 11, 20, 0.5)' }}>
                   <div className="p-2.5 border-b border-white/[0.06] flex items-center gap-1.5 text-xs font-medium text-slate-400">
                     <Languages className="h-3 w-3" /> Transcript
                   </div>
                   <div className="flex-1 p-2.5 space-y-2.5">
                     <div className="flex gap-2.5 opacity-40">
                       <span className="text-[10px] font-mono text-muted-foreground pt-0.5 min-w-[36px]">12:04</span>
                       <p className="text-[11px] leading-relaxed text-slate-300">Before we move on to the next topic...</p>
                     </div>
                     <div className="flex gap-2.5 glass-panel-active rounded-lg p-2.5 -mx-1">
                       <span className="text-[10px] font-mono text-electric-bright pt-0.5 min-w-[36px] font-semibold glow-blue-subtle">12:15</span>
                       <p className="text-[11px] leading-relaxed font-medium text-slate-200">The most important concept here is the observer pattern.</p>
                     </div>
                     <div className="flex gap-2.5 opacity-40">
                       <span className="text-[10px] font-mono text-muted-foreground pt-0.5 min-w-[36px]">12:30</span>
                       <p className="text-[11px] leading-relaxed text-slate-300">It allows components to react to state changes without tight coupling.</p>
                     </div>
                   </div>
                </div>
                <h3 className="mt-8 text-lg font-bold text-primary">Interactive Reading</h3>
                <p className="text-center text-muted-foreground mt-2 text-xs max-w-xs">Search, highlight, and jump to exact moments in the video through the transcript.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            LEARNING TOOLS — Mind Map + Cards
            ══════════════════════════════════ */}
        <section id="learning" className="w-full py-20 lg:py-28 relative z-10 border-y border-white/[0.04]">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
            <div className="mb-12">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-3">Active Learning <span className="text-electric glow-blue-subtle">Tools</span></h2>
              <p className="text-base text-slate-400 max-w-xl">We built tools that force recall, test comprehension, and map concepts visually.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Mind Map — large card */}
              <div className="md:col-span-2 glass-panel rounded-2xl transition-all duration-700 hover:shadow-blue-glow-lg p-6 flex flex-col cursor-default">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2.5">
                    <Network className="h-5 w-5 text-electric" /> Concept Mapping
                  </h3>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded border border-white/[0.06] text-muted-foreground uppercase tracking-widest" style={{ background: 'rgba(59, 130, 246, 0.04)' }}>Visual</span>
                </div>
                <div className="flex-1 relative min-h-[260px] rounded-xl overflow-hidden flex items-center justify-center border border-white/[0.04]" style={{ background: 'rgba(7, 11, 20, 0.4)' }}>
                  <div className="relative w-full h-full max-w-md max-h-56 flex items-center justify-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-10 glass-panel-active text-white text-[10px] font-semibold flex items-center justify-center rounded-xl z-10 border-electric/15 shadow-blue-glow">CORE TOPIC</div>
                    
                    <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                      <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="currentColor" strokeWidth="1" className="text-electric/15" />
                      <line x1="50%" y1="50%" x2="75%" y2="30%" stroke="currentColor" strokeWidth="1" className="text-electric/15" />
                      <line x1="50%" y1="50%" x2="30%" y2="75%" stroke="currentColor" strokeWidth="1" className="text-electric/15" />
                      <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="currentColor" strokeWidth="1" className="text-electric/15" />
                    </svg>

                    <div className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-20 h-8 glass-panel text-[9px] font-medium flex items-center justify-center rounded-lg text-slate-300">Concept A</div>
                    <div className="absolute top-[30%] left-[75%] -translate-x-1/2 -translate-y-1/2 w-20 h-8 glass-panel text-[9px] font-medium flex items-center justify-center rounded-lg text-slate-300">Concept B</div>
                    <div className="absolute top-[75%] left-[30%] -translate-x-1/2 -translate-y-1/2 w-20 h-8 glass-panel text-[9px] font-medium flex items-center justify-center rounded-lg text-slate-300">Detail A.1</div>
                    <div className="absolute top-[80%] left-[80%] -translate-x-1/2 -translate-y-1/2 w-20 h-8 glass-panel text-[9px] font-medium flex items-center justify-center rounded-lg text-slate-300">Example</div>
                  </div>
                </div>
              </div>

              {/* Flashcards + Quiz */}
              <div className="flex flex-col gap-4">
                <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col justify-between transition-all duration-700 hover:shadow-blue-glow-lg cursor-pointer group">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-1.5 text-primary">
                      <BookOpen className="h-4 w-4 opacity-70" /> Flashcards
                    </h3>
                    <p className="text-xs text-muted-foreground">AI-generated spaced repetition cards for long-term retention.</p>
                  </div>
                  <div className="w-full aspect-[3/2] rounded-xl mt-4 p-3.5 flex flex-col items-center justify-center text-center group-hover:shadow-blue-glow transition-all duration-500 border border-white/[0.04]" style={{ background: 'rgba(7, 11, 20, 0.4)' }}>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground mb-1.5">Front</span>
                    <p className="font-medium text-xs text-slate-200">What is the primary advantage of the observer pattern?</p>
                  </div>
                </div>
                
                <div className="flex-1 glass-panel rounded-2xl p-6 flex flex-col justify-between transition-all duration-700 hover:shadow-blue-glow-lg cursor-pointer group">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-1.5 text-primary">
                      <Lightbulb className="h-4 w-4 text-electric" /> Quizzes
                    </h3>
                    <p className="text-xs text-muted-foreground">Test your comprehension immediately after watching.</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-9 w-full rounded-xl flex items-center px-3.5 gap-2.5 border border-white/[0.06]" style={{ background: 'rgba(7, 11, 20, 0.3)' }}><div className="h-3.5 w-3.5 rounded-full border border-white/[0.1]" /><div className="h-2 w-1/2 bg-white/[0.08] rounded" /></div>
                    <div className="h-9 w-full glass-panel-active rounded-xl flex items-center px-3.5 gap-2.5 border-electric/15"><div className="h-3.5 w-3.5 rounded-full bg-electric flex items-center justify-center shadow-[0_0_8px_rgba(59,130,246,0.4)]"><div className="h-1.5 w-1.5 bg-white rounded-full" /></div><div className="h-2 w-2/3 bg-white/[0.15] rounded" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            HOW IT WORKS — process steps
            ══════════════════════════════════ */}
        <section id="how-it-works" className="w-full py-20 lg:py-28 relative z-10">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-14 text-center">The TubeLens <span className="text-electric glow-blue-subtle">Process</span></h2>
            
            <div className="flex flex-col lg:flex-row justify-between relative">
              {/* Connecting line */}
              <div className="hidden lg:block absolute top-5 left-10 right-10 h-px bg-gradient-to-r from-electric/10 via-electric/20 to-electric/10" />
              
              {[
                { step: "01", title: "Import", desc: "Paste any YouTube link." },
                { step: "02", title: "Analyze", desc: "TubeLens processes transcript and structure." },
                { step: "03", title: "Explore", desc: "Read, watch, and search simultaneously." },
                { step: "04", title: "Interact", desc: "Ask questions and take notes." },
                { step: "05", title: "Retain", desc: "Review with generated tools." }
              ].map((item, i) => (
                <div key={i} className="group flex flex-row lg:flex-col gap-3 lg:gap-4 relative z-10 mb-6 lg:mb-0 w-full lg:w-40 cursor-default">
                  <div className="shrink-0 h-10 w-10 rounded-xl glass-panel text-slate-300 font-semibold flex items-center justify-center text-sm group-hover:shadow-blue-glow group-hover:border-electric/15 transition-all motion-fluid duration-300">
                    {item.step}
                  </div>
                  <div className="transition-all motion-fluid duration-300 group-hover:translate-x-1 lg:group-hover:translate-x-0">
                    <h4 className="font-semibold text-base mb-0.5 text-primary">{item.title}</h4>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════
            VALUE PROPS
            ══════════════════════════════════ */}
        <section className="w-full relative py-20 lg:py-28 z-10">
          <div className="max-w-[1400px] mx-auto px-5 lg:px-10 grid grid-cols-1 md:grid-cols-3 gap-5 text-center md:text-left">
            {[
              { title: "Understand More", desc: "Spend less time passively watching content wash over you. Extract the structural ideas instantly." },
              { title: "Think Deeper", desc: "Ask questions while the context is still present. Never let a confusing concept block your progress." },
              { title: "Remember Better", desc: "Turn ephemeral video content into persistent, structured active learning material." }
            ].map((v, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl hover:shadow-blue-glow-lg transition-all duration-700 cursor-default group">
                <h3 className="text-xl font-bold mb-3 text-primary group-hover:glow-blue-subtle transition-all duration-500">{v.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════
            FINAL CTA
            ══════════════════════════════════ */}
        <section className="w-full py-28 lg:py-40 flex items-center justify-center relative z-10">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
          <div className="max-w-2xl px-5 text-center space-y-6 relative z-20">
            <h2 className="text-4xl lg:text-6xl font-bold tracking-tight text-balance">
              Stop just watching.<br/>
              <span className="text-electric glow-blue">Start understanding.</span>
            </h2>
            <p className="text-base text-slate-400">
              Create your intelligent workspace today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => setIsEnteringUrl(true), 500);
                }}
                className="h-11 px-6 font-medium rounded-xl flex items-center justify-center transition-all motion-fluid duration-300 w-full sm:w-auto text-white text-sm border border-electric/25 hover:border-electric/40 hover:shadow-blue-glow-lg"
                style={{ background: 'rgba(59, 130, 246, 0.12)' }}
              >
                Start Learning Free
              </button>
              <Link href="#how-it-works" className="h-11 px-6 glass-panel text-slate-300 hover:text-white font-medium rounded-xl flex items-center justify-center hover:bg-white/[0.03] transition-all motion-fluid duration-300 w-full sm:w-auto text-sm">
                Explore TubeLens
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ══════════════════════════════════
          FOOTER
          ══════════════════════════════════ */}
      <footer className="w-full border-t border-white/[0.04] bg-background pt-16 pb-8 relative z-10">
        <div className="max-w-[1400px] mx-auto px-5 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 lg:gap-6 mb-12">
            <div className="lg:col-span-1 space-y-3">
              <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-primary/90">
                <img src="/tubelens.png" alt="TubeLens Logo" className="h-5 w-auto object-contain opacity-80" />
                TubeLens
              </div>
              <p className="text-xs text-muted-foreground text-balance leading-relaxed">
                From Watching to Understanding.<br/>
                An AI-powered learning workspace.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:col-span-3">
              <div className="space-y-3">
                <h4 className="font-semibold text-[10px] uppercase tracking-widest text-slate-400">Product</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li><Link href="#features" className="hover:text-slate-300 transition-colors">Features</Link></li>
                  <li><Link href="#learning" className="hover:text-slate-300 transition-colors">Learning Tools</Link></li>
                  <li><Link href="#how-it-works" className="hover:text-slate-300 transition-colors">How it works</Link></li>
                </ul>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-[10px] uppercase tracking-widest text-slate-400">Resources</h4>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Documentation</Link></li>
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">About</Link></li>
                  <li><Link href="#" className="hover:text-slate-300 transition-colors">Contact</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/[0.04] pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <p>© {new Date().getFullYear()} TubeLens.</p>
            <div className="flex items-center gap-5">
              <Link href="#" className="hover:text-slate-300 transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-slate-300 transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Helper icon component
function CompassIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
    </svg>
  );
}
