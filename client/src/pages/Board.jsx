import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useSocket } from '../store/SocketContext';
import { Plus } from 'lucide-react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, statusLabels, priorityColors } from '../utils/cn';
import toast from 'react-hot-toast';

const COLUMN_STATUS_MAP = {
  backlog: 'backlog',
  todo: 'todo',
  in_progress: 'in_progress',
  in_review: 'in_review',
  done: 'resolved',
};

const columns = ['backlog', 'todo', 'in_progress', 'in_review', 'done'];

const columnColors = {
  backlog: 'bg-secondary-100 dark:bg-secondary-800/50',
  todo: 'bg-primary-50 dark:bg-primary-900/10',
  in_progress: 'bg-primary-100 dark:bg-primary-800/30',
  in_review: 'bg-secondary-100 dark:bg-secondary-800/50',
  done: 'bg-green-50 dark:bg-green-900/10',
};

function BugCard({ bug }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: bug._id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={cn('p-3 bg-white dark:bg-secondary-700 rounded-lg border border-secondary-200 dark:border-secondary-600 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow', isDragging && 'opacity-50')}>
      <Link to={`/projects/${bug.project}/bugs/${bug._id}`} className="block">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', priorityColors[bug.priority])}>{bug.priority}</span>
          <span className="text-xs text-secondary-400">{bug.severity}</span>
        </div>
        <p className="text-sm font-medium mb-1 line-clamp-2">{bug.title}</p>
        {bug.assignee && (
          <div className="flex items-center gap-1.5 mt-2">
            <div className="w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">
              {bug.assignee.fullName?.charAt(0)}
            </div>
            <span className="text-xs text-secondary-500">{bug.assignee.fullName?.split(' ')[0]}</span>
          </div>
        )}
      </Link>
    </div>
  );
}

function Column({ title, status, bugs, children }) {
  const { setNodeRef } = useDroppable({ id: `column-${status}` });

  return (
    <div className={cn('flex-1 min-w-[250px] rounded-xl p-3', columnColors[status])}>
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-sm font-semibold text-secondary-700 dark:text-secondary-300">{title} <span className="ml-1.5 text-xs text-secondary-400">({bugs?.length || 0})</span></h3>
      </div>
      <div ref={setNodeRef} className="space-y-2 min-h-[200px]">
        {children}
      </div>
    </div>
  );
}

export default function Board() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const { socket, joinProject, leaveProject } = useSocket();
  const [activeBug, setActiveBug] = useState(null);

  const { data: bugs } = useQuery({
    queryKey: ['bugs', projectId],
    queryFn: () => api.get(`/projects/${projectId}/bugs`).then(r => r.data.data),
  });

  useEffect(() => { joinProject(projectId); return () => leaveProject(projectId); }, [projectId]);
  useEffect(() => {
    if (!socket) return;
    const handler = (data) => { queryClient.invalidateQueries(['bugs', projectId]); };
    socket.on('bug_updated', handler);
    socket.on('bug_created', handler);
    socket.on('card_moved', handler);
    return () => { socket.off('bug_updated', handler); socket.off('bug_created', handler); socket.off('card_moved', handler); };
  }, [socket, projectId, queryClient]);

  const updateMutation = useMutation({
    mutationFn: ({ bugId, data }) => api.patch(`/projects/${projectId}/bugs/${bugId}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['bugs', projectId]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragStart = (event) => {
    const bug = bugs?.find(b => b._id === event.active.id);
    if (bug) setActiveBug(bug);
  };

  const handleDragEnd = async (event) => {
    setActiveBug(null);
    const { active, over } = event;
    if (!over) return;
    const bugId = active.id;
    const bug = bugs?.find(b => b._id === bugId);
    if (!bug) return;

    let targetStatus = over.data.current?.sortable?.containerId;
    if (!targetStatus) {
      if (typeof over.id === 'string' && over.id.startsWith('column-')) {
        targetStatus = over.id.replace('column-', '');
      } else {
        return;
      }
    }
    targetStatus = COLUMN_STATUS_MAP[targetStatus] || targetStatus;

    if (targetStatus !== bug.status) {
      updateMutation.mutate({ bugId, data: { status: targetStatus } });
    }
  };

  const getBugsByStatus = (status) => {
    const s = COLUMN_STATUS_MAP[status] || status;
    return bugs?.filter(b => b.status === s) || [];
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kanban Board</h1>
        <Link to={`/projects/${projectId}/bugs/new`} className="btn-primary"><Plus className="w-4 h-4" /> New Bug</Link>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map(col => {
            const colBugs = getBugsByStatus(col);
            return (
              <Column key={col} status={col} title={statusLabels[COLUMN_STATUS_MAP[col]]} bugs={colBugs}>
                <SortableContext id={col} items={colBugs.map(b => b._id)} strategy={verticalListSortingStrategy}>
                  {colBugs.map(bug => <BugCard key={bug._id} bug={bug} />)}
                </SortableContext>
              </Column>
            );
          })}
        </div>
        <DragOverlay>{activeBug ? <div className="p-3 bg-white dark:bg-secondary-700 rounded-lg border-2 border-primary-500 shadow-xl"><p className="text-sm font-medium">{activeBug.title}</p></div> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
