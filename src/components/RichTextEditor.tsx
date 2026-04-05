import { useEffect, useMemo, useRef } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List as ListIcon,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Heading1,
  Heading2,
  RemoveFormatting,
} from 'lucide-react'
import { Button } from '@admin/components/ui/button'
import { cn } from '@admin/lib/utils'

export type RichTextEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeightClassName?: string
  disabled?: boolean
}

function isSameHtml(a: string, b: string): boolean {
  const norm = (s: string) => (s ?? '').replace(/\s+/g, ' ').trim()
  return norm(a) === norm(b)
}

export function RichTextEditor({
  value,
  onChange,
  placeholder,
  className,
  minHeightClassName = 'min-h-[260px]',
  disabled,
}: RichTextEditorProps) {
  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? '',
        emptyEditorClass:
          'before:content-[attr(data-placeholder)] before:float-left before:text-[hsl(var(--muted-foreground))] before:pointer-events-none before:h-0',
      }),
    ],
    [placeholder],
  )

  const editorOptions = useMemo(
    () => ({
      extensions,
      content: value || '',
      editable: !disabled,
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-invert max-w-none',
            'prose-p:leading-relaxed prose-p:my-2',
            'prose-a:text-[hsl(var(--primary))] prose-a:underline',
            'focus:outline-none',
            'px-3 py-2',
            minHeightClassName,
          ),
        },
      },
      onUpdate: ({ editor }: { editor: any }) => {
        onChangeRef.current(editor.getHTML())
      },
    }),
    [extensions, disabled, minHeightClassName],
  )

  const editor = useEditor(editorOptions, [editorOptions])

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (isSameHtml(current, value || '')) return
    editor.commands.setContent(value || '', { emitUpdate: false })
  }, [editor, value])

  if (!editor) return null

  const toolbarBtn = (active: boolean | undefined) =>
    cn('h-9 w-9 px-0', active ? 'bg-[hsl(var(--accent))]' : '')

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card)/0.35)]',
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-[hsl(var(--border))] bg-[hsl(var(--background)/0.35)] p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarBtn(editor.isActive('bold'))}
          title="Bold"
          aria-label="Bold"
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarBtn(editor.isActive('italic'))}
          title="Italic"
          aria-label="Italic"
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarBtn(editor.isActive('underline'))}
          title="Underline"
          aria-label="Underline"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarBtn(editor.isActive('strike'))}
          title="Strike"
          aria-label="Strike"
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-[hsl(var(--border))]" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarBtn(editor.isActive('heading', { level: 1 }))}
          title="H1"
          aria-label="Heading 1"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarBtn(editor.isActive('heading', { level: 2 }))}
          title="H2"
          aria-label="Heading 2"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-[hsl(var(--border))]" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarBtn(editor.isActive('bulletList'))}
          title="Bullets"
          aria-label="Bulleted list"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarBtn(editor.isActive('orderedList'))}
          title="Ordered"
          aria-label="Ordered list"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={toolbarBtn(editor.isActive('blockquote'))}
          title="Quote"
          aria-label="Blockquote"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-[hsl(var(--border))]" />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 w-9 px-0"
          title="Link"
          aria-label="Set link"
          onClick={() => {
            const prev = editor.getAttributes('link').href as string | undefined
            const url = window.prompt('URL', prev ?? '')
            if (url === null) return
            if (url.trim() === '') {
              editor.chain().focus().extendMarkRange('link').unsetLink().run()
              return
            }
            editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
          }}
        >
          <LinkIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="ml-auto h-9 w-9 px-0"
          title="Clear formatting"
          aria-label="Clear formatting"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        >
          <RemoveFormatting className="h-4 w-4" />
        </Button>
      </div>

      <EditorContent editor={editor} />
    </div>
  )
}

