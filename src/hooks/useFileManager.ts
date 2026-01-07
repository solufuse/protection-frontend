
import { useState, useEffect, useCallback } from 'react';
import { SessionFile, SortKey, SortOrder } from '../components/files/FileTable';

interface UseFileManagerReturn {
    files: SessionFile[];
    loading: boolean;
    uploading: boolean;
    currentPath: string;
    setCurrentPath: (path: string) => void;
    sortConfig: { key: SortKey; order: SortOrder };
    handleSort: (key: SortKey) => void;
    handleUpload: (fileList: FileList | null) => Promise<void>;
    handleDelete: (paths: string[]) => Promise<void>; // Changed to handle bulk delete
    handleCreateFolder: (folderName: string) => Promise<void>;
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
    const [currentPath, setCurrentPath] = useState(''); // NEW: Current path state
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; order: SortOrder }>({ key: 'type', order: 'asc' });
    
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
            const params = new URLSearchParams();
            if (activeProjectId) params.append('project_id', activeProjectId);
            else if (activeSessionUid) params.append('project_id', activeSessionUid);
            if (currentPath) params.append('path', currentPath); // NEW: Add path to request

            const res = await fetch(`${apiUrl}/files/details?${params.toString()}`, { 
                headers: { 'Authorization': `Bearer ${t}` } 
            });

            if (!res.ok) throw new Error("Failed to fetch files");
            const data = await res.json();
            setFiles(data.files || []);
        } catch (e) {
            console.error(e);
            setFiles([]);
            notify("Could not load files", "error");
        } finally {
            setLoading(false);
        }
    }, [user, activeProjectId, activeSessionUid, apiUrl, currentPath]); // NEW: currentPath dependency

    // Reset path when project changes
    useEffect(() => {
        setCurrentPath('');
    }, [activeProjectId, activeSessionUid]);

    useEffect(() => { fetchFiles(); }, [fetchFiles]);

    const handleUpload = async (fileList: FileList | null) => {
        if (!fileList || !user) return;
        setUploading(true);
        
        const formData = new FormData();
        Array.from(fileList).forEach(f => formData.append('files', f));

        try {
            const t = await getToken();
            const params = new URLSearchParams();
            if (activeProjectId) params.append('project_id', activeProjectId);
            else if (activeSessionUid) params.append('project_id', activeSessionUid);
            if (currentPath) params.append('path', currentPath); // NEW: Add path to upload

            const res = await fetch(`${apiUrl}/files/upload?${params.toString()}`, { 
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${t}` }, 
                body: formData 
            });

            if (!res.ok) throw new Error("Upload Failed");
            
            notify(`${fileList.length} File(s) Uploaded`);
            fetchFiles(); 
        } catch (e: any) {
            notify(e.message || "Upload Failed", "error");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (paths: string[]) => {
        if (paths.length === 0) return;
        if (!confirm(`Delete ${paths.length} item(s) permanently?`)) return;
        
        notify(`Deleting ${paths.length} item(s)...`);
        
        try {
            const t = await getToken();
            const params = new URLSearchParams();
            if (activeProjectId) params.append('project_id', activeProjectId);
            else if (activeSessionUid) params.append('project_id', activeSessionUid);

            const res = await fetch(`${apiUrl}/files/bulk-delete?${params.toString()}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({paths: paths})
            });

            if (!res.ok) throw new Error((await res.json()).detail || "Bulk delete failed");
            
            const data = await res.json();
            const deletedSet = new Set(data.deleted);
            setFiles(prev => prev.filter(f => !deletedSet.has(f.path)));
            
            if (data.errors && data.errors.length > 0) {
                notify(`Deleted ${data.deleted.length} of ${paths.length} items. Some failed.`, "error");
            } else {
                notify(`${data.deleted.length} Item(s) deleted`);
            }
            
        } catch (e: any) {
            console.error(e);
            notify(e.message || "Bulk delete failed", "error");
        }
    };
    
    const handleCreateFolder = async (folderName: string) => {
        if (!folderName.trim()) return notify("Folder name cannot be empty", "error");
        try {
            const t = await getToken();
            const params = new URLSearchParams();
            if (activeProjectId) params.append('project_id', activeProjectId);
            else if (activeSessionUid) params.append('project_id', activeSessionUid);

            const res = await fetch(`${apiUrl}/files/folder?${params.toString()}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: currentPath, name: folderName })
            });
            if (!res.ok) throw new Error((await res.json()).detail || "Failed to create folder");
            notify("Folder created");
            fetchFiles();
        } catch (e: any) {
            notify(e.message, "error");
        }
    };

    const handleBulkDownload = async (selectedFiles: Set<string>, format: 'raw' | 'xlsx' | 'json' = 'raw') => {
        const targets = Array.from(selectedFiles);
        if (targets.length === 0) return;

        notify(format === 'raw' ? `Compressing ${targets.length} files...` : `Converting ${targets.length} files to ${format.toUpperCase()}...`);
        
        try {
            const t = await getToken();
            const params = new URLSearchParams();
            if (activeProjectId) params.append('project_id', activeProjectId);
            else if (activeSessionUid) params.append('project_id', activeSessionUid);

            let url = format === 'raw' ? `${apiUrl}/files/bulk-download` : `${apiUrl}/ingestion/bulk-download/${format}`;

            const res = await fetch(`${url}?${params.toString()}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({paths: targets})
            });

            if (!res.ok) throw new Error((await res.json()).detail || "Download failed");

            const blob = await res.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            const dateStr = new Date().toISOString().slice(0,19).replace(/:/g, "-");
            link.download = `solufuse_export_${dateStr}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            notify("Download started!");

        } catch (e: any) {
            notify(e.message || "Download failed", "error");
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

        // NEW: Always sort folders first when sorting by name or type
        if (sortConfig.key === 'filename' || sortConfig.key === 'type') {
            if (a.type === 'folder' && b.type !== 'folder') return -1;
            if (a.type !== 'folder' && b.type === 'folder') return 1;
        }

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
        currentPath,
        setCurrentPath,
        sortConfig,
        handleSort,
        handleUpload,
        handleDelete, // Unified delete function
        handleCreateFolder,
        handleBulkDownload, 
        refreshFiles: fetchFiles,
        starredFiles,
        toggleStar
    };
};
