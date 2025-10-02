"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Plus,
  Trash2,
  Save,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Shuffle,
  ListOrdered,
  ArrowLeft,
} from "lucide-react"

// Import your types (assuming they're in a separate file)
import type { Test, Section, Question, Option } from "@/types/test"
import { TestStatus, QuestionOrder, ResultVisibility, QuestionType } from "@/types/test"

// Import shadcn/ui and utils for improved UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Component starts here
export default function TestEditor({ id }: { id: string }) {
  const router = useRouter()
  const testId = id

  const [test, setTest] = useState<Test | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<"details" | "sections">("details")

  // Fetch test data
  useEffect(() => {
    fetchTestData()
  }, [testId])

  const fetchTestData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tests/${testId}`)
      if (!response.ok) throw new Error("Failed to fetch test")
      const data = await response.json()
      setTest(data.test)
      // Expand first section by default
      if (data.sections?.length > 0) {
        setExpandedSections(new Set([data.sections[0].id]))
      }
    } catch (error) {
      console.error("Error fetching test:", error)
      setErrors({ fetch: "Failed to load test data" })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTest = async () => {
    try {
      setSaving(true)
      setErrors({})

      const response = await fetch(`/api/test/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(test),
      })

      if (!response.ok) throw new Error("Failed to save test")

      // Show success message
      showNotification("Test saved successfully!", "success")
    } catch (error) {
      console.error("Error saving test:", error)
      setErrors({ save: "Failed to save test" })
      showNotification("Failed to save test", "error")
    } finally {
      setSaving(false)
    }
  }

  const showNotification = (message: string, type: "success" | "error") => {
    // Implement your notification system here
    console.log(`${type}: ${message}`)
  }

  const updateTestField = (field: keyof Test, value: any) => {
    if (!test) return
    setTest({ ...test, [field]: value })
  }

  const addSection = () => {
    if (!test) return
    const newSection: Section = {
      id: `section-${Date.now()}`,
      testId: test.id,
      test: test,
      title: "New Section",
      description: "",
      duration: 0,
      order: test.sections?.length || 0,
      questions: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setTest({
      ...test,
      sections: [...(test.sections || []), newSection],
    })
    setExpandedSections(new Set([...expandedSections, newSection.id]))
  }

  const updateSection = (sectionId: string, field: keyof Section, value: any) => {
    if (!test) return
    setTest({
      ...test,
      sections: test.sections.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s)),
    })
  }

  const deleteSection = (sectionId: string) => {
    if (!test) return
    if (!confirm("Are you sure you want to delete this section and all its questions?")) return

    setTest({
      ...test,
      sections: test.sections.filter((s) => s.id !== sectionId),
    })
  }

  const addQuestion = (sectionId?: string) => {
    if (!test) return
    const newQuestion: Question = {
      id: `question-${Date.now()}`,
      testId: test.id,
      test: test,
      type: QuestionType.MCQ_SINGLE,
      title: "",
      description: "",
      imageUrl: "",
      points: 1,
      negativePoints: 0,
      order: test.questions?.length || 0,
      options: [],
      correctAnswer: "",
      explanation: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (sectionId) {
      setTest({
        ...test,
        sections: test.sections.map((s) =>
          s.id === sectionId ? { ...s, questions: [...(s.questions || []), newQuestion] } : s,
        ),
      })
    } else {
      setTest({
        ...test,
        questions: [...(test.questions || []), newQuestion],
      })
    }
    setExpandedQuestions(new Set([...expandedQuestions, newQuestion.id]))
  }

  const updateQuestion = (questionId: string, field: keyof Question, value: any, sectionId?: string) => {
    if (!test) return

    if (sectionId) {
      setTest({
        ...test,
        sections: test.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                questions: s.questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
              }
            : s,
        ),
      })
    } else {
      setTest({
        ...test,
        questions: test.questions.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)),
      })
    }
  }

  const deleteQuestion = (questionId: string, sectionId?: string) => {
    if (!test) return
    if (!confirm("Are you sure you want to delete this question?")) return

    if (sectionId) {
      setTest({
        ...test,
        sections: test.sections.map((s) =>
          s.id === sectionId ? { ...s, questions: s.questions.filter((q) => q.id !== questionId) } : s,
        ),
      })
    } else {
      setTest({
        ...test,
        questions: test.questions.filter((q) => q.id !== questionId),
      })
    }
  }

  const addOption = (questionId: string, sectionId?: string) => {
    if (!test) return

    const findQuestion = (questions: Question[]) => questions.find((q) => q.id === questionId)
    const question = sectionId
      ? findQuestion(test.sections.find((s) => s.id === sectionId)?.questions || [])
      : findQuestion(test.questions || [])

    if (!question) return

    const newOption: Option = {
      id: `option-${Date.now()}`,
      questionId: question.id,
      question: question,
      text: "",
      imageUrl: "",
      isCorrect: false,
      order: question.options?.length || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    updateQuestion(questionId, "options", [...(question.options || []), newOption], sectionId)
  }

  const updateOption = (questionId: string, optionId: string, field: keyof Option, value: any, sectionId?: string) => {
    if (!test) return

    const findQuestion = (questions: Question[]) => questions.find((q) => q.id === questionId)
    const question = sectionId
      ? findQuestion(test.sections.find((s) => s.id === sectionId)?.questions || [])
      : findQuestion(test.questions || [])

    if (!question) return

    const updatedOptions = question.options.map((o) => {
      if (o.id === optionId) {
        // Handle single correct answer for MCQ_SINGLE and TRUE_FALSE
        if (
          field === "isCorrect" &&
          value &&
          (question.type === QuestionType.MCQ_SINGLE || question.type === QuestionType.TRUE_FALSE)
        ) {
          // Set all other options to false
          question.options.forEach((opt) => {
            if (opt.id !== optionId) opt.isCorrect = false
          })
        }
        return { ...o, [field]: value }
      }
      // For MCQ_SINGLE and TRUE_FALSE, ensure only one correct answer
      if (
        field === "isCorrect" &&
        value &&
        (question.type === QuestionType.MCQ_SINGLE || question.type === QuestionType.TRUE_FALSE)
      ) {
        return { ...o, isCorrect: false }
      }
      return o
    })

    updateQuestion(questionId, "options", updatedOptions, sectionId)
  }

  const deleteOption = (questionId: string, optionId: string, sectionId?: string) => {
    if (!test) return

    const findQuestion = (questions: Question[]) => questions.find((q) => q.id === questionId)
    const question = sectionId
      ? findQuestion(test.sections.find((s) => s.id === sectionId)?.questions || [])
      : findQuestion(test.questions || [])

    if (!question) return

    updateQuestion(
      questionId,
      "options",
      question.options.filter((o) => o.id !== optionId),
      sectionId,
    )
  }

  const renderQuestionOptions = (question: Question, sectionId?: string) => {
    switch (question.type) {
      case QuestionType.MCQ_SINGLE:
      case QuestionType.MCQ_MULTIPLE:
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-medium text-foreground">Options</Label>
              <Button
                onClick={() => addOption(question.id, sectionId)}
                className="text-sm text-primary hover:text-primary-foreground flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Option
              </Button>
            </div>
            {question.options?.map((option, index) => (
              <div key={option.id} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type={question.type === QuestionType.MCQ_SINGLE ? "radio" : "checkbox"}
                    checked={option.isCorrect}
                    onChange={(e) => updateOption(question.id, option.id, "isCorrect", e.target.checked, sectionId)}
                    className="mt-0.5"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Input
                    value={option.text}
                    onChange={(e) => updateOption(question.id, option.id, "text", e.target.value, sectionId)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Input
                    value={option.imageUrl || ""}
                    onChange={(e) => updateOption(question.id, option.id, "imageUrl", e.target.value, sectionId)}
                    placeholder="Image URL (optional)"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteOption(question.id, option.id, sectionId)}
                  className="mt-2 text-destructive"
                  aria-label="Delete option"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )

      case QuestionType.TRUE_FALSE:
        if (question.options?.length === 0) {
          // Auto-create True/False options
          addOption(question.id, sectionId)
          setTimeout(() => {
            addOption(question.id, sectionId)
          }, 100)
        }
        return (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Answer</Label>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`tf-${question.id}`}
                  checked={question.correctAnswer === "true"}
                  onChange={() => updateQuestion(question.id, "correctAnswer", "true", sectionId)}
                />
                True
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`tf-${question.id}`}
                  checked={question.correctAnswer === "false"}
                  onChange={() => updateQuestion(question.id, "correctAnswer", "false", sectionId)}
                />
                False
              </Label>
            </div>
          </div>
        )

      case QuestionType.SHORT_ANSWER:
      case QuestionType.NUMERIC:
        return (
          <div>
            <Label className="block text-sm font-medium text-foreground mb-2">Correct Answer</Label>
            <Input
              type={question.type === QuestionType.NUMERIC ? "number" : "text"}
              value={question.correctAnswer}
              onChange={(e) => updateQuestion(question.id, "correctAnswer", e.target.value, sectionId)}
              placeholder={question.type === QuestionType.NUMERIC ? "Enter numeric answer" : "Enter correct answer"}
              className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
            />
          </div>
        )

      default:
        return null
    }
  }

  const renderQuestion = (question: Question, sectionId?: string) => {
    const isExpanded = expandedQuestions.has(question.id)

    return (
      <div key={question.id} className="border rounded-lg bg-background">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Button
                onClick={() => {
                  if (isExpanded) {
                    expandedQuestions.delete(question.id)
                  } else {
                    expandedQuestions.add(question.id)
                  }
                  setExpandedQuestions(new Set(expandedQuestions))
                }}
                className="mt-1"
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
              <div className="flex-1">
                <Input
                  type="text"
                  value={question.title}
                  onChange={(e) => updateQuestion(question.id, "title", e.target.value, sectionId)}
                  className="w-full text-lg font-medium px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                  placeholder="Enter question title"
                />
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-muted-foreground">Type: {question.type.replace(/_/g, " ")}</span>
                  <span className="text-sm text-muted-foreground">Points: {question.points}</span>
                  {question.negativePoints > 0 && (
                    <span className="text-sm text-destructive">Negative: -{question.negativePoints}</span>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => deleteQuestion(question.id, sectionId)}
              className="text-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4 pt-4 border-t">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium text-foreground mb-2">Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) => updateQuestion(question.id, "type", value as QuestionType, sectionId)}
                    // className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select question type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={QuestionType.MCQ_SINGLE}>Single Choice</SelectItem>
                      <SelectItem value={QuestionType.MCQ_MULTIPLE}>Multiple Choice</SelectItem>
                      <SelectItem value={QuestionType.TRUE_FALSE}>True/False</SelectItem>
                      <SelectItem value={QuestionType.SHORT_ANSWER}>Short Answer</SelectItem>
                      <SelectItem value={QuestionType.NUMERIC}>Numeric</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">Points</Label>
                    <Input
                      type="number"
                      value={question.points}
                      onChange={(e) =>
                        updateQuestion(question.id, "points", Number.parseFloat(e.target.value) || 0, sectionId)
                      }
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                      min="0"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-foreground mb-2">Negative Points</Label>
                    <Input
                      type="number"
                      value={question.negativePoints}
                      onChange={(e) =>
                        updateQuestion(question.id, "negativePoints", Number.parseFloat(e.target.value) || 0, sectionId)
                      }
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                      min="0"
                      step="0.5"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Description (Optional)</Label>
                <Textarea
                  value={question.description}
                  onChange={(e) => updateQuestion(question.id, "description", e.target.value, sectionId)}
                  placeholder="Add question description or instructions"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                  rows={3}
                />
              </div>

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Image URL (Optional)</Label>
                <Input
                  type="text"
                  value={question.imageUrl || ""}
                  onChange={(e) => updateQuestion(question.id, "imageUrl", e.target.value, sectionId)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                />
              </div>

              {renderQuestionOptions(question, sectionId)}

              <div>
                <Label className="block text-sm font-medium text-foreground mb-2">Explanation (Optional)</Label>
                <Textarea
                  value={question.explanation}
                  onChange={(e) => updateQuestion(question.id, "explanation", e.target.value, sectionId)}
                  placeholder="Explain the correct answer"
                  className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSection = (section: Section) => {
    const isExpanded = expandedSections.has(section.id)

    return (
      <div key={section.id} className="border rounded-lg bg-card">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <Button
                onClick={() => {
                  if (isExpanded) {
                    expandedSections.delete(section.id)
                  } else {
                    expandedSections.add(section.id)
                  }
                  setExpandedSections(new Set(expandedSections))
                }}
              >
                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </Button>
              <div className="flex-1">
                <Input
                  type="text"
                  value={section.title}
                  onChange={(e) => updateSection(section.id, "title", e.target.value)}
                  placeholder="Section Title"
                  className="w-full text-xl font-semibold px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary"
                />
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-sm text-muted-foreground">{section.questions?.length || 0} questions</span>
                  {section.duration > 0 && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {section.duration} min
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              onClick={() => deleteSection(section.id)}
              className="text-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Description</Label>
                  <Textarea
                    value={section.description}
                    onChange={(e) => updateSection(section.id, "description", e.target.value)}
                    placeholder="Section description"
                    rows={2}
                  />
                </div>
                <div>
                  <Label className="mb-2 block">Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={section.duration}
                    onChange={(e) => updateSection(section.id, "duration", Number.parseInt(e.target.value) || 0)}
                    min={0}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-foreground">Questions</h4>
                <Button onClick={() => addQuestion(section.id)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>
              <div className="space-y-3">
                {section.questions?.map((question) => renderQuestion(question, section.id))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load test</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl text-foreground">Edit Test</CardTitle>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  className={cn(
                    "px-3 py-1 rounded-full",
                    test.status === TestStatus.PUBLISHED
                      ? "bg-green-100 text-green-800"
                      : test.status === TestStatus.DRAFT
                        ? "bg-yellow-100 text-yellow-800"
                        : test.status === TestStatus.CLOSED
                          ? "bg-red-100 text-red-800"
                          : "bg-muted text-foreground",
                  )}
                >
                  {test.status}
                </Badge>
                <Button onClick={handleSaveTest} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Test
                    </>
                  )}
                </Button>
              </div>
            </div>
            {/* Tabs */}
            <div className="border-b mt-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab("details")}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === "details"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  Test Details
                </button>
                <button
                  onClick={() => setActiveTab("sections")}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    activeTab === "sections"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                  )}
                >
                  Sections & Questions
                </button>
              </nav>
            </div>
          </CardHeader>
        </Card>

        {/* Content */}
        {activeTab === "details" ? (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="test-title">Test Title</Label>
                  <Input
                    id="test-title"
                    value={test.title}
                    onChange={(e) => updateTestField("title", e.target.value)}
                    placeholder="Enter test title"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={test.status} onValueChange={(value) => updateTestField("status", value as TestStatus)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TestStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={TestStatus.PUBLISHED}>Published</SelectItem>
                      <SelectItem value={TestStatus.CLOSED}>Closed</SelectItem>
                      <SelectItem value={TestStatus.ARCHIVED}>Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test-description">Description</Label>
                <Textarea
                  id="test-description"
                  value={test.description}
                  onChange={(e) => updateTestField("description", e.target.value)}
                  rows={4}
                  placeholder="Enter test description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={test.duration}
                    onChange={(e) => updateTestField("duration", Number.parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="start-time">Start Time</Label>
                  <Input
                    id="start-time"
                    type="datetime-local"
                    value={test.startTime ? new Date(test.startTime).toISOString().slice(0, 16) : ""}
                    onChange={(e) => updateTestField("startTime", new Date(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end-time">End Time</Label>
                  <Input
                    id="end-time"
                    type="datetime-local"
                    value={test.endTime ? new Date(test.endTime).toISOString().slice(0, 16) : ""}
                    onChange={(e) => updateTestField("endTime", new Date(e.target.value))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Question Order</Label>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="questionOrder"
                        checked={test.questionOrder === QuestionOrder.SEQUENTIAL}
                        onChange={() => updateTestField("questionOrder", QuestionOrder.SEQUENTIAL)}
                      />
                      <ListOrdered className="w-4 h-4" />
                      Sequential
                    </label>
                    <label className="flex items-center gap-2 text-sm text-foreground">
                      <input
                        type="radio"
                        name="questionOrder"
                        checked={test.questionOrder === QuestionOrder.SHUFFLED}
                        onChange={() => updateTestField("questionOrder", QuestionOrder.SHUFFLED)}
                      />
                      <Shuffle className="w-4 h-4" />
                      Shuffled
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Result Visibility</Label>
                  <Select
                    value={test.resultVisibility}
                    onValueChange={(value) => updateTestField("resultVisibility", value as ResultVisibility)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ResultVisibility.INSTANT}>Instant</SelectItem>
                      <SelectItem value={ResultVisibility.AFTER_TEST}>After Test</SelectItem>
                      <SelectItem value={ResultVisibility.HIDDEN}>Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Attempt Limit</Label>
                  <Input
                    type="number"
                    value={test.attemptLimit}
                    onChange={(e) => updateTestField("attemptLimit", Number.parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pass Percentage</Label>
                  <Input
                    type="number"
                    value={test.passPercentage}
                    onChange={(e) => updateTestField("passPercentage", Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                  />
                </div>
{/* 
                <div className="space-y-2">
                  <Label>Time Limit per Question (seconds)</Label>
                  <Input
                    type="number"
                    value={test.timeLimitPerQuestion}
                    onChange={(e) => updateTestField("timeLimitPerQuestion", Number.parseInt(e.target.value) || 0)}
                    min="0"
                  />
                </div> */}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Sections</h2>
              <Button onClick={addSection}>
                <Plus className="w-4 h-4 mr-2" />
                Add Section
              </Button>
            </div>
            <div className="space-y-4">
              {test.sections && test.sections.length > 0 ? (
                test.sections.map((section) => renderSection(section))
              ) : (
                <div className="text-center text-muted-foreground">
                  No sections available. Click the button above to add a new section.
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                {test.sections && test.sections.length > 0 ? "Standalone Questions" : "Questions"}
              </h2>
              <div className="flex items-center gap-3">
                {(!test.sections || test.sections.length === 0) && (
                  <Button variant="secondary" onClick={addSection}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Section
                  </Button>
                )}
                <Button onClick={() => addQuestion()}>Add Question</Button>
              </div>
            </div>
            <div className="space-y-4">
              {test.questions && test.questions.length > 0 ? (
                test.questions.map((question) => renderQuestion(question))
              ) : (
                <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed border-border">
                  <p className="text-muted-foreground mb-4">
                    {test.sections && test.sections.length > 0 ? "No standalone questions" : "No questions yet"}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    {(!test.sections || test.sections.length === 0) && (
                      <Button variant="secondary" onClick={addSection}>
                        Create Section
                      </Button>
                    )}
                    <Button onClick={() => addQuestion()}>Add Question</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
