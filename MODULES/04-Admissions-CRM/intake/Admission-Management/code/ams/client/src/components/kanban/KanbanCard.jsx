import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { MoreVertical } from 'lucide-react';

const KanbanCard = ({ enquiry, onOpen }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: enquiry._id,
    data: { enquiry },
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(enquiry)}
      className={`bg-white rounded-lg border border-gray-200 p-3 mb-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-semibold text-gray-800">{enquiry.studentName}</p>
        <MoreVertical size={14} className="text-gray-300 shrink-0 mt-0.5" />
      </div>
      <p className="text-xs text-gray-500 mt-0.5">{enquiry.source}</p>
      <p className="text-[11px] text-gray-400 mt-1">
        {new Date(enquiry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      </p>
      {enquiry.counselor?.name && (
        <div className="mt-2 inline-flex items-center gap-1 text-[11px] bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5 text-gray-500">
          {enquiry.counselor.name}
        </div>
      )}
    </div>
  );
};

export default KanbanCard;
