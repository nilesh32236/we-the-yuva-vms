'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code } from 'lucide-react';
import { memo, useCallback } from 'react';
import styles from './RichTextEditor.module.css';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

const ToolbarButton = memo(function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 rounded-lg transition-colors duration-150 ${
        active
          ? 'bg-brand-primary/10 text-brand-primary'
          : 'text-brand-muted hover:text-brand-text hover:bg-brand-bg'
      }`}
    >
      {children}
    </button>
  );
});

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const handleUpdate = useCallback(
    ({ editor: ed }: { editor: { getHTML: () => string } }) => {
      onChange(ed.getHTML());
    },
    [onChange],
  );

  const editor = useEditor({
    extensions: [StarterKit],
    content,
    editorProps: {
      attributes: {
        class: styles.editor,
      },
    },
    onUpdate: handleUpdate,
  });

  const handleBold = useCallback(() => editor.chain().focus().toggleBold().run(), [editor]);
  const handleItalic = useCallback(() => editor.chain().focus().toggleItalic().run(), [editor]);
  const handleHeading1 = useCallback(
    () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    [editor],
  );
  const handleHeading2 = useCallback(
    () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    [editor],
  );
  const handleBulletList = useCallback(() => editor.chain().focus().toggleBulletList().run(), [editor]);
  const handleOrderedList = useCallback(
    () => editor.chain().focus().toggleOrderedList().run(),
    [editor],
  );
  const handleBlockquote = useCallback(() => editor.chain().focus().toggleBlockquote().run(), [editor]);
  const handleCode = useCallback(() => editor.chain().focus().toggleCode().run(), [editor]);

  if (!editor)
    return (
      <p className="text-sm text-brand-muted p-4">
        Editor failed to load. Please refresh the page.
      </p>
    );

  return (
    <div className="rounded-xl border border-brand-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-brand-primary">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-2 border-b border-brand-border bg-brand-bg/50">
        <ToolbarButton onClick={handleBold} active={editor.isActive('bold')} label="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={handleItalic} active={editor.isActive('italic')} label="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-5 bg-brand-border mx-1" aria-hidden="true" />

        <ToolbarButton onClick={handleHeading1} active={editor.isActive('heading', { level: 1 })} label="Heading 1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={handleHeading2} active={editor.isActive('heading', { level: 2 })} label="Heading 2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-5 bg-brand-border mx-1" aria-hidden="true" />

        <ToolbarButton onClick={handleBulletList} active={editor.isActive('bulletList')} label="Bullet List">
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={handleOrderedList} active={editor.isActive('orderedList')} label="Ordered List">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>

        <span className="w-px h-5 bg-brand-border mx-1" aria-hidden="true" />

        <ToolbarButton onClick={handleBlockquote} active={editor.isActive('blockquote')} label="Blockquote">
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton onClick={handleCode} active={editor.isActive('code')} label="Code">
          <Code className="w-4 h-4" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
