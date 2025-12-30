
import { Icons } from '../icons';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface FilesProps {
  user: any;
}

export default function Files({ user }: FilesProps) {
  // [!] [FIX] : Removed unused state variables that were causing build failure (TS6133).
  // We will re-introduce them when we implement the real API connection.

  const handleGoogleLogin = async () => {
    const auth = getAuth();
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Icons.Folder className="w-6 h-6 text-blue-600" />
                FILE MANAGER
            </h1>
            <p className="text-slate-500 text-sm mt-1">Manage your simulation files (.ram, .xml)</p>
        </div>
        
        {/* NEW PROJECT BUTTON (Disabled for Guests) */}
        <button 
            disabled={user?.isAnonymous}
            className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all ${
                user?.isAnonymous 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
            }`}
            title={user?.isAnonymous ? "Feature locked for guests" : "Create new project"}
        >
            <Icons.Plus className="w-4 h-4" />
            {user?.isAnonymous ? 'New Project (Locked)' : 'New Project'}
        </button>
      </div>

      {/* GUEST WARNING BANNER */}
      {user?.isAnonymous && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
                    <Icons.Alert className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-blue-900 text-sm">Guest Mode (Demo)</h3>
                    <p className="text-blue-700 text-xs mt-0.5">
                        You are limited to <strong>5 files</strong> and storage is temporary. 
                        Projects are disabled.
                    </p>
                </div>
            </div>
            <button 
                onClick={handleGoogleLogin}
                className="whitespace-nowrap px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
                GO UNLIMITED <Icons.ArrowRight className="w-3 h-3" />
            </button>
        </div>
      )}

      {/* FILE DROP ZONE (Visual Placeholder) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center hover:border-blue-300 transition-colors border-dashed">
        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Icons.UploadCloud className="w-8 h-8" />
        </div>
        <h3 className="text-slate-800 font-bold mb-2">Upload Files</h3>
        <p className="text-slate-400 text-sm mb-6">
            {user?.isAnonymous 
                ? "Guest Limit: 5 files max." 
                : "Drag & drop your files here or click to browse."}
        </p>
        
        {/* Empty State */}
        <div className="border-t border-slate-100 pt-6 mt-6">
            <p className="text-xs text-slate-400 italic">No files uploaded yet.</p>
        </div>
      </div>

    </div>
  );
}
