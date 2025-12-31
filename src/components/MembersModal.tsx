
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
    const [selectedRole, setSelectedRole] = useState("viewer");
    const [loading, setLoading] = useState(false);
    const [updatingUid, setUpdatingUid] = useState<string | null>(null);

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
            const body = isEmail ? { email: inviteInput, role: selectedRole } : { user_id: inviteInput, role: selectedRole };
            
            const res = await fetch(`${apiUrl}/projects/${projectId}/members`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            if (!res.ok) throw new Error((await res.json()).detail);
            notify("Member invited!");
            setInviteInput("");
            loadMembers();
        } catch (e: any) { notify(e.message || "Invite failed", "error"); }
    };

    // [NEW] Function to change role directly from the list
    const handleRoleChange = async (uid: string, newRole: string) => {
        setUpdatingUid(uid);
        try {
            const t = await getToken();
            const res = await fetch(`${apiUrl}/projects/${projectId}/members`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: uid, role: newRole })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Update failed");
            }
            notify(`Role updated to ${newRole.toUpperCase()}`);
            loadMembers(); // Refresh list to confirm
        } catch (e: any) { 
            notify(e.message || "Update failed", "error"); 
        } finally {
            setUpdatingUid(null);
        }
    };

    const handleKick = async (uid: string) => {
        if (!confirm("Kick this user?")) return;
        try {
            const t = await getToken();
            const res = await fetch(`${apiUrl}/projects/${projectId}/members/${uid}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${t}` }
            });
            if (!res.ok) throw new Error((await res.json()).detail);
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
                        <div className="relative">
                            <select 
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold py-2 pl-2 pr-6 rounded focus:outline-none focus:border-blue-500 h-full uppercase cursor-pointer"
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
                        <Icons.Plus className="w-3 h-3" /> ADD NEW MEMBER
                    </button>
                </div>

                {/* Member List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-50/30">
                    {loading ? <div className="text-center p-4 text-slate-400 text-xs flex items-center justify-center gap-2"><Icons.Loader className="w-3 h-3 animate-spin"/> Loading...</div> : members.map(m => {
                        // Check if I can edit this user (Simple UI check, Backend enforces security)
                        const canEdit = m.uid !== currentUserUID && m.role !== 'owner';
                        const isUpdating = updatingUid === m.uid;

                        return (
                            <div key={m.uid} className="flex justify-between items-center p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm group transition-all">
                                <div className="flex items-center gap-2 overflow-hidden flex-1">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0 ${m.role === 'owner' ? 'bg-yellow-50 text-yellow-600 border-yellow-200' : 'bg-white text-slate-500 border-slate-200'}`}>
                                        {m.role === 'owner' ? '👑' : '👤'}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-700 truncate" title={m.uid}>{m.email || "Guest User"}</span>
                                            {/* Global Badge */}
                                            {['admin', 'moderator', 'nitro'].includes(m.global_role) && (
                                                <span className="text-[8px] text-purple-600 font-bold bg-purple-50 px-1 rounded border border-purple-100">{m.global_role.toUpperCase()}</span>
                                            )}
                                        </div>
                                        
                                        {/* ROLE SELECTOR (INLINE) */}
                                        <div className="mt-0.5">
                                            {canEdit ? (
                                                <div className="relative inline-block">
                                                    <select 
                                                        value={m.role}
                                                        disabled={isUpdating}
                                                        onChange={(e) => handleRoleChange(m.uid, e.target.value)}
                                                        className={`appearance-none text-[9px] font-bold uppercase py-0.5 pl-1.5 pr-4 rounded border cursor-pointer focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition-all ${
                                                            isUpdating ? 'opacity-50' : ''
                                                        } ${
                                                            m.role === 'admin' ? 'bg-red-50 text-red-600 border-red-100' :
                                                            m.role === 'moderator' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            m.role === 'editor' ? 'bg-green-50 text-green-600 border-green-100' :
                                                            'bg-slate-100 text-slate-500 border-slate-200'
                                                        }`}
                                                    >
                                                        <option value="viewer">Viewer</option>
                                                        <option value="editor">Editor</option>
                                                        <option value="moderator">Mod</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                    <Icons.ChevronDown className="w-2.5 h-2.5 text-current opacity-50 absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
                                                </div>
                                            ) : (
                                                <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-bold inline-block border ${
                                                    m.role === 'owner' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' : 
                                                    'bg-slate-100 text-slate-400 border-slate-200'
                                                }`}>
                                                    {m.role}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Kick Button */}
                                {canEdit && (
                                    <button onClick={() => handleKick(m.uid)} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all ml-2" title="Kick Member">
                                        <Icons.UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default MembersModal;
