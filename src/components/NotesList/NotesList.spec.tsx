import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import NotesList from './NotesList'
import type { Note } from '@/types/note'

describe('NotesList', () => {
  const mockOnNoteClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.confirm
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    )
  })

  const now = Date.now()
  const mockNotes: Note[] = [
    {
      id: '1',
      title: 'First Note',
      content: '<p>This is the first note content</p>',
      createdAt: now - 3600000,
      updatedAt: now - 3600000, // Oldest
      version: 1,
      lastEditedBy: 'User1',
    },
    {
      id: '2',
      title: 'Second Note',
      content:
        '<p>This is the second note content with more text to test truncation behavior when the content exceeds one hundred characters</p>',
      createdAt: now - 7200000,
      updatedAt: now, // Most recent
      version: 2,
      lastEditedBy: 'User2',
    },
    {
      id: '3',
      title: 'Third Note',
      content: '<p>Short content</p>',
      createdAt: now - 10800000,
      updatedAt: now - 1800000, // Middle
      version: 1,
    },
  ]

  it('renders empty state when no notes exist', () => {
    renderWithProviders(<NotesList onNoteClick={mockOnNoteClick} />, {
      preloadedState: {
        notes: {
          notes: [],
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(screen.getByText(/No notes yet/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Create your first note to get started!/i)
    ).toBeInTheDocument()
  })

  it('renders list of notes', () => {
    renderWithProviders(<NotesList onNoteClick={mockOnNoteClick} />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(screen.getByText('First Note')).toBeInTheDocument()
    expect(screen.getByText('Second Note')).toBeInTheDocument()
    expect(screen.getByText('Third Note')).toBeInTheDocument()
  })

  it('sorts notes by updatedAt in descending order', () => {
    renderWithProviders(<NotesList onNoteClick={mockOnNoteClick} />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const noteItems = screen.getAllByRole('heading', { level: 3 })
    expect(noteItems[0]).toHaveTextContent('Second Note') // Most recent
    expect(noteItems[1]).toHaveTextContent('Third Note')
    expect(noteItems[2]).toHaveTextContent('First Note') // Oldest
  })

  it('displays note preview text without HTML tags', () => {
    renderWithProviders(<NotesList onNoteClick={mockOnNoteClick} />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(
      screen.getByText(/This is the first note content/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/This is the second note content/)
    ).toBeInTheDocument()
  })

  it('truncates preview text longer than 100 characters', () => {
    renderWithProviders(<NotesList onNoteClick={mockOnNoteClick} />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    // The text gets truncated at 100 characters
    expect(
      screen.getByText((content, element) => {
        return !!(
          element?.classList.contains('note-preview') &&
          content.includes('This is the second note content') &&
          content.endsWith('...')
        )
      })
    ).toBeInTheDocument()
  })

  it('displays last edited by information when available', () => {
    renderWithProviders(<NotesList onNoteClick={mockOnNoteClick} />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(screen.getByText(/Last edited by: User1/)).toBeInTheDocument()
    expect(screen.getByText(/Last edited by: User2/)).toBeInTheDocument()
  })

  it('calls onNoteClick and sets current note when note is clicked', () => {
    const { store } = renderWithProviders(
      <NotesList onNoteClick={mockOnNoteClick} />,
      {
        preloadedState: {
          notes: {
            notes: mockNotes,
            currentNoteId: null,
            pendingEdits: [],
            loading: false,
          },
        },
      }
    )

    const firstNote = screen.getByText('First Note').closest('.note-item')
    fireEvent.click(firstNote!)

    expect(mockOnNoteClick).toHaveBeenCalledWith('1')
    expect(store.getState().notes.currentNoteId).toBe('1')
  })

  it('shows confirmation dialog when delete button is clicked', () => {
    const mockConfirm = vi.fn(() => false)
    vi.stubGlobal('confirm', mockConfirm)

    renderWithProviders(<NotesList onNoteClick={mockOnNoteClick} />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const deleteButtons = screen.getAllByLabelText('Delete note')
    fireEvent.click(deleteButtons[0])

    expect(mockConfirm).toHaveBeenCalledWith(
      'Are you sure you want to delete this note?'
    )
  })

  it('deletes note when confirmed', () => {
    const mockConfirm = vi.fn(() => true)
    vi.stubGlobal('confirm', mockConfirm)

    const { store } = renderWithProviders(
      <NotesList onNoteClick={mockOnNoteClick} />,
      {
        preloadedState: {
          notes: {
            notes: mockNotes,
            currentNoteId: null,
            pendingEdits: [],
            loading: false,
          },
        },
      }
    )

    const deleteButtons = screen.getAllByLabelText('Delete note')
    fireEvent.click(deleteButtons[0])

    expect(mockConfirm).toHaveBeenCalled()
    expect(store.getState().notes.notes).toHaveLength(2)
    expect(store.getState().notes.notes.find(n => n.id === '2')).toBeUndefined()
  })

  it('does not delete note when cancelled', () => {
    const mockConfirm = vi.fn(() => false)
    vi.stubGlobal('confirm', mockConfirm)

    const { store } = renderWithProviders(
      <NotesList onNoteClick={mockOnNoteClick} />,
      {
        preloadedState: {
          notes: {
            notes: mockNotes,
            currentNoteId: null,
            pendingEdits: [],
            loading: false,
          },
        },
      }
    )

    const deleteButtons = screen.getAllByLabelText('Delete note')
    fireEvent.click(deleteButtons[0])

    expect(mockConfirm).toHaveBeenCalled()
    expect(store.getState().notes.notes).toHaveLength(3)
  })

  it('prevents note click when delete button is clicked', () => {
    renderWithProviders(<NotesList onNoteClick={mockOnNoteClick} />, {
      preloadedState: {
        notes: {
          notes: mockNotes,
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const deleteButtons = screen.getAllByLabelText('Delete note')
    fireEvent.click(deleteButtons[0])

    // onNoteClick should not be called when delete button is clicked
    expect(mockOnNoteClick).not.toHaveBeenCalled()
  })

  it('has correct display name', () => {
    expect(NotesList.displayName).toBe('NotesList')
  })
})
