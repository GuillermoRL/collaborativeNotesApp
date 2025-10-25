import { useCallback, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { LazyNotesList } from '@/components/LazyNotesList'
import { EditorModal } from '@/components/EditorModal'
import type { Note } from '@/types/note'
import './Home.css'

const Home = () => {
  const notes = useAppSelector(state => state.notes.notes)
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenExistingNote = useCallback(
    (noteId: string) => {
      const note = notes.find(n => n.id === noteId)

      setCurrentNote(note || null)
      setIsModalOpen(true)
    },
    [notes]
  )

  const handleCreateNewNote = useCallback(() => {
    setCurrentNote(null)
    setIsModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setCurrentNote(null)
    setIsModalOpen(false)
  }, [])

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>My Notes</h1>
        <button className="create-note-btn" onClick={handleCreateNewNote}>
          + New Note
        </button>
      </header>

      <main className="home-content">
        <LazyNotesList onNoteClick={handleOpenExistingNote} itemsPerPage={10} />
      </main>

      {isModalOpen && (
        <EditorModal note={currentNote} onClose={handleCloseModal} />
      )}
    </div>
  )
}

export default Home
