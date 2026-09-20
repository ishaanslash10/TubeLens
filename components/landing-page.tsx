"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowRight, Play, Search, Video, NotebookPen, BrainCircuit, Network, BookOpen, Lightbulb, ChevronRight, Sparkles, Languages, CheckCircle2, MessageSquare, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function LandingPage() {
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
    <div className="flex min-h-screen flex-col bg-background text-foreground font-sans selection:bg-accent/20 selection:text-primary overflow-x-hidden">
      
      {/* 1. NAVBAR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-50 px-6 lg:px-12 flex items-center justify-between transition-all">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary">
          <div className="h-6 w-6 bg-primary text-background rounded flex items-center justify-center">
            <Play className="h-3 w-3 ml-0.5 fill-current" />
          </div>
          TubeLens
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link href="#how-it-works" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm px-1 py-0.5">How it works</Link>
          <Link href="#features" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm px-1 py-0.5">Features</Link>
          <Link href="#learning" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm px-1 py-0.5">Learning</Link>
        </nav>

        <div className="flex items-center">
          <button 
            onClick={() => setIsEnteringUrl(true)}
            className="flex items-center gap-2 text-sm font-medium text-background bg-primary hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:translate-y-0 transition-all px-4 py-2 rounded shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            Start Learning
          </button>
          <div className="hidden sm:block pl-4 border-l border-border ml-4"><Link href="/login" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm px-2 py-1">Sign In</Link></div>
        </div>
      </header>

      <main className="flex-1 w-full pt-16">
        
        {/* 2. HERO SECTION */}
        <section className="w-full px-6 lg:px-12 py-20 lg:py-32 max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <div className="flex-1 space-y-8 max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <span className="text-xs font-bold uppercase tracking-widest text-accent mb-4 block">
                AI-Powered Learning Workspace
              </span>
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.05]">
                FROM WATCHING <br/>
                <span className="text-muted-foreground italic font-light">TO UNDERSTANDING</span>
              </h1>
            </motion.div>
            
            <motion.p 
              className="text-lg text-muted-foreground leading-relaxed text-pretty"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            >
              Transform YouTube videos into interactive learning experiences.
              Explore ideas, ask questions, take notes, and build deeper understanding in one structured workspace.
            </motion.p>

            <motion.div 
              className="pt-4 h-20" // Fixed height to prevent layout shift during transition
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {!isEnteringUrl ? (
                  <motion.div
                    key="cta-button"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <button
                      onClick={() => setIsEnteringUrl(true)}
                      className="group flex items-center gap-3 h-14 px-8 bg-primary text-background font-medium rounded-lg shadow-editorial hover:shadow-editorial-hover hover:-translate-y-0.5 active:translate-y-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      Start a learning session
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="url-input"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSubmit}
                    className="relative flex items-center w-full max-w-lg bg-background border border-border shadow-editorial rounded-lg overflow-hidden group focus-within:ring-2 focus-within:ring-accent focus-within:border-accent transition-all"
                  >
                    <div className="pl-4 text-muted-foreground">
                      <Video className="h-5 w-5" />
                    </div>
                    <input
                      ref={inputRef}
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste any YouTube link here..."
                      className="w-full h-14 bg-transparent border-none pl-3 pr-24 text-sm focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60"
                    />
                    <div className="absolute right-1 top-1 bottom-1 flex items-center gap-1">
                      {url.trim() && (
                        <button
                          type="button"
                          onClick={() => setUrl("")}
                          className="p-2 text-muted-foreground hover:text-primary hover:bg-secondary rounded-md transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isLoading || !url.trim()}
                        className="h-full px-4 bg-primary text-background text-sm font-medium rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                      >
                        {isLoading ? (
                          <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                        ) : (
                          <ArrowRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <motion.div 
            className="flex-1 w-full lg:w-auto relative"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3 }}
          >
            {/* Hero Visual Composition */}
            <div className="relative aspect-[4/3] lg:aspect-square max-h-[600px] w-full rounded-xl border border-border bg-secondary/30 shadow-editorial overflow-hidden flex flex-col p-4 gap-4 transition-all hover:shadow-editorial-hover">
              {/* Fake UI Header */}
              <div className="flex items-center gap-3 px-2">
                <div className="h-2 w-2 rounded-full bg-border" />
                <div className="h-2 w-2 rounded-full bg-border" />
                <div className="h-2 w-2 rounded-full bg-border" />
              </div>
              
              <div className="flex-1 flex flex-col gap-4">
                {/* Video Area */}
                <div className="w-full h-1/2 bg-black rounded-lg overflow-hidden relative group cursor-pointer">
                  <img src="https://images.unsplash.com/photo-1633431305705-c243ec1663b3?w=800&q=80" alt="Video placeholder" className="object-cover w-full h-full opacity-60 group-hover:opacity-70 transition-opacity" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform shadow-sm">
                      <Play className="h-5 w-5 text-white ml-1 fill-current" />
                    </div>
                  </div>
                </div>

                {/* Split Panels */}
                <div className="flex-1 flex gap-4 min-h-0">
                  <div className="flex-1 bg-background rounded-lg border border-border shadow-sm p-4 flex flex-col gap-3 group hover:border-border/80 transition-colors">
                    <div className="h-4 w-24 bg-secondary rounded" />
                    <div className="space-y-2">
                      <div className="h-3 w-full bg-secondary rounded" />
                      <div className="h-3 w-4/5 bg-secondary rounded" />
                      <div className="h-3 w-5/6 bg-secondary rounded" />
                    </div>
                    <div className="mt-auto h-20 bg-accent/5 rounded-md border border-accent/10 p-3">
                      <div className="h-3 w-16 bg-accent/20 rounded mb-2" />
                      <div className="h-2 w-full bg-accent/10 rounded" />
                    </div>
                  </div>
                  
                  <div className="w-2/5 bg-background rounded-lg border border-border shadow-sm flex flex-col relative overflow-hidden group hover:border-border/80 transition-colors">
                    <div className="p-3 border-b border-border bg-secondary/20 flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-accent" />
                      <div className="h-3 w-16 bg-border rounded" />
                    </div>
                    <div className="p-3 space-y-3">
                      <div className="self-end h-6 w-3/4 bg-secondary rounded-md ml-auto" />
                      <div className="self-start h-12 w-5/6 bg-accent rounded-md text-white p-2">
                        <div className="h-2 w-full bg-white/30 rounded mb-2" />
                        <div className="h-2 w-2/3 bg-white/30 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. SECTION 2: PRODUCT STORY */}
        <section className="w-full bg-primary text-background py-24">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-16 text-center lg:text-left text-balance">
              WATCH. EXPLORE. <br className="hidden lg:block"/>
              QUESTION. UNDERSTAND.
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { num: "01", title: "WATCH", desc: "View the original video in a clean, distraction-free environment.", icon: Play },
                { num: "02", title: "EXPLORE", desc: "Navigate concepts, read transcripts, and highlight key ideas.", icon: CompassIcon },
                { num: "03", title: "QUESTION", desc: "Ask the AI companion anything about the content at any moment.", icon: MessageSquare },
                { num: "04", title: "UNDERSTAND", desc: "Connect ideas and build lasting knowledge through active learning.", icon: BrainCircuit }
              ].map((step, i) => (
                <div key={i} className="flex flex-col gap-4 group cursor-pointer p-6 -m-6 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="text-xs font-mono text-muted-foreground">{step.num}</div>
                  <div className="h-12 w-12 rounded bg-white/10 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white group-hover:scale-105 group-active:scale-95 transition-all shadow-sm">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. SECTION 3: PRODUCT SHOWCASE */}
        <section id="features" className="w-full py-24 lg:py-32">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-balance">
                Your video becomes a learning workspace.
              </h2>
              <p className="text-lg text-muted-foreground">
                TubeLens surrounds standard video playback with a suite of analytical tools. Transcript sync, instant concept lookup, and persistent notes make learning intentional.
              </p>
              <button 
                onClick={() => setIsEnteringUrl(true)}
                className="group flex items-center gap-2 text-sm font-semibold text-primary hover:text-accent transition-colors pt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm"
              >
                Explore the workspace <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="flex-[1.5] w-full">
              <div className="aspect-[16/10] bg-secondary/30 rounded-xl border border-border shadow-editorial hover:shadow-editorial-hover transition-shadow duration-500 flex flex-col p-2 overflow-hidden relative cursor-default">
                {/* Simulated UI */}
                <div className="flex-1 flex gap-2">
                  <div className="flex-[2] bg-background rounded-md border border-border shadow-sm flex flex-col hover:border-border/80 transition-colors">
                    <div className="h-2/3 bg-black rounded-t-md relative">
                      <div className="absolute bottom-2 left-2 right-2 h-1 bg-white/20 rounded">
                        <div className="h-full w-1/3 bg-accent rounded" />
                      </div>
                    </div>
                    <div className="flex-1 p-4 flex gap-4">
                      <div className="w-1/2 space-y-2">
                        <div className="h-3 w-full bg-secondary rounded" />
                        <div className="h-3 w-4/5 bg-secondary rounded" />
                      </div>
                      <div className="w-1/2 bg-accent/5 rounded border border-accent/10 p-2">
                        <div className="h-2 w-12 bg-accent/30 rounded mb-2" />
                        <div className="h-2 w-full bg-accent/20 rounded" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-[1] bg-background rounded-md border border-border shadow-sm flex flex-col hover:border-border/80 transition-colors">
                    <div className="p-3 border-b border-border flex items-center justify-between">
                      <div className="h-3 w-16 bg-secondary rounded" />
                      <div className="h-3 w-3 bg-secondary rounded-full" />
                    </div>
                    <div className="flex-1 p-3 space-y-4">
                      <div className="space-y-2">
                        <div className="flex gap-2"><div className="w-6 h-2 bg-primary/20 rounded" /><div className="flex-1 h-2 bg-secondary rounded" /></div>
                        <div className="flex gap-2"><div className="w-6 h-2 bg-primary/20 rounded" /><div className="flex-1 h-2 bg-secondary rounded" /></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. SECTION 4: AI COMPANION */}
        <section className="w-full bg-[#FAFAFA] py-24 lg:py-32 border-y border-border">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-24">
            <div className="flex-1 space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-balance">
                A thinking partner for every video.
              </h2>
              <p className="text-lg text-muted-foreground">
                Don't just read summaries. Question the content. Ask for explanations, challenge concepts, and connect ideas across domains.
              </p>
              
              <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["Explain this simply", "Give me an example", "Connect this to history", "Challenge my understanding"].map((q, i) => (
                  <button key={i} className="group px-4 py-3 bg-background border border-border rounded-lg text-sm font-medium text-muted-foreground flex items-center justify-between hover:border-accent hover:text-accent hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    {q}
                    <ChevronRight className="h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full flex justify-center">
              <div className="w-full max-w-md h-[500px] bg-background rounded-xl border border-border shadow-editorial hover:shadow-editorial-hover transition-shadow flex flex-col overflow-hidden">
                <div className="h-14 border-b border-border flex items-center px-4 gap-3 bg-secondary/30">
                  <BrainCircuit className="h-5 w-5 text-accent" />
                  <span className="font-semibold text-sm">AI Companion</span>
                </div>
                <div className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                  <div className="self-end bg-secondary/50 p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm">
                    Why is this concept important?
                  </div>
                  <div className="self-start bg-accent p-4 rounded-2xl rounded-tl-sm max-w-[90%] text-white text-sm shadow-sm hover:shadow transition-shadow">
                    <p className="mb-2">It matters because it forms the foundation of...</p>
                    <div className="h-2 w-3/4 bg-white/20 rounded mt-2" />
                    <div className="h-2 w-5/6 bg-white/20 rounded mt-2" />
                  </div>
                  <div className="self-end bg-secondary/50 p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-sm mt-4">
                    Can you give a practical example?
                  </div>
                  <div className="self-start bg-background border border-border p-4 rounded-2xl rounded-tl-sm max-w-[90%] text-sm shadow-sm flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-accent rounded-full animate-pulse" />
                    Thinking...
                  </div>
                </div>
                <div className="p-3 border-t border-border bg-secondary/10">
                  <div className="h-10 w-full bg-background border border-border rounded-full flex items-center px-4 hover:border-accent/50 transition-colors cursor-text">
                    <div className="h-4 w-1/3 bg-secondary rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. SECTION 5: NOTES + TRANSCRIPT */}
        <section className="w-full py-24 lg:py-32">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 space-y-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight">From watching to reading to thinking.</h2>
              <p className="text-muted-foreground">Seamlessly transition between modalities to reinforce learning.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Notes */}
              <div className="bg-secondary/20 rounded-xl border border-border p-8 lg:p-12 flex flex-col items-center hover:bg-secondary/30 transition-colors group cursor-default">
                <div className="w-full max-w-sm bg-background rounded-lg border border-border shadow-sm group-hover:shadow-md transition-shadow p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <NotebookPen className="h-4 w-4" /> Notes
                    </div>
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm">Key Insight: Architecture</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      The separation of concerns allows for independent scaling. This is critical for...
                    </p>
                    <div className="flex gap-2 pt-2">
                      <span className="px-2 py-1 bg-accent/10 text-accent text-xs rounded-md">#design</span>
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded-md hover:bg-secondary/80 cursor-pointer transition-colors">#scaling</span>
                    </div>
                  </div>
                </div>
                <h3 className="mt-8 text-xl font-bold">Structured Knowledge</h3>
                <p className="text-center text-muted-foreground mt-2 text-sm max-w-xs">Write notes alongside the video. They sync with timestamps automatically.</p>
              </div>

              {/* Transcript */}
              <div className="bg-primary rounded-xl border border-border p-8 lg:p-12 flex flex-col items-center text-white hover:bg-[#18181B] transition-colors group cursor-default">
                <div className="w-full max-w-sm bg-[#18181B] rounded-lg border border-[#27272A] shadow-sm group-hover:shadow-md transition-shadow p-1 flex flex-col h-64 overflow-hidden">
                   <div className="p-3 border-b border-[#27272A] flex items-center gap-2 text-sm font-medium text-[#A1A1AA]">
                     <Languages className="h-4 w-4" /> Transcript
                   </div>
                   <div className="flex-1 p-3 space-y-4">
                     <div className="flex gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                       <span className="text-xs font-mono text-[#71717A] pt-0.5">12:04</span>
                       <p className="text-sm leading-relaxed">Before we move on to the next topic...</p>
                     </div>
                     <div className="flex gap-3 bg-white/10 rounded-md p-2 -mx-2 cursor-pointer hover:bg-white/15 transition-colors shadow-sm">
                       <span className="text-xs font-mono text-accent pt-0.5">12:15</span>
                       <p className="text-sm leading-relaxed font-medium">The most important concept here is the observer pattern.</p>
                     </div>
                     <div className="flex gap-3 opacity-50 hover:opacity-100 transition-opacity cursor-pointer">
                       <span className="text-xs font-mono text-[#71717A] pt-0.5">12:30</span>
                       <p className="text-sm leading-relaxed">It allows components to react to state changes without tight coupling.</p>
                     </div>
                   </div>
                </div>
                <h3 className="mt-8 text-xl font-bold">Interactive Reading</h3>
                <p className="text-center text-[#A1A1AA] mt-2 text-sm max-w-xs">Search, highlight, and jump to exact moments in the video through the transcript.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. SECTION 6 & 7: LEARNING TOOLS & MIND MAP */}
        <section id="learning" className="w-full py-24 lg:py-32 bg-secondary/10 border-y border-border">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <div className="mb-16">
              <h2 className="text-4xl lg:text-5xl font-bold tracking-tight mb-4">Active Learning Tools</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">We built tools that force recall, test comprehension, and map concepts visually.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mind Map - Large Focus */}
              <div className="md:col-span-2 bg-background rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow p-8 flex flex-col cursor-default">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <Network className="h-6 w-6 text-accent" /> Concept Mapping
                  </h3>
                  <span className="text-xs font-semibold px-2 py-1 bg-secondary rounded text-muted-foreground uppercase tracking-wider">Visual</span>
                </div>
                <div className="flex-1 relative min-h-[300px] border border-border/50 rounded-lg bg-secondary/20 overflow-hidden flex items-center justify-center hover:bg-secondary/30 transition-colors">
                  {/* Abstract Graph Visualization */}
                  <div className="relative w-full h-full max-w-md max-h-64 flex items-center justify-center">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-12 bg-primary text-background text-xs font-bold flex items-center justify-center rounded-lg shadow-sm z-10 hover:scale-105 transition-transform cursor-pointer">CORE TOPIC</div>
                    
                    {/* SVG lines */}
                    <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                      <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="currentColor" strokeWidth="2" className="text-border" />
                      <line x1="50%" y1="50%" x2="75%" y2="30%" stroke="currentColor" strokeWidth="2" className="text-border" />
                      <line x1="50%" y1="50%" x2="30%" y2="75%" stroke="currentColor" strokeWidth="2" className="text-border" />
                      <line x1="50%" y1="50%" x2="80%" y2="80%" stroke="currentColor" strokeWidth="2" className="text-border" />
                    </svg>

                    <div className="absolute top-[25%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-20 h-8 bg-background border border-border text-[10px] font-medium flex items-center justify-center rounded shadow-sm hover:border-accent hover:text-accent transition-colors cursor-pointer">Concept A</div>
                    <div className="absolute top-[30%] left-[75%] -translate-x-1/2 -translate-y-1/2 w-20 h-8 bg-background border border-border text-[10px] font-medium flex items-center justify-center rounded shadow-sm hover:border-accent hover:text-accent transition-colors cursor-pointer">Concept B</div>
                    <div className="absolute top-[75%] left-[30%] -translate-x-1/2 -translate-y-1/2 w-20 h-8 bg-background border border-border text-[10px] font-medium flex items-center justify-center rounded shadow-sm hover:border-accent hover:text-accent transition-colors cursor-pointer">Detail A.1</div>
                    <div className="absolute top-[80%] left-[80%] -translate-x-1/2 -translate-y-1/2 w-20 h-8 bg-background border border-border text-[10px] font-medium flex items-center justify-center rounded shadow-sm hover:border-accent hover:text-accent transition-colors cursor-pointer">Example</div>
                  </div>
                </div>
              </div>

              {/* Flashcards & Quiz */}
              <div className="flex flex-col gap-6">
                <div className="flex-1 bg-primary text-background rounded-xl p-8 flex flex-col justify-between hover:bg-[#18181B] transition-colors cursor-pointer group">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 opacity-80" /> Flashcards
                    </h3>
                    <p className="text-sm text-background/70">AI-generated spaced repetition cards for long-term retention.</p>
                  </div>
                  <div className="w-full aspect-[3/2] bg-white/10 rounded-lg mt-6 p-4 flex flex-col items-center justify-center text-center group-hover:bg-white/20 transition-all shadow-sm group-hover:shadow group-active:scale-[0.98]">
                    <span className="text-xs uppercase tracking-widest text-background/50 mb-2">Front</span>
                    <p className="font-medium">What is the primary advantage of the observer pattern?</p>
                  </div>
                </div>
                
                <div className="flex-1 bg-background border border-border rounded-xl p-8 flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer group">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-2">
                      <Lightbulb className="h-5 w-5 text-accent" /> Quizzes
                    </h3>
                    <p className="text-sm text-muted-foreground">Test your comprehension immediately after watching.</p>
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="h-8 w-full bg-secondary rounded border border-border flex items-center px-3 gap-2 group-hover:border-border/80 transition-colors"><div className="h-3 w-3 rounded-full border border-muted-foreground" /><div className="h-2 w-1/2 bg-muted-foreground/30 rounded" /></div>
                    <div className="h-8 w-full bg-accent/10 border border-accent rounded flex items-center px-3 gap-2 shadow-sm"><div className="h-3 w-3 rounded-full bg-accent flex items-center justify-center"><div className="h-1.5 w-1.5 bg-white rounded-full" /></div><div className="h-2 w-2/3 bg-accent rounded" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. SECTION 8: HOW IT WORKS */}
        <section id="how-it-works" className="w-full py-24 lg:py-32">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-16 text-center">The TubeLens Process</h2>
            
            <div className="flex flex-col lg:flex-row justify-between relative">
              {/* Connecting line (desktop) */}
              <div className="hidden lg:block absolute top-6 left-12 right-12 h-px bg-border" />
              
              {[
                { step: "01", title: "Import", desc: "Paste any YouTube link." },
                { step: "02", title: "Analyze", desc: "TubeLens processes transcript and structure." },
                { step: "03", title: "Explore", desc: "Read, watch, and search simultaneously." },
                { step: "04", title: "Interact", desc: "Ask questions and take notes." },
                { step: "05", title: "Retain", desc: "Review with generated tools." }
              ].map((item, i) => (
                <div key={i} className="group flex flex-row lg:flex-col gap-4 lg:gap-6 relative z-10 mb-8 lg:mb-0 w-full lg:w-48 cursor-default">
                  <div className="shrink-0 h-12 w-12 rounded-full bg-background border-2 border-primary text-primary font-bold flex items-center justify-center text-lg group-hover:bg-primary group-hover:text-background transition-colors shadow-sm">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. SECTION 9: VALUE / SOCIAL */}
        <section className="w-full bg-primary text-background py-24 lg:py-32">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
            <div className="hover:-translate-y-1 transition-transform cursor-default">
              <h3 className="text-2xl font-bold mb-4">Understand More</h3>
              <p className="text-muted text-lg leading-relaxed">Spend less time passively watching content wash over you. Extract the structural ideas instantly.</p>
            </div>
            <div className="hover:-translate-y-1 transition-transform cursor-default">
              <h3 className="text-2xl font-bold mb-4">Think Deeper</h3>
              <p className="text-muted text-lg leading-relaxed">Ask questions while the context is still present. Never let a confusing concept block your progress.</p>
            </div>
            <div className="hover:-translate-y-1 transition-transform cursor-default">
              <h3 className="text-2xl font-bold mb-4">Remember Better</h3>
              <p className="text-muted text-lg leading-relaxed">Turn ephemeral video content into persistent, structured active learning material.</p>
            </div>
          </div>
        </section>

        {/* 10. FINAL CTA */}
        <section className="w-full py-32 lg:py-48 flex items-center justify-center">
          <div className="max-w-3xl px-6 text-center space-y-8">
            <h2 className="text-5xl lg:text-7xl font-bold tracking-tight text-balance">
              Stop just watching.<br/>
              Start understanding.
            </h2>
            <p className="text-xl text-muted-foreground">
              Create your intelligent workspace today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <button 
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => setIsEnteringUrl(true), 500);
                }}
                className="group h-14 px-8 bg-primary text-background font-medium rounded-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto shadow-editorial hover:shadow-editorial-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Start Learning Free
              </button>
              <Link href="#how-it-works" className="h-14 px-8 bg-secondary text-primary font-medium rounded-lg flex items-center justify-center hover:bg-secondary/80 transition-all hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                Explore TubeLens
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-border bg-background pt-20 pb-10">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-8 mb-16">
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-primary">
                <div className="h-6 w-6 bg-primary text-background rounded flex items-center justify-center">
                  <Play className="h-3 w-3 ml-0.5 fill-current" />
                </div>
                TubeLens
              </div>
              <p className="text-sm text-muted-foreground text-balance">
                From Watching to Understanding.<br/>
                An AI-powered learning workspace.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:col-span-3">
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#features" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">Features</Link></li>
                  <li><Link href="#learning" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">Learning Tools</Link></li>
                  <li><Link href="#how-it-works" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">How it works</Link></li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-sm uppercase tracking-wider text-primary">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">Documentation</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">About</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">Contact</Link></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} TubeLens.</p>
            <div className="flex items-center gap-6">
              <Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">Privacy</Link>
              <Link href="#" className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:underline rounded-sm">Terms</Link>
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
