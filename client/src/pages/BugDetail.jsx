import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { useSocket } from '../store/SocketContext';
import { cn, severityColors, priorityColors, statusColors, statusLabels, formatDate } from '../utils/cn';
import { MessageSquare, Paperclip, Sparkles, Send, Edit3, Trash2, Clock, User, AlertCircle, AtSign, Plus, Eye, EyeOff, Tag, CheckSquare, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../store/AuthContext';
import ReactMarkdown from 'react-markdown';
import toast from 'react-hot-toast';

const EMOJIS = ['👍', '❤️', '🎉', '🚀', '😄', '😕'];

const extractMentions = (text) => {
  const mentions = text.match(/@(\w+)/g);
  return mentions ? mentions.map(m => m.slice(1)) : [];
};

const getReplies = (comments, parentId) => comments?.filter(c => c.parentComment === parentId) || [];

const hasReacted = (reactions, userId, emoji) => reactions?.some(r => r.emoji === emoji && r.user?._id === userId);

function CommentItem({ comment, currentUser, projectId, bugId, editingComment, editBody, setEditingComment, setEditBody, editCommentMutation, deleteCommentMutation, replyToComment, setReplyToComment, replyBody, setReplyBody, replyMutation, reactionMutation, removeReactionMutation, project, isReply }) {
  const isOwner = currentUser?._id === comment.author?._id;

  return (
    <div className="flex gap-3 group">
      <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mt-0.5">{comment.author?.fullName?.charAt(0)}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.author?.fullName}</span>
          <span className="text-xs text-secondary-400">{formatDate(comment.createdAt)}</span>
          {comment.isEdited && <span className="text-xs text-secondary-400">(edited)</span>}
        </div>
        {editingComment === comment._id ? (
          <div className="mt-1">
            <textarea className="input min-h-[60px] text-sm" value={editBody} onChange={e => setEditBody(e.target.value)} />
            <div className="flex gap-2 mt-2">
              <button onClick={() => editCommentMutation.mutate({ commentId: comment._id, body: editBody })} className="btn-primary btn-sm">Save</button>
              <button onClick={() => setEditingComment(null)} className="btn-secondary btn-sm">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="prose dark:prose-invert prose-sm max-w-none mt-1"><ReactMarkdown>{comment.body}</ReactMarkdown></div>
        )}

        <div className="flex items-center gap-1 mt-1 flex-wrap">
          {comment.reactions?.reduce((acc, r) => {
            const existing = acc.find(a => a.emoji === r.emoji);
            if (existing) existing.users.push(r.user);
            else acc.push({ emoji: r.emoji, users: [r.user] });
            return acc;
          }, []).map(group => {
            const reacted = group.users.some(u => u?._id === currentUser?._id);
            return (
              <button
                key={group.emoji}
                onClick={() => reacted
                  ? removeReactionMutation.mutate({ commentId: comment._id, emoji: group.emoji })
                  : reactionMutation.mutate({ commentId: comment._id, emoji: group.emoji })
                }
                className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 text-xs rounded-full border transition-colors', reacted ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-300 dark:border-primary-700' : 'border-secondary-200 dark:border-secondary-700 hover:bg-secondary-100 dark:hover:bg-secondary-700')}
              >
                <span>{group.emoji}</span>
                <span className="text-secondary-500">{group.users.length}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => setReplyToComment(replyToComment === comment._id ? null : comment._id)} className="text-xs text-secondary-400 hover:text-primary-600 flex items-center gap-1"><MessageSquare className="w-3 h-3" /> Reply</button>
          {EMOJIS.map(emoji => (
            <button key={emoji} onClick={() => reactionMutation.mutate({ commentId: comment._id, emoji })} className="text-xs hover:scale-125 transition-transform">{emoji}</button>
          ))}
          {isOwner && (
            <>
              <button onClick={() => { setEditingComment(comment._id); setEditBody(comment.body); }} className="text-xs text-secondary-400 hover:text-primary-600 flex items-center gap-1"><Edit3 className="w-3 h-3" /> Edit</button>
              <button onClick={() => { if (confirm('Delete this comment?')) deleteCommentMutation.mutate(comment._id); }} className="text-xs text-secondary-400 hover:text-danger flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
            </>
          )}
        </div>

        {replyToComment === comment._id && (
          <div className="mt-2 flex gap-2">
            <input className="input flex-1 text-sm" placeholder="Write a reply..." value={replyBody} onChange={e => setReplyBody(e.target.value)} autoFocus />
            <button onClick={() => replyMutation.mutate({ body: replyBody, parentComment: comment._id })} disabled={!replyBody.trim() || replyMutation.isPending} className="btn-primary btn-sm"><Send className="w-3.5 h-3.5" /></button>
            <button onClick={() => { setReplyToComment(null); setReplyBody(''); }} className="btn-secondary btn-sm">Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BugDetail() {
  const { projectId, bugId } = useParams();
  const queryClient = useQueryClient();
  const { socket, startTyping, stopTyping, getTypingForBug } = useSocket();
  const { user: currentUser } = useAuth();
  const typingRef = useRef(null);
  const typingUsers = getTypingForBug(bugId);
  const [comment, setComment] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [errorInput, setErrorInput] = useState('');
  const [stackTrace, setStackTrace] = useState('');
  const [mentionSearch, setMentionSearch] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [replyToComment, setReplyToComment] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const commentsEndRef = useRef(null);
  const commentInputRef = useRef(null);

  const { data: bug, isLoading } = useQuery({
    queryKey: ['bug', bugId],
    queryFn: () => api.get(`/projects/${projectId}/bugs/${bugId}`).then(r => r.data.data),
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', bugId],
    queryFn: () => api.get(`/projects/${projectId}/bugs/${bugId}/comments`).then(r => r.data.data),
  });

  const { data: projectLabels } = useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => api.get(`/projects/${projectId}/bugs/labels`).then(r => r.data.data),
  });

  useEffect(() => { commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [comments]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => { queryClient.invalidateQueries(['comments', bugId]); };
    socket.on('comment_created', handler);
    return () => socket.off('comment_created', handler);
  }, [socket, bugId, queryClient]);

  const updateMutation = useMutation({
    mutationFn: (data) => api.patch(`/projects/${projectId}/bugs/${bugId}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['bug', bugId]); toast.success('Updated!'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => api.get(`/projects/${projectId}`).then(r => r.data.data),
    enabled: !!projectId,
  });

  const commentMutation = useMutation({
    mutationFn: (body) => {
      const mentions = extractMentions(body);
      return api.post(`/projects/${projectId}/bugs/${bugId}/comments`, { body, mentions });
    },
    onSuccess: () => { queryClient.invalidateQueries(['comments', bugId]); setComment(''); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add comment'),
  });

  const editCommentMutation = useMutation({
    mutationFn: ({ commentId, body }) => api.patch(`/projects/${projectId}/bugs/${bugId}/comments/${commentId}`, { body }),
    onSuccess: () => { queryClient.invalidateQueries(['comments', bugId]); setEditingComment(null); setEditBody(''); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to edit comment'),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId) => api.delete(`/projects/${projectId}/bugs/${bugId}/comments/${commentId}`),
    onSuccess: () => { queryClient.invalidateQueries(['comments', bugId]); toast.success('Comment deleted'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete comment'),
  });

  const replyMutation = useMutation({
    mutationFn: ({ body, parentComment, mentions }) => api.post(`/projects/${projectId}/bugs/${bugId}/comments`, { body, parentComment, mentions }),
    onSuccess: () => { queryClient.invalidateQueries(['comments', bugId]); setReplyBody(''); setReplyToComment(null); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reply'),
  });

  const reactionMutation = useMutation({
    mutationFn: ({ commentId, emoji }) => api.post(`/projects/${projectId}/bugs/${bugId}/comments/${commentId}/reactions`, { emoji }),
    onSuccess: () => { queryClient.invalidateQueries(['comments', bugId]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add reaction'),
  });

  const removeReactionMutation = useMutation({
    mutationFn: ({ commentId, emoji }) => api.delete(`/projects/${projectId}/bugs/${bugId}/comments/${commentId}/reactions/${encodeURIComponent(emoji)}`),
    onSuccess: () => { queryClient.invalidateQueries(['comments', bugId]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove reaction'),
  });

  const addSubtaskMutation = useMutation({
    mutationFn: (title) => api.post(`/projects/${projectId}/bugs/${bugId}/subtasks`, { title }),
    onSuccess: () => { queryClient.invalidateQueries(['bug', bugId]); setNewSubtask(''); toast.success('Subtask added'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add subtask'),
  });

  const updateSubtaskMutation = useMutation({
    mutationFn: ({ subtaskId, data }) => api.patch(`/projects/${projectId}/bugs/${bugId}/subtasks/${subtaskId}`, data),
    onSuccess: () => { queryClient.invalidateQueries(['bug', bugId]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update subtask'),
  });

  const deleteSubtaskMutation = useMutation({
    mutationFn: (subtaskId) => api.delete(`/projects/${projectId}/bugs/${bugId}/subtasks/${subtaskId}`),
    onSuccess: () => { queryClient.invalidateQueries(['bug', bugId]); toast.success('Subtask removed'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove subtask'),
  });

  const addWatcherMutation = useMutation({
    mutationFn: () => api.post(`/projects/${projectId}/bugs/${bugId}/watchers`),
    onSuccess: () => { queryClient.invalidateQueries(['bug', bugId]); toast.success('Watching this bug'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add watcher'),
  });

  const removeWatcherMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${projectId}/bugs/${bugId}/watchers`),
    onSuccess: () => { queryClient.invalidateQueries(['bug', bugId]); toast.success('No longer watching'); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove watcher'),
  });

  const addLabelMutation = useMutation({
    mutationFn: (label) => api.post(`/projects/${projectId}/bugs/${bugId}/labels`, { label }),
    onSuccess: () => { queryClient.invalidateQueries(['bug', bugId]); setNewLabel(''); setShowLabelInput(false); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to add label'),
  });

  const removeLabelMutation = useMutation({
    mutationFn: (label) => api.delete(`/projects/${projectId}/bugs/${bugId}/labels/${encodeURIComponent(label)}`),
    onSuccess: () => { queryClient.invalidateQueries(['bug', bugId]); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to remove label'),
  });

  const handleAiExplain = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/bugs/${bugId}/ai/explain`, { errorMessage: errorInput, stackTrace });
      setAiResult(data.data);
      setShowAi(true);
    } catch (err) { toast.error(err.response?.data?.message || 'AI analysis failed'); }
    finally { setAiLoading(false); }
  };

  const handleAiFix = async () => {
    setAiLoading(true);
    try {
      const { data } = await api.post(`/projects/${projectId}/bugs/${bugId}/ai/suggest-fix`);
      setAiResult(data.data);
      setShowAi(true);
    } catch (err) { toast.error(err.response?.data?.message || 'AI fix suggestion failed'); }
    finally { setAiLoading(false); }
  };

  const isWatching = bug?.watchers?.some(w => (w._id || w) === currentUser?._id);

  if (isLoading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (!bug) return <p>Bug not found</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
      <div className="lg:col-span-2 space-y-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn('text-xs', statusColors[bug.status])}>{statusLabels[bug.status]}</span>
            <span className={cn('text-xs', severityColors[bug.severity])}>{bug.severity}</span>
            <span className={cn('text-xs', priorityColors[bug.priority])}>{bug.priority}</span>
          </div>
          <h1 className="text-2xl font-bold mt-2">{bug.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-secondary-500">
            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {bug.reporter?.fullName || 'Unknown'}</span>
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatDate(bug.createdAt)}</span>
          </div>

          {bug.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {bug.labels.map(label => (
                <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                  <Tag className="w-3 h-3" />
                  {label}
                  <button onClick={() => removeLabelMutation.mutate(label)} className="hover:text-primary-900 dark:hover:text-primary-100 ml-0.5">&times;</button>
                </span>
              ))}
            </div>
          )}

          <div className="prose dark:prose-invert max-w-none mt-4">
            <p>{bug.description || 'No description provided.'}</p>
          </div>
          {bug.stepsToReproduce && (
            <div className="mt-4">
              <h3 className="font-semibold mb-1">Steps to Reproduce</h3>
              <p className="text-sm text-secondary-600 dark:text-secondary-400 whitespace-pre-wrap">{bug.stepsToReproduce}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4 mt-4">
            {bug.expectedBehavior && <div><h3 className="font-semibold text-sm">Expected</h3><p className="text-sm text-secondary-600 dark:text-secondary-400">{bug.expectedBehavior}</p></div>}
            {bug.actualBehavior && <div><h3 className="font-semibold text-sm">Actual</h3><p className="text-sm text-secondary-600 dark:text-secondary-400">{bug.actualBehavior}</p></div>}
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">
            <select className="input w-auto text-sm" value={bug.status} onChange={e => updateMutation.mutate({ status: e.target.value })}>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={handleAiExplain} disabled={aiLoading} className="btn-secondary btn-sm"><Sparkles className="w-3.5 h-3.5" /> AI Explain</button>
            <button onClick={handleAiFix} disabled={aiLoading} className="btn-secondary btn-sm"><Sparkles className="w-3.5 h-3.5" /> AI Fix</button>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Subtasks ({bug.subtasks?.filter(s => s.status === 'done').length || 0}/{bug.subtasks?.length || 0})</h3>
          <div className="space-y-1 mb-3">
            {bug.subtasks?.map(sub => (
              <div key={sub._id} className="flex items-center gap-2 group">
                <button onClick={() => updateSubtaskMutation.mutate({ subtaskId: sub._id, data: { completed: sub.status !== 'done' } })} className="flex-shrink-0">
                  {sub.status === 'done' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Circle className="w-4 h-4 text-secondary-400 hover:text-primary-500" />}
                </button>
                <span className={cn('text-sm flex-1', sub.status === 'done' && 'line-through text-secondary-400')}>{sub.title}</span>
                <button onClick={() => deleteSubtaskMutation.mutate(sub._id)} className="opacity-0 group-hover:opacity-100 text-secondary-400 hover:text-danger transition-opacity"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); if (newSubtask.trim()) addSubtaskMutation.mutate(newSubtask.trim()); }} className="flex gap-2">
            <input className="input flex-1 text-sm" placeholder="Add subtask..." value={newSubtask} onChange={e => setNewSubtask(e.target.value)} />
            <button type="submit" disabled={!newSubtask.trim() || addSubtaskMutation.isPending} className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5" /></button>
          </form>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comments ({comments?.length || 0})</h3>
          <div className="space-y-4 mb-4">
            {comments?.filter(c => !c.parentComment).map(c => (
              <div key={c._id}>
                <CommentItem
                  comment={c}
                  currentUser={currentUser}
                  projectId={projectId}
                  bugId={bugId}
                  editingComment={editingComment}
                  editBody={editBody}
                  setEditingComment={setEditingComment}
                  setEditBody={setEditBody}
                  editCommentMutation={editCommentMutation}
                  deleteCommentMutation={deleteCommentMutation}
                  replyToComment={replyToComment}
                  setReplyToComment={setReplyToComment}
                  replyBody={replyBody}
                  setReplyBody={setReplyBody}
                  replyMutation={replyMutation}
                  reactionMutation={reactionMutation}
                  removeReactionMutation={removeReactionMutation}
                  project={project}
                />
                {getReplies(comments, c._id).length > 0 && (
                  <div className="ml-10 mt-2 space-y-2 border-l-2 border-secondary-200 dark:border-secondary-700 pl-4">
                    {getReplies(comments, c._id).map(reply => (
                      <CommentItem
                        key={reply._id}
                        comment={reply}
                        currentUser={currentUser}
                        projectId={projectId}
                        bugId={bugId}
                        editingComment={editingComment}
                        editBody={editBody}
                        setEditingComment={setEditingComment}
                        setEditBody={setEditBody}
                        editCommentMutation={editCommentMutation}
                        deleteCommentMutation={deleteCommentMutation}
                        replyToComment={replyToComment}
                        setReplyToComment={setReplyToComment}
                        replyBody={replyBody}
                        setReplyBody={setReplyBody}
                        replyMutation={replyMutation}
                        reactionMutation={reactionMutation}
                        removeReactionMutation={removeReactionMutation}
                        project={project}
                        isReply
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={commentsEndRef} />
          </div>
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <input ref={commentInputRef} className="input w-full pr-8" placeholder="Write a comment... @mention users (Markdown supported)" value={comment} onChange={e => {
                setComment(e.target.value);
                const match = e.target.value.match(/@(\w*)$/);
                setMentionSearch(match ? match[1] : '');
                setShowMentions(!!match);
                if (e.target.value) {
                  startTyping(projectId, bugId);
                  clearTimeout(typingRef.current);
                  typingRef.current = setTimeout(() => stopTyping(projectId, bugId), 2000);
                } else {
                  stopTyping(projectId, bugId);
                }
              }} onKeyDown={e => { if (e.key === 'Escape') setShowMentions(false); }} />
              <AtSign className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              {showMentions && project?.members?.length > 0 && (
                <div className="absolute bottom-full mb-1 left-0 w-full bg-white dark:bg-secondary-800 border border-secondary-200 dark:border-secondary-700 rounded-lg shadow-lg max-h-32 overflow-y-auto z-10">
                  {project.members.filter(m => m.user?.fullName?.toLowerCase().includes(mentionSearch.toLowerCase())).map(m => (
                    <button key={m.user?._id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 dark:hover:bg-primary-900/20 flex items-center gap-2" onClick={() => { setComment(prev => prev.replace(/@\w*$/, `@${m.user.fullName} `)); setShowMentions(false); commentInputRef.current?.focus(); }}>
                      <User className="w-3.5 h-3.5 text-secondary-400" />{m.user?.fullName || m.user?.email}
                    </button>
                  ))}
                </div>
              )}
              {typingUsers.filter(t => t.userId !== currentUser?._id).length > 0 && (
                <p className="text-xs text-secondary-400 mt-1 italic">
                  {typingUsers.filter(t => t.userId !== currentUser?._id).map(t => t.fullName).join(', ')} typing...
                </p>
              )}
            </div>
            <button onClick={() => commentMutation.mutate(comment)} disabled={!comment.trim() || commentMutation.isPending} className="btn-primary"><Send className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Details</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-secondary-500">Status</span><span className={cn('text-xs', statusColors[bug.status])}>{statusLabels[bug.status]}</span></div>
            <div className="flex justify-between"><span className="text-secondary-500">Severity</span><span className={cn('text-xs', severityColors[bug.severity])}>{bug.severity}</span></div>
            <div className="flex justify-between"><span className="text-secondary-500">Priority</span><span className={cn('text-xs', priorityColors[bug.priority])}>{bug.priority}</span></div>
            <div className="flex justify-between"><span className="text-secondary-500">Assignee</span><span>{bug.assignee?.fullName || 'Unassigned'}</span></div>
            <div className="flex justify-between"><span className="text-secondary-500">Reporter</span><span>{bug.reporter?.fullName || 'Unknown'}</span></div>
            {bug.dueDate && <div className="flex justify-between"><span className="text-secondary-500">Due Date</span><span>{formatDate(bug.dueDate)}</span></div>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" /> Labels
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {bug.labels?.length > 0 ? bug.labels.map(label => (
              <span key={label} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs rounded-full">
                {label}
                <button onClick={() => removeLabelMutation.mutate(label)} className="hover:text-danger ml-0.5">&times;</button>
              </span>
            )) : <span className="text-xs text-secondary-400">No labels</span>}
          </div>
          {showLabelInput ? (
            <form onSubmit={e => { e.preventDefault(); if (newLabel.trim()) addLabelMutation.mutate(newLabel.trim()); }} className="flex gap-1">
              <input className="input flex-1 text-xs" placeholder="Label name..." value={newLabel} onChange={e => setNewLabel(e.target.value)} autoFocus />
              <button type="submit" disabled={!newLabel.trim()} className="btn-primary btn-xs">Add</button>
              <button type="button" onClick={() => { setShowLabelInput(false); setNewLabel(''); }} className="btn-secondary btn-xs">Cancel</button>
            </form>
          ) : (
            <button onClick={() => setShowLabelInput(true)} className="btn-secondary btn-xs w-full"><Plus className="w-3 h-3" /> Add Label</button>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">{isWatching ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} Watchers ({bug.watchers?.length || 0})</h3>
            {isWatching ? (
              <button onClick={() => removeWatcherMutation.mutate()} className="btn-secondary btn-xs">Unwatch</button>
            ) : (
              <button onClick={() => addWatcherMutation.mutate()} className="btn-primary btn-xs"><Eye className="w-3 h-3" /> Watch</button>
            )}
          </div>
          <div className="space-y-2">
            {bug.watchers?.length > 0 ? bug.watchers.map(w => (
              <div key={w._id} className="flex items-center gap-2 text-sm">
                <div className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-medium">{w.fullName?.charAt(0) || '?'}</div>
                <span>{w.fullName || w.email || 'Unknown'}</span>
              </div>
            )) : <span className="text-xs text-secondary-400">No watchers</span>}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><Paperclip className="w-4 h-4" /> Attachments ({bug.attachments?.length || 0})</h3>
          {bug.attachments?.length > 0 ? (
            <div className="space-y-2">
              {bug.attachments.map(a => (
                <a key={a._id} href={a.url} target="_blank" className="flex items-center gap-2 text-sm text-primary-600 hover:underline">
                  <Paperclip className="w-3 h-3 flex-shrink-0" />{a.originalName}
                </a>
              ))}
            </div>
          ) : <span className="text-xs text-secondary-400">No attachments</span>}
        </div>

        {bug.aiExplanation && (
          <div className="card p-5 border-primary-200 dark:border-primary-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary-600" /> AI Analysis</h3>
            <div className="space-y-2 text-sm">
              <p><strong>Root Cause:</strong> {bug.aiExplanation.rootCause}</p>
              <p><strong>Impact:</strong> {bug.aiExplanation.impact}</p>
              <p><strong>Recommended Actions:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                {bug.aiExplanation.recommendedActions?.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>
        )}

        {showAi && aiResult && (
          <div className="card p-5 border-primary-200 dark:border-primary-800">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary-600" /> AI Result</h3>
            <div className="text-sm space-y-2">
              {aiResult.fixes?.map((f, i) => (
                <div key={i} className="p-3 bg-secondary-50 dark:bg-secondary-700/50 rounded-lg">
                  <p className="font-medium">{f.description}</p>
                  {f.codeSnippet && <pre className="mt-1 p-2 bg-secondary-900 text-green-400 text-xs rounded overflow-x-auto"><code>{f.codeSnippet}</code></pre>}
                </div>
              ))}
              {aiResult.rootCause && <p><strong>Root Cause:</strong> {aiResult.rootCause}</p>}
              {aiResult.explanation && <p>{aiResult.explanation}</p>}
            </div>
          </div>
        )}

        {!bug.aiExplanation && !aiResult && (
          <div className="card p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary-600" /> AI Tools</h3>
            <div className="space-y-3">
              <div>
                <label className="label text-xs">Error Message (optional)</label>
                <textarea className="input text-sm min-h-[50px]" placeholder="Paste error message..." value={errorInput} onChange={e => setErrorInput(e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">Stack Trace (optional)</label>
                <textarea className="input text-sm min-h-[50px]" placeholder="Paste stack trace..." value={stackTrace} onChange={e => setStackTrace(e.target.value)} />
              </div>
              <button onClick={handleAiExplain} disabled={aiLoading} className="btn-secondary w-full btn-sm"><Sparkles className="w-3.5 h-3.5" /> {aiLoading ? 'Analyzing...' : 'Explain with AI'}</button>
              <button onClick={handleAiFix} disabled={aiLoading} className="btn-primary w-full btn-sm"><Sparkles className="w-3.5 h-3.5" /> {aiLoading ? 'Thinking...' : 'Suggest Fix'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}