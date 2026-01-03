
// [structure:hook]
// USELOADFLOW HOOK
// [context:flow] Handles API interaction for Loadflow.

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

export const useLoadflow = (currentProjectId: string | undefined, currentProjectName: string | undefined) => {
    // [FIX] Use user object to get token dynamically
    const { user } = useAuth();
    
    // State
    const [results, setResults] = useState<LoadflowResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [historyFiles, setHistoryFiles] = useState<HistoryFile[]>([]);

    // [?] [THOUGHT] Standardized API fetcher with async token retrieval
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

    // [+] [INFO] Refresh available archives from backend
    const refreshHistory = useCallback(async () => {
        if (!currentProjectId) return;
        try {
            const data = await apiCall(`/files/details?project_id=${currentProjectId}`);
            
            // [decision:logic] Filter only JSONs in 'loadflow_results' or following the timestamp pattern
            const archives = (data.files || [])
                .filter((f: any) => 
                    f.filename.includes('loadflow_results') || 
                    f.filename.match(/_\d{8}_\d{6}\.json$/)
                )
                .map((f: any) => ({ 
                    name: f.filename.split('/').pop(), // Display name only
                    date: f.uploaded_at,
                    path: f.filename
                }))
                .sort((a: any, b: any) => b.name.localeCompare(a.name)); // Newest first

            setHistoryFiles(archives);
        } catch (err) { console.error("Failed to load history", err); }
    }, [currentProjectId, apiCall]);

    // Trigger refresh when project changes
    useEffect(() => {
        if (currentProjectId) refreshHistory();
    }, [currentProjectId, refreshHistory]);

    // [+] [INFO] Run Analysis
    const runAnalysis = async () => {
        if (!currentProjectId) return;
        setLoading(true);
        setError(null);
        setResults([]);
        
        try {
            // [decision:logic] Generate basename based on Project Name
            const safeName = (currentProjectName || 'run').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
            
            const data: LoadflowResponse = await apiCall(
                `/loadflow/run-and-save?project_id=${currentProjectId}&basename=${safeName}`, 
                { method: 'POST' }
            );

            if (data.results) setResults(data.results);
            await refreshHistory(); // Update sidebar immediately

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // [+] [INFO] Load specific result file
    const loadResultFile = async (filename: string) => {
        if (!currentProjectId) return;
        setLoading(true);
        setError(null);
        try {
            // Workaround: Use download endpoint to get content
            const cleanPath = filename.includes('/') ? filename : `loadflow_results/${filename}`;
            
            const response = await fetch(`https://api.solufuse.com/files/download?project_id=${currentProjectId}&filename=${cleanPath}`, {
                headers: { 'Authorization': `Bearer ${(await user?.getIdToken())}` }
            });
            
            if (!response.ok) throw new Error("Could not load archive");
            
            const blob = await response.blob();
            const text = await blob.text();
            const json = JSON.parse(text); 
            
            // Handle different JSON structures (Array or Object wrapper)
            if (Array.isArray(json)) setResults(json);
            else if (json.results) setResults(json.results);
            else if (Array.isArray(json.data)) setResults(json.data); // Safety fallback
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
