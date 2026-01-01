
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
  author_email?: string; 
  author_role: string;
}

export default function Forum({ user }: { user: any }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  
  const [userGlobalData, setUserGlobalData] = useState<any>(null);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as 'success' | 'error' });
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null); 
  
  const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
  const LIMIT = 50; 

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
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async (isRefresh = false) => {
    if (!activeProjectId) return;
    setLoading(true);
    try {
      const t = await getToken();
      const res = await fetch(`${API_URL}/messages/${activeProjectId}?limit=${LIMIT}&skip=0`, { 
          headers: { 'Authorization': `Bearer ${t}` } 
      });
      if (res.ok) {
          const data = await res.json();
          setMessages(data.reverse());
          setOffset(LIMIT);
          setHasMore(data.length === LIMIT);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 100);
      }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const loadMoreMessages = async () => {
      if (!activeProjectId || !hasMore || isLoadingMore) return;
      setIsLoadingMore(true);
      const currentHeight = scrollRef.current?.scrollHeight || 0;
      const currentScrollTop = scrollRef.current?.scrollTop || 0;

      try {
          const t = await getToken();
          const res = await fetch(`${API_URL}/messages/${activeProjectId}?limit=${LIMIT}&skip=${offset}`, { 
              headers: { 'Authorization': `Bearer ${t}` } 
          });
          
          if (res.ok) {
              const data = await res.json();
              if (data.length > 0) {
                  setMessages(prev => [...data.reverse(), ...prev]);
                  setOffset(prev => prev + LIMIT);
                  setHasMore(data.length === LIMIT);
                  setTimeout(() => {
                      if (scrollRef.current) {
                          const newHeight = scrollRef.current.scrollHeight;
                          scrollRef.current.scrollTop = newHeight - currentHeight + currentScrollTop;
                      }
                  }, 50);
              } else {
                  setHasMore(false);
              }
          }
      } catch (e) { console.error(e); } finally { setIsLoadingMore(false); }
  };

  useEffect(() => { if (user) { fetchGlobalProfile(); fetchProjects(); } }, [user]);
  
  useEffect(() => { 
      setMessages([]);
      setOffset(0);
      setHasMore(true);
      fetchMessages(); 
  }, [activeProjectId]);

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
            if (res.status === 429) notify("Slow down!", "error");
            else notify(err.detail || "Error", "error");
        } else {
            setNewMessage("");
            fetchMessages(true); 
        }
    } catch (e) { notify("Network Error", "error"); }
    finally { setSending(false); }
  };

  const handleDeleteMessage = async (msgId: number) => {
      if(!confirm("Delete this comment?")) return;
      try {
          const t = await getToken();
          const res = await fetch(`${API_URL}/messages/${msgId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } });
          if(res.ok) {
              notify("Message deleted");
              setMessages(prev => prev.filter(m => m.id !== msgId));
          } else {
              notify("Permission denied", "error");
          }
      } catch(e) { notify("Error", "error"); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => { 
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { 
          e.preventDefault(); handleSendMessage(); 
      }
  };

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

  const canDelete = (msg: Message) => {
      if (msg.author_uid === user.uid) return true;
      if (!userGlobalData) return false;
      const isGlobalStaff = ['admin', 'super_admin'].includes(userGlobalData.global_role);
      if (isGlobalStaff) return true;
      const currentProject = projects.find(p => p.id === activeProjectId);
      if (currentProject && ['owner', 'admin', 'moderator'].includes(currentProject.role)) return true;
      return false;
  };

  return (
    // [FIX] Changed h-screen to h-full to fit within parent flex container
    <div className="max-w-7xl mx-auto px-6 py-6 text-[11px] font-sans h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 flex-shrink-0">
        <div className="flex flex-col">
          <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
            Project Discussion Board
            {userGlobalData && <GlobalRoleBadge role={userGlobalData.global_role} />}
          </label>
          <div className="flex items-center gap-2">
             <h1 className="text-xl font-black text-slate-800 uppercase flex items-center gap-2">
                <Icons.List className="w-5 h-5 text-slate-700" />
                <span>{getActiveProjectName()}</span>
             </h1>
             {activeProjectId?.startsWith("PUBLIC_") && <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[9px] font-bold border border-slate-200">PUBLIC</span>}
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <ProjectsSidebar 
          user={user} userGlobalData={userGlobalData} projects={projects} activeProjectId={activeProjectId} setActiveProjectId={setActiveProjectId}
          isCreatingProject={false} setIsCreatingProject={() => {}} newProjectName="" setNewProjectName={() => {}} onCreateProject={() => {}} onDeleteProject={() => {}}
        />

        <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded shadow-sm overflow-hidden relative">
            
            <div 
                ref={scrollRef} 
                className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30 custom-scrollbar"
            >
                {hasMore && !loading && (
                    <div className="flex justify-center pt-2 pb-4">
                        <button 
                            onClick={loadMoreMessages} 
                            disabled={isLoadingMore}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold px-4 py-1.5 rounded-full text-[10px] flex items-center gap-2 transition-colors border border-slate-200 shadow-sm"
                        >
                            {isLoadingMore ? <Icons.Refresh className="w-3 h-3 animate-spin" /> : <Icons.ArrowUp className="w-3 h-3" />}
                            Load older messages
                        </button>
                    </div>
                )}

                {loading && messages.length === 0 ? <div className="text-center italic text-slate-400 mt-10">Loading discussion...</div> : messages.length === 0 ? (
                    <div className="text-center mt-10">
                        <Icons.MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                        <p className="text-slate-400 font-bold">No issues or comments yet.</p>
                        <p className="text-slate-300">Start the conversation below.</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.author_uid === user.uid;
                        const roleColor = msg.author_role === 'super_admin' ? 'bg-red-50 text-red-600 border-red-200' : (msg.author_role === 'admin' ? 'bg-red-50 text-red-500 border-red-200' : (msg.author_role === 'nitro' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-slate-100 text-slate-600 border-slate-200'));
                        
                        return (
                            <div key={msg.id} className="flex gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="flex-shrink-0 pt-1">
                                    <div className="w-8 h-8 rounded-md bg-white border border-slate-200 shadow-sm flex items-center justify-center font-bold text-slate-500 uppercase select-none">
                                        {getAuthorName(msg)[0]}
                                    </div>
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-t-md px-3 py-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-slate-700 hover:underline cursor-pointer">{getAuthorName(msg)}</span>
                                            {msg.author_role !== 'user' && msg.author_role !== 'guest' && (
                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase ${roleColor}`}>
                                                    {msg.author_role.replace('_', ' ')}
                                                </span>
                                            )}
                                            <span className="text-slate-400 text-[9px]">commented {new Date(msg.created_at).toLocaleString()}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {isMe && <span className="px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-600 text-[9px] font-bold">YOU</span>}
                                            {canDelete(msg) && (
                                                <button onClick={() => handleDeleteMessage(msg.id)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Delete">
                                                    <Icons.Trash className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="bg-white border border-t-0 border-slate-200 rounded-b-md p-3 text-slate-700 leading-relaxed whitespace-pre-wrap font-mono text-[11px]">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex-shrink-0">
                <div className="relative border border-slate-300 rounded-md shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                    <textarea 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={user.isAnonymous ? "Sign in to contribute..." : "Leave a comment (Ctrl+Enter to send)..."}
                        disabled={user.isAnonymous || sending}
                        className="w-full min-h-[80px] p-3 text-slate-700 resize-y focus:outline-none rounded-t-md disabled:bg-slate-50 disabled:text-slate-400 bg-white text-[11px] font-mono"
                    />
                    <div className="bg-slate-50 px-3 py-2 flex justify-between items-center rounded-b-md border-t border-slate-100">
                         <span className="text-[9px] text-slate-400 hidden sm:inline">
                             Supports basic text. Be kind and constructive.
                         </span>
                         <button 
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || user.isAnonymous || sending}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white px-4 py-1.5 rounded font-bold text-[10px] shadow-sm transition-colors flex items-center gap-2"
                        >
                            {sending ? <Icons.Refresh className="w-3 h-3 animate-spin" /> : <Icons.MessageSquare className="w-3 h-3" />}
                            Comment
                        </button>
                    </div>
                </div>
            </div>

        </div>
      </div>
      {toast.show && <Toast message={toast.msg} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />}
    </div>
  );
}
