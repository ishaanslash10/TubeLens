import { AICompanion } from "@/components/workspace/ai-companion";
import { WorkspaceTitle } from "@/components/workspace/workspace-title";
import { TranscriptPanel } from "@/components/workspace/transcript-panel";

import { WorkspaceProvider } from "@/components/workspace/workspace-context";
import { YouTubePlayer } from "@/components/workspace/youtube-player";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LogOut, LayoutGrid, Settings, LogIn } from "lucide-react";
import { signout } from "@/app/login/actions";

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
      <div className="flex h-screen w-full flex-col bg-secondary/30 text-foreground overflow-hidden font-sans selection:bg-accent/20 selection:text-primary">
        
        {/* Top Bar - Premium Application Shell */}
        <header className="h-16 shrink-0 bg-background border-b border-border flex items-center justify-between px-6 z-40 relative">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight text-primary hover:opacity-80 transition-opacity">
              <img src="/tubelens.png" alt="TubeLens Logo" className="h-6 w-auto object-contain" />
              TubeLens
            </Link>
            
            <div className="h-4 w-px bg-border hidden sm:block" />
            
            <WorkspaceTitle videoId={id} defaultTitle={videoTitle} />
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground transition-colors" title="Workspace Library">
               <LayoutGrid className="h-4 w-4" />
            </Link>
            <button className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground transition-colors group relative" title="Workspace Settings">
               <Settings className="h-4 w-4" />
               <div className="absolute top-full mt-2 right-0 w-48 bg-background border border-border rounded-xl shadow-lg opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all p-2 z-50 text-left">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Settings</div>
                  <div className="px-2 py-2 text-sm hover:bg-secondary rounded-md cursor-pointer transition-colors">Preferences</div>
                  <div className="px-2 py-2 text-sm hover:bg-secondary rounded-md cursor-pointer transition-colors">Export Data</div>
               </div>
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            
            {user ? (
              <form action={signout}>
                <button className="flex items-center gap-2 h-9 px-3 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-primary transition-colors rounded-md">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </form>
            ) : (
              <Link href={`/login?next=/workspace/${id}`} className="flex items-center gap-2 h-9 px-3 text-xs font-semibold text-primary hover:bg-secondary transition-colors rounded-md border border-border">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In to Save</span>
              </Link>
            )}
          </div>
        </header>

        {/* Main Workspace Area - Modular Flexible Grid */}
        <main className="flex-1 flex flex-col lg:flex-row p-2 sm:p-4 gap-4 overflow-y-auto lg:overflow-hidden">
          
          {/* Left Area: Video & Tools */}
          <div className="flex-[3] flex flex-col gap-4 min-w-0 lg:h-full">
            {/* Video Module */}
            <div className="aspect-video bg-black w-full rounded-xl overflow-hidden shadow-sm border border-border shrink-0 relative z-20 group">
              <YouTubePlayer />
            </div>
            
            {/* Tools Module */}
            <div className="flex-1 flex flex-col min-h-[400px] lg:min-h-0 z-10 lg:overflow-hidden">
              <TranscriptPanel />
            </div>
          </div>
          
          {/* Right Area: AI Companion */}
          <div className="flex-[1.8] flex flex-col z-30 min-h-[500px] lg:min-h-0 lg:h-full lg:overflow-hidden shrink-0">
            <AICompanion videoId={id} />
          </div>
        </main>
      </div>
    </WorkspaceProvider>
  );
}
