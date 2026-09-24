"use client";

import { User } from "@supabase/supabase-js";
import { UserMenu } from "./user-menu";
import Link from "next/link";
import { LogIn } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function HeaderAuth({ user, workspaceId }: { user: User | null; workspaceId: string }) {
  return (
    <AnimatePresence mode="wait">
      {user ? (
        <motion.div
          key="user-menu"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <UserMenu user={user} />
        </motion.div>
      ) : (
        <motion.div
          key="login-btn"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link 
            href={`/login?next=/workspace/${workspaceId}`} 
            className="flex items-center gap-1.5 h-8 px-3 text-[11px] font-semibold text-electric-bright hover:text-white transition-all motion-fluid duration-200 rounded-lg border border-electric/20 hover:border-electric/40 hover:shadow-blue-glow"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign In to Save</span>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
