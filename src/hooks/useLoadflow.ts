
import { useState, useEffect, useCallback } from 'react';
import { LoadflowResponse, LoadflowResult } from '../types/loadflow';

const API_URL = import.meta.env.VITE_API_URL || "https://api.solufuse.com";
const MAX_HISTORY = 5;

// Helper to sort by revision number
const extractLoadNumber = (rev: string | undefined) => {
    if (!rev) return 0;
    const match = rev.match(/(\d+)/);
    return match ? parseInt(match[0]) : 0;
};

export const useLoadflow = (user: any, activeProjectId: string | null, activeSessionUid: string | null, notify: (msg: string, type?: 'success'|'error') => void) => {
    
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<LoadflowResult[]>([]);
    const [scenarioGroups, setScenarioGroups] = useState<Record<string, LoadflowResult[]>>({});
    const [baseName, setBaseName] = useState("lf_results");
    const [historyFiles, setHistoryFiles] = useState<{name: string, date: string}[]>([]);

    const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

    // [CRITICAL] Target ID Logic (Project > Session > Self)
    const getTargetId = useCallback(() => {
        if (activeProjectId) return activeProjectId;
        if (activeSessionUid) return activeSessionUid;
        return user?.uid; 
    }, [activeProjectId, activeSessionUid, user]);

    // Data Processing
    const processResults = (data: LoadflowResponse) => {
        if (!data.results) return;
        const groups: Record<string, LoadflowResult[]> = {};
        
        data.results.forEach(r => {
            const key = r.study_case ? `${r.study_case.id} / ${r.study_case.config}` : "Unknown Scenario";
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
        });

        // Sort inside groups
        Object.keys(groups).forEach(k => {
            groups[k].sort((a, b) => extractLoadNumber(a.study_case?.revision) - extractLoadNumber(b.study_case?.revision));
        });
        setScenarioGroups(groups);

        // Sort main list
        data.results.sort((a, b) => {
            const keyA = a.study_case ? `${a.study_case.id}_${a.study_case.config}` : a.filename;
            const keyB = b.study_case ? `${b.study_case.id}_${b.study_case.config}` : b.filename;
            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return extractLoadNumber(a.study_case?.revision) - extractLoadNumber(b.study_case?.revision);
        });
        setResults(data.results);
    };

    // Load Specific File
    const handleManualLoad = async (filename: string) => {
        if (!user) return;
        setLoading(true);
        try {
            const t = await getToken();
            const targetId = getTargetId();
            let jsonFilename = filename;
            if (!jsonFilename.endsWith('.json')) jsonFilename += '.json';

            let url = `${API_URL}/ingestion/preview?filename=${encodeURIComponent(jsonFilename)}&token=${t}&project_id=${targetId}`;
            
            const res = await fetch(url);
            if (!res.ok) throw new Error("No results found.");
            const data: LoadflowResponse = await res.json();
            processResults(data);
            notify(`Loaded: ${data.results.length} files`);
        } catch (e: any) {
            notify(e.message, "error");
        } finally {
            setLoading(false);
        }
    };

    // Auto-Detect Logic
    const detectAndLoad = useCallback(async () => {
        if (!user) return;
        const targetId = getTargetId();
        if (!targetId) return;

        setLoading(true);
        setResults([]); // Clear previous
        try {
            const t = await getToken();
            const listRes = await fetch(`${API_URL}/files/details?project_id=${targetId}`, { headers: { 'Authorization': `Bearer ${t}` } });
            if (!listRes.ok) throw new Error("Failed to list files");

            const listData = await listRes.json();
            const files = listData.files || [];
            const jsonFiles = files.filter((f: any) => f.filename.toLowerCase().endsWith('.json') && !f.filename.includes('config.json'));

            // Update History
            const hist = jsonFiles.map((f: any) => ({ name: f.filename, date: f.uploaded_at }))
                                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setHistoryFiles(hist);

            if (hist.length > 0) {
                // Auto-load most recent
                const mostRecent = hist[0];
                const cleanName = mostRecent.name.split('/').pop().replace('.json', '').replace(/_\d{8}_\d{6}$/, "");
                setBaseName(cleanName);
                
                // Call manual load logic internally
                let prevUrl = `${API_URL}/ingestion/preview?filename=${encodeURIComponent(mostRecent.name)}&token=${t}&project_id=${targetId}`;
                const dataRes = await fetch(prevUrl);
                if (dataRes.ok) {
                    const jsonData = await dataRes.json();
                    processResults(jsonData);
                    notify(`Auto-loaded: ${mostRecent.name}`);
                }
            }
        } catch (e: any) {
            console.warn("Auto-load failed", e);
        } finally {
            setLoading(false);
        }
    }, [user, getTargetId]); // Dependencies

    // Run Analysis
    const runAnalysis = async () => {
        if (!user) return;
        const targetId = getTargetId();
        if (!targetId) return notify("Context Error", "error");

        setLoading(true);
        try {
            const t = await getToken();
            const cleanBaseName = baseName.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 20) || "lf_run";
            
            // Clean old files logic inline
            const deleteOld = async () => {
                 try {
                    const listRes = await fetch(`${API_URL}/files/details?project_id=${targetId}`, { headers: { Authorization: `Bearer ${t}` }});
                    if(listRes.ok) {
                        const allFiles = await listRes.json();
                        const matches = (allFiles.files || []).filter((f: any) => f.filename.includes(cleanBaseName + "_") && f.filename.endsWith(".json"));
                        matches.sort((a: any, b: any) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
                        if (matches.length > MAX_HISTORY) {
                            for (const f of matches.slice(MAX_HISTORY)) {
                                await fetch(`${API_URL}/files/file/${f.filename}?project_id=${targetId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` }});
                            }
                        }
                    }
                 } catch(e) {}
            };

            let url = `${API_URL}/loadflow/run-and-save?basename=${cleanBaseName}&project_id=${targetId}`;
            const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` } });
            
            if (!res.ok) throw new Error("Calculation Failed");
            const data = await res.json();

            if (data.filename) {
                const fullPath = data.folder ? `${data.folder}/${data.filename}` : data.filename;
                await handleManualLoad(fullPath);
                await deleteOld();
                notify("Analysis Computed & Saved");
            } else {
                throw new Error("No filename returned");
            }
        } catch (e: any) {
            notify(e.message || "Error", "error");
        } finally {
            setLoading(false);
        }
    };

    // Initial Trigger
    useEffect(() => {
        let mounted = true;
        if (user && mounted) detectAndLoad();
        return () => { mounted = false; };
    }, [activeProjectId, activeSessionUid, user]); // Re-run when context changes

    return {
        loading,
        results,
        scenarioGroups,
        baseName,
        setBaseName,
        historyFiles,
        handleManualLoad,
        runAnalysis,
        extractLoadNumber
    };
};
