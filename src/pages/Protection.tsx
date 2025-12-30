
import { Icons } from '../icons';

interface PageProps {
  user: any;
}

export default function Protection({ user }: PageProps) {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-black text-slate-800 flex items-center justify-center gap-3 mb-4">
        <Icons.Shield className="w-8 h-8 text-blue-600" />
        MODULE EN CONSTRUCTION
      </h1>
      <p className="text-slate-500 mb-8">
        Cette fonctionnalité sera bientôt disponible pour l'utilisateur :
        <span className="font-mono bg-slate-100 px-2 py-1 rounded ml-2 text-sm text-slate-700">
          {user?.uid || "Chargement..."}
        </span>
      </p>
      <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 inline-block text-left max-w-md">
        <h3 className="font-bold text-blue-800 flex items-center gap-2 mb-2">
          <Icons.Shield className="w-4 h-4" /> Statut du compte
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>Type : {user?.isAnonymous ? "Invité (Guest)" : "Membre Google"}</li>
          <li>Email : {user?.email || "N/A"}</li>
        </ul>
      </div>
    </div>
  );
}
