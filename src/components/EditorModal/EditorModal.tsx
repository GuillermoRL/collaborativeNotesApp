/* eslint-disable react-hooks/preserve-manual-memoization */
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import {
  addNote,
  updateNote,
  updateNoteTitle,
  receiveRemoteEdit,
} from '@/store/notesSlice'
import { RichTextEditor } from '@/components/RichTextEditor'
import type { EditOperation, Note } from '@/types/note'
import type { EditorModalProps } from './EditorModal.types'
import './EditorModal.css'

const FAKE_USERS = ['alice', 'bob', 'charlie']
const ME = 'alice' // Current user

const EditorModal = ({ note = null, onClose }: EditorModalProps) => {
  const dispatch = useAppDispatch()

  const pendingEdits = useAppSelector(state => state.notes.pendingEdits)

  const [content, setContent] = useState(note?.content ?? '')
  const [title, setTitle] = useState(note?.title ?? '')
  const [simulating, setSimulating] = useState(false)
  const [notification, setNotification] = useState<string>('')
  const [showConflictDialog, setShowConflictDialog] = useState(false)
  const [conflictingEdit, setConflictingEdit] = useState<EditOperation | null>(
    null
  )

  // eslint-disable-next-line no-undef
  const simTimer = useRef<NodeJS.Timeout>()

  const onContentChange = useCallback((newContent: string) => {
    setContent(newContent)
  }, [])

  const onTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value)
    },
    []
  )

  const handleSave = useCallback(() => {
    // Discard empty notes without asking
    const isEmpty = !title.trim() && !content.trim()
    if (isEmpty) {
      onClose()
      return
    }

    const newNote: Note = {
      id: note?.id ?? '',
      title,
      content,
      version: note?.version ?? 1,
      createdAt: note?.createdAt ?? Date.now(),
      updatedAt: note?.updatedAt ?? Date.now(),
      lastEditedBy: ME,
    }

    if (!newNote?.id) {
      // Create new note
      dispatch(
        addNote({
          title: title.trim() || 'Untitled Note',
          content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          version: 1,
        })
      )
      setNotification('Note created successfully!')
      onClose()
      return
    }

    // Update existing note
    const conflict = pendingEdits.find(edit => edit.noteId === newNote.id)
    if (conflict) {
      setConflictingEdit(conflict)
      setShowConflictDialog(true)
      return
    }

    dispatch(
      updateNote({
        id: newNote.id,
        content,
        userId: ME,
      })
    )
    dispatch(
      updateNoteTitle({
        id: newNote.id,
        title: title.trim() || 'Untitled Note',
      })
    )
    setNotification('Saved successfully!')
    setTimeout(() => {
      setNotification('')
      onClose()
    }, 2000)
  }, [
    title,
    content,
    note?.id,
    note?.version,
    note?.createdAt,
    note?.updatedAt,
    pendingEdits,
    dispatch,
    onClose,
  ])

  const handleDiscardChanges = useCallback(() => {
    if (!note?.id || !conflictingEdit) return

    // Apply the remote edit and discard local changes
    setContent(conflictingEdit.content)
    dispatch(
      updateNote({
        id: note.id,
        content: conflictingEdit.content,
        userId: conflictingEdit.userId,
      })
    )
    dispatch(
      updateNoteTitle({
        id: note.id,
        title,
      })
    )
    setShowConflictDialog(false)
    setConflictingEdit(null)
    setNotification('Changes discarded, remote version applied')
    setTimeout(() => setNotification(''), 2000)
  }, [note, conflictingEdit, dispatch, title])

  const handleMergeChanges = useCallback(() => {
    if (!note?.id || !conflictingEdit) return

    // Simple merge: keep current content and append remote changes
    const mergedContent = content + '<hr/>' + conflictingEdit.content

    dispatch(
      updateNote({
        id: note.id,
        content: mergedContent,
        userId: ME,
      })
    )
    dispatch(
      updateNoteTitle({
        id: note.id,
        title,
      })
    )
    setContent(mergedContent)
    setShowConflictDialog(false)
    setConflictingEdit(null)
    setNotification('Changes merged successfully!')
    setTimeout(() => setNotification(''), 2000)
  }, [note?.id, conflictingEdit, content, dispatch, title])

  const fakeEdit = useCallback(() => {
    if (!note) return

    const user = FAKE_USERS[Math.floor(Math.random() * FAKE_USERS.length)]

    const edit: EditOperation = {
      noteId: note.id,
      userId: user,
      content: content + `<p><em>Edit from ${user}</em></p>`,
      version: note.version,
      timestamp: Date.now(),
    }
    setNotification(`${user} made an edit`)
    dispatch(receiveRemoteEdit(edit))

    setTimeout(() => {
      setNotification('')
    }, 3000)
  }, [note, content, dispatch])

  const toggleSim = useCallback(() => {
    if (simulating) {
      if (simTimer.current) {
        clearInterval(simTimer.current)
      }
      setSimulating(false)
    } else {
      setSimulating(true)
      simTimer.current = setInterval(
        () => {
          fakeEdit()
        },
        Math.random() * 5000 + 5000
      )
    }
  }, [simulating, fakeEdit])

  useEffect(() => {
    return () => {
      if (simTimer.current) {
        clearInterval(simTimer.current)
      }
    }
  }, [])

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <input
            type="text"
            className="modal-title-input"
            value={title}
            onChange={onTitleChange}
            placeholder="Note title..."
          />
          <div className="modal-actions">
            <button className="save-btn" onClick={handleSave}>
              Save
            </button>
            {note?.id && (
              <button
                className={`simulate-btn ${simulating ? 'active' : ''}`}
                onClick={toggleSim}
              >
                {simulating ? '⏸ Stop Simulation' : '▶ Simulate Edits'}
              </button>
            )}
            <button className="close-btn" onClick={handleClose}>
              ✕
            </button>
          </div>
        </header>

        {notification && (
          <div className="modal-notification">{notification}</div>
        )}

        {showConflictDialog && conflictingEdit && (
          <div
            className="conflict-dialog-overlay"
            onClick={e => e.stopPropagation()}
          >
            <div className="conflict-dialog">
              <h2>⚠️ Conflict Detected</h2>
              <p>
                There are modifications to this note by{' '}
                <strong>{conflictingEdit.userId}</strong>.
              </p>
              <p className="conflict-timestamp">
                Modified at:{' '}
                {new Date(conflictingEdit.timestamp).toLocaleString()}
              </p>
              <div className="conflict-preview">
                <h3>Remote Changes:</h3>
                <div
                  className="preview-content"
                  dangerouslySetInnerHTML={{ __html: conflictingEdit.content }}
                />
              </div>
              <div className="conflict-actions">
                <button className="btn-discard" onClick={handleDiscardChanges}>
                  Discard My Changes
                </button>
                <button className="btn-merge" onClick={handleMergeChanges}>
                  Merge Changes
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="modal-editor-content">
          <RichTextEditor
            value={content}
            onChange={onContentChange}
            placeholder="Start typing your note..."
          />
        </div>

        <footer className="modal-footer">
          {note ? (
            <>
              <span className="version-info">Version: {note.version}</span>
              <span className="last-edited">
                Last edited:{' '}
                {new Date(note.updatedAt).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {note.lastEditedBy && (
                <span className="edited-by">By: {note.lastEditedBy}</span>
              )}
            </>
          ) : (
            <span className="new-note-label">New Note</span>
          )}
        </footer>
      </div>
    </div>
  )
}

export default EditorModal
