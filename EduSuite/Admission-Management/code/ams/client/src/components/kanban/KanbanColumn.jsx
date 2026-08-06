import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import KanbanCard from './KanbanCard';

const STAGE_STYLES = {
  New: 'bg-blue-50 text-blue-700 border-blue-100',
  Contacted: 'bg-purple-50 text-purple-700 border-purple-100',
  'Follow-up': 'bg-amber-50 text-amber-700 border-amber-100',
  Interested: 'bg-cyan-50 text-cyan-700 border-cyan-100',
  'Application Started': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  Converted: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  Lost: 'bg-red-50 text-red-700 border-red-100',
};

const KanbanColumn = ({ stage, enquiries, onOpen, onAdd }) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-64 rounded-xl border ${STAGE_STYLES[stage] || 'bg-gray-50 border-gray-100'} ${
        isOver ? 'ring-2 ring-blue-400' : ''
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide">
          {stage} <span className="opacity-60">({enquiries.length})</span>
        </p>
      </div>
      <div className="px-2 pb-2 max-h-[65vh] overflow-y-auto kanban-column">
        {enquiries.map((e) => (
          <KanbanCard key={e._id} enquiry={e} onOpen={onOpen} />
        ))}
        <button
          onClick={() => onAdd(stage)}
          className="w-full flex items-center justify-center gap-1 text-xs text-gray-500 hover:text-blue-600 py-2 rounded-lg border border-dashed border-gray-300 hover:border-blue-300"
        >
          <Plus size={13} /> Add Card
        </button>
      </div>
    </div>
  );
};

export default KanbanColumn;
