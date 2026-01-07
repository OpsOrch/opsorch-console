'use client';

import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { OrchestrationStep, StepStatus } from '@/app/lib/types';

interface ManualStepNodeData {
  step: OrchestrationStep;
  status: StepStatus;
  statusColor: string;
  onClick?: (stepId: string) => void;
}

export function ManualStepNode({ data }: NodeProps) {
  const { step, status, statusColor, onClick } = data as unknown as ManualStepNodeData;

  const handleClick = () => {
    if (onClick) {
      onClick(step.id);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'succeeded':
        return '✓';
      case 'failed':
        return '✗';
      case 'running':
        return '⟳';
      case 'blocked':
        return '⚠';
      case 'ready':
        return '▶';
      case 'pending':
        return '⏸';
      case 'skipped':
        return '⏭';
      case 'cancelled':
        return '⏹';
      default:
        return '○';
    }
  };

  return (
    <div
      className={`
        px-4 py-3 shadow-md rounded-md bg-white border-2 min-w-[200px] cursor-pointer
        hover:shadow-lg transition-shadow duration-200
      `}
      style={{ borderColor: statusColor }}
      onClick={handleClick}
    >
      <Handle type="target" position={Position.Left} />
      
      <div className="flex items-center gap-2 mb-1">
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: statusColor }}
        >
          👤
        </div>
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Manual
        </div>
        <div className="ml-auto text-lg" style={{ color: statusColor }}>
          {getStatusIcon()}
        </div>
      </div>
      
      <div className="font-medium text-gray-900 text-sm mb-1">
        {step.title}
      </div>
      
      {step.description && (
        <div className="text-xs text-gray-600 line-clamp-2">
          {step.description}
        </div>
      )}
      
      <div className="mt-2 text-xs font-medium" style={{ color: statusColor }}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>

      <Handle type="source" position={Position.Right} />
    </div>
  );
}