
// [structure:hook]
// USELOADFLOW HOOK
// [context:flow] Handles API interaction. Now supports Custom Filenames.

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// --- TYPES ---
export interface TransformerResult { Tap: number; LFMW: number; LFMvar: number; kV: number; }
export interface StudyCase { id: string; config: string; revision: string; }

export interface LoadflowResult {
  filename: string; 
  is_valid: boolean; 
  mw_flow: number; 
  mvar_flow: number; 
  delta_target: number; 
  is_winner: boolean;
  victory_reason?: string;
  status_color: string;
  study_case?: StudyCase; 
  transformers: Record<string, TransformerResult>;
  swing_bus_found?: { script: string };
}

export interface LoadflowResponse { 
    status: string; 
    results: LoadflowResult[]; 
    folder?: string;
    filename?: string;
}

export interface HistoryFile {
    name: string;
    date: string;
    path?: string;
}

export const useLoadflow = (
    currentProjectId: string | null, 
    activeSessionUid: string | null,
    currentProjectName: string | undefined
) => {
    const { user } = useAuth();
    
    // State
    const [results, setResults] = useState<LoadflowResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [historyFiles, setHistoryFiles] = useState<HistoryFile[]>([]);

    const apiCall = useCallback(async (endpoint: string, options: RequestInit = {}) => {
        if (!user) return;
        const token = await user.getIdToken();
        const headers = { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers 
        };
        const response = await fetch(`https://api.solufuse.com${endpoint}`, { ...options, headers });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'API Error');
        }
        return response.json();
    }, [user]);

    // [+] [INFO] Refresh available archives
    const refreshHistory = useCallback(async () => {
        if (!currentProjectId && !activeSessionUid) return;

        try {
            let url = '/files/details';
            if (currentProjectId) url += `?project_id=${currentProjectId}`;
            else if (activeSessionUid) url += `?project_id=${activeSessionUid}`; 

            const data = await apiCall(url);
            
            const archives = (data.files || [])
                .filter((f: any) => 
                    f.filename.includes('loadflow_results') || 
                    f.filename.match(/_\d{8}_\d{6}\.json$/)
                )
                .map((f: any) => ({ 
                    name: f.filename.split('/').pop(),
                    date: f.uploaded_at,
                    path: f.filename
                }))
                .sort((a: any, b: any) => b.name.localeCompare(a.name));

            setHistoryFiles(archives);
        } catch (err) { console.error("Failed to load history", err); }
    }, [currentProjectId, activeSessionUid, apiCall]);

    // Trigger refresh when context changes
    useEffect(() => {
        if (currentProjectId || activeSessionUid) refreshHistory();
    }, [currentProjectId, activeSessionUid, refreshHistory]);

    // [+] [INFO] Run Analysis with Custom Name
    const runAnalysis = async (customName: string) => {
        if (!currentProjectId && !activeSessionUid) return;
        setLoading(true);
        setError(null);
        setResults([]);
        
        try {
            // Use custom name or fallback to project/default
            let base = customName.trim();
            if (!base) base = (currentProjectName || 'run');
            
            // Clean the name strictly
            const safeName = base.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 20);
            
            let url = `/loadflow/run-and-save?basename=${safeName}`;
            if (currentProjectId) url += `&project_id=${currentProjectId}`;
            
            const data: LoadflowResponse = await apiCall(url, { method: 'POST' });

            if (data.results) setResults(data.results);
            await refreshHistory();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // [+] [INFO] Load specific result file
    const loadResultFile = async (filename: string) => {
        if (!currentProjectId && !activeSessionUid) return;
        setLoading(true);
        setError(null);
        try {
            const cleanPath = filename.includes('/') ? filename : `loadflow_results/${filename}`;
            
            let url = `https://api.solufuse.com/files/download?filename=${cleanPath}`;
            if (currentProjectId) url += `&project_id=${currentProjectId}`;
            else if (activeSessionUid) url += `&project_id=${activeSessionUid}`;

            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${(await user?.getIdToken())}` }
            });
            
            if (!response.ok) throw new Error("Could not load archive");
            
            const blob = await response.blob();
            const text = await blob.text();
            const json = JSON.parse(text); 
            
            if (Array.isArray(json)) setResults(json);
            else if (json.results) setResults(json.results);
            else if (Array.isArray(json.data)) setResults(json.data);
            else throw new Error("Invalid JSON Format");

        } catch (err: any) {
            setError("Failed to load archive: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return {
        results,
        loading,
        error,
        historyFiles,
        runAnalysis,
        loadResultFile,
        refreshHistory
    };
};
