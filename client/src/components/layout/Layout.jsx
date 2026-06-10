import { useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Header from './Header';
import AiChatSidebar from '../ai/AiChatSidebar';
import api from '../../services/api';
import { Sparkles } from 'lucide-react';

export default function Layout() {
  const { projectId, bugId } = useParams();
  const [showAi, setShowAi] = useState(false);

  const { data: bug } = useQuery({
    queryKey: ['bug', bugId],
    queryFn: () => api.get(`/projects/${projectId}/bugs/${bugId}`).then(r => r.data.data),
    enabled: !!projectId && !!bugId,
  });

  return (
    <div className="flex h-screen bg-secondary-50 dark:bg-secondary-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet context={{ bug }} />
        </main>
      </div>
      <button
        onClick={() => setShowAi(!showAi)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 transition-all flex items-center justify-center z-40 hover:scale-110"
        title="AI Assistant"
      >
        <Sparkles className="w-5 h-5" />
      </button>
      {showAi && (
        <AiChatSidebar
          projectId={projectId}
          bugId={bugId}
          bug={bug}
          onClose={() => setShowAi(false)}
        />
      )}
    </div>
  );
}