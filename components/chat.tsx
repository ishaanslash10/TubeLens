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
    return text.replace(/\[\s*cite:([\d\s\-\,;a-zA-Z]*)\]/gi, (match, inner) => {
      return `[cite](#cite-${inner.trim()})`;
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
                            className="inline-flex items-center text-[11px] font-mono font-semibold bg-accent/15 text-accent hover:bg-accent hover:text-white px-1.5 py-0.5 rounded mx-0.5 align-baseline transition-colors cursor-pointer border border-accent/20"
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
            return <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline" {...props}>{children}</a>;
          },
          h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-5 mb-3 text-primary tracking-tight" {...props} />,
          h2: ({node, ...props}) => <h2 className="text-base font-bold mt-4 mb-2 text-primary tracking-tight" {...props} />,
          h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-3 mb-2 text-primary tracking-tight" {...props} />,
          p: ({node, ...props}) => <p className="mb-3 leading-relaxed last:mb-0 text-[13px]" {...props} />,
          ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1.5 text-[13px]" {...props} />,
          ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 space-y-1.5 text-[13px]" {...props} />,
          li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
          strong: ({node, ...props}) => <strong className="font-semibold text-primary" {...props} />,
          em: ({node, ...props}) => <em className="italic" {...props} />,
          code: ({node, className, children, ...props}: any) => {
             const isInline = !className;
             return isInline ? 
               <code className="bg-secondary/40 text-primary px-1.5 py-0.5 rounded text-[12px] font-mono" {...props}>{children}</code> :
               <code className="block bg-secondary/20 p-3 rounded-lg text-xs font-mono overflow-x-auto border border-border my-3" {...props}>{children}</code>
          }
        }}
      >
        {processedText}
      </ReactMarkdown>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background z-10 w-full relative font-sans">
      <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-secondary/5 z-20">
        <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" /> Chat
        </div>
        <div className="flex items-center gap-2 px-2 py-1 bg-background border border-border rounded text-[10px] uppercase tracking-wider font-semibold">
          {isLoadingTranscript ? (
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full border-2 border-accent border-t-transparent animate-spin" />
              Loading Context
            </div>
          ) : transcriptError ? (
            <div className="flex items-center gap-1.5 text-destructive">
              <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
              Limited Context
            </div>
          ) : (
            <>
              <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Ready
            </>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col bg-background/50">
        <AnimatePresence initial={false}>
          {messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, type: "spring", bounce: 0 }}
              key={idx} 
              className={`p-4 max-w-[85%] text-sm shadow-sm ${
                msg.role === 'assistant' 
                  ? 'bg-secondary/30 border border-border text-foreground rounded-2xl rounded-tl-sm self-start whitespace-pre-wrap leading-relaxed' 
                  : 'bg-primary text-background rounded-2xl rounded-tr-sm self-end whitespace-pre-wrap leading-relaxed'
              }`}
            >
              {renderMessageContent(msg.text, msg.role)}
            </motion.div>
          ))}
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-secondary/30 border border-border text-muted-foreground p-4 rounded-2xl rounded-tl-sm max-w-[85%] self-start text-xs font-medium shadow-sm flex items-center gap-3"
            >
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="h-1.5 w-1.5 bg-accent rounded-full animate-bounce" />
              </div>
              Thinking...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-6 bg-background border-t border-border">
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={(e) => handleSubmit(e, q.label)}
                className="flex items-center gap-1.5 text-xs font-medium bg-secondary/30 text-foreground hover:bg-accent hover:text-white px-3 py-2 rounded-md transition-all border border-border hover:border-accent"
              >
                <q.icon className="h-3 w-3" />
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
            className="w-full bg-secondary/20 text-foreground rounded-lg pl-4 pr-12 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all disabled:opacity-50 border border-border focus:border-accent placeholder:text-muted-foreground/60"
          />
          <button 
            type="submit"
            disabled={isLoading || !input.trim() || isLoadingTranscript}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-background rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-sm disabled:hover:bg-primary"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
