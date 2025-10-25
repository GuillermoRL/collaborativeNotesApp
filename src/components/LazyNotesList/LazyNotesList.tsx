import { FC, memo, useCallback, useMemo, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { deleteNote, setCurrentNote } from '@/store/notesSlice'
import NoteItem from './NoteItem'
import type { LazyNotesListProps } from './LazyNotesList.types'
import '../NotesList/NotesList.css'

const LazyNotesListComponent: FC<LazyNotesListProps> = ({
  onNoteClick,
  itemsPerPage = 10,
}) => {
  const dispatch = useAppDispatch()
  const notes = useAppSelector(state => state.notes.notes)

  const [shown, setShown] = useState(itemsPerPage)
  const [loading, setLoading] = useState(false)

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [notes])

  const visibleNotes = useMemo(() => {
    return sortedNotes.slice(0, shown)
  }, [sortedNotes, shown])

  const hasMore = shown < sortedNotes.length

  const handleLoadMore = useCallback(() => {
    setLoading(true)

    setTimeout(() => {
      setShown(prev => prev + itemsPerPage)
      setLoading(false)
    }, 300)
  }, [itemsPerPage])

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
        <>
          {visibleNotes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              onDelete={handleDelete}
              onClick={handleClick}
            />
          ))}

          {hasMore && (
            <div className="load-more-container">
              <button
                className="load-more-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
              <span className="notes-count">
                Showing {visibleNotes.length} of {sortedNotes.length} notes
              </span>
            </div>
          )}

          {!hasMore && sortedNotes.length > itemsPerPage && (
            <div className="all-loaded">
              <span>All {sortedNotes.length} notes loaded</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

const LazyNotesList = memo(LazyNotesListComponent)
LazyNotesList.displayName = 'LazyNotesList'

export default LazyNotesList
