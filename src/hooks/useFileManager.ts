
// [structure:root] : Custom Hook for File Management logic
// [context:flow] : Handles fetching, uploading, deleting, sorting AND starring of files.

import { useState, useEffect, useCallback } from 'react';
import { SessionFile, SortKey, SortOrder } from '../components/FileTable';

// [decision:logic] : Return type definition
interface UseFileManagerReturn {
    files: SessionFile[];
    loading: boolean;
    uploading: boolean;
    sortConfig: { key: SortKey; order: SortOrder };
    handleSort: (key: SortKey) => void;
    handleUpload: (fileList: FileList | null) => Promise<void>;
    handleDelete: (path: string) => Promise<void>;
    handleBulkDelete: (paths: string[]) => Promise<void>;
    refreshFiles: () => void;
    // [!] [CRITICAL] : New Star features
    starredFiles: Set<string>;
    toggleStar: (path: string) => void;
}

export const useFileManager = (
    user: any, 
    activeProjectId: string | null, 
    activeSessionUid: string | null,
    apiUrl: string,
    notify: (msg: string, type?: 'success' | 'error') => void
): UseFileManagerReturn => {
    
    // [context:flow] : State Definitions
    const [files, setFiles] = useState<SessionFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'uploaded_at', order: 'desc' });
    
    // [decision:logic] : Initialize Starred Files from LocalStorage
    // We use a Set for O(1) lookup performance during rendering.
    const [starredFiles, setStarredFiles] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('solufuse_starred_files');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // [+] [INFO] : Persist stars when changed
    useEffect(() => {
        localStorage.setItem('solufuse_starred_files', JSON.stringify(Array.from(starredFiles)));
    }, [starredFiles]);

    const toggleStar = (path: string) => {
        setStarredFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) newSet.delete(path);
            else newSet.add(path);
            return newSet;
        });
    };

    // [+] [INFO] : Helper to get the auth token
    const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

    // [+] [INFO] : Fetch Files from Backend
    const fetchFiles = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const t = await getToken();
            let url = `${apiUrl}/files/details`;
            if (activeProjectId) url += `?project_id=${activeProjectId}`;
            else if (activeSessionUid) url += `?project_id=${activeSessionUid}`;

            const res = await fetch(url, { headers: { 'Authorization': `Bearer ${t}` } });
            if (!res.ok) throw new Error("Failed to fetch");
            const data = await res.json();
            setFiles(data.files || []);
        } catch (e) {
            console.error(e);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    }, [user, activeProjectId, activeSessionUid, apiUrl]);

    // [+] [INFO] : Initial Load
    useEffect(() => { fetchFiles(); }, [fetchFiles]);

    // [+] [INFO] : Upload Logic
    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || !user) return;
        setUploading(true);
        
        const formData = new FormData();
        Array.from(fileList).forEach(f => formData.append('files', f));

        try {
            const t = await getToken();
            let url = `${apiUrl}/files/upload`;
            if (activeProjectId) url += `?project_id=${activeProjectId}`;
            else if (activeSessionUid) url += `?project_id=${activeSessionUid}`;

            const res = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${t}` }, body: formData });
            if (!res.ok) throw new Error("Upload Failed");
            
            notify(`${fileList.length} File(s) Uploaded`);
            fetchFiles(); 
        } catch (e: any) {
            notify(e.message || "Upload Failed", "error");
        } finally {
            setUploading(false);
        }
    };

    // [+] [INFO] : Delete Logic
    const handleDelete = async (path: string) => {
        try {
            const t = await getToken();
            let url = `${apiUrl}/files/file/${path}`;
            if (activeProjectId) url += `?project_id=${activeProjectId}`;
            else if (activeSessionUid) url += `?project_id=${activeSessionUid}`;

            await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } });
            setFiles(p => p.filter(f => f.path !== path));
            notify("File deleted");
        } catch (e) {
            notify("Delete failed", "error");
        }
    };

    const handleBulkDelete = async (paths: string[]) => {
        if (!confirm(`Delete ${paths.length} files permanently?`)) return;
        try {
            await Promise.all(paths.map(path => handleDelete(path)));
            notify(`${paths.length} Files deleted`);
        } catch (e) {
            notify("Some files could not be deleted", "error");
        }
    };

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({ key, order: current.key === key && current.order === 'asc' ? 'desc' : 'asc' }));
    };

    // [decision:logic] : Sorting Strategy
    // 1. Starred files ALWAYS come first.
    // 2. Then normal sorting applies.
    const sortedFiles = [...files].sort((a, b) => {
        // [!] [CRITICAL] : Star Priority Logic
        const aStarred = starredFiles.has(a.path || a.filename);
        const bStarred = starredFiles.has(b.path || b.filename);

        if (aStarred && !bStarred) return -1; // a comes first
        if (!aStarred && bStarred) return 1;  // b comes first

        // Standard sorting for items with same star status
        let aVal: any = a[sortConfig.key];
        let bVal: any = b[sortConfig.key];
        
        if (sortConfig.key === 'size') {
            aVal = a.size; bVal = b.size;
        } else if (sortConfig.key === 'uploaded_at') {
            aVal = new Date(a.uploaded_at || 0).getTime();
            bVal = new Date(b.uploaded_at || 0).getTime();
        } else {
            aVal = aVal?.toString().toLowerCase() || "";
            bVal = bVal?.toString().toLowerCase() || "";
        }
        
        if (aVal < bVal) return sortConfig.order === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.order === 'asc' ? 1 : -1;
        return 0;
    });

    return {
        files: sortedFiles,
        loading,
        uploading,
        sortConfig,
        handleSort,
        handleUpload,
        handleDelete,
        handleBulkDelete,
        refreshFiles: fetchFiles,
        starredFiles,
        toggleStar
    };
};
