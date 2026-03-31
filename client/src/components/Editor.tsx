import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { EditorToolbar } from './EditorToolbar';
import { useEffect, useCallback, useRef } from 'react';

interface EditorProps {
  content: string;
  editable: boolean;
  onUpdate: (content: string) => void;
  title: string;
  onTitleChange: (title: string) => void;
}

export const DocumentEditor: React.FC<EditorProps> = ({ content, editable, onUpdate, title, onTitleChange }) => {
  const saveTimeout = useRef<NodeJS.Timeout>();
  const lastSaved = useRef(content);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), Underline],
    content,
    editable,
    editorProps: { attributes: { class: 'tiptap' } },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        if (html !== lastSaved.current) {
          lastSaved.current = html;
          onUpdate(html);
        }
      }, 500);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
      lastSaved.current = content;
    }
  }, [editor, content]);

  useEffect(() => () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); }, []);

  if (!editor) return <div className="flex-1 flex items-center justify-center"><div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-12 pt-10 pb-2">
        <input
          type="text" value={title} onChange={(e) => onTitleChange(e.target.value)}
          disabled={!editable} placeholder="Untitled Document"
          className="w-full text-[28px] font-bold text-surface-900 placeholder:text-surface-200 focus:outline-none bg-transparent disabled:opacity-50 tracking-tight"
        />
      </div>
      {editable && <EditorToolbar editor={editor} />}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};