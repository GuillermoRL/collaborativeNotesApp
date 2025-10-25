import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import EditorModal from './EditorModal'
import type { Note } from '@/types/note'

// Mock RichTextEditor
vi.mock('@/components/RichTextEditor', () => ({
  RichTextEditor: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }) => (
    <div data-testid="mock-rich-text-editor">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid="editor-textarea"
      />
    </div>
  ),
}))

describe('EditorModal', () => {
  const mockOnClose = vi.fn()

  const mockNote: Note = {
    id: '1',
    title: 'Test Note',
    content: '<p>Test content</p>',
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 1800000,
    version: 1,
    lastEditedBy: 'alice',
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the editor modal with note data', () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(screen.getByDisplayValue('Test Note')).toBeInTheDocument()
    expect(screen.getByDisplayValue('<p>Test content</p>')).toBeInTheDocument()
    expect(screen.getByText(/Version: 1/)).toBeInTheDocument()
  })

  it('renders new note modal when note is null', () => {
    renderWithProviders(<EditorModal note={null} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: null,
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(screen.getByPlaceholderText('Note title...')).toHaveValue('')
    expect(screen.getByTestId('editor-textarea')).toHaveValue('')
    expect(screen.getByText('New Note')).toBeInTheDocument()
  })

  it('save button is always enabled for existing notes', () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const saveButton = screen.getByRole('button', {
      name: /Save/,
    }) as HTMLButtonElement
    expect(saveButton.disabled).toBe(false)

    const textarea = screen.getByTestId('editor-textarea')
    fireEvent.change(textarea, { target: { value: '<p>New content</p>' } })

    expect(saveButton.disabled).toBe(false)
  })

  it('enables save button when title is changed', () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const titleInput = screen.getByPlaceholderText('Note title...')
    fireEvent.change(titleInput, { target: { value: 'New Title' } })

    const saveButton = screen.getByRole('button', {
      name: /Save/,
    }) as HTMLButtonElement
    expect(saveButton.disabled).toBe(false)
  })

  it('saves note and shows success notification', async () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const textarea = screen.getByTestId('editor-textarea')
    fireEvent.change(textarea, { target: { value: '<p>Updated content</p>' } })

    const saveButton = screen.getByRole('button', { name: /Save/ })
    fireEvent.click(saveButton)

    expect(screen.getByText('Saved successfully!')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.queryByText('Saved successfully!')).not.toBeInTheDocument()
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('shows conflict dialog when there are pending edits', () => {
    const pendingEdit = {
      noteId: '1',
      userId: 'bob',
      content: "<p>Bob's edit</p>",
      version: 1,
      timestamp: Date.now(),
    }

    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [pendingEdit],
          loading: false,
        },
      },
    })

    const textarea = screen.getByTestId('editor-textarea')
    fireEvent.change(textarea, { target: { value: '<p>My changes</p>' } })

    const saveButton = screen.getByRole('button', { name: /Save/ })
    fireEvent.click(saveButton)

    expect(screen.getByText(/Conflict Detected/)).toBeInTheDocument()
    expect(screen.getByText(/bob/)).toBeInTheDocument()
    expect(screen.getByText('Discard My Changes')).toBeInTheDocument()
    expect(screen.getByText('Merge Changes')).toBeInTheDocument()
  })

  it('discards local changes and applies remote edit', async () => {
    const pendingEdit = {
      noteId: '1',
      userId: 'bob',
      content: "<p>Bob's edit</p>",
      version: 1,
      timestamp: Date.now(),
    }

    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [pendingEdit],
          loading: false,
        },
      },
    })

    const textarea = screen.getByTestId('editor-textarea')
    fireEvent.change(textarea, { target: { value: '<p>My changes</p>' } })

    const saveButton = screen.getByRole('button', { name: /Save/ })
    fireEvent.click(saveButton)

    const discardButton = screen.getByText('Discard My Changes')
    fireEvent.click(discardButton)

    expect(
      screen.getByText('Changes discarded, remote version applied')
    ).toBeInTheDocument()
    expect(screen.queryByText(/Conflict Detected/)).not.toBeInTheDocument()

    // Check that content is updated to remote version
    const updatedTextarea = screen.getByTestId(
      'editor-textarea'
    ) as HTMLTextAreaElement
    expect(updatedTextarea.value).toBe("<p>Bob's edit</p>")
  })

  it('merges local and remote changes', async () => {
    const pendingEdit = {
      noteId: '1',
      userId: 'bob',
      content: "<p>Bob's edit</p>",
      version: 1,
      timestamp: Date.now(),
    }

    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [pendingEdit],
          loading: false,
        },
      },
    })

    const textarea = screen.getByTestId('editor-textarea')
    fireEvent.change(textarea, { target: { value: '<p>My changes</p>' } })

    const saveButton = screen.getByRole('button', { name: /Save/ })
    fireEvent.click(saveButton)

    const mergeButton = screen.getByText('Merge Changes')
    fireEvent.click(mergeButton)

    expect(screen.getByText('Changes merged successfully!')).toBeInTheDocument()
    expect(screen.queryByText(/Conflict Detected/)).not.toBeInTheDocument()

    // Check that content is merged
    const updatedTextarea = screen.getByTestId(
      'editor-textarea'
    ) as HTMLTextAreaElement
    expect(updatedTextarea.value).toContain('<p>My changes</p>')
    expect(updatedTextarea.value).toContain("<p>Bob's edit</p>")
    expect(updatedTextarea.value).toContain('<hr/>')
  })

  it('starts and stops edit simulation', () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const simulateButton = screen.getByText('▶ Simulate Edits')
    fireEvent.click(simulateButton)

    expect(screen.getByText('⏸ Stop Simulation')).toBeInTheDocument()

    fireEvent.click(screen.getByText('⏸ Stop Simulation'))

    expect(screen.getByText('▶ Simulate Edits')).toBeInTheDocument()
  })

  it('shows notification when simulated edit occurs', async () => {
    const { store } = renderWithProviders(
      <EditorModal note={mockNote} onClose={mockOnClose} />,
      {
        preloadedState: {
          notes: {
            notes: [mockNote],
            currentNoteId: '1',
            pendingEdits: [],
            loading: false,
          },
        },
      }
    )

    const simulateButton = screen.getByRole('button', {
      name: /Simulate Edits/,
    })
    fireEvent.click(simulateButton)

    // Advance timers to trigger a simulated edit (random between 5-10 seconds)
    await act(async () => {
      vi.advanceTimersByTime(10000)
    })

    // Check that a pending edit was added
    expect(store.getState().notes.pendingEdits.length).toBeGreaterThan(0)
  })

  it('closes modal without confirmation', () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const textarea = screen.getByTestId('editor-textarea')
    fireEvent.change(textarea, { target: { value: '<p>Changed content</p>' } })

    const closeButton = screen.getByText('✕')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes without confirmation when no unsaved changes', () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const closeButton = screen.getByText('✕')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('closes when overlay is clicked without unsaved changes', () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const overlay = screen
      .getByTestId('editor-textarea')
      .closest('.modal-overlay')
    if (overlay?.parentElement) {
      fireEvent.click(overlay.parentElement)
    }
  })

  it('does not close when modal content is clicked', () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    const modalContent = screen
      .getByTestId('editor-textarea')
      .closest('.modal-content')
    if (modalContent) {
      fireEvent.click(modalContent)
    }

    expect(mockOnClose).not.toHaveBeenCalled()
  })

  it('displays last edited information', () => {
    renderWithProviders(<EditorModal note={mockNote} onClose={mockOnClose} />, {
      preloadedState: {
        notes: {
          notes: [mockNote],
          currentNoteId: '1',
          pendingEdits: [],
          loading: false,
        },
      },
    })

    expect(screen.getByText(/Last edited:/)).toBeInTheDocument()
    expect(screen.getByText(/By: alice/)).toBeInTheDocument()
  })

  it('clears simulation timer on unmount', () => {
    const { unmount } = renderWithProviders(
      <EditorModal note={mockNote} onClose={mockOnClose} />,
      {
        preloadedState: {
          notes: {
            notes: [mockNote],
            currentNoteId: '1',
            pendingEdits: [],
            loading: false,
          },
        },
      }
    )

    const simulateButton = screen.getByText('▶ Simulate Edits')
    fireEvent.click(simulateButton)

    unmount()

    // Should not throw any errors
    vi.advanceTimersByTime(10000)
  })
})
