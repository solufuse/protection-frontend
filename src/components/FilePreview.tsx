import { Icons } from '../icons';

interface FilePreviewProps {
  data: any;
  loading: boolean;
}

export default function FilePreview({ data, loading }: FilePreviewProps) {
  return (
    <tr>
      <td colSpan={5} className="bg-slate-900 p-0">
        <div className="max-h-60 overflow-auto custom-scrollbar p-4 text-[10px] font-mono text-green-400">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 animate-pulse">
              <Icons.Refresh className="w-3 h-3 animate-spin"/> Loading...
            </div>
          ) : (
            <pre>{JSON.stringify(data?.tables || data, null, 2)}</pre>
          )}
        </div>
      </td>
    </tr>
  );
}
