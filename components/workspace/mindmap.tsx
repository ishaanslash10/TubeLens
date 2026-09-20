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
          style: { stroke: 'var(--muted-foreground)', strokeWidth: 1.5, opacity: 0.5 },
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
    <div className="flex flex-col items-center justify-center h-full w-full bg-secondary/10 rounded-xl relative">
      {!mermaidCode && !isLoading && (
        <div className="text-center space-y-6 max-w-sm">
          <div className="h-16 w-16 bg-background border border-border rounded-2xl flex items-center justify-center mx-auto shadow-sm">
            <Network className="h-8 w-8 text-accent" />
          </div>
          <div className="space-y-2">
            <h3 className="font-bold text-lg text-balance">Visual Concept Mapping</h3>
            <p className="text-sm text-muted-foreground text-balance">
              Generate an AI-powered visual graph of the core ideas covered in this video.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoadingTranscript || undefined}
            className="w-full h-12 bg-primary text-background rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-editorial flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoadingTranscript ? (
              <span className="inline-block h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
            ) : (
              <Network className="h-4 w-4" />
            )}
            {isLoadingTranscript ? "Loading Transcript..." : "Generate Mind Map"}
          </button>
          {transcriptError && !error && (
            <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              Limited Context: Transcript unavailable.
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-xs bg-destructive/10 px-4 py-3 rounded-lg border border-destructive/20 text-left">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      )}

      {isLoading && (
        <div className="flex flex-col items-center space-y-6">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 border-4 border-border rounded-full" />
            <div className="absolute inset-0 border-4 border-accent rounded-full border-t-transparent animate-spin" />
            <Network className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground animate-pulse" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold">Analyzing structures</p>
            <p className="text-sm text-muted-foreground">Building conceptual graph...</p>
          </div>
        </div>
      )}

      <div
        className={`w-full h-full overflow-hidden flex flex-col ${
          !mermaidCode || isLoading ? "hidden" : "flex"
        }`}
      >
        <div className="flex justify-between items-center px-4 py-3 border-b border-border bg-background z-10">
           <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Concept Graph</span>
           <button 
             onClick={handleGenerate}
             disabled={isLoadingTranscript || undefined}
             className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-md hover:bg-secondary/50 border border-transparent hover:border-border disabled:opacity-50"
           >
             <RefreshCw className={`h-3 w-3 ${isLoadingTranscript ? 'animate-spin' : ''}`} /> 
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
            className="bg-background/50"
          >
            <Background color="hsl(var(--border))" variant={BackgroundVariant.Dots} gap={24} size={2} />
            <Controls showInteractive={false} className="!bg-background !border-border !shadow-sm !rounded-lg overflow-hidden [&>button]:!border-border [&>button]:!bg-background [&>button]:!text-primary hover:[&>button]:!bg-secondary" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
