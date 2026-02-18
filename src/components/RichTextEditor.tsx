'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useCallback, useEffect } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { toast } from 'react-hot-toast'; // Assuming a toast notification library for feedback

interface RichTextEditorProps {
  content: string; // JSON string
  onChange: (content: string) => void;
  editable?: boolean;
}

const MenuBar = ({ editor, organizationId }: { editor: any; organizationId: string }) => {
  if (!editor) {
    return null;
  }

  const setLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // update link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt('URL');

    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const uploadImage = useCallback(async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.onchange = async () => {
      if (input.files && input.files.length > 0) {
        const file = input.files[0];
        if (!organizationId) {
          toast.error("Organization ID not available for image upload.");
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('organizationId', organizationId); // Pass organizationId for permission check

        toast.loading('Uploading image...', { id: 'imageUpload' });
        const response = await fetch('/api/upload-article-image', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          editor.chain().focus().setImage({ src: data.url }).run();
          toast.success('Image uploaded!', { id: 'imageUpload' });
        } else {
          const errorData = await response.json();
          toast.error(errorData.error || 'Image upload failed', { id: 'imageUpload' });
        }
      }
    };
    input.click();
  }, [editor, organizationId]);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-300 p-2 bg-gray-50 rounded-t-md">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
      >
        Bold
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
      >
        Italic
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
      >
        Strike
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? 'is-active' : ''}
      >
        Code
      </button>
      <button onClick={() => editor.chain().focus().unsetAllMarks().run()}>
        Clear Marks
      </button>
      <button onClick={() => editor.chain().focus().clearNodes().run()}>
        Clear Nodes
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
      >
        H3
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
      >
        Bullet List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
      >
        Ordered List
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'is-active' : ''}
      >
        Code Block
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive('blockquote') ? 'is-active' : ''}
      >
        Blockquote
      </button>
      <button onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        Horizontal Rule
      </button>
      <button onClick={() => editor.chain().focus().setHardBreak().run()}>
        Hard Break
      </button>
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        Undo
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        Redo
      </button>
      <button
        onClick={setLink}
        className={editor.isActive('link') ? 'is-active' : ''}
      >
        Set Link
      </button>
      <button
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive('link')}
      >
        Unset Link
      </button>
      <button onClick={addImage}>
        Add Image (URL)
      </button>
      <button onClick={uploadImage}>
        Upload Image
      </button>
    </div>
  );
};


export default function RichTextEditor({ content, onChange, editable = true }: RichTextEditorProps) {
  const { organization } = useOrganization(); // Get organization context for upload
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
    ],
    content: content ? JSON.parse(content) : '',
    onUpdate: ({ editor }) => {
      onChange(JSON.stringify(editor.getJSON()));
    },
    editable,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert prose-sm sm:prose-base lg:prose-lg xl:prose-xl focus:outline-none p-4 min-h-[200px] border border-gray-300 rounded-b-md bg-white',
      },
    },
  });

  // Basic styling for the editor menu buttons
  useEffect(() => {
    if (editor) {
      editor.view.dom.querySelectorAll('button').forEach(button => {
        button.className = `${button.className} px-3 py-1 rounded-md text-sm transition-colors ${
          button.classList.contains('is-active') ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`;
      });
    }
  }, [editor]);


  return (
    <div>
      {editable && <MenuBar editor={editor} organizationId={organization?.id || ''} />}
      <EditorContent editor={editor} />
    </div>
  );
}
