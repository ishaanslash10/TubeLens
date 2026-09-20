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
    <div className="flex flex-col h-full bg-background rounded-xl border border-border shadow-sm overflow-hidden z-10 font-sans">
      <div 
        ref={scrollContainerRef}
        onWheel={handleScroll}
        onTouchMove={handleScroll}
        className="flex-1 overflow-y-auto p-4 relative"
      >
        {isLoadingTranscript ? (
          <div className="flex h-full items-center justify-center text-muted-foreground flex-col gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="text-sm font-medium">Extracting transcript...</span>
          </div>
        ) : transcriptError && transcriptErrorCode !== "CAPTIONS_UNAVAILABLE" ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex items-center gap-3 text-destructive text-sm bg-destructive/10 px-6 py-4 rounded-xl border border-destructive/20 max-w-md">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="leading-relaxed">{transcriptError}</p>
            </div>
          </div>
        ) : transcriptError && transcriptErrorCode === "CAPTIONS_UNAVAILABLE" ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="bg-secondary/10 p-8 rounded-2xl border border-border text-center max-w-sm flex flex-col items-center">
              <div className="h-12 w-12 rounded-full bg-secondary/80 flex items-center justify-center mx-auto mb-5 border border-border/50">
                <Languages className="h-5 w-5 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-primary mb-3 text-lg tracking-tight">Transcript unavailable for this video</h3>
              <p className="text-sm text-balance mb-4 leading-relaxed">This video doesn't provide captions, so TubeLens can't generate a transcript right now.</p>
              <p className="text-sm text-balance text-muted-foreground leading-relaxed">You can still watch the video normally. If captions become available, TubeLens will be able to use them automatically.</p>
            </div>
          </div>
        ) : transcript && transcript.length > 0 ? (
          <div className="space-y-1.5 pb-24 relative">
            {transcript.map((item, i) => {
              const isActive = i === activeIndex;
              return (
                <div 
                  key={i} 
                  ref={(el) => { itemRefs.current[i] = el; }}
                  onClick={() => handleSeek(item.offset, i)}
                  className={`flex gap-4 p-3 rounded-lg transition-all cursor-pointer border-l-4 ${isActive ? "bg-accent/10 border-l-accent shadow-sm" : "border-l-transparent hover:bg-secondary/40"}`}
                >
                  <div className={`text-xs font-mono pt-0.5 min-w-[50px] transition-colors ${isActive ? "text-accent font-bold" : "text-muted-foreground font-medium"}`}>
                    {Math.floor(item.offset / 60)}:{(Math.floor(item.offset % 60)).toString().padStart(2, "0")}
                  </div>
                  <div className={`text-sm leading-relaxed transition-colors text-pretty ${isActive ? "text-primary font-semibold" : "text-foreground/80"}`}>
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
