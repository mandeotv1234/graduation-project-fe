'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { Button } from '@/components/ui/button'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered
} from 'lucide-react'
import { Label } from '@/components/ui/label'

interface ExamDescriptionEditorProps {
  content: string
  onContentChange: (content: string) => void
}

export default function ExamDescriptionEditor({
  content,
  onContentChange
}: ExamDescriptionEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      })
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onContentChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[120px] px-4 py-3 focus:outline-none bg-background text-foreground'
      }
    }
  })

  if (!editor) {
    return null
  }

  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Mô tả chi tiết</Label>
      <div className="border border-input rounded-md overflow-hidden bg-background">
        {/* Toolbar */}
        <div className="flex items-center gap-1 p-2 border-b border-border bg-card">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('underline') ? 'bg-accent' : ''}`}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 p-0 ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
      <p className="text-xs text-muted-foreground">
        Dùng các nút ở bài tập, bao gồm hướng dẫn, mục tiêu và kỹ thuật có thể
        liên quan đến lên quan đến cho người dùng.
      </p>
    </div>
  )
}
