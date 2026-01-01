import { Icons } from '../icons';

interface ContextRoleBadgeProps {
  role?: 'owner' | 'admin' | 'moderator' | 'editor' | 'viewer' | 'staff_override' | string;
  isSession?: boolean;
}

export default function ContextRoleBadge({ role, isSession = false }: ContextRoleBadgeProps) {
  // 1. Session Case (Always Owner/Private)
  if (isSession) {
    return (
      <span className="flex items-center gap-1 bg-slate-800 text-white text-[8px] font-black px-1.5 py-0.5 rounded border border-slate-600 uppercase tracking-wider ml-2">
        <Icons.Lock className="w-2.5 h-2.5" /> PRIVATE OWNER
      </span>
    );
  }

  // 2. Project Roles Mapping
  const normalizedRole = role?.toLowerCase() || 'viewer';

  const styles: Record<string, string> = {
    owner: "bg-amber-100 text-amber-700 border-amber-200",
    admin: "bg-red-100 text-red-700 border-red-200",
    moderator: "bg-purple-100 text-purple-700 border-purple-200",
    editor: "bg-blue-100 text-blue-700 border-blue-200",
    viewer: "bg-slate-100 text-slate-500 border-slate-200",
    staff_override: "bg-pink-100 text-pink-700 border-pink-200",
  };

  const icons: Record<string, any> = {
    owner: Icons.Crown,
    admin: Icons.Shield,
    moderator: Icons.CheckCircle, // [FIX] Replaced ShieldCheck with CheckCircle (available)
    editor: Icons.FileText, 
    viewer: Icons.Show,           // [FIX] Replaced Eye with Show (available alias)
    staff_override: Icons.Zap,
  };

  const Icon = icons[normalizedRole] || Icons.User;
  const style = styles[normalizedRole] || styles.viewer;

  return (
    <span className={`flex items-center gap-1 text-[8px] font-black px-1.5 py-0.5 rounded border uppercase tracking-wider ml-2 ${style}`}>
      <Icon className="w-2.5 h-2.5" /> {normalizedRole.replace('_', ' ')}
    </span>
  );
}
