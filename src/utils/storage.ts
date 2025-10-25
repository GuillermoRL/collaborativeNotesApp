import type { Note } from '@/types/note'

const STORAGE_KEY = 'collaborative_notes_app'

export const storage = {
  saveNotes: (notes: Note[]): void => {
    try {
      const data = JSON.stringify(notes)
      localStorage.setItem(STORAGE_KEY, data)
    } catch (error) {
      console.error('Failed to save notes to localStorage:', error)
    }
  },

  loadNotes: (): Note[] | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data === null) {
        return null
      }
      return JSON.parse(data) as Note[]
    } catch (error) {
      console.error('Failed to load notes from localStorage:', error)
      return null
    }
  },

  clearNotes: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Failed to clear notes from localStorage:', error)
    }
  },

  isAvailable: (): boolean => {
    try {
      const testKey = '__storage_test__'
      localStorage.setItem(testKey, testKey)
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  },
}
