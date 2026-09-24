"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useWorkspace } from "./workspace-context";
import { Loader2, AlertCircle, Languages, FileText } from "lucide-react";

export function TranscriptPanel() {
  const { 
    transcript, 
    isLoadingTranscript, 
    transcriptError, 
    transcriptErrorCode,
    seekTo,
    playerRef
  } = useWorkspace();

  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isAutoScrolling = useRef(true);
  const lastScrollTime = useRef(0);

  // Poll current time
  useEffect(() => {
    if (!transcript || transcript.length === 0) return;
    
    const interval = setInterval(() => {
      if (playerRef?.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime();
        
        // Find active segment
        let newActiveIndex = -1;
        for (let i = transcript.length - 1; i >= 0; i--) {
          if (currentTime >= transcript[i].offset - 0.5) { // 0.5s grace period for smooth transitions
            newActiveIndex = i;
            break;
          }
        }
        
        if (newActiveIndex !== activeIndex) {
          setActiveIndex(newActiveIndex);
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, [transcript, activeIndex, playerRef]);

  // Handle smooth auto-scrolling
  useEffect(() => {
    if (activeIndex === -1 || !isAutoScrolling.current) return;
    
    const activeEl = itemRefs.current[activeIndex];
    const containerEl = scrollContainerRef.current;
    
    if (activeEl && containerEl) {
      const containerHeight = containerEl.clientHeight;
      const elementOffset = activeEl.offsetTop;
      const elementHeight = activeEl.clientHeight;
      
      // Calculate position to center the element
      const targetScroll = elementOffset - (containerHeight / 2) + (elementHeight / 2);
      
      containerEl.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [activeIndex]);

  // Detect manual scrolling to temporarily pause auto-scroll
  const handleScroll = useCallback(() => {
    const now = Date.now();
    // If the scroll was triggered by our smooth scroll, ignore
    // We can't perfectly distinguish, but checking if user is actively wheeling/touching helps
    isAutoScrolling.current = false;
    lastScrollTime.current = now;
    
    // Resume auto-scroll after 3 seconds of no scrolling
    setTimeout(() => {
      if (Date.now() - lastScrollTime.current >= 2900) {
        isAutoScrolling.current = true;
      }
    }, 3000);
  }, []);

  const handleSeek = (offset: number, index: number) => {
    seekTo(offset);
    setActiveIndex(index);
    isAutoScrolling.current = true; // Resume tracking immediately on click
  };

  return (
    <div className="flex flex-col h-full bg-transparent rounded-2xl overflow-hidden z-10 font-sans">
      <div 
        ref={scrollContainerRef}
        onWheel={handleScroll}
        onTouchMove={handleScroll}
        className="flex-1 overflow-y-auto p-3 sm:p-4 relative scroll-smooth"
      >
        {isLoadingTranscript ? (
          <div className="flex h-full items-center justify-center flex-col gap-4">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 border-2 border-white/[0.06] rounded-full" />
              <div className="absolute inset-0 border-2 border-electric rounded-full border-t-transparent animate-spin" />
            </div>
            <span className="text-xs font-medium text-muted-foreground tracking-wide">Extracting transcript...</span>
          </div>
        ) : transcriptError && transcriptErrorCode !== "CAPTIONS_UNAVAILABLE" ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-3 text-red-400 text-sm glass-panel px-5 py-4 rounded-xl border-red-500/10 max-w-md">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="leading-relaxed text-xs">{transcriptError}</p>
            </div>
          </div>
        ) : transcriptError && transcriptErrorCode === "CAPTIONS_UNAVAILABLE" ? (
          <div className="flex h-full items-center justify-center">
            <div className="glass-panel p-8 rounded-2xl text-center max-w-xs flex flex-col items-center">
              <div className="h-12 w-12 rounded-xl glass-panel-active flex items-center justify-center mx-auto mb-5">
                <Languages className="h-5 w-5 text-electric-bright" />
              </div>
              <h3 className="font-semibold text-primary mb-2 text-sm tracking-tight">Transcript unavailable</h3>
              <p className="text-xs text-muted-foreground text-balance mb-3 leading-relaxed">This video doesn't provide captions, so TubeLens can't generate a transcript right now.</p>
              <p className="text-xs text-balance text-muted-foreground/70 leading-relaxed">You can still watch the video normally. If captions become available, TubeLens will be able to use them automatically.</p>
            </div>
          </div>
        ) : transcript && transcript.length > 0 ? (
          <div className="space-y-0.5 pb-24 relative">
            {transcript.map((item, i) => {
              const isActive = i === activeIndex;
              return (
                <div 
                  key={i} 
                  ref={(el) => { itemRefs.current[i] = el; }}
                  onClick={() => handleSeek(item.offset, i)}
                  className={`flex gap-3 px-3 py-2.5 rounded-lg transition-all duration-500 motion-fluid cursor-pointer group ${
                    isActive 
                      ? "glass-panel-active shadow-blue-glow" 
                      : "hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`text-[11px] font-mono pt-0.5 min-w-[44px] tabular-nums transition-colors duration-400 ${
                    isActive 
                      ? "text-electric-bright font-semibold glow-blue-subtle" 
                      : "text-muted-foreground group-hover:text-slate-400"
                  }`}>
                    {Math.floor(item.offset / 60)}:{(Math.floor(item.offset % 60)).toString().padStart(2, "0")}
                  </div>
                  <div className={`text-[13px] leading-relaxed transition-all duration-400 text-pretty ${
                    isActive 
                      ? "text-primary font-medium" 
                      : "text-slate-400 group-hover:text-slate-300"
                  }`}>
                    {item.text}
                  </div>
                </div>
              );
            })}          </div>
        ) : null}
      </div>
    </div>
  );
}
