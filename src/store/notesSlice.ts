import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { Note, EditOperation } from '@/types/note'

interface NotesState {
  notes: Note[]
  currentNoteId: string | null
  pendingEdits: EditOperation[]
  loading: boolean
}

const demoNotes: Note[] = [
  {
    id: '1',
    title: 'Welcome to Collaborative Notes',
    content:
      '<p><strong>Welcome!</strong> This is a collaborative notes app.</p><p>Features:</p><ul><li>Real-time editing simulation</li><li>Rich text formatting</li><li>Conflict resolution</li></ul>',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
    version: 1,
  },
  {
    id: '2',
    title: 'Meeting Notes - Q4 Planning',
    content:
      '<p><em>Date: 2024-01-15</em></p><p><strong>Attendees:</strong> Team leads</p><p><strong>Topics:</strong></p><ol><li>Budget allocation</li><li>Resource planning</li><li>Timeline review</li></ol>',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
    version: 1,
  },
  {
    id: '3',
    title: 'Development Tasks',
    content:
      '<p><strong>High Priority:</strong></p><ul><li>Implement authentication</li><li>Add data validation</li></ul><p><strong>Medium Priority:</strong></p><ul><li>Improve UI/UX</li><li>Performance optimization</li></ul>',
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000,
    version: 1,
  },
]

const initialState: NotesState = {
  notes: demoNotes,
  currentNoteId: null,
  pendingEdits: [],
  loading: false,
}

const notesSlice = createSlice({
  name: 'notes',
  initialState,
  reducers: {
    addNote: {
      reducer: (state, action: PayloadAction<Note>) => {
        state.notes.unshift(action.payload)
      },
      prepare: (note: Omit<Note, 'id'>) => {
        const fresh: Note = {
          ...note,
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        }
        return { payload: fresh }
      },
    },

    deleteNote: (state, action: PayloadAction<string>) => {
      state.notes = state.notes.filter(note => note.id !== action.payload)
      if (state.currentNoteId === action.payload) {
        state.currentNoteId = null
      }
    },

    updateNote: (
      state,
      action: PayloadAction<{
        id: string
        content: string
        userId?: string
      }>
    ) => {
      const { id, content, userId } = action.payload
      const note = state.notes.find(n => n.id === id)

      if (note) {
        const conflict = state.pendingEdits.find(
          edit => edit.noteId === id && edit.version === note.version
        )

        if (conflict) {
          console.warn(
            `Conflict detected for note ${id}. Applying last-write-wins.`
          )
        }

        note.content = content
        note.updatedAt = Date.now()
        note.version += 1
        note.lastEditedBy = userId

        state.pendingEdits = state.pendingEdits.filter(
          edit => edit.noteId !== id
        )
      }
    },

    updateNoteTitle: (
      state,
      action: PayloadAction<{ id: string; title: string }>
    ) => {
      const note = state.notes.find(n => n.id === action.payload.id)
      if (note) {
        note.title = action.payload.title
        note.updatedAt = Date.now()
      }
    },

    setCurrentNote: (state, action: PayloadAction<string | null>) => {
      state.currentNoteId = action.payload
    },

    receiveRemoteEdit: (state, action: PayloadAction<EditOperation>) => {
      const edit = action.payload
      const note = state.notes.find(n => n.id === edit.noteId)
      if (!note) return

      state.notes = [
        {
          ...note,
          content: edit.content,
          version: edit.version + 1,
          updatedAt: edit.timestamp,
          lastEditedBy: edit.userId,
        },
        ...state.notes.filter(n => n.id !== edit.noteId),
      ]
      state.pendingEdits.push(edit)
    },

    loadNotes: (state, action: PayloadAction<Note[]>) => {
      state.notes = action.payload
      state.loading = false
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const {
  addNote,
  deleteNote,
  updateNote,
  updateNoteTitle,
  setCurrentNote,
  receiveRemoteEdit,
  loadNotes,
  setLoading,
} = notesSlice.actions

export default notesSlice.reducer
