
// [structure:root] : Custom Hook for File Management logic
// [context:flow] : Handles fetching, uploading, deleting, sorting AND starring of files.

import { useState, useEffect, useCallback } from 'react';
import { SessionFile, SortKey, SortOrder } from '../components/FileTable';

interface UseFileManagerReturn {
    files: SessionFile[];
    loading: boolean;
    uploading: boolean;
    sortConfig: { key: SortKey; order: SortOrder };
    handleSort: (key: SortKey) => void;
    handleUpload: (fileList: FileList | null) => Promise<void>;
    handleDelete: (path: string) => Promise<void>;
    handleBulkDelete: (paths: string[]) => Promise<void>;
    handleBulkDownload: (selectedFiles: Set<string>, format?: 'raw' | 'xlsx' | 'json') => Promise<void>; 
    refreshFiles: () => void;
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
    
    const [files, setFiles] = useState<SessionFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'uploaded_at', order: 'desc' });
    
    const [starredFiles, setStarredFiles] = useState<Set<string>>(() => {
        const saved = localStorage.getItem('solufuse_starred_files');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

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

    const getToken = async () => { if (!user) return null; return await user.getIdToken(); };

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

    useEffect(() => { fetchFiles(); }, [fetchFiles]);

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

    // [!] UPDATED: Bulk Delete using Server-Side Endpoint
    const handleBulkDelete = async (paths: string[]) => {
        if (paths.length === 0) return;
        if (!confirm(`Delete ${paths.length} files permanently?`)) return;
        
        notify(`Deleting ${paths.length} files...`);
        
        try {
            const t = await getToken();
            let url = `${apiUrl}/files/bulk-delete`;
            if (activeProjectId) url += `?project_id=${activeProjectId}`;
            else if (activeSessionUid) url += `?project_id=${activeSessionUid}`;

            const res = await fetch(url, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${t}`,
                    'Content-Type': 'application/json' 
                },
                body: JSON.stringify(paths)
            });

            if (!res.ok) throw new Error("Bulk delete failed");
            
            const data = await res.json();
            
            // Remove deleted files from state optimistically
            const deletedSet = new Set(data.deleted);
            setFiles(prev => prev.filter(f => !deletedSet.has(f.path)));
            
            if (data.errors && data.errors.length > 0) {
                notify(`Deleted ${data.deleted.length} files. Some failed.`, "error");
            } else {
                notify(`${data.deleted.length} Files deleted`);
            }
            
        } catch (e) {
            console.error(e);
            notify("Bulk delete failed", "error");
        }
    };

    const handleBulkDownload = async (selectedFiles: Set<string>, format: 'raw' | 'xlsx' | 'json' = 'raw') => {
        const targets = Array.from(selectedFiles);
        if (targets.length === 0) return;

        notify(format === 'raw' ? `Compressing ${targets.length} files...` : `Converting ${targets.length} files to ${format.toUpperCase()}...`);
        
        try {
            const t = await getToken();
            let url = "";
            if (format === 'raw') {
                url = `${apiUrl}/files/bulk-download`;
            } else {
                url = `${apiUrl}/ingestion/bulk-download/${format}`;
            }
            if (activeProjectId) url += `?project_id=${activeProjectId}`;
            else if (activeSessionUid) url += `?project_id=${activeSessionUid}`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${t}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(targets) 
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.detail || "Compression/Conversion failed");
            }

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            
            const dateStr = new Date().toISOString().slice(0,19).replace(/:/g, "-");
            const prefix = format === 'raw' ? 'files' : `converted_${format}`;
            link.download = `solufuse_${prefix}_${dateStr}.zip`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            notify("Archive Downloaded!");

        } catch (e: any) {
            console.error(e);
            notify(e.message || "Bulk download failed", "error");
        }
    };

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({ key, order: current.key === key && current.order === 'asc' ? 'desc' : 'asc' }));
    };

    const sortedFiles = [...files].sort((a, b) => {
        const aStarred = starredFiles.has(a.path || a.filename);
        const bStarred = starredFiles.has(b.path || b.filename);

        if (aStarred && !bStarred) return -1; 
        if (!aStarred && bStarred) return 1;

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
        handleBulkDownload, 
        refreshFiles: fetchFiles,
        starredFiles,
        toggleStar
    };
};
