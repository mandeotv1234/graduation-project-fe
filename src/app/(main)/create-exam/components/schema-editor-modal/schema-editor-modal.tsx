'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useState, useEffect } from 'react'
import styles from '@/app/(main)/create-exam/components/schema-editor-modal/schema-editor-modal.module.scss'

interface SchemaEditorModalProps {
  isOpen: boolean
  onClose: () => void
  schema: string
  onSave: (schema: string) => void
}

export default function SchemaEditorModal({
  isOpen,
  onClose,
  schema,
  onSave
}: SchemaEditorModalProps) {
  const [editedSchema, setEditedSchema] = useState(schema)

  // Sync editedSchema with the schema prop when the modal opens
  useEffect(() => {
    if (isOpen) {
      setEditedSchema(schema)
    }
  }, [isOpen, schema])

  const handleSave = () => {
    onSave(editedSchema)
    onClose()
  }

  const handleCancel = () => {
    setEditedSchema(schema) // Reset về giá trị ban đầu
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={styles.modalContent}>
        <DialogHeader>
          <DialogTitle className={styles.modalTitle}>
            Nhập SQL CREATE TABLE:
          </DialogTitle>
          <DialogDescription className={styles.modalDescription}>
            Nhập câu lệnh SQL CREATE TABLE của bạn vào ô bên dưới
          </DialogDescription>
        </DialogHeader>

        <div className={styles.schemaField}>
          <Label htmlFor="schema-input" className={styles.fieldLabel}>
            SQL CREATE TABLE
          </Label>
          <Textarea
            id="schema-input"
            value={editedSchema}
            onChange={(e) => setEditedSchema(e.target.value)}
            className={styles.schemaTextarea}
            placeholder="CREATE TABLE Students (
  StudentID INT PRIMARY KEY,
  FirstName VARCHAR(50),
  LastName VARCHAR(50)
);"
          />
        </div>

        <DialogFooter className={styles.modalFooter}>
          <Button
            variant="outline"
            onClick={handleCancel}
            className={styles.cancelButton}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} className={styles.saveButton}>
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
