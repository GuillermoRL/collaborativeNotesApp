import { memo, useCallback, useRef, useMemo } from 'react'
import ReactQuill from 'react-quill'
import type { RichTextEditorProps } from './RichTextEditor.types'
import 'react-quill/dist/quill.snow.css'
import './RichTextEditor.css'

const RichTextEditorComponent = ({
  value,
  onChange,
  placeholder = 'What are you thinking?',
}: RichTextEditorProps) => {
  const editorRef = useRef<ReactQuill>(null)

  const toolbar = useMemo(
    () => ({
      toolbar: [
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['clean'],
      ],
    }),
    []
  )

  const allowedFormats = useMemo(
    () => ['bold', 'italic', 'underline', 'list', 'bullet'],
    []
  )

  const handleChange = useCallback(
    (content: string) => {
      onChange(content)
    },
    [onChange]
  )

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={editorRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={toolbar}
        formats={allowedFormats}
        placeholder={placeholder}
      />
    </div>
  )
}

const RichTextEditor = memo(RichTextEditorComponent)
RichTextEditor.displayName = 'RichTextEditor'

export default RichTextEditor
