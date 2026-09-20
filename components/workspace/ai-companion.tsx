"use client";

import { useState } from "react";
import { BrainCircuit, MessageSquare, NotebookPen, Network } from "lucide-react";
import { Chat } from "@/components/chat";
import { Notes } from "./notes";
import { MindMap } from "./mindmap";

export function AICompanion({ videoId }: { videoId: string }) {
  const [activeView, setActiveView] = useState<'chat' | 'notes' | 'mindmap'>('chat');

  return (
    <div className="flex flex-col h-full bg-background rounded-xl border border-border shadow-sm overflow-hidden z-30 w-full font-sans">
      {/* Header Tabs */}
      <div className="px-5 py-3 border-b border-border flex items-center justify-between bg-secondary/10 shrink-0">
        <h2 className="text-sm font-bold tracking-wide flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-accent" />
          <span className="hidden sm:inline">AI COMPANION</span>
        </h2>
        <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/50">
          <button 
            onClick={() => setActiveView('chat')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'chat' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" /> Chat
          </button>
          <button 
            onClick={() => setActiveView('notes')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'notes' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <NotebookPen className="h-3.5 w-3.5" /> Notes
          </button>
          <button 
            onClick={() => setActiveView('mindmap')} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeView === 'mindmap' ? 'bg-background text-primary shadow-sm' : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Network className="h-3.5 w-3.5" /> Mind Map
          </button>
        </div>
      </div>
      
      {/* Content Area - Toggle View */}
      <div className="flex-1 overflow-hidden relative">
        {/* Chat - Always mounted to preserve state */}
        <div className={`flex flex-col h-full w-full absolute inset-0 z-10 bg-background transition-opacity duration-200 ${
          activeView === 'chat' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <Chat videoId={videoId} />
        </div>

        {/* Notes View */}
        <div className={`flex flex-col h-full w-full absolute inset-0 z-10 bg-background p-4 sm:p-6 transition-opacity duration-200 ${
          activeView === 'notes' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <Notes />
        </div>

        {/* Mind Map View */}
        <div className={`flex flex-col h-full w-full absolute inset-0 z-10 bg-background transition-opacity duration-200 ${
          activeView === 'mindmap' ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <MindMap />
        </div>
      </div>
    </div>
  );
}
