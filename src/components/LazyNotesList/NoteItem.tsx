import React, { FC, memo, useCallback, useMemo } from 'react'
import type { NoteItemProps } from './NoteItem.types'

const NoteItemComponent: FC<NoteItemProps> = ({ note, onDelete, onClick }) => {
  const textPreview = useMemo(() => {
    const temp = document.createElement('div')
    temp.innerHTML = note.content
    return temp.textContent || temp.innerText || ''
  }, [note.content])

  const handleDelete = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation()
      if (window.confirm('Are you sure you want to delete this note?')) {
        onDelete(note.id)
      }
    },
    [note.id, onDelete]
  )

  const handleClick = useCallback(() => {
    onClick(note.id)
  }, [note.id, onClick])

  return (
    <div className="note-item" onClick={handleClick}>
      <div className="note-item-header">
        <h3 className="note-title">{note.title}</h3>
        <button
          className="delete-btn"
          onClick={handleDelete}
          aria-label="Delete note"
        >
          ×
        </button>
      </div>
      <p className="note-preview">
        {textPreview.substring(0, 100)}
        {textPreview.length > 100 ? '...' : ''}
      </p>
      <div className="note-meta">
        <span className="note-date">
          {new Date(note.updatedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        {note.lastEditedBy && (
          <span className="note-editor">
            Last edited by: {note.lastEditedBy}
          </span>
        )}
      </div>
    </div>
  )
}

const NoteItem = memo(NoteItemComponent)
NoteItem.displayName = 'NoteItem'

export default NoteItem
