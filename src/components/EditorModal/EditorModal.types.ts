import type { Note } from '@/types/note'

export interface EditorModalProps {
  note: Note | null
  onClose: () => void
}
