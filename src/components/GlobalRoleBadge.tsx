
import { Icons } from '../icons';

const GlobalRoleBadge = ({ role }: { role: string }) => {
    if (!role || role === 'user' || role === 'guest') return null;
    
    let color = "bg-gray-100 text-gray-500";
    let icon = <Icons.User className="w-3 h-3" />;
    let label = role;

    if (['super_admin', 'admin'].includes(role)) {
        color = "bg-red-50 text-red-600 border-red-100";
        icon = <Icons.Shield className="w-3 h-3" />;
        label = "ADMIN";
    } else if (role === 'moderator') {
        color = "bg-blue-50 text-blue-600 border-blue-100";
        icon = <Icons.CheckCircle className="w-3 h-3" />;
        label = "MOD";
    } else if (role === 'nitro') {
        color = "bg-purple-50 text-purple-600 border-purple-100";
        icon = <Icons.Zap className="w-3 h-3" />;
        label = "NITRO";
    }

    return (
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${color}`} title={`Global Rank: ${role}`}>
            {icon}
            <span>{label}</span>
        </div>
    );
};

export default GlobalRoleBadge;
