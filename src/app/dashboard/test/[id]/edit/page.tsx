"use client"

import { useParams } from "next/navigation"
import TestEditor from "@/components/TestEditor"
import Header from "@/components/Header"

// Component starts here
export default function EditTestPage() {
  const params = useParams()
  const testId = params.id as string

  return (
    <>
      <Header page="testeditor" />
      <TestEditor id={testId}  />
    </>
  )
}
