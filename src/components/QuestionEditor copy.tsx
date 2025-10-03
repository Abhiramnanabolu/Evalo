"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Bold from "@tiptap/extension-bold"
import Italic from "@tiptap/extension-italic"
import Underline from "@tiptap/extension-underline"
import { useCallback, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import "mathlive"

import {
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Sigma,
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
}

export default function RichTextEditor({ onChange, placeholder = "Start typing..." }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, Bold, Italic, Underline],
    content: "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      onChange?.(html)
    },
    immediatelyRender: false,
  })

  const [showMath, setShowMath] = useState(false)
  const [mathValue, setMathValue] = useState("")

  const isActive = useCallback(
    (name: string) => (editor ? editor.isActive(name) : false),
    [editor],
  )

  const toolBtnClass = useCallback(
    (active: boolean) =>
      cn(
        "size-8",
        "rounded-md",
        "transition-colors",
        "hover:bg-accent",
        "hover:text-accent-foreground",
        active && "bg-primary text-primary-foreground hover:bg-primary/90 ring-2 ring-primary",
      ),
    [],
  )

  const insertMath = useCallback(() => {
    if (editor && mathValue.trim()) {
      editor.chain().focus().insertContent(`<span>\$$${mathValue}\$$</span>`).run()
      setShowMath(false)
      setMathValue("")
    }
  }, [editor, mathValue])

  const Toolbar = useMemo(
    () => (
      <Card
        role="toolbar"
        aria-label="Formatting toolbar"
        className="flex items-center gap-1 p-1 bg-card text-card-foreground border border-border rounded-b-none border-b-0"
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Bold (Ctrl+B)"
          aria-label="Bold"
          aria-pressed={isActive("bold")}
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={toolBtnClass(isActive("bold"))}
        >
          <BoldIcon className="size-4" />
          <span className="sr-only">Bold</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Italic (Ctrl+I)"
          aria-label="Italic"
          aria-pressed={isActive("italic")}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={toolBtnClass(isActive("italic"))}
        >
          <ItalicIcon className="size-4" />
          <span className="sr-only">Italic</span>
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Underline (Ctrl+U)"
          aria-label="Underline"
          aria-pressed={isActive("underline")}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={toolBtnClass(isActive("underline"))}
        >
          <UnderlineIcon className="size-4" />
          <span className="sr-only">Underline</span>
        </Button>

        <div className="mx-1 h-6 w-px bg-border" aria-hidden="true" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Insert math"
          aria-label="Insert math"
          onClick={() => setShowMath(true)}
          className="size-8 rounded-md hover:bg-accent hover:text-accent-foreground"
        >
          <Sigma className="size-4" />
          <span className="sr-only">Insert math</span>
        </Button>
      </Card>
    ),
    [editor, isActive, toolBtnClass],
  )

  if (!editor) return null

  return (
    <div>
      {Toolbar}

      <Card
        className={cn(
          "p-2 min-h-[180px]",
          "bg-card text-card-foreground border border-border rounded-t-none",
          "prose prose-sm dark:prose-invert max-w-none",
          "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-0",
        )}
      >
        <EditorContent
          editor={editor}
          aria-label="Rich text editor"
          className="leading-6 [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[150px]"
        />
      </Card>

      {showMath && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="math-dialog-title"
          onClick={() => setShowMath(false)}
        >
          <Card
            className="w-[360px] p-3 bg-popover text-popover-foreground border border-border shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="math-dialog-title" className="text-sm font-semibold mb-2">
              Insert math equation
            </h2>
            {
              (
                <math-field
                  className="w-full rounded-md border border-border bg-background text-foreground p-2"
                  onInput={(e: any) => setMathValue(e.target.value)}
                ></math-field>
              ) as any
            }
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowMath(false)}>
                Cancel
              </Button>
              <Button onClick={insertMath} disabled={!mathValue.trim()}>
                Insert
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
