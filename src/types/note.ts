export interface Note {
  id: string
  title: string
  content: string
  createdAt: number
  updatedAt: number
  version: number
  lastEditedBy?: string
}

export interface EditOperation {
  noteId: string
  userId: string
  content: string
  version: number
  timestamp: number
}

export type ConflictResolution = 'last-write-wins' | 'merge' | 'prompt'
