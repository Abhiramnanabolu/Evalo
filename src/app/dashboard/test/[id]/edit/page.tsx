"use client"

import { useParams } from "next/navigation"
import Header from "@/components/Header"
import TestEditor from "@/components/TestEditor"

export default function EditTestPage() {
  const params = useParams()
  const testId = params.id as string

  return (
    <div className="min-h-screen flex flex-col">
      <Header page="testeditor" />
      <main className="flex-1 min-h-0">
        {/* The TestEditor internally locks its height with calc(100vh-56px) */}
        <TestEditor id={testId} />
      </main>
    </div>
  )
}
