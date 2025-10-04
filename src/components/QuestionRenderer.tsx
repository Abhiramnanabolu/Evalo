"use client"

import { useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import katex from "katex"
import "katex/dist/katex.min.css"

type Props = {
  content: string
  className?: string
  type?: 'question' | 'option'
}

export default function QuestionRenderer({ 
  content, 
  className,
  type = "question" 
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const renderMath = () => {
      if (!containerRef.current) return

      // Find all math nodes - try multiple selectors
      const selectors = [
        'span[data-type="math"]',
        '[data-type="math"]',
        '.math-inline',
        'span.math-inline'
      ]

      let mathNodes: NodeListOf<Element> | null = null
      
      for (const selector of selectors) {
        mathNodes = containerRef.current.querySelectorAll(selector)
        if (mathNodes.length > 0) {
          console.log(`Found ${mathNodes.length} math nodes with selector: ${selector}`)
          break
        }
      }

      if (!mathNodes || mathNodes.length === 0) {
        console.log('No math nodes found. HTML:', containerRef.current.innerHTML)
        return
      }
      
      mathNodes.forEach((node) => {
        if (!(node instanceof HTMLElement)) return

        // Try to get the math value from various attributes
        let mathValue = node.getAttribute('data-value') || 
                       node.getAttribute('value') ||
                       node.dataset.value

        console.log('Processing node:', node, 'Math value:', mathValue)

        if (mathValue) {
          try {
            // Render using KaTeX
            const html = katex.renderToString(mathValue, {
              throwOnError: false,
              displayMode: false,
            })
            node.innerHTML = html
            node.classList.add('katex-rendered')
          } catch (error) {
            console.error('Error rendering math:', error)
            node.textContent = mathValue
          }
        }
      })
    }

    // Try immediate render
    renderMath()

    // Also try with a delay in case DOM isn't ready
    const timeoutId = setTimeout(renderMath, 100)

    return () => clearTimeout(timeoutId)
  }, [content])

  // Log the content for debugging
  useEffect(() => {
    console.log('Content received:', content)
  }, [content])

  return (
    <Card 
      className={cn(
        "bg-card text-card-foreground border border-border rounded-md p-4",
        type === 'option' ? 'min-h-[60px]' : 'min-h-[120px]',
        className
      )}
    >
      <div
        ref={containerRef}
        className="prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </Card>
  )
}