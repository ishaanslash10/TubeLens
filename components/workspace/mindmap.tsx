"use client";

import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { useWorkspace } from "./workspace-context";
import { Network, RefreshCw, AlertCircle } from "lucide-react";

export function MindMap() {
  const { videoId, transcript, isLoadingTranscript, transcriptError } = useWorkspace();
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, theme: 'default' });
  }, []);

  useEffect(() => {
    if (mermaidCode && mermaidRef.current) {
      const render = async () => {
        try {
          mermaidRef.current!.innerHTML = "";
          const { svg } = await mermaid.render(`mindmap-${Date.now()}`, mermaidCode);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (e) {
          console.error("Mermaid rendering error", e);
        }
      };
      render();
    }
  }, [mermaidCode]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const transcriptText = transcript ? transcript.map(t => t.text).join(" ") : "";

      const res = await fetch("/api/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, transcriptText }),
      });
      if (!res.ok) throw new Error("Failed to generate mind map");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMermaidCode(data.mermaid);
    } catch (e: any) {
      setError(e.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-secondary/10 rounded-xl relative">
      {!mermaidCode && !isLoading && (
        <div className="text-center space-y-6 max-w-sm">
          <div className="h-16 w-16 bg-background border border-border rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Network className="h-8 w-8 text-accent" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-balance">Visual Concept Mapping</h3>
            <p className="text-sm text-muted-foreground text-balance">
              Generate an AI-powered visual graph of the core ideas covered in this video.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoadingTranscript ? true : false}
            className="w-full h-12 bg-primary text-background rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-editorial flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoadingTranscript ? (
              <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <Network className="h-4 w-4" />
            )}
            {isLoadingTranscript ? "Loading Transcript..." : "Generate Mind Map"}
          </button>
          {transcriptError && !error && (
            <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Limited Context: Transcript unavailable.
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center space-y-6">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 border-4 border-border rounded-full" />
            <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin" />
            <Network className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold">Analyzing structures</p>
            <p className="text-sm text-muted-foreground">Building conceptual graph...</p>
          </div>
        </div>
      )}

      <div
        className={`w-full h-full overflow-hidden flex flex-col ${
          !mermaidCode || isLoading ? "hidden" : "flex"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-background">
           <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Concept Graph</span>
           <button 
             onClick={handleGenerate}
             disabled={isLoadingTranscript ? true : false}
             className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-secondary/50 border border-transparent hover:border-border disabled:opacity-50"
           >
             <RefreshCw className={`h-3 w-3 ${isLoadingTranscript ? 'animate-spin' : ''}`} /> 
             Regenerate
           </button>
        </div>
        <div className="flex-1 overflow-auto bg-background/50">
          <div ref={mermaidRef} className="flex min-w-full min-h-full items-center justify-center p-8 [&>svg]:max-w-full [&>svg]:h-auto" />
        </div>
      </div>
    </div>
  );
}
