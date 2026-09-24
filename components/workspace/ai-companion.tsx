"use client";

import { useState } from "react";
import { BrainCircuit, MessageSquare, NotebookPen, Network } from "lucide-react";
import { Chat } from "@/components/chat";
import { Notes } from "./notes";
import { MindMap } from "./mindmap";

export function AICompanion({ videoId }: { videoId: string }) {
  const [activeView, setActiveView] = useState<'chat' | 'notes' | 'mindmap'>('chat');

  const tabs = [
    { key: 'chat' as const, label: 'Chat', icon: MessageSquare },
    { key: 'notes' as const, label: 'Notes', icon: NotebookPen },
    { key: 'mindmap' as const, label: 'Mind Map', icon: Network },
  ];

  return (
    <div className="flex flex-col h-full bg-transparent w-full font-sans rounded-2xl overflow-hidden">
      {/* Header — minimal, integrated chrome */}
      <div className="px-4 py-3 border-b border-white/[0.04] flex items-center justify-between shrink-0" style={{ background: 'rgba(7, 11, 20, 0.4)', backdropFilter: 'blur(12px)' }}>
        <h2 className="text-[11px] font-semibold tracking-widest uppercase flex items-center gap-2 text-slate-400">
          <BrainCircuit className="h-3.5 w-3.5 text-electric" />
          <span className="hidden sm:inline">AI Companion</span>
        </h2>
        
        {/* View switcher — pill tabs with sliding active state */}
        <div className="flex p-0.5 rounded-lg border border-white/[0.04]" style={{ background: 'rgba(7, 11, 20, 0.5)' }}>
          {tabs.map((tab) => (
            <button 
              key={tab.key}
              onClick={() => setActiveView(tab.key)} 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-all motion-fluid duration-300 ${
                activeView === tab.key 
                  ? 'glass-panel-active text-primary shadow-blue-glow' 
                  : 'text-muted-foreground hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
            >
              <tab.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
      
      {/* Content area — stacked views for instant switching */}
      <div className="flex-1 overflow-hidden relative">
        {/* Chat — always mounted to preserve state */}
        <div className={`flex flex-col h-full w-full absolute inset-0 z-10 transition-all motion-fluid duration-400 ${
          activeView === 'chat' ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
        }`}>
          <Chat videoId={videoId} />
        </div>

        {/* Notes */}
        <div className={`flex flex-col h-full w-full absolute inset-0 z-10 p-4 sm:p-5 transition-all motion-fluid duration-400 ${
          activeView === 'notes' ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
        }`}>
          <Notes />
        </div>

        {/* Mind Map */}
        <div className={`flex flex-col h-full w-full absolute inset-0 z-10 transition-all motion-fluid duration-400 ${
          activeView === 'mindmap' ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-2'
        }`}>
          <MindMap />
        </div>
      </div>
    </div>
  );
}
