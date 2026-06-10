import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { cn, formatDate, timeAgo } from '../utils/cn';
import { Activity, Bug, GitBranch, MessageSquare, User, ArrowRight, Filter } from 'lucide-react';

const ACTION_LABELS = {
  bug_created: 'created bug',
  bug_updated: 'updated bug',
  bug_deleted: 'deleted bug',
  bug_status_changed: 'changed bug status',
  comment_created: 'commented on',
  comment_deleted: 'deleted comment',
  sprint_created: 'created sprint',
  sprint_started: 'started sprint',
  sprint_completed: 'completed sprint',
  user_joined: 'joined project',
  user_left: 'left project',
  task_created: 'created task',
  task_status_changed: 'changed task status',
  task_deleted: 'deleted task',
  story_created: 'created story',
  story_status_changed: 'changed story status',
  story_deleted: 'deleted story',
};

const ACTION_ICONS = {
  bug_created: Bug,
  bug_updated: Bug,
  bug_status_changed: ArrowRight,
  comment_created: MessageSquare,
  sprint_created: GitBranch,
  sprint_started: GitBranch,
  sprint_completed: GitBranch,
  task_created: Activity,
  story_created: Activity,
  user_joined: User,
};

export default function ProjectActivity() {
  const { projectId } = useParams();
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const { data: activities, isLoading } = useQuery({
    queryKey: ['activities', projectId, entityFilter, actionFilter],
    queryFn: () => {
      const params = new URLSearchParams();
      if (entityFilter) params.set('entityType', entityFilter);
      if (actionFilter) params.set('action', actionFilter);
      return api.get(`/projects/${projectId}/activity?${params}`).then(r => r.data.data);
    },
  });

  const getEntityLink = (activity) => {
    if (activity.entityType === 'bug' && activity.bug?._id) {
      return `/projects/${projectId}/bugs/${activity.bug._id}`;
    }
    return null;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6" /> Activity</h1>
        <div className="flex gap-2">
          <select className="input text-sm w-auto" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="bug">Bugs</option>
            <option value="task">Tasks</option>
            <option value="story">Stories</option>
            <option value="sprint">Sprints</option>
            <option value="comment">Comments</option>
          </select>
          <select className="input text-sm w-auto" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            <option value="">All actions</option>
            <option value="bug_created">Created</option>
            <option value="bug_status_changed">Status changed</option>
            <option value="comment_created">Comments</option>
            <option value="sprint_created">Sprints</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>
      ) : activities?.length === 0 ? (
        <div className="card p-12 text-center text-secondary-400">
          <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No activity yet</p>
        </div>
      ) : (
        <div className="space-y-1">
          {activities?.map((a, i) => {
            const Icon = ACTION_ICONS[a.action] || Activity;
            const label = ACTION_LABELS[a.action] || a.action;
            const link = getEntityLink(a);
            const content = (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary-50 dark:hover:bg-secondary-800/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{a.user?.fullName || 'Unknown'}</span>
                    <span className="text-sm text-secondary-500">{label}</span>
                    {a.bug?.title && <span className="text-sm text-primary-600 truncate">{a.bug.title}</span>}
                    {a.details?.title && <span className="text-sm text-primary-600 truncate">{a.details.title}</span>}
                    {a.details?.status && (
                      <span className="text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                        {a.details.status}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondary-400 mt-0.5">{timeAgo(a.createdAt)}</p>
                </div>
              </div>
            );

            if (link) {
              return <Link key={a._id} to={link}>{content}</Link>;
            }
            return <div key={a._id}>{content}</div>;
          })}
        </div>
      )}
    </div>
  );
}