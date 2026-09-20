import dagre from 'dagre';
import { Node, Edge } from '@xyflow/react';

export function parseMermaidMindmap(mermaidCode: string) {
  const lines = mermaidCode.split('\n');
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];
  
  const stack: { depth: number; id: string }[] = [];
  let idCounter = 1;

  for (const line of lines) {
    if (!line.trim() || line.trim() === 'mindmap') continue;
    
    const depthMatch = line.match(/^\s*/);
    const depth = depthMatch ? depthMatch[0].length : 0;
    
    // Extract label: if it has shape markers like ((Label)), extract 'Label'. Otherwise use the text.
    let label = line.trim();
    const match = label.match(/^(?:[^\(\[\{]+)?[\(\[\{]+(.*?)[\)\]\}]+$/);
    if (match) {
      label = match[1];
    }
    
    const id = `node-${idCounter++}`;
    
    // Find parent
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }
    
    if (stack.length > 0) {
      const parentId = stack[stack.length - 1].id;
      initialEdges.push({
        id: `e-${parentId}-${id}`,
        source: parentId,
        target: id,
        type: 'default',
        animated: false,
      });
    }
    
    initialNodes.push({
      id,
      data: { label },
      position: { x: 0, y: 0 },
      type: 'default' // Or a custom type if we want
    });
    
    stack.push({ depth, id });
  }
  
  return { nodes: initialNodes, edges: initialEdges };
}

export function getLayoutedElements(nodes: Node[], edges: Edge[], direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  
  // Standard mindmap layout (left to right)
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

  nodes.forEach((node) => {
    // We estimate width/height based on label length. 
    // Usually React Flow nodes are ~150px wide. 
    // We'll update dimensions properly later if needed, but this is a good estimate.
    const width = 180;
    const height = 50;
    dagreGraph.setNode(node.id, { width, height });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    const width = 180;
    const height = 50;
    
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
