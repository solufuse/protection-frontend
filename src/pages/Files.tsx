// src/pages/Files.tsx
import FileManager from '../components/files/FileManager';

export default function Files({ user }: { user: any }) {
    return <FileManager user={user} />;
}
