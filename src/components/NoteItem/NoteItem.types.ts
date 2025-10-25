import type { Note } from '@/types/note'

export interface NoteItemProps {
  note: Note
  onDelete: (id: string) => void
  onClick: (id: string) => void
}
