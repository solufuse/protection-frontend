import { Shield } from 'lucide-react';

export default function Protection() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-center">
      <div className="bg-white rounded-3xl p-12 shadow-sm border border-slate-200 inline-block">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Protection Module</h1>
        <p className="text-xl text-slate-500 max-w-lg mx-auto">
            Cette fonctionnalité est en cours de développement. Elle permettra le calcul des plans de protection.
        </p>
        <div className="mt-8">
            <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 font-bold rounded-full text-sm">
                🚧 Coming Soon
            </span>
        </div>
      </div>
    </div>
  );
}
