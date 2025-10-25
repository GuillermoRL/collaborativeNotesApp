import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/test-utils'
import App from './App'

// Mock child components
vi.mock('@/pages/Home', () => ({
  Home: () => <div data-testid="home-page">Home Page</div>,
}))

// Mock useLocalStorage hook
vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn(),
}))

// Mock storage utilities
vi.mock('@/utils/storage', () => ({
  storage: {
    isAvailable: vi.fn(() => true),
    loadNotes: vi.fn(() => []),
    saveNotes: vi.fn(),
  },
}))

import { useLocalStorage } from '@/hooks/useLocalStorage'

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the app with router', () => {
    vi.mocked(useLocalStorage).mockReturnValue({
      isStorageAvailable: true,
    })

    renderWithProviders(<App />)

    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })

  it('renders the Home page on root route', () => {
    vi.mocked(useLocalStorage).mockReturnValue({
      isStorageAvailable: true,
    })

    renderWithProviders(<App />)

    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })

  it('does not show storage warning when storage is available', () => {
    vi.mocked(useLocalStorage).mockReturnValue({
      isStorageAvailable: true,
    })

    renderWithProviders(<App />)

    expect(
      screen.queryByText(/localStorage is not available/)
    ).not.toBeInTheDocument()
  })

  it('shows storage warning when storage is not available', () => {
    vi.mocked(useLocalStorage).mockReturnValue({
      isStorageAvailable: false,
    })

    renderWithProviders(<App />)

    expect(
      screen.getByText(
        'Warning: localStorage is not available. Notes will not be persisted.'
      )
    ).toBeInTheDocument()
  })

  it('renders both warning and home page when storage is unavailable', () => {
    vi.mocked(useLocalStorage).mockReturnValue({
      isStorageAvailable: false,
    })

    renderWithProviders(<App />)

    expect(
      screen.getByText(/localStorage is not available/)
    ).toBeInTheDocument()
    expect(screen.getByTestId('home-page')).toBeInTheDocument()
  })

  it('applies app className to root div', () => {
    vi.mocked(useLocalStorage).mockReturnValue({
      isStorageAvailable: true,
    })

    const { container } = renderWithProviders(<App />)

    const appDiv = container.querySelector('.app')
    expect(appDiv).toBeInTheDocument()
  })
})
