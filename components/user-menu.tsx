"use client";

import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, User as UserIcon } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

export function UserMenu({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.refresh();
  };

  // Generate deterministic gradient based on user ID or email
  const seed = user.email ? user.email.charCodeAt(0) + user.email.charCodeAt(user.email.length - 1) : 0;
  const hues = [210, 230, 250, 270, 290]; // Blue to violet
  const hue1 = hues[seed % hues.length];
  const hue2 = hues[(seed + 2) % hues.length];
  
  const emailPrefix = user.email ? user.email.split('@')[0] : 'User';
  const username = user.user_metadata?.username;
  const displayName = username || emailPrefix;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSigningOut}
        className="flex items-center gap-2 h-8 pl-1 pr-2 rounded-full hover:bg-white/[0.06] transition-all motion-fluid duration-200 border border-transparent hover:border-white/[0.06] focus:outline-none focus:bg-white/[0.06]"
      >
        <div 
          className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 border border-white/[0.15] shadow-[0_0_8px_rgba(59,130,246,0.15)]"
          style={{ 
            background: `linear-gradient(135deg, hsl(${hue1}, 80%, 55%), hsl(${hue2}, 70%, 30%))` 
          }}
        >
          <span className="text-[10px] font-bold text-white shadow-sm">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <span className="text-[11px] font-medium text-slate-200 hidden sm:block max-w-[90px] truncate">
          {displayName}
        </span>
        <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform motion-fluid duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-full mt-2.5 right-0 w-56 rounded-xl z-50 p-1.5 border border-white/[0.1] origin-top-right overflow-hidden"
            style={{ 
              background: 'rgba(7, 11, 20, 0.45)',
              backdropFilter: 'blur(40px) saturate(150%)',
              boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5), 0 0 20px -5px rgba(59,130,246,0.15), inset 0 0 0 1px rgba(255,255,255,0.02)'
            }}
          >
            <div className="px-3 py-3 border-b border-white/[0.06] mb-1.5 flex flex-col gap-0.5">
              <div className="text-sm font-semibold text-slate-100 truncate">{displayName}</div>
              {user.email && (
                <div className="text-[11px] text-muted-foreground truncate">{user.email}</div>
              )}
            </div>
            
            <button 
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] rounded-lg cursor-pointer transition-colors motion-fluid duration-150 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {isSigningOut ? "Signing Out..." : "Sign Out"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
