import { memo, useCallback, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { deleteNote, setCurrentNote } from '@/store/notesSlice'
import NoteItem from '@/components/NoteItem/NoteItem'
import type { NotesListProps } from './NotesList.types'
import './NotesList.css'

const NotesListComponent = ({ onNoteClick }: NotesListProps) => {
  const dispatch = useAppDispatch()
  const notes = useAppSelector(state => state.notes.notes)

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes])

  const handleDelete = useCallback(
    (id: string) => {
      dispatch(deleteNote(id))
    },
    [dispatch]
  )

  const handleClick = useCallback(
    (id: string) => {
      dispatch(setCurrentNote(id))
      onNoteClick(id)
    },
    [dispatch, onNoteClick]
  )

  return (
    <div className="notes-list">
      {sortedNotes.length === 0 ? (
        <div className="empty-state">
          <p>No notes yet. Create your first note to get started!</p>
        </div>
      ) : (
        sortedNotes.map(note => (
          <NoteItem
            key={note.id}
            note={note}
            onDelete={handleDelete}
            onClick={handleClick}
          />
        ))
      )}
    </div>
  )
}

const NotesList = memo(NotesListComponent)
NotesList.displayName = 'NotesList'

export default NotesList
