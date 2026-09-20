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
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <h3 className="text-xs font-bold tracking-widest uppercase flex items-center gap-2">
          Structured Notes
        </h3>
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground bg-secondary/50 border border-border px-2.5 py-1 rounded-md">
          {isAnonymous ? (
             <>
               <AlertCircle className="h-3 w-3 text-accent" /> Unsaved Session
             </>
          ) : isSaving ? (
            <>
              <Save className="h-3 w-3 animate-pulse" /> Saving...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3 w-3 text-green-600" /> Saved
            </>
          )}
        </div>
      </div>
      
      {isAnonymous && isLoaded && (
        <div className="bg-accent/5 border border-accent/20 rounded-md p-3 mb-2 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            You're in an anonymous session. Your notes will be lost when you leave.
          </p>
          <Link href={`/login?next=/workspace/${videoId}`} className="shrink-0 text-xs font-semibold text-accent hover:underline">
            Sign in to save
          </Link>
        </div>
      )}

      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Jot down key takeaways, timestamps, and connections here."
          className="flex-1 w-full bg-transparent border-0 focus:ring-0 resize-none outline-none text-foreground text-sm placeholder:text-muted-foreground/50 leading-relaxed font-sans"
        />
      )}
    </div>
  );
}
