import { Handle, Position } from '@xyflow/react';

export function CustomMindMapNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div className={`px-4 py-3 shadow-sm rounded-xl border bg-background flex items-center justify-center min-w-[150px] transition-colors ${
      selected ? 'border-accent ring-1 ring-accent/30' : 'border-border hover:border-accent/50'
    }`}>
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-muted-foreground/30 border-0" />
      <span className="text-sm font-semibold text-primary text-balance text-center leading-tight">
        {data.label}
      </span>
      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-muted-foreground/30 border-0" />
    </div>
  );
}
