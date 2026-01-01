
import { useEffect, useState, useRef } from 'react';
import { Icons } from '../icons';
import Toast from '../components/Toast';
import ProjectsSidebar, { Project } from '../components/ProjectsSidebar';
import GlobalRoleBadge from '../components/GlobalRoleBadge';

interface Message {
  id: number;
  content: string;
  created_at: string;
  author_uid: string;
  author_username?: string;
  author_email?: string; // [+] Added
  author_role: string;
}

export default function Forum({ user }: { user: any }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ show: true, msg, type });
  const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

  const fetchGlobalProfile = async () => {
     try {
         const t = await getToken();
         const res = await fetch(`${API_URL}/users/me`, { headers: { 'Authorization': `Bearer ${t}` } });
         if (res.ok) setUserGlobalData(await res.json());
     } catch (e) {}
  };

  const fetchProjects = async () => {
    try {
      const t = await getToken();
      const res = await fetch(`${API_URL}/projects/`, { headers: { 'Authorization': `Bearer ${t}` } });
      if (res.ok) {
          const data = await res.json();
          setProjects(data);
          if (!activeProjectId) {
              const pub = data.find((p: Project) => p.id.startsWith("PUBLIC_"));
              if (pub) setActiveProjectId(pub.id);
          }
      }
    } catch (e) { console.error("Failed to load projects", e); }
  };

  const fetchMessages = async () => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const t = await getToken();
      const res = await fetch(`${API_URL}/messages/${activeProjectId}?limit=50`, { 
          headers: { 'Authorization': `Bearer ${t}` } 
      });
      if (res.ok) {
          const data = await res.json();
          setMessages(data.reverse()); 
      } else { setMessages([]); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (user) { fetchGlobalProfile(); fetchProjects(); } }, [user]);
  useEffect(() => { fetchMessages(); }, [activeProjectId]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeProjectId) return;
    setSending(true);
    try {
        const t = await getToken();
        const res = await fetch(`${API_URL}/messages/${activeProjectId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newMessage })
        });
        if (!res.ok) {
            const err = await res.json();
            if (res.status === 429) notify("Wow! Slow down (Anti-Spam)", "error");
            else notify(err.detail || "Error sending", "error");
        } else {
            setNewMessage("");
            fetchMessages(); 
        }
    } catch (e) { notify("Network Error", "error"); }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
  const getRoleColor = (role: string) => {
      switch(role) {
          case 'super_admin': return 'text-red-600';
          case 'admin': return 'text-red-500';
          case 'moderator': return 'text-purple-500';
          case 'nitro': return 'text-yellow-500';
          default: return 'text-slate-700';
      }
  };

  // [+] [LOGIC] Name Fallback: Username > Email Prefix > Guest
  const getAuthorName = (msg: Message) => {
      if (msg.author_username) return msg.author_username;
      if (msg.author_email) return msg.author_email.split('@')[0];
      return "Guest";
  };

  const getActiveProjectName = () => {
      if (!activeProjectId) return "Select a Channel";
      const p = projects.find(prj => prj.id === activeProjectId);
      return p ? p.name : activeProjectId;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-screen flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            Community {userGlobalData && <GlobalRoleBadge role={userGlobalData.global_role} />}
          </label>
          <div className="flex items-center gap-2">
             <h1 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                <Icons.MessageSquare className="w-5 h-5 text-purple-600" />
                <span>{getActiveProjectName()}</span>
             </h1>
             {activeProjectId?.startsWith("PUBLIC_") && (
                 <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full text-[9px] font-bold border border-purple-200">PUBLIC CHANNEL</span>
             )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <ProjectsSidebar 
          user={user} userGlobalData={userGlobalData} projects={projects} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId}
          isCreatingProject={false} setIsCreatingProject={() => {}} newProjectName="" setNewProjectName={() => {}} onCreateProject={() => {}} onDeleteProject={() => {}}
        />

        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded shadow-sm overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
                {loading && messages.length === 0 ? <div className="flex justify-center items-center h-full text-slate-400 font-bold italic">Loading messages...</div> : messages.length === 0 ? <div className="flex flex-col justify-center items-center h-full text-slate-300"><Icons.MessageSquare className="w-12 h-12 mb-2 opacity-50" /><span className="font-bold">No messages yet.</span></div> : (
                    messages.map((msg) => {
                        const isMe = msg.author_uid === user.uid;
                        return (
                            <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${isMe ? 'bg-blue-500' : 'bg-slate-400'}`}>
                                    {getAuthorName(msg)[0].toUpperCase()}
                                </div>
                                <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`font-black text-[10px] ${getRoleColor(msg.author_role)}`}>
                                            {getAuthorName(msg)}
                                        </span>
                                        <span className="text-[9px] text-slate-300">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`px-3 py-2 rounded-xl text-[11px] leading-relaxed shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-t border-slate-200">
                <div className="flex gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder={user.isAnonymous ? "Guests cannot post..." : `Message #${getActiveProjectName()}...`} disabled={user.isAnonymous || sending} className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50" />
                    <button onClick={handleSendMessage} disabled={!newMessage.trim() || user.isAnonymous || sending} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-2 rounded-lg transition-colors flex items-center justify-center">{sending ? <Icons.Refresh className="w-4 h-4 animate-spin" /> : <Icons.Send className="w-4 h-4" />}</button>
                </div>
            </div>
        </div>
      </div>
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
