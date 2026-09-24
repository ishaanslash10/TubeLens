import { AICompanion } from "@/components/workspace/ai-companion";
import { WorkspaceTitle } from "@/components/workspace/workspace-title";
import { TranscriptPanel } from "@/components/workspace/transcript-panel";

import { WorkspaceProvider } from "@/components/workspace/workspace-context";
import { YouTubePlayer } from "@/components/workspace/youtube-player";
import { createClient } from "@/lib/supabase/server";
import { HeaderAuth } from "@/components/header-auth";
import Link from "next/link";
import { LayoutGrid, Settings } from "lucide-react";

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  let workspaceId = null;
  let videoTitle = id;
  
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`);
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      if (oembed?.title) {
        // Clean up common suffixes like " (Official Video)", etc if desired, or just use as is.
        videoTitle = oembed.title;
      }
    }
  } catch (e) {
    // Ignore fetch errors
  }


  if (user) {
    const { data: existingWorkspace } = await supabase
      .from('workspaces')
      .select('id')
      .eq('user_id', user.id)
      .eq('video_id', id)
      .maybeSingle();

    if (existingWorkspace) {
      workspaceId = existingWorkspace.id;
    } else {
      const { data: newWorkspace } = await supabase
        .from('workspaces')
        .insert({ user_id: user.id, video_id: id })
        .select('id')
        .single();
      workspaceId = newWorkspace?.id;
    }
  }

  return (
    <WorkspaceProvider videoId={id} workspaceId={workspaceId}>
      <div className="relative flex h-screen w-full flex-col text-foreground overflow-hidden font-sans">
        
        {/* Structural grid overlay — faint architectural feel */}
        {/* We keep this here if we want a specific overlay for the workspace, 
            but it's also in FluidBackground. Let's remove it to avoid double-grid. */}
        <div className="absolute inset-0 pointer-events-none z-[1]" />

        {/* ══════════════════════════════════
            WORKSPACE HEADER — Minimal chrome
            Floating glass bar
            ══════════════════════════════════ */}
        <header className="h-14 shrink-0 flex items-center justify-between px-5 z-40 relative border-b border-white/[0.04]" style={{ background: 'rgba(7, 11, 20, 0.5)', backdropFilter: 'blur(16px)' }}>
          <div className="flex items-center gap-5">
            <Link href="/" className="group flex items-center gap-2 font-bold text-sm tracking-tight text-primary/90 hover:text-white transition-all motion-fluid duration-300">
              <img src="/tubelens.png" alt="TubeLens Logo" className="h-5 w-auto object-contain opacity-90 group-hover:opacity-100 group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-300" />
              <span className="hidden sm:inline">TubeLens</span>
            </Link>
            
            <div className="h-3.5 w-px bg-white/[0.06] hidden sm:block" />
            
            <WorkspaceTitle videoId={id} defaultTitle={videoTitle} />
          </div>

          <div className="flex items-center gap-1.5">
            <Link href="/" className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-white/[0.04] transition-all motion-fluid duration-200" title="Workspace Library">
               <LayoutGrid className="h-3.5 w-3.5" />
            </Link>
            <button className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-primary hover:bg-white/[0.04] transition-all motion-fluid duration-200 group relative" title="Workspace Settings">
               <Settings className="h-3.5 w-3.5" />
               <div className="absolute top-full mt-1.5 right-0 w-44 glass-elevated rounded-xl opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all motion-fluid duration-300 p-1.5 z-50 text-left">
                  <div className="px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Settings</div>
                  <div className="px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] rounded-lg cursor-pointer transition-colors motion-fluid duration-150">Preferences</div>
                  <div className="px-2.5 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/[0.04] rounded-lg cursor-pointer transition-colors motion-fluid duration-150">Export Data</div>
               </div>
            </button>
            
            <div className="h-3.5 w-px bg-white/[0.06] mx-0.5" />
            
            <HeaderAuth user={user} workspaceId={id} />
          </div>
        </header>

        {/* ══════════════════════════════════
            MAIN WORKSPACE — Modular Grid
            Large cinematic surfaces
            ══════════════════════════════════ */}
        <main className="flex-1 flex flex-col lg:flex-row p-2 sm:p-3 gap-3 overflow-y-auto lg:overflow-hidden relative z-10">
          
          {/* Left Column: Video + Transcript */}
          <div className="flex-[3] flex flex-col gap-3 min-w-0 lg:h-full">
            {/* Video — dominant cinematic surface */}
            <div className="aspect-video bg-black w-full rounded-2xl overflow-hidden shadow-cinematic-lg border border-white/[0.04] shrink-0 relative z-20 transition-shadow motion-smooth duration-700 hover:shadow-blue-glow-lg group">
              {/* Subtle blue rim light on the video container */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-electric/[0.06] via-transparent to-transparent pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <YouTubePlayer />
            </div>
            
            {/* Transcript — structured information surface */}
            <div className="flex-1 flex flex-col min-h-[400px] lg:min-h-0 z-10 lg:overflow-hidden rounded-2xl glass-surface border border-white/[0.04] shadow-cinematic">
              <TranscriptPanel />
            </div>
          </div>
          
          {/* Right Column: AI Companion — floating intelligence layer */}
          <div className="flex-[1.8] flex flex-col z-30 min-h-[500px] lg:min-h-0 lg:h-full lg:overflow-hidden shrink-0 rounded-2xl glass-surface border border-white/[0.04] shadow-cinematic">
            <AICompanion videoId={id} />
          </div>
        </main>
      </div>
    </WorkspaceProvider>
  );
}
