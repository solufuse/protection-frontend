
import { useState, useEffect } from 'react';
import { Icons } from '../icons';

interface Member {
    uid: string;
    email: string | null;
    role: string;
    global_role: string;
}

interface MembersModalProps {
    projectId: string;
    currentUserUID: string;
    onClose: () => void;
    apiUrl: string;
    getToken: () => Promise<string | null>;
    notify: (msg: string, type?: 'success' | 'error') => void;
}

const MembersModal = ({ projectId, currentUserUID, onClose, apiUrl, getToken, notify }: MembersModalProps) => {
    const [members, setMembers] = useState<Member[]>([]);
    const [inviteInput, setInviteInput] = useState("");
    const [selectedRole, setSelectedRole] = useState("viewer"); // Default role
    const [loading, setLoading] = useState(false);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const t = await getToken();
            const res = await fetch(`${apiUrl}/projects/${projectId}/members`, { headers: { 'Authorization': `Bearer ${t}` } });
            if (res.ok) setMembers(await res.json());
        } catch (e) { notify("Failed to load members", "error"); } 
        finally { setLoading(false); }
    };

    const handleInvite = async () => {
        if (!inviteInput) return;
        try {
            const t = await getToken();
            const isEmail = inviteInput.includes("@");
            
            // [UPDATE] We now use 'selectedRole' instead of hardcoded 'viewer'
            const body = isEmail 
                ? { email: inviteInput, role: selectedRole } 
                : { user_id: inviteInput, role: selectedRole };
            
            const res = await fetch(`${apiUrl}/projects/${projectId}/members`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Error");
            }
            
            notify(`User set as ${selectedRole.toUpperCase()}`);
            setInviteInput("");
            loadMembers();
        } catch (e: any) { notify(e.message || "Invite failed", "error"); }
    };

    const handleKick = async (uid: string) => {
        if (!confirm("Kick this user?")) return;
        try {
            const t = await getToken();
            const res = await fetch(`${apiUrl}/projects/${projectId}/members/${uid}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${t}` }
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Error");
            }
            notify("User kicked");
            loadMembers();
        } catch (e: any) { notify(e.message || "Kick failed", "error"); }
    };

    useEffect(() => { loadMembers(); }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-96 overflow-hidden flex flex-col max-h-[500px]">
                {/* Header */}
                <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Icons.Users className="w-4 h-4 text-blue-500" /> Project Members
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded text-slate-500"><Icons.X className="w-4 h-4"/></button>
                </div>
                
                {/* Invite Bar */}
                <div className="p-3 border-b border-slate-100 flex flex-col gap-2 bg-white">
                    <div className="flex gap-2">
                        <input 
                            className="flex-1 text-[10px] p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                            placeholder="Email or UID..."
                            value={inviteInput}
                            onChange={(e) => setInviteInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                        />
                        
                        {/* Role Selector */}
                        <div className="relative">
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold py-2 pl-2 pr-6 rounded focus:outline-none focus:border-blue-500 h-full uppercase"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="moderator">Mod</option>
                                <option value="admin">Admin</option>
                            </select>
                            <Icons.ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>
                    <button onClick={handleInvite} className="w-full bg-blue-600 text-white py-1.5 rounded font-bold text-[10px] hover:bg-blue-700 transition-colors flex justify-center items-center gap-1">
                        <Icons.Plus className="w-3 h-3" /> INVITE / UPDATE ROLE
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/30">
                    {loading ? <div className="text-center p-4 text-slate-400 text-xs flex items-center justify-center gap-2"><Icons.Loader className="w-3 h-3 animate-spin"/> Loading...</div> : members.map(m => (
                        <div key={m.uid} className="flex justify-between items-center p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm group transition-all">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border ${m.role === 'owner' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                                    {m.role === 'owner' ? '👑' : '👤'}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold text-slate-700 truncate">{m.email || "Guest User"}</span>
                                    <div className="flex gap-1 items-center">
                                        <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-bold ${
                                            m.role === 'owner' ? 'bg-yellow-100 text-yellow-700' : 
                                            m.role === 'admin' ? 'bg-red-100 text-red-600' :
                                            m.role === 'editor' ? 'bg-green-100 text-green-600' :
                                            'bg-slate-200 text-slate-500'
                                        }`}>{m.role}</span>
                                        
                                        {['admin', 'moderator', 'nitro'].includes(m.global_role) && (
                                            <span className="text-[8px] text-purple-600 font-bold bg-purple-50 px-1 rounded border border-purple-100">{m.global_role.toUpperCase()}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Kick Button */}
                            {m.uid !== currentUserUID && m.role !== 'owner' && (
                                <button onClick={() => handleKick(m.uid)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all" title="Kick Member">
                                    <Icons.UserMinus className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MembersModal;
