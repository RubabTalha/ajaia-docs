import React, { useRef, useState } from 'react';
import { Button } from './ui/Button';
import { uploadsApi, Attachment } from '../lib/api';
import { useToast } from './ui/Toast';

interface FileUploadProps { documentId: string; editable: boolean; onImported?: () => void; }
const SUPPORTED = '.txt, .md, .png, .jpg, .jpeg, .gif, .webp, .pdf';

export const FileUpload: React.FC<FileUploadProps> = ({ documentId, editable, onImported }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showList, setShowList] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const load = async () => { try { setAttachments(await uploadsApi.list(documentId)); } catch {} };

  const upload = async (file: File, importContent: boolean) => {
    setUploading(true);
    try {
      const r = await uploadsApi.upload(documentId, file, importContent);
      showToast(r.imported ? `Imported from ${file.name}` : `Attached ${file.name}`, 'success');
      if (r.imported) onImported?.();
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
    finally { setUploading(false); }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>, imp: boolean) => {
    const f = e.target.files?.[0];
    if (f) { upload(f, imp); e.target.value = ''; }
  };

  const remove = async (id: string) => {
    try { await uploadsApi.delete(documentId, id); showToast('Removed', 'success'); load(); } catch (e: any) { showToast(e.message, 'error'); }
  };

  const fmtSize = (b: number) => b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`;

  if (!editable) return null;

  return (
    <div className="border-t border-surface-100 px-12 py-3 bg-surface-50/50 no-print">
      <input ref={fileRef} type="file" accept={SUPPORTED} onChange={(e) => onChange(e, false)} className="hidden" />
      <input ref={importRef} type="file" accept=".txt,.md" onChange={(e) => onChange(e, true)} className="hidden" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>} onClick={() => fileRef.current?.click()} loading={uploading}>Attach</Button>
          <Button variant="ghost" size="sm" icon={<svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>} onClick={() => importRef.current?.click()} loading={uploading}>Import .txt/.md</Button>
          {attachments.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { setShowList(!showList); if (!showList) load(); }}>
              {showList ? 'Hide' : 'Show'} ({attachments.length})
            </Button>
          )}
        </div>
        <span className="text-[10px] text-surface-300 font-medium">{SUPPORTED}</span>
      </div>

      {showList && attachments.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2 animate-fade-in">
          {attachments.map(att => (
            <div key={att.id} className="flex items-center gap-2 py-2 px-3 bg-white rounded-lg border border-surface-100 shadow-card">
              <div className="w-7 h-7 rounded-md bg-brand-50 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-surface-700 truncate">{att.original_name}</p>
                <p className="text-[10px] text-surface-400">{fmtSize(att.size)}</p>
              </div>
              <button onClick={() => remove(att.id)} className="p-0.5 text-surface-300 hover:text-red-500 transition-colors">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};