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
import { useState } from 'react'

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nhập SQL CREATE TABLE:</DialogTitle>
          <DialogDescription>
            Nhập câu lệnh SQL CREATE TABLE của bạn vào ô bên dưới
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="schema-input">SQL CREATE TABLE</Label>
          <Textarea
            id="schema-input"
            value={editedSchema}
            onChange={(e) => setEditedSchema(e.target.value)}
            className="font-mono text-sm min-h-[200px] bg-background"
            placeholder="CREATE TABLE Students (
  StudentID INT PRIMARY KEY,
  FirstName VARCHAR(50),
  LastName VARCHAR(50)
);"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
