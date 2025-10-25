import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RichTextEditor from './RichTextEditor'

// Mock ReactQuill
vi.mock('react-quill', () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }) => (
    <div data-testid="mock-quill-editor">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid="quill-textarea"
      />
    </div>
  ),
}))

describe('RichTextEditor', () => {
  it('renders without crashing', () => {
    const mockOnChange = vi.fn()
    render(<RichTextEditor value="" onChange={mockOnChange} />)

    expect(screen.getByTestId('mock-quill-editor')).toBeInTheDocument()
  })

  it('displays the provided value', () => {
    const mockOnChange = vi.fn()
    const testValue = '<p>Test content</p>'

    render(<RichTextEditor value={testValue} onChange={mockOnChange} />)

    const textarea = screen.getByTestId('quill-textarea') as HTMLTextAreaElement
    expect(textarea.value).toBe(testValue)
  })

  it('displays custom placeholder', () => {
    const mockOnChange = vi.fn()
    const customPlaceholder = 'Enter your notes here'

    render(
      <RichTextEditor
        value=""
        onChange={mockOnChange}
        placeholder={customPlaceholder}
      />
    )

    expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument()
  })

  it('displays default placeholder when not provided', () => {
    const mockOnChange = vi.fn()

    render(<RichTextEditor value="" onChange={mockOnChange} />)

    expect(
      screen.getByPlaceholderText('What are you thinking?')
    ).toBeInTheDocument()
  })

  it('calls onChange when content is modified', () => {
    const mockOnChange = vi.fn()

    render(<RichTextEditor value="" onChange={mockOnChange} />)

    const textarea = screen.getByTestId('quill-textarea') as HTMLTextAreaElement
    const newValue = '<p>New content</p>'

    fireEvent.change(textarea, { target: { value: newValue } })

    expect(mockOnChange).toHaveBeenCalledWith(newValue)
  })

  it('has the correct display name', () => {
    expect(RichTextEditor.displayName).toBe('RichTextEditor')
  })
})
