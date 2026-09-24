"use client";

import { useEffect, useState, useRef } from "react";
import { Save, CheckCircle2, AlertCircle } from "lucide-react";
import { useWorkspace } from "./workspace-context";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export function Notes() {
  const { workspaceId, videoId } = useWorkspace();
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(!workspaceId);
  const supabase = createClient();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const storageKey = `tubelens-anonymous-notes-${videoId}`;

  useEffect(() => {
    let isMounted = true;
    
    async function loadNotes() {
      const { data: { user } } = await supabase.auth.getUser();
      const storedAnonymousNotes = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null;
      
      if (!user || !workspaceId) {
        if (isMounted) {
          setIsAnonymous(true);
          if (storedAnonymousNotes) {
            setContent(storedAnonymousNotes);
          }
          setIsLoaded(true);
        }
        return;
      }
      
      if (isMounted) setIsAnonymous(false);

      const { data, error } = await supabase
        .from("notes")
        .select("id, content")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .maybeSingle();

      let finalContent = "";
      let currentNoteId = null;

      if (data) {
        finalContent = data.content || "";
        currentNoteId = data.id;
      }

      let shouldMerge = false;
      if (storedAnonymousNotes && storedAnonymousNotes.trim()) {
        if (finalContent && finalContent.trim()) {
          finalContent = `${finalContent}\n\n--- Recovered Anonymous Notes ---\n\n${storedAnonymousNotes}`;
        } else {
          finalContent = storedAnonymousNotes;
        }
        shouldMerge = true;
      }

      if (isMounted) {
        setContent(finalContent);
        setNoteId(currentNoteId);
        setIsLoaded(true);
      }

      if (shouldMerge) {
        // Attempt to persist the merged content immediately
        try {
          if (currentNoteId) {
            const { error: updateError } = await supabase
              .from("notes")
              .update({ content: finalContent })
              .eq("id", currentNoteId);
            
            if (!updateError) {
              localStorage.removeItem(storageKey);
            }
          } else {
            const { data: insertData, error: insertError } = await supabase
              .from("notes")
              .insert({ 
                workspace_id: workspaceId, 
                user_id: user.id, 
                content: finalContent 
              })
              .select("id")
              .single();
              
            if (!insertError && insertData) {
              if (isMounted) setNoteId(insertData.id);
              localStorage.removeItem(storageKey);
            }
          }
        } catch (e) {
          console.error("Failed to persist anonymous notes to database", e);
        }
      }
    }

    loadNotes();
    return () => { isMounted = false; };
  }, [workspaceId, videoId, supabase]);

  const handleSave = async (contentToSave: string) => {
    if (isAnonymous || !workspaceId) return;
    setIsSaving(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsSaving(false);
      return;
    }

    let success = false;
    if (noteId) {
      const { error } = await supabase
        .from("notes")
        .update({ content: contentToSave })
        .eq("id", noteId);
      success = !error;
    } else {
      const { data, error } = await supabase
        .from("notes")
        .insert({ 
          workspace_id: workspaceId, 
          user_id: user.id, 
          content: contentToSave 
        })
        .select("id")
        .single();
        
      if (data) setNoteId(data.id);
      success = !error;
    }

    if (success) {
      localStorage.removeItem(storageKey);
    }
    
    setIsSaving(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    if (isAnonymous) {
      localStorage.setItem(storageKey, newContent);
    } else {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        handleSave(newContent);
      }, 1500);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
        <h3 className="text-[10px] font-semibold tracking-widest uppercase text-slate-400">
          Notes
        </h3>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground px-2 py-0.5 rounded border border-white/[0.04]" style={{ background: 'rgba(7, 11, 20, 0.4)' }}>
          {isAnonymous ? (
             <>
               <AlertCircle className="h-2.5 w-2.5 text-amber-400/60" /> Unsaved
             </>
          ) : isSaving ? (
            <>
              <Save className="h-2.5 w-2.5 animate-pulse text-electric/60" /> Saving
            </>
          ) : (
            <>
              <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400/60" /> Saved
            </>
          )}
        </div>
      </div>
      
      {isAnonymous && isLoaded && (
        <div className="glass-panel rounded-xl p-3 flex items-center justify-between gap-3 border-amber-500/[0.08]">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Anonymous session — notes will be lost when you leave.
          </p>
          <Link href={`/login?next=/workspace/${videoId}`} className="shrink-0 text-[11px] font-semibold text-electric-bright hover:text-white transition-colors motion-fluid duration-200">
            Sign in
          </Link>
        </div>
      )}

      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-[1.5px] border-white/[0.06] border-t-electric" />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Jot down key takeaways, timestamps, and connections here."
          className="flex-1 w-full bg-transparent border-0 focus:ring-0 resize-none outline-none text-slate-300 text-[13px] placeholder:text-muted-foreground/40 leading-relaxed font-sans"
        />
      )}
    </div>
  );
}
