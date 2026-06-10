import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

export const severityColors = { critical: 'badge-critical', major: 'badge-major', minor: 'badge-minor', trivial: 'badge-trivial' };
export const priorityColors = { critical: 'badge-critical-priority', high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
export const statusColors = { backlog: 'status-backlog', todo: 'status-todo', in_progress: 'status-in_progress', in_review: 'status-in_review', resolved: 'status-resolved', closed: 'status-closed' };

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateShort = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const statusLabels = {
  backlog: 'Backlog', todo: 'To Do', in_progress: 'In Progress',
  in_review: 'In Review', resolved: 'Resolved', closed: 'Closed',
  done: 'Done', cancelled: 'Cancelled',
};

export const timeAgo = (date) => {
  if (!date) return '';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
};
