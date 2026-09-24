"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex-1 grid w-full">
      <AnimatePresence>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.16, 1, 0.3, 1] 
          }}
          className="w-full flex-1 flex flex-col z-10 will-change-[opacity,transform]"
          style={{ gridArea: "1 / 1 / 2 / 2" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
