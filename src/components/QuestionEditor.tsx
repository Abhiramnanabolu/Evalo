"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Bold from "@tiptap/extension-bold"
import Italic from "@tiptap/extension-italic"
import Underline from "@tiptap/extension-underline"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import { useCallback, useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import "mathlive"
import MathNode from "@/components/MathNode"

import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Sigma,
  Image as ImageIcon,
  Link as LinkIcon,
  Undo,
  Redo,
  ChevronLeft,
} from "lucide-react"

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": any
    }
  }
}


type Props = {
  onChange?: (html: string) => void
  placeholder?: string
  initialContent?: string
  type?: 'question' | 'option'
}

export default function RichTextEditor({ 
  onChange, 
  placeholder = "Start typing...", 
  initialContent = "",
  type = "question"
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [showMath, setShowMath] = useState(false)
  const [mathValue, setMathValue] = useState("")
  const [showLink, setShowLink] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>({})
  const [showToolbar, setShowToolbar] = useState(type !== 'option')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Bold,
      Italic,
      Underline,
      MathNode,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-md',
        },
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
      updateActiveStates()
    },
    onSelectionUpdate: ({ editor }) => {
      updateActiveStates()
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none ${type === 'option' ? 'min-h-[60px]' : 'min-h-[120px]'} px-3 py-2`,
        placeholder: placeholder,
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false

        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) {
              handleImageFile(file)
            }
            return true
          }
        }
        return false
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false

        for (const file of Array.from(files)) {
          if (file.type.startsWith('image/')) {
            event.preventDefault()
            handleImageFile(file)
            return true
          }
        }
        return false
      },
    },
    immediatelyRender: false,
  })

  const updateActiveStates = useCallback(() => {
    if (!editor) return
    
    setActiveStates({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      highlight: editor.isActive('highlight'),
      link: editor.isActive('link'),
      bulletList: editor.isActive('bulletList'),
      orderedList: editor.isActive('orderedList'),
      blockquote: editor.isActive('blockquote'),
      alignLeft: editor.isActive({ textAlign: 'left' }),
      alignCenter: editor.isActive({ textAlign: 'center' }),
      alignRight: editor.isActive({ textAlign: 'right' }),
      alignJustify: editor.isActive({ textAlign: 'justify' }),
    })
  }, [editor])

  useEffect(() => {
    updateActiveStates()
  }, [updateActiveStates])

  const toolBtnClass = useCallback(
    (active: boolean) =>
      cn(
        "size-8",
        "rounded-md",
        "transition-all duration-200",
        "hover:bg-accent",
        "hover:text-accent-foreground",
        active && "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      ),
    [],
  )

  const handleImageFile = async (file: File) => {
    if (!editor || !file.type.startsWith('image/')) return
    
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      editor
        .chain()
        .focus()
        .setImage({ src: base64 })
        .run()
    }
    reader.readAsDataURL(file)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleImageFile(file)
    }
  }

  const insertMath = useCallback(() => {
    if (editor && mathValue.trim()) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: 'math',
          attrs: {
            value: mathValue
          }
        })
        .run()
      setShowMath(false)
      setMathValue("")
    }
  }, [editor, mathValue])

  const setLink = useCallback(() => {
    if (editor && linkUrl.trim()) {
      if (linkUrl === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange('link')
          .setLink({ href: linkUrl })
          .run()
      }
      setShowLink(false)
      setLinkUrl("")
    }
  }, [editor, linkUrl])

  if (!editor) return null

  return (
    <div className="w-full">
      {/* Toolbar */}
      {showToolbar && (
        <Card
          role="toolbar"
          aria-label="Formatting toolbar"
          className="flex flex-wrap items-center gap-1 p-2 bg-card text-card-foreground border border-border rounded-b-none border-b-0"
        >
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Undo (Ctrl+Z)"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className={cn(toolBtnClass(false), "disabled:opacity-50")}
          >
            <Undo className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Redo (Ctrl+Y)"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className={cn(toolBtnClass(false), "disabled:opacity-50")}
          >
            <Redo className="size-4" />
          </Button>
        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Text formatting */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Bold (Ctrl+B)"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={toolBtnClass(activeStates.bold)}
          >
            <BoldIcon className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Italic (Ctrl+I)"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={toolBtnClass(activeStates.italic)}
          >
            <ItalicIcon className="size-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Underline (Ctrl+U)"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={toolBtnClass(activeStates.underline)}
          >
            <UnderlineIcon className="size-4" />
          </Button>

        </div>

        <div className="mx-1 h-6 w-px bg-border" />

        {/* Inserts */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Insert math"
            onClick={() => setShowMath(true)}
            className="size-8 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <Sigma className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Insert image"
            onClick={() => fileInputRef.current?.click()}
            className="size-8 rounded-md hover:bg-accent hover:text-accent-foreground"
          >
            <ImageIcon className="size-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        </Card>
      )}

      {/* Editor */}
      <Card
        className={cn(
          "bg-card text-card-foreground border border-border",
          showToolbar ? "rounded-t-none" : "rounded-md",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0",
          "relative"
        )}
      >
        <EditorContent editor={editor} />
        
        {/* Toggle Toolbar Button */}
        {type === 'option' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowToolbar(!showToolbar)}
            className="absolute top-2 right-2 size-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800"
            title={showToolbar ? "Hide toolbar" : "Show toolbar"}
          >
            <ChevronLeft className={cn("size-3 transition-transform", showToolbar ? "rotate-180" : "")} />
          </Button>
        )}
      </Card>

      {/* Math Modal */}
      {showMath && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50"
          onClick={() => setShowMath(false)}
        >
          <Card
            className="w-[400px] p-4 bg-popover text-popover-foreground border border-border shadow-lg z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-3">Insert Math Equation</h2>
            {/* @ts-ignore */}
            <math-field
              className="w-full rounded-md border border-border bg-background text-foreground p-2 text-lg"
              onInput={(e: any) => setMathValue(e.target.value)}
              value={mathValue}
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowMath(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={insertMath} disabled={!mathValue.trim()}>
                Insert
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Link Modal */}
      {showLink && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowLink(false)}
        >
          <Card
            className="w-[400px] p-4 bg-popover text-popover-foreground border border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold mb-3">Insert Link</h2>
            <input
              type="url"
              placeholder="https://example.com"
              className="w-full rounded-md border border-border bg-background text-foreground p-2"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  setLink()
                }
              }}
              autoFocus
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLink(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={setLink} disabled={!linkUrl.trim()}>
                Add Link
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}