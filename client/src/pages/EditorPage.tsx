import React, { useState, useEffect, useCallback, useRef } from 'react';
import { documentsApi, DocumentDetail, DocumentListItem } from '../lib/api';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { DocumentEditor } from '../components/Editor';
import { FileUpload } from '../components/FileUpload';
import { getCurrentUser } from '../lib/auth';
import { useToast } from '../components/ui/Toast';

interface EditorPageProps { initialDocId?: string; onLogout: () => void; }

export const EditorPage: React.FC<EditorPageProps> = ({ initialDocId, onLogout }) => {
  const [documents, setDocuments] = useState<{ owned: DocumentListItem[]; shared: DocumentListItem[] }>({ owned: [], shared: [] });
  const [activeDocId, setActiveDocId] = useState<string | null>(initialDocId || null);
  const [activeDoc, setActiveDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const titleTimeout = useRef<NodeJS.Timeout>();
  const { showToast } = useToast();

  const loadDocs = useCallback(async () => {
    try { setDocuments(await documentsApi.list()); }
    catch (e: any) { if (e.message.includes('User')) { onLogout(); return; } showToast(e.message, 'error'); }
  }, [onLogout, showToast]);

  const loadDoc = useCallback(async (id: string) => {
    setLoading(true);
    try { setActiveDoc(await documentsApi.get(id)); setActiveDocId(id); }
    catch (e: any) { showToast(e.message, 'error'); setActiveDoc(null); setActiveDocId(null); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { loadDocs(); }, [loadDocs]);
  useEffect(() => { if (activeDocId) loadDoc(activeDocId); else setActiveDoc(null); }, [activeDocId, loadDoc]);

  const handleContentUpdate = useCallback(async (content: string) => {
    if (!activeDoc) return;
    try {
      await documentsApi.update(activeDoc.id, { content });
      setDocuments(prev => ({
        ...prev,
        owned: prev.owned.map(d => d.id === activeDoc.id ? { ...d, updated_at: new Date().toISOString() } : d),
        shared: prev.shared.map(d => d.id === activeDoc.id ? { ...d, updated_at: new Date().toISOString() } : d),
      }));
    } catch (e: any) { showToast(e.message, 'error'); }
  }, [activeDoc, showToast]);

  const handleTitleChange = useCallback((title: string) => {
    if (!activeDoc) return;
    setActiveDoc(prev => prev ? { ...prev, title } : null);
    if (titleTimeout.current) clearTimeout(titleTimeout.current);
    titleTimeout.current = setTimeout(async () => {
      try { await documentsApi.update(activeDoc.id, { title }); loadDocs(); }
      catch (e: any) { showToast(e.message, 'error'); }
    }, 500);
  }, [activeDoc, loadDocs, showToast]);

  return (
    <div className="h-screen flex bg-surface-100 overflow-hidden">
      <Sidebar owned={documents.owned} shared={documents.shared} activeId={activeDocId || undefined} onSelect={setActiveDocId} onCreateNew={async () => { try { const d = await documentsApi.create(); setActiveDocId(d.id); loadDocs(); showToast('Created', 'success'); } catch (e: any) { showToast(e.message, 'error'); } }} onUserSwitch={onLogout} />

      <div className="flex-1 flex flex-col min-w-0">
        {activeDoc ? (
          <>
            <Header document={activeDoc} onBack={() => setActiveDocId(null)} onDeleted={() => { setActiveDoc(null); setActiveDocId(null); loadDocs(); }} />
            <div className="flex-1 flex flex-col bg-white overflow-hidden rounded-tl-xl shadow-card">
              {loading ? (
                <div className="flex-1 flex items-center justify-center"><div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full" /></div>
              ) : (
                <>
                  <DocumentEditor content={activeDoc.content} editable={activeDoc.permission === 'owner' || activeDoc.permission === 'edit'} onUpdate={handleContentUpdate} title={activeDoc.title} onTitleChange={handleTitleChange} />
                  <FileUpload documentId={activeDoc.id} editable={activeDoc.permission === 'owner' || activeDoc.permission === 'edit'} onImported={() => { if (activeDocId) loadDoc(activeDocId); }} />
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl bg-surface-100 border border-surface-200 flex items-center justify-center mx-auto mb-5">
                <svg className="w-10 h-10 text-surface-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
              </div>
              <h2 className="text-lg font-semibold text-surface-600 mb-1">Select a document</h2>
              <p className="text-sm text-surface-400">Choose from the sidebar or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};