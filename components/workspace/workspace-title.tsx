"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "./workspace-context";

export function WorkspaceTitle({ videoId, defaultTitle }: { videoId: string, defaultTitle: string }) {
  const { transcript, isLoadingTranscript } = useWorkspace();
  const [title, setTitle] = useState<string>("Creating workspace...");
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    // Only proceed once transcript loading has settled (whether success or fail)
    if (isLoadingTranscript) return;

    const storageKey = `tubelens-workspace-title-${videoId}`;
    
    // Check cache first
    try {
      const cachedTitle = localStorage.getItem(storageKey);
      if (cachedTitle) {
        setTitle(cachedTitle);
        setIsGenerating(false);
        return;
      }
    } catch (e) {
      // Ignore localStorage errors
    }

    let isMounted = true;

    async function generateTitle() {
      try {
        const transcriptText = transcript 
          ? transcript.slice(0, 40).map(t => t.text).join(" ") // First ~2 mins of dialogue
          : "";

        const res = await fetch("/api/workspace-title", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoTitle: defaultTitle, transcriptText })
        });

        if (!res.ok) throw new Error("API failed");
        
        const data = await res.json();
        
        if (data.title && isMounted) {
          setTitle(data.title);
          try { localStorage.setItem(storageKey, data.title); } catch(e) {}
        } else if (isMounted) {
          setTitle(defaultTitle);
        }
      } catch (err) {
        if (isMounted) setTitle(defaultTitle);
      } finally {
        if (isMounted) setIsGenerating(false);
      }
    }

    generateTitle();

    return () => { isMounted = false; };
  }, [videoId, defaultTitle, transcript, isLoadingTranscript]);

  return (
    <div 
      className={`hidden md:flex text-sm font-medium truncate max-w-sm transition-all duration-300 ${isGenerating ? 'text-muted-foreground/60 animate-pulse' : 'text-muted-foreground'}`} 
      title={isGenerating ? "Creating workspace..." : title}
    >
      Workspace / {title}
    </div>
  );
}
