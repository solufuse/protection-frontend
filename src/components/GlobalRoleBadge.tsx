
import { Icons } from '../icons';

const GlobalRoleBadge = ({ role }: { role: string }) => {
    if (!role || role === 'user' || role === 'guest') return null;
    
    // Default (Fallthrough)
    let color = "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
    let icon = <Icons.User className="w-3 h-3" />;
    let label = role;

    if (['super_admin', 'admin'].includes(role)) {
        // Red for Admin
        color = "bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/50";
        icon = <Icons.Shield className="w-3 h-3" />;
        label = "ADMIN";
    } else if (role === 'moderator') {
        // Blue for Mod
        color = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/50";
        icon = <Icons.CheckCircle className="w-3 h-3" />;
        label = "MOD";
    } else if (role === 'nitro') {
        // Purple/Gold for Nitro
        color = "bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-900/50";
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
