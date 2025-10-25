import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, act } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import LazyNotesList from './LazyNotesList'
import type { Note } from '@/types/note'

describe('LazyNotesList', () => {
  const mockOnNoteClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal(
      'confirm',
      vi.fn(() => true)
    )
  })

  const createMockNotes = (count: number): Note[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `${i + 1}`,
      title: `Note ${i + 1}`,
      content: `<p>Content for note ${i + 1}</p>`,
      createdAt: Date.now() - (count - i) * 3600000,
      updatedAt: Date.now() - (count - i) * 3600000,
      version: 1,
      lastEditedBy: `User${i + 1}`,
    }))
  }

  it('renders empty state when no notes exist', () => {
    renderWithProviders(<LazyNotesList onNoteClick={mockOnNoteClick} />, {
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
  })

  it('renders initial set of notes based on itemsPerPage', () => {
    const mockNotes = createMockNotes(15)

    renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} itemsPerPage={5} />,
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

    const noteItems = screen.getAllByRole('heading', { level: 3 })
    expect(noteItems).toHaveLength(5)
  })

  it('uses default itemsPerPage of 10 when not specified', () => {
    const mockNotes = createMockNotes(15)

    renderWithProviders(<LazyNotesList onNoteClick={mockOnNoteClick} />, {
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
    expect(noteItems).toHaveLength(10)
  })

  it('shows "Load More" button when there are more notes', () => {
    const mockNotes = createMockNotes(15)

    renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} itemsPerPage={5} />,
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

    expect(screen.getByText('Load More')).toBeInTheDocument()
    expect(screen.getByText('Showing 5 of 15 notes')).toBeInTheDocument()
  })

  it('does not show "Load More" button when all notes are visible', () => {
    const mockNotes = createMockNotes(5)

    renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} itemsPerPage={10} />,
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

    expect(screen.queryByText('Load More')).not.toBeInTheDocument()
  })

  it('loads more notes when "Load More" is clicked', async () => {
    vi.useFakeTimers()

    const mockNotes = createMockNotes(15)

    renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} itemsPerPage={5} />,
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

    const loadMoreButton = screen.getByText('Load More')

    act(() => {
      fireEvent.click(loadMoreButton)
    })

    // Check loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument()

    // Advance timers to simulate loading
    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    const noteItems = screen.getAllByRole('heading', { level: 3 })
    expect(noteItems).toHaveLength(10)

    expect(screen.getByText('Showing 10 of 15 notes')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('shows "all loaded" message when all notes are displayed', async () => {
    vi.useFakeTimers()

    const mockNotes = createMockNotes(12)

    renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} itemsPerPage={5} />,
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

    // Click Load More twice to show all notes
    const loadMoreButton = screen.getByText('Load More')

    act(() => {
      fireEvent.click(loadMoreButton)
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByText('Showing 10 of 12 notes')).toBeInTheDocument()

    const loadMoreButton2 = screen.getByText('Load More')

    act(() => {
      fireEvent.click(loadMoreButton2)
    })

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    expect(screen.getByText('All 12 notes loaded')).toBeInTheDocument()
    expect(screen.queryByText('Load More')).not.toBeInTheDocument()

    vi.useRealTimers()
  })

  it('sorts notes by updatedAt in descending order', () => {
    const mockNotes = createMockNotes(5)

    renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} itemsPerPage={10} />,
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

    const noteItems = screen.getAllByRole('heading', { level: 3 })
    expect(noteItems[0]).toHaveTextContent('Note 5') // Most recent
    expect(noteItems[4]).toHaveTextContent('Note 1') // Oldest
  })

  it('calls onNoteClick and sets current note when note is clicked', () => {
    const mockNotes = createMockNotes(5)

    const { store } = renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} />,
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

    const firstNote = screen.getByText('Note 5').closest('.note-item')
    fireEvent.click(firstNote!)

    expect(mockOnNoteClick).toHaveBeenCalledWith('5')
    expect(store.getState().notes.currentNoteId).toBe('5')
  })

  it('deletes note when delete button is clicked and confirmed', () => {
    const mockConfirm = vi.fn(() => true)
    vi.stubGlobal('confirm', mockConfirm)

    const mockNotes = createMockNotes(5)

    const { store } = renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} />,
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
    expect(store.getState().notes.notes).toHaveLength(4)
  })

  it('adjusts shown count when notes are deleted', () => {
    const mockConfirm = vi.fn(() => true)
    vi.stubGlobal('confirm', mockConfirm)

    const mockNotes = createMockNotes(3)

    renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} itemsPerPage={10} />,
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

    let noteItems = screen.getAllByRole('heading', { level: 3 })
    expect(noteItems).toHaveLength(3)

    const deleteButtons = screen.getAllByLabelText('Delete note')
    fireEvent.click(deleteButtons[0])

    noteItems = screen.getAllByRole('heading', { level: 3 })
    expect(noteItems).toHaveLength(2)
  })

  it('disables Load More button while loading', async () => {
    vi.useFakeTimers()

    const mockNotes = createMockNotes(15)

    renderWithProviders(
      <LazyNotesList onNoteClick={mockOnNoteClick} itemsPerPage={5} />,
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

    const loadMoreButton = screen.getByText('Load More') as HTMLButtonElement
    expect(loadMoreButton.disabled).toBe(false)

    act(() => {
      fireEvent.click(loadMoreButton)
    })

    const loadingButton = screen.getByText('Loading...') as HTMLButtonElement
    expect(loadingButton.disabled).toBe(true)

    await act(async () => {
      vi.advanceTimersByTime(300)
    })

    const enabledButton = screen.getByText('Load More') as HTMLButtonElement
    expect(enabledButton.disabled).toBe(false)

    vi.useRealTimers()
  })

  it('has correct display name', () => {
    expect(LazyNotesList.displayName).toBe('LazyNotesList')
  })
})
