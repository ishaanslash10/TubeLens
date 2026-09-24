"use client";

import { useState, Fragment } from "react";
import { ArrowUp, Sparkles, BrainCircuit, Lightbulb, Link2 } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspace } from "./workspace/workspace-context";

export function Chat({ videoId }: { videoId: string }) {
  const { transcript, isLoadingTranscript, transcriptError, seekTo } = useWorkspace();
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([
    { role: 'assistant', text: "Hello! I'm your TubeLens companion. I've prepared this workspace for us. What would you like to understand deeper about this video?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQuestions = [
    { label: "Explain concept", icon: Lightbulb },
    { label: "Connect ideas", icon: Link2 },
    { label: "Why it matters", icon: Sparkles }
  ];

  const handleSubmit = async (e: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const userMessage = overrideText || input.trim();
    if (!userMessage || isLoading) return;

    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const transcriptText = transcript 
        ? transcript.map((t, i) => `[${i}] ${t.text}`).join("\n") 
        : "";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, videoId, transcriptText })
      });

      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', text: data.text }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I encountered an error connecting to my knowledge base." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const preprocessCitations = (text: string) => {
    return text.replace(/(?:\[\s*cite\s*:\s*([\d\s\-\,;a-zA-Z]+)\s*\]|\[\s*cite\s*\]\(\s*(?:cite-)?([\d\s\-\,;a-zA-Z]+)\s*\))/gi, (match, g1, g2) => {
      const inner = g1 || g2 || "";
      return `[cite](#cite-${inner.replace(/\s+/g, '')})`;
    });
  };

  const renderMessageContent = (text: string, role: string) => {
    if (role === "user") {
      return <span>{text}</span>;
    }
    const processedText = preprocessCitations(text);

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, href, children, ...props }) => {
            if (href && href.toLowerCase().startsWith("#cite-")) {
              const groups = href.replace(/#cite-/i, "").split(/[,;]/);
              return (
                <Fragment>
                  {groups.map((group, idx) => {
                    const m = group.match(/\d+/);
                    if (m) {
                      const id = parseInt(m[0], 10);
                      if (transcript && transcript[id]) {
                        const offset = transcript[id].offset;
                        const formatted = `${Math.floor(offset / 60)}:${Math.floor(offset % 60).toString().padStart(2, "0")}`;
                        return (
                          <button 
                            key={idx} 
                            onClick={() => seekTo(offset)}
                            className="inline-flex items-center text-[10px] font-mono font-semibold text-electric-bright hover:text-white bg-electric/10 hover:bg-electric/25 px-1.5 py-0.5 rounded mx-0.5 align-baseline transition-all motion-fluid duration-200 cursor-pointer border border-electric/15 hover:border-electric/30"
                            title="Seek to this moment"
                          >
                            {formatted}
                          </button>
                        );
                      }
                    }
                    return null;
                  })}
                </Fragment>
              );
            }
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-electric-bright hover:text-electric-glow hover:underline transition-colors" {...props}>{children}</a>;
          },
          h1: ({node, ...props}) => <h1 className="text-base font-bold mt-5 mb-2 text-primary tracking-tight" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-sm font-bold mt-4 mb-2 text-primary tracking-tight" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-[13px] font-bold mt-3 mb-1.5 text-primary tracking-tight" {...props} />,
          p: ({node, ...props}) => <p className="mb-2.5 leading-relaxed last:mb-0 text-[13px]" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-[13px]" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-[13px]" {...props} />,
          li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold text-primary" {...props} />,
          em: ({node, ...props}) => <em className="italic text-slate-300" {...props} />,
          code: ({node, className, children, ...props}: any) => {
             const isInline = !className;
             return isInline ? 
               <code className="bg-white/[0.06] text-electric-bright px-1.5 py-0.5 rounded text-[11px] font-mono border border-white/[0.04]" {...props}>{children}</code> :
               <code className="block bg-white/[0.03] p-3 rounded-lg text-[11px] font-mono overflow-x-auto border border-white/[0.04] my-2.5" {...props}>{children}</code>
          }
        }}
      >
        {processedText}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent z-10 w-full relative font-sans">
      {/* Context status bar */}
      <div className="px-4 py-2 border-b border-white/[0.04] flex items-center justify-between z-20" style={{ background: 'rgba(7, 11, 20, 0.3)' }}>
        <div className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
          <Sparkles className="h-3 w-3 text-electric/60" /> Context
        </div>
        <div className="flex items-center gap-2 px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium border border-white/[0.04]" style={{ background: 'rgba(7, 11, 20, 0.4)' }}>
          {isLoadingTranscript ? (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="h-2.5 w-2.5 rounded-full border-[1.5px] border-electric/40 border-t-electric animate-spin" />
              Loading
            </div>
          ) : transcriptError ? (
            <div className="flex items-center gap-1.5 text-red-400/80">
              <div className="h-1.5 w-1.5 rounded-full bg-red-400/60" />
              Limited
            </div>
          ) : (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-electric animate-pulse shadow-[0_0_6px_rgba(59,130,246,0.5)]" />
              <span className="text-slate-400">Ready</span>
            </>
          )}
        </div>
      </div>
      
      {/* Message feed */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 flex flex-col scroll-smooth">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              key={idx} 
              className={`p-3.5 max-w-[88%] text-[13px] ${
                msg.role === 'assistant' 
                  ? 'glass-panel text-slate-200 rounded-2xl rounded-tl-md self-start leading-relaxed' 
                  : 'rounded-2xl rounded-tr-md self-end leading-relaxed border border-electric/15 text-slate-200'
              }`}
              style={msg.role === 'user' ? { background: 'rgba(59, 130, 246, 0.08)' } : undefined}
            >
              {renderMessageContent(msg.text, msg.role)}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass-panel text-muted-foreground p-3.5 rounded-2xl rounded-tl-md max-w-[88%] self-start text-xs font-medium flex items-center gap-3"
            >
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 bg-electric/60 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 bg-electric/60 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 bg-electric/60 rounded-full animate-bounce" />
              </div>
              <span className="text-slate-500">Thinking...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-white/[0.04] relative z-20" style={{ background: 'rgba(7, 11, 20, 0.4)', backdropFilter: 'blur(12px)' }}>
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={(e) => handleSubmit(e, q.label)}
                className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-primary px-2.5 py-1.5 rounded-lg transition-all motion-fluid duration-250 border border-white/[0.06] hover:border-electric/20 hover:bg-electric/[0.04]"
              >
                <q.icon className="h-3 w-3 text-electric/50" />
                {q.label}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} autoComplete="off" className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..." 
            disabled={isLoading || isLoadingTranscript}
            className="w-full glass-panel text-slate-200 rounded-xl pl-4 pr-12 py-3 text-[13px] focus:outline-none focus:ring-1 focus:ring-electric/20 focus:border-electric/15 transition-all motion-fluid duration-300 disabled:opacity-40 placeholder:text-muted-foreground/60"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim() || isLoadingTranscript}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all motion-fluid duration-200 disabled:opacity-30 border border-white/[0.06] text-slate-400 hover:text-white hover:bg-electric/10 hover:border-electric/20 disabled:hover:bg-transparent disabled:hover:border-white/[0.06]"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
