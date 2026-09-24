import { Handle, Position } from '@xyflow/react';

export function CustomMindMapNode({ data, selected }: { data: any; selected: boolean }) {
  return (
    <div className={`px-4 py-2.5 rounded-xl flex items-center justify-center min-w-[140px] transition-all motion-fluid duration-300 ${
      selected 
        ? 'glass-panel-active shadow-blue-glow border-electric/20' 
        : 'glass-panel border-white/[0.06] hover:border-white/[0.1] hover:shadow-blue-glow'
    }`}>
      <Handle type="target" position={Position.Left} className="w-1.5 h-1.5 !bg-electric/40 border-0" />
      <span className="text-xs font-medium text-slate-200 text-balance text-center leading-tight">
        {data.label}
      </span>
      <Handle type="source" position={Position.Right} className="w-1.5 h-1.5 !bg-electric/40 border-0" />
    </div>
  );
}
