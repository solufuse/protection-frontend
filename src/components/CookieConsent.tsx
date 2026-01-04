// [structure:component] : Cookie Consent Banner
// [context:flow] : Manages user consent for tracking/auth cookies. Persists to localStorage with versioning.
// [decision:logic] : Uses a versioned key (solufuse_consent_v1) to allow forcing re-consent in future updates.

import { useState, useEffect } from 'react';
import { Icons } from '../icons';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        // [?] [THOUGHT] Check for consent versioning. Changing 'v1' to 'v2' in future will reshow banner.
        const consent = localStorage.getItem('solufuse_consent_v1');
        if (!consent) {
            // [+] [INFO] Delay for UX to avoid layout trashing on load
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAction = (type: 'accept' | 'essential') => {
        setIsClosing(true);
        // [?] [THOUGHT] Wait for animation to finish before removing from DOM
        setTimeout(() => {
            localStorage.setItem('solufuse_consent_v1', type);
            setIsVisible(false);
        }, 300);
    };

    if (!isVisible) return null;

    return (
        <div 
            className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-[9999] transition-all duration-300 ease-in-out ${isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}
        >
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-2xl rounded-xl p-5 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl shrink-0">
                        <Icons.Shield className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <h4 className="font-black text-slate-800 dark:text-slate-100 text-xs uppercase tracking-wider mb-1.5">
                                Privacy & Security
                            </h4>
                            <a 
                                href="https://solufuse.com/privacy" 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-[9px] font-bold text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1"
                            >
                                POLICY <Icons.ArrowRight className="w-2.5 h-2.5" />
                            </a>
                        </div>
                        
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-4">
                            We use essential cookies to ensure secure authentication (Firebase) and session integrity. These cannot be disabled.
                        </p>

                        <div className="flex gap-2 justify-end">
                            <button 
                                onClick={() => handleAction('essential')}
                                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                ESSENTIAL ONLY
                            </button>
                            <button 
                                onClick={() => handleAction('accept')}
                                className="bg-slate-900 hover:bg-black dark:bg-blue-600 dark:hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm flex items-center gap-2"
                            >
                                <Icons.Check className="w-3 h-3" /> ACCEPT ALL
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
