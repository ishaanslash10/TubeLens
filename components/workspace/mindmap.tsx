"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useWorkspace } from "./workspace-context";
import { Network, RefreshCw, AlertCircle } from "lucide-react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  MarkerType,
  BackgroundVariant
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { parseMermaidMindmap, getLayoutedElements } from "@/lib/mindmap-utils";
import { CustomMindMapNode } from "./mindmap-node";

const nodeTypes = {
  custom: CustomMindMapNode,
};

export function MindMap() {
  const { videoId, transcript, isLoadingTranscript, transcriptError } = useWorkspace();
  const [mermaidCode, setMermaidCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nodes, setNodes, onNodesChange] = useNodesState<import("@xyflow/react").Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<import("@xyflow/react").Edge>([]);

  useEffect(() => {
    if (mermaidCode) {
      try {
        const parsed = parseMermaidMindmap(mermaidCode);
        
        // Convert to custom node type and style edges
        const styledNodes = parsed.nodes.map(n => ({ ...n, type: 'custom' }));
        const styledEdges = parsed.edges.map(e => ({
          ...e,
          style: { stroke: 'rgba(59, 130, 246, 0.2)', strokeWidth: 1.5 },
        }));

        const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
          styledNodes,
          styledEdges,
          'LR'
        );

        setNodes(layoutedNodes);
        setEdges(layoutedEdges);
      } catch (e) {
        console.error("Failed to parse mind map:", e);
        setTimeout(() => setError("Failed to render mind map structure."), 0);
      }
    }
  }, [mermaidCode, setNodes, setEdges]);

  // Node Click interaction: dim unselected
  const onNodeClick = useCallback((_: any, node: any) => {
    // We can highlight connected nodes, or just rely on default selection
  }, []);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const transcriptText = transcript ? transcript.map(t => t.text).join(" ") : "";

      const res = await fetch("/api/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, transcriptText }),
      });
      if (!res.ok) throw new Error("Failed to generate mind map");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMermaidCode(data.mermaid);
    } catch (e: any) {
      setError(e.message || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-transparent rounded-2xl relative">
      {!mermaidCode && !isLoading && (
        <div className="text-center space-y-5 max-w-xs glass-panel p-7 rounded-2xl">
          <div className="h-14 w-14 rounded-xl glass-panel-active flex items-center justify-center mx-auto">
            <Network className="h-6 w-6 text-electric" />
          </div>
          <div className="space-y-1.5">
            <h3 className="font-semibold text-sm text-balance text-primary">Visual Concept Mapping</h3>
            <p className="text-xs text-muted-foreground text-balance leading-relaxed">
              Generate an AI-powered visual graph of the core ideas covered in this video.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoadingTranscript || undefined}
            className="w-full h-10 rounded-xl text-xs font-medium text-slate-300 hover:text-white transition-all motion-fluid duration-300 flex items-center justify-center gap-2 disabled:opacity-40 border border-electric/15 hover:border-electric/30 hover:bg-electric/[0.06] hover:shadow-blue-glow"
          >
            {isLoadingTranscript ? (
              <span className="inline-block h-3.5 w-3.5 border-[1.5px] border-white/20 border-t-electric rounded-full animate-spin" />
            ) : (
              <Network className="h-3.5 w-3.5 text-electric/70" />
            )}
            {isLoadingTranscript ? "Loading Transcript..." : "Generate Mind Map"}
          </button>
          {transcriptError && !error && (
            <div className="flex items-center gap-2 text-amber-400/80 text-[11px] px-3 py-2 rounded-lg text-left border border-amber-500/10" style={{ background: 'rgba(245, 158, 11, 0.04)' }}>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Limited Context: Transcript unavailable.
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400/80 text-[11px] px-3 py-2 rounded-lg text-left border border-red-500/10" style={{ background: 'rgba(239, 68, 68, 0.04)' }}>
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center space-y-5">
          <div className="relative h-14 w-14">
            <div className="absolute inset-0 border-2 border-white/[0.04] rounded-full" />
            <div className="absolute inset-0 border-2 border-electric rounded-full border-t-transparent animate-spin" />
            <Network className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-medium text-sm text-primary">Analyzing structures</p>
            <p className="text-xs text-muted-foreground">Building conceptual graph...</p>
          </div>
        </div>
      )}

      <div
        className={`w-full h-full overflow-hidden flex flex-col ${
          !mermaidCode || isLoading ? "hidden" : "flex"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-2.5 border-b border-white/[0.04] z-10" style={{ background: 'rgba(7, 11, 20, 0.4)', backdropFilter: 'blur(12px)' }}>
           <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Concept Graph</span>
           <button 
             onClick={handleGenerate}
             disabled={isLoadingTranscript || undefined}
             className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-electric-bright transition-all motion-fluid duration-200 px-2 py-1 rounded-md hover:bg-electric/[0.04] disabled:opacity-40"
           >
             <RefreshCw className={`h-2.5 w-2.5 ${isLoadingTranscript ? 'animate-spin' : ''}`} /> 
             Regenerate
           </button>
        </div>
        <div className="flex-1 w-full h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={2}
            className="bg-transparent"
          >
            <Background color="rgba(59, 130, 246, 0.06)" variant={BackgroundVariant.Dots} gap={24} size={1} />
            <Controls showInteractive={false} className="!bg-[rgba(13,19,35,0.7)] !border-white/[0.06] !backdrop-blur-md !shadow-cinematic !rounded-lg overflow-hidden [&>button]:!border-white/[0.04] [&>button]:!bg-transparent [&>button]:!text-slate-400 hover:[&>button]:!bg-white/[0.04] hover:[&>button]:!text-white transition-colors" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
