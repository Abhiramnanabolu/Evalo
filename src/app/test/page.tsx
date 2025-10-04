'use client'

import RichTextEditor from "@/components/QuestionEditor"
import QuestionRenderer from "@/components/QuestionRenderer"
import { useState } from "react"

export default function Page() {
  const [questionHtml, setQuestionHtml] = useState("")

  return (
    <div>
      {/* Editor */}
      <RichTextEditor 
        onChange={setQuestionHtml}
        placeholder="Enter your question"
        type="question"
      />

      {/* Renderer */}
      <QuestionRenderer 
        content={questionHtml}
        type="question"
      />
    </div>
  )
}