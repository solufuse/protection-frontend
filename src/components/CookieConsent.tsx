
import { useState, useEffect } from 'react';
import { Icons } from '../icons';

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        // On vérifie si l'utilisateur a déjà accepté
        const consent = localStorage.getItem('solufuse_cookie_consent');
        if (!consent) {
            // Petit délai pour l'animation d'entrée
            setTimeout(() => setShow(true), 1000);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('solufuse_cookie_consent', 'true');
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-slate-200 shadow-2xl rounded-xl p-4 z-[999] animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                    <Icons.Shield className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider mb-1">
                        Cookie Policy
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                        We use essential cookies to ensure the security of your session and authentication (Firebase). By continuing, you accept our use of these necessary cookies.
                    </p>
                </div>
            </div>
            <div className="mt-3 flex gap-2 justify-end">
                <button 
                    onClick={handleAccept}
                    className="bg-slate-900 hover:bg-black text-white px-4 py-1.5 rounded-lg text-[10px] font-bold transition-colors shadow-sm"
                >
                    I UNDERSTAND
                </button>
            </div>
        </div>
    );
}
