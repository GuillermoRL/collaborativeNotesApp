import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { loadNotes, setLoading } from '@/store/notesSlice'
import { storage } from '@/utils/storage'

export const useLocalStorage = () => {
  const dispatch = useAppDispatch()
  const notes = useAppSelector(state => state.notes.notes)

  useEffect(() => {
    dispatch(setLoading(true))

    const saved = storage.loadNotes()
    if (saved && saved.length > 0) {
      dispatch(loadNotes(saved))
    } else {
      dispatch(setLoading(false))
    }
  }, [dispatch])

  useEffect(() => {
    if (notes.length > 0) {
      storage.saveNotes(notes)
    }
  }, [notes])

  return {
    isStorageAvailable: storage.isAvailable(),
  }
}
