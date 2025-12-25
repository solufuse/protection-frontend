import React, { useState, useEffect } from 'react';
import { AppConfig } from '../types';
import { Settings, Info } from 'lucide-react';

interface Props {
  onConfigChange: (config: string) => void;
}

const ConfigGenerator: React.FC<Props> = ({ onConfigChange }) => {
  const [settings, setSettings] = useState({
    target_mw: -80.0,
    tolerance_mw: 0.3,
    swing_bus_id: "Bus RTE 1"
  });

  useEffect(() => {
    const fullConfig: AppConfig = {
      loadflow_settings: settings
    };
    onConfigChange(JSON.stringify(fullConfig, null, 2));
  }, [settings, onConfigChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
      <h2 className="font-bold text-slate-800 mb-6 flex items-center gap-2 text-xl">
        <Settings className="w-6 h-6 text-blue-600" />
        Configuration Loadflow
      </h2>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Cible Active Power (MW)
          </label>
          <div className="relative">
            <input
              type="number"
              name="target_mw"
              step="0.1"
              value={settings.target_mw}
              onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <span className="absolute right-4 top-3 text-slate-400 font-mono text-sm">MW</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> Valeur idéale au Swing Bus (ex: -80.0)
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Tolérance Acceptée (+/- MW)
          </label>
          <div className="relative">
            <input
              type="number"
              name="tolerance_mw"
              step="0.05"
              min="0"
              value={settings.tolerance_mw}
              onChange={handleChange}
              className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <span className="absolute right-4 top-3 text-slate-400 font-mono text-sm">+/- MW</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            ID Swing Bus (ETAP)
          </label>
          <input
            type="text"
            name="swing_bus_id"
            value={settings.swing_bus_id}
            onChange={handleChange}
            className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            placeholder="Ex: Bus RTE 1"
          />
          <p className="text-xs text-slate-500 mt-2">Laisser vide pour auto-détection.</p>
        </div>
      </div>

      <div className="mt-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 block">Aperçu JSON</label>
        <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs overflow-auto font-mono">
          {JSON.stringify({ loadflow_settings: settings }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ConfigGenerator;
