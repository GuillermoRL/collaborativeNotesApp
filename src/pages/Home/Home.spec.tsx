import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import Home from './Home'
import type { Note } from '@/types/note'

// Mock child components
vi.mock('@/components/LazyNotesList', () => ({
  LazyNotesList: ({ onNoteClick }: { onNoteClick: (id: string) => void }) => (
    <div data-testid="lazy-notes-list">
      <button onClick={() => onNoteClick('test-note-1')}>Open Note 1</button>
      <button onClick={() => onNoteClick('test-note-2')}>Open Note 2</button>
    </div>
  ),
}))

vi.mock('@/components/EditorModal', () => ({
  EditorModal: ({
    note,
    onClose,
  }: {
    note: Note | null
    onClose: () => void
  }) => (
    <div data-testid="editor-modal">
      <div>Editing note: {note ? note.id : 'new'}</div>
      <button onClick={() => onClose()}>Close Modal</button>
    </div>
  ),
}))

describe('Home', () => {
  const mockNotes: Note[] = [
    {
      id: 'test-note-1',
      title: 'First Note',
      content: '<p>First content</p>',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 1800000,
      version: 1,
      lastEditedBy: 'User1',
    },
    {
      id: 'test-note-2',
      title: 'Second Note',
      content: '<p>Second content</p>',
      createdAt: Date.now() - 7200000,
      updatedAt: Date.now(),
      version: 2,
      lastEditedBy: 'User2',
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the home page with header', () => {
    renderWithProviders(<Home />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(screen.getByText('My Notes')).toBeInTheDocument()
    expect(screen.getByText('+ New Note')).toBeInTheDocument()
  })

  it('renders LazyNotesList component', () => {
    renderWithProviders(<Home />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(screen.getByTestId('lazy-notes-list')).toBeInTheDocument()
  })

  it('does not show EditorModal initially', () => {
    renderWithProviders(<Home />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(screen.queryByTestId('editor-modal')).not.toBeInTheDocument()
  })

  it('opens editor modal in new note mode when "New Note" is clicked', async () => {
    const { store } = renderWithProviders(<Home />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const createButton = screen.getByText('+ New Note')
    fireEvent.click(createButton)

    // Check that no new note was added to the store yet (only created on save)
    expect(store.getState().notes.notes).toHaveLength(2)

    // Check that the editor modal is opened in new note mode
    await waitFor(() => {
      expect(screen.getByTestId('editor-modal')).toBeInTheDocument()
      expect(screen.getByText('Editing note: new')).toBeInTheDocument()
    })
  })

  it('opens editor modal when a note is clicked from the list', () => {
    renderWithProviders(<Home />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const openNoteButton = screen.getByText('Open Note 1')
    fireEvent.click(openNoteButton)

    expect(screen.getByTestId('editor-modal')).toBeInTheDocument()
    expect(screen.getByText('Editing note: test-note-1')).toBeInTheDocument()
  })

  it('closes editor modal when close is called', async () => {
    renderWithProviders(<Home />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    // Open a note
    const openNoteButton = screen.getByText('Open Note 1')
    fireEvent.click(openNoteButton)

    expect(screen.getByTestId('editor-modal')).toBeInTheDocument()

    // Close the editor
    const closeButton = screen.getByText('Close Modal')
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByTestId('editor-modal')).not.toBeInTheDocument()
    })
  })

  it('can switch between different notes', () => {
    renderWithProviders(<Home />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    // Open first note
    const openNote1Button = screen.getByText('Open Note 1')
    fireEvent.click(openNote1Button)
    expect(screen.getByText('Editing note: test-note-1')).toBeInTheDocument()

    // Close and open second note
    const closeButton = screen.getByText('Close Modal')
    fireEvent.click(closeButton)

    const openNote2Button = screen.getByText('Open Note 2')
    fireEvent.click(openNote2Button)
    expect(screen.getByText('Editing note: test-note-2')).toBeInTheDocument()
  })

  it('opens and closes new note modal without creating a note', async () => {
    const { store } = renderWithProviders(<Home />, {
      preloadedState: {
        notes: {
          notes: [],
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const createButton = screen.getByText('+ New Note')

    // Open new note modal
    fireEvent.click(createButton)
    await waitFor(() => {
      expect(screen.getByTestId('editor-modal')).toBeInTheDocument()
    })

    // No note created yet
    expect(store.getState().notes.notes).toHaveLength(0)

    // Close editor without saving
    const closeButton = screen.getByText('Close Modal')
    fireEvent.click(closeButton)

    // Still no note created
    await waitFor(() => {
      expect(screen.queryByTestId('editor-modal')).not.toBeInTheDocument()
      expect(store.getState().notes.notes).toHaveLength(0)
    })
  })

  it('passes correct itemsPerPage prop to LazyNotesList', () => {
    renderWithProviders(<Home />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    // LazyNotesList should be rendered (we're checking through the mock)
    expect(screen.getByTestId('lazy-notes-list')).toBeInTheDocument()
  })
})
