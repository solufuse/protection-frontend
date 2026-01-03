
// [structure:root] : Custom Hook for File Management logic
// [context:flow] : Handles fetching, uploading, deleting, and sorting of files to keep UI components light.

import { useState, useEffect, useCallback } from 'react';
import { SessionFile, SortKey, SortOrder } from '../components/FileTable';

// [decision:logic] : Return type definition for strict typing in components
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

    // [+] [INFO] : Helper to get the auth token
    const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

    // [+] [INFO] : Fetch Files from Backend
    const fetchFiles = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const t = await getToken();
            let url = `${apiUrl}/files/details`;
            
            // [decision:logic] : Determine context (Project vs Session)
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
            fetchFiles(); // Refresh list immediately
        } catch (e: any) {
            notify(e.message || "Upload Failed", "error");
        } finally {
            setUploading(false);
        }
    };

    // [+] [INFO] : Single Delete Logic
    const handleDelete = async (path: string) => {
        try {
            const t = await getToken();
            let url = `${apiUrl}/files/file/${path}`;
            if (activeProjectId) url += `?project_id=${activeProjectId}`;
            else if (activeSessionUid) url += `?project_id=${activeSessionUid}`;

            await fetch(url, { method: 'DELETE', headers: { 'Authorization': `Bearer ${t}` } });
            setFiles(p => p.filter(f => f.path !== path)); // Optimistic update
            notify("File deleted");
        } catch (e) {
            notify("Delete failed", "error");
        }
    };

    // [+] [INFO] : Bulk Delete Logic
    const handleBulkDelete = async (paths: string[]) => {
        if (!confirm(`Delete ${paths.length} files permanently?`)) return;
        
        // [?] [THOUGHT] : We process deletes in parallel for speed
        try {
            await Promise.all(paths.map(path => handleDelete(path)));
            notify(`${paths.length} Files deleted`);
        } catch (e) {
            notify("Some files could not be deleted", "error");
        }
    };

    // [+] [INFO] : Sorting Logic (Client-side)
    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({ key, order: current.key === key && current.order === 'asc' ? 'desc' : 'asc' }));
    };

    const sortedFiles = [...files].sort((a, b) => {
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
        refreshFiles: fetchFiles
    };
};
