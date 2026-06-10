import { useState, useRef, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { cn } from '../../utils/cn';
import { Sparkles, Send, X, Loader2, Bot, User } from 'lucide-react';
import toast from 'react-hot-toast';

const SUGGESTIONS = [
  'How can I improve my bug reports?',
  'What are best practices for sprint planning?',
  'How should I prioritize bugs?',
  'Help me write a good bug description',
];

export default function AiChatSidebar({ projectId, bugId, bug, onClose }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your AI assistant. Ask me anything about bugs, projects, or best practices.' },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamText]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buildContext = () => {
    const parts = [];
    if (bug) {
      parts.push(`Current Bug:\nTitle: ${bug.title}\nDescription: ${bug.description || 'N/A'}\nStatus: ${bug.status}\nSeverity: ${bug.severity}\nPriority: ${bug.priority}`);
    }
    if (projectId) {
      parts.push(`Project ID: ${projectId}`);
    }
    return parts.join('\n\n');
  };

  const handleStreamResponse = useCallback(async (prompt) => {
    setStreaming(true);
    setStreamText('');
    const context = buildContext();

    try {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();

      const token = localStorage.getItem('accessToken');
      const params = new URLSearchParams({ prompt, context });
      const response = await fetch(`/api/v1/ai/chat/stream?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('AI rate limit exceeded. Please wait a moment and try again.');
        }
        throw new Error('AI response failed. Please try again.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setStreamText(fullText);
              }
            } catch {}
          }
        }
      }

      return fullText || 'I processed your request.';
    } catch (err) {
      if (err.name === 'AbortError') return '';
      toast.error(err.message || 'AI response failed');
      return '';
    } finally {
      setStreaming(false);
    }
  }, [bug, projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    if (window.EventSource) {
      const response = await handleStreamResponse(userMsg);
      if (response) {
        setMessages(prev => [...prev, { role: 'assistant', text: response }]);
        setStreamText('');
      }
    } else {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Thinking...' }]);
      try {
        const { data } = await api.post('/ai/chat', { prompt: userMsg, context: buildContext() });
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: data.data?.response || data.data?.text || JSON.stringify(data.data) }]);
      } catch (err) {
        const msg = err.response?.status === 429 ? 'AI rate limit exceeded. Please wait.' : 'Sorry, I encountered an error.';
        setMessages(prev => [...prev.slice(0, -1), { role: 'assistant', text: msg }]);
      }
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    inputRef.current?.focus();
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white dark:bg-secondary-800 rounded-2xl shadow-2xl border border-secondary-200 dark:border-secondary-700 flex flex-col z-50 overflow-hidden animate-slide-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-secondary-200 dark:border-secondary-700 bg-primary-600 text-white">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">AI Assistant</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-primary-500 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : '')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary-600" />
              </div>
            )}
            <div className={cn('max-w-[80%] px-3 py-2 rounded-xl text-sm', msg.role === 'user' ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-secondary-100 dark:bg-secondary-700 rounded-tl-sm')}>
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-full bg-secondary-300 dark:bg-secondary-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-secondary-600 dark:text-secondary-300" />
              </div>
            )}
          </div>
        ))}
        {streaming && streamText && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-primary-600" />
            </div>
            <div className="max-w-[80%] px-3 py-2 rounded-xl text-sm bg-secondary-100 dark:bg-secondary-700 rounded-tl-sm">
              <p className="whitespace-pre-wrap">{streamText}</p>
              <span className="inline-block w-1.5 h-4 bg-primary-600 animate-pulse ml-0.5" />
            </div>
          </div>
        )}
        {!streaming && messages.length === 1 && (
          <div className="mt-2">
            <p className="text-xs text-secondary-400 mb-2">Try asking:</p>
            <div className="space-y-1">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => handleSuggestion(s)} className="block w-full text-left text-xs px-3 py-1.5 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 text-secondary-600 dark:text-secondary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {streaming && !streamText && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-secondary-100 dark:bg-secondary-700">
              <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
              <span className="text-sm text-secondary-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-secondary-200 dark:border-secondary-700">
        <div className="flex gap-2">
          <input ref={inputRef} className="input flex-1 text-sm" placeholder="Ask anything..." value={input} onChange={e => setInput(e.target.value)} disabled={streaming} />
          <button type="submit" disabled={!input.trim() || streaming} className="btn-primary p-2"><Send className="w-4 h-4" /></button>
        </div>
      </form>
    </div>
  );
}