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
import styles from '@/app/(main)/create-exam/components/exam-description-editor/exam-description-editor.module.scss'

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
        class: styles.editorContent
      }
    }
  })

  if (!editor) {
    return null
  }

  return (
    <div className={styles.descriptionEditorContainer}>
      <Label className={styles.sectionTitle}>Mô tả chi tiết</Label>
      <div className="border border-input rounded-md overflow-hidden bg-background">
        {/* Toolbar */}
        <div className={styles.editorToolbar}>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`${styles.toolbarButton} ${editor.isActive('bold') ? styles.active : ''}`}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`${styles.toolbarButton} ${editor.isActive('italic') ? styles.active : ''}`}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`${styles.toolbarButton} ${editor.isActive('underline') ? styles.active : ''}`}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`${styles.toolbarButton} ${editor.isActive('bulletList') ? styles.active : ''}`}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`${styles.toolbarButton} ${editor.isActive('orderedList') ? styles.active : ''}`}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor */}
        <EditorContent editor={editor} />
      </div>
      <p className="text-xs text-muted-foreground">
        Mô tả chi tiết bài tập, bao gồm hướng dẫn, mục tiêu và các kỹ thuật liên
        quan cho người dùng.
      </p>
    </div>
  )
}
