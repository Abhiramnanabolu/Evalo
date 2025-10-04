"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import QuestionEditor from "./QuestionEditor"

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
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)

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
        setSelectedSectionId(data.sections[0].id)
        const firstQ = data.sections[0].questions?.[0]?.id
        if (firstQ) setSelectedQuestionId(firstQ)
      } else {
        setSelectedSectionId(null)
        // If there are standalone questions, select the first one
        const firstStandalone = data.test?.questions?.[0]?.id
        if (firstStandalone) setSelectedQuestionId(firstStandalone)
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
    setSelectedSectionId(newSection.id)
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
    setSelectedSectionId(null)
    setSelectedQuestionId(null)
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
    setSelectedQuestionId(newQuestion.id)
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
    setSelectedQuestionId(null)
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
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm font-medium text-foreground">Options</Label>
              <Button onClick={() => addOption(question.id, sectionId)} size="sm" variant="secondary" className="h-8">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Option
              </Button>
            </div>
            {question.options?.map((option, index) => (
              <div
                key={option.id}
                className="flex items-start gap-2 p-2 bg-muted/50 rounded-md border border-border/50"
              >
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type={question.type === QuestionType.MCQ_SINGLE ? "radio" : "checkbox"}
                    checked={option.isCorrect}
                    onChange={(e) => updateOption(question.id, option.id, "isCorrect", e.target.checked, sectionId)}
                    className="mt-0.5"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <QuestionEditor
                    initialContent={option.text}
                    onChange={(html) => updateOption(question.id, option.id, "text", html, sectionId)}
                    placeholder={`Option ${index + 1}`}
                    type="option"
                  />
                  <Input
                    value={option.imageUrl || ""}
                    onChange={(e) => updateOption(question.id, option.id, "imageUrl", e.target.value, sectionId)}
                    placeholder="Image URL (optional)"
                    className="h-9"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteOption(question.id, option.id, sectionId)}
                  className="mt-1 text-destructive h-8 w-8"
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
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Answer</Label>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`tf-${question.id}`}
                  checked={question.correctAnswer === "true"}
                  onChange={() => updateQuestion(question.id, "correctAnswer", "true", sectionId)}
                />
                True
              </Label>
              <Label className="flex items-center gap-2 text-sm">
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
              className="w-full"
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
      <Card key={question.id} className="rounded-lg border border-border/50 shadow-sm hover:shadow transition bg-card">
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isExpanded) {
                    expandedQuestions.delete(question.id)
                  } else {
                    expandedQuestions.add(question.id)
                  }
                  setExpandedQuestions(new Set(expandedQuestions))
                }}
                aria-label="Toggle question details"
                className="mt-0.5 shrink-0 h-7 w-7"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              <div className="flex-1 min-w-0">
                <QuestionEditor
                  initialContent={question.title}
                  onChange={(html) => updateQuestion(question.id, "title", html, sectionId)}
                  placeholder="Enter question title"
                  type="question"
                />
                <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="h-5 px-1.5">
                    {question.type.replace(/_/g, " ")}
                  </Badge>
                  <span className="leading-none">•</span>
                  <span className="leading-none">Pts: {question.points}</span>
                  {question.negativePoints > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-destructive">
                      -{question.negativePoints}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteQuestion(question.id, sectionId)}
              aria-label="Delete question"
              className="h-7 w-7 text-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-3 border-t space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="block text-sm font-medium mb-1">Question Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) => updateQuestion(question.id, "type", value as QuestionType, sectionId)}
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

                <div>
                  <Label className="block text-sm font-medium mb-1">Points</Label>
                  <Input
                    type="number"
                    value={question.points}
                    onChange={(e) =>
                      updateQuestion(question.id, "points", Number.parseFloat(e.target.value) || 0, sectionId)
                    }
                    min="0"
                    step="0.5"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">Negative Points</Label>
                  <Input
                    type="number"
                    value={question.negativePoints}
                    onChange={(e) =>
                      updateQuestion(question.id, "negativePoints", Number.parseFloat(e.target.value) || 0, sectionId)
                    }
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              {renderQuestionOptions(question, sectionId)}

              <div>
                <Label className="block text-xs font-medium mb-2">Explanation (Optional)</Label>
                <QuestionEditor
                  initialContent={question.explanation}
                  onChange={(html) => updateQuestion(question.id, "explanation", html, sectionId)}
                  placeholder="Explain the correct answer"
                  type="question"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderSection = (section: Section) => {
    const isExpanded = expandedSections.has(section.id)

    return (
      <Card key={section.id} className="rounded-lg border border-border/50 shadow-sm hover:shadow transition bg-card">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Section Header with Inputs */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isExpanded) {
                    expandedSections.delete(section.id)
                  } else {
                    expandedSections.add(section.id)
                  }
                  setExpandedSections(new Set(expandedSections))
                }}
                aria-label="Toggle section details"
                className="h-10 w-10 shrink-0"
              >
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor={`section-title-${section.id}`} className="text-xs font-medium text-muted-foreground">
                    Section Title
                  </Label>
                  <Input
                    id={`section-title-${section.id}`}
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSection(section.id, "title", e.target.value)}
                    placeholder="Enter section title"
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor={`section-duration-${section.id}`} className="text-xs font-medium text-muted-foreground">
                    Duration (minutes)
                  </Label>
                  <Input
                    id={`section-duration-${section.id}`}
                    type="number"
                    value={section.duration}
                    onChange={(e) => updateSection(section.id, "duration", Number.parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="flex items-end gap-3 shrink-0">
                <div className="text-right">
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50 mb-1">
                    <span className="text-sm font-semibold text-foreground">
                      {section.questions?.length || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {section.questions?.length === 1 ? 'Question' : 'Questions'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteSection(section.id)}
                  aria-label="Delete section"
                  className="h-10 w-10 mt-3 text-destructive hover:text-destructive-foreground bg-red-50 hover:bg-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-4 border-t space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-medium text-foreground">Questions</h4>
                  <Button size="sm" className="h-9" onClick={() => addQuestion(section.id)}>
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
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!test) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load test</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-56px)] min-h-[calc(100vh-56px)] max-h-[calc(100vh-56px)] w-full overflow-hidden bg-background">
      <div className="h-full flex min-h-0">
        {/* Sidebar */}
        <aside className="w-72 shrink-0 border-r bg-card/40 backdrop-blur supports-[backdrop-filter]:bg-card/40 overflow-y-auto">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Structure</h2>
              <Button size="sm" onClick={addSection}>
                <Plus className="w-4 h-4 mr-1" />
                Section
              </Button>
            </div>
          </div>

          <nav className="p-2 space-y-4">
            {/* Sections */}
            <div>
              <div className="px-2 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sections
              </div>
              <div className="space-y-1">
                {test.sections && test.sections.length > 0 ? (
                  test.sections.map((s) => {
                    const isActiveSection = selectedSectionId === s.id
                    return (
                      <div key={s.id} className="group">
                        <button
                          className={cn(
                            "w-full text-left rounded-md px-3 py-2 text-sm flex items-center justify-between hover:bg-muted/70",
                            isActiveSection && "bg-muted",
                          )}
                          onClick={() => {
                            setSelectedSectionId(s.id)
                            const firstQ = s.questions?.[0]?.id
                            setSelectedQuestionId(firstQ ?? null)
                          }}
                        >
                          <span className="truncate">{s.title || "Untitled section"}</span>
                          <span className="text-xs text-muted-foreground ml-2">{s.questions?.length || 0}</span>
                        </button>
                        {/* Section actions */}
                        <div className="pl-3 pr-2 pb-2 flex items-center gap-2">
                          <Button size="sm" variant="secondary" onClick={() => addQuestion(s.id)}>
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Question
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteSection(s.id)}
                            className="ml-auto text-destructive hover:text-destructive-foreground"
                            aria-label="Delete section"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Questions under section */}
                        {s.questions && s.questions.length > 0 && (
                          <div className="pl-3 space-y-1">
                            {s.questions.map((q) => {
                              const isActive = selectedQuestionId === q.id
                              return (
                                <div key={q.id} className="flex items-center gap-2">
                                  <button
                                    className={cn(
                                      "flex-1 min-w-0 text-left rounded-md px-2 py-1.5 text-xs hover:bg-muted/70",
                                      isActive && "bg-muted",
                                    )}
                                    onClick={() => {
                                      setSelectedSectionId(s.id)
                                      setSelectedQuestionId(q.id)
                                      if (!expandedQuestions.has(q.id)) {
                                        expandedQuestions.add(q.id)
                                        setExpandedQuestions(new Set(expandedQuestions))
                                      }
                                    }}
                                  >
                                    <span className="truncate block">{q.title || "Untitled question"}</span>
                                  </button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive-foreground shrink-0"
                                    onClick={() => deleteQuestion(q.id, s.id)}
                                    aria-label="Delete question"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No sections. Create one to organize questions.
                  </div>
                )}
              </div>
            </div>

            {/* Standalone Questions */}
            <div>
              <div className="px-2 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Standalone
              </div>
              <div className="px-2 pb-2 flex items-center gap-2">
                <Button size="sm" onClick={() => addQuestion()}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Question
                </Button>
              </div>
              <div className="space-y-1">
                {test.questions && test.questions.length > 0 ? (
                  test.questions.map((q) => {
                    const isActive = selectedSectionId === null && selectedQuestionId === q.id
                    return (
                      <div key={q.id} className="flex items-center gap-2 px-3">
                        <button
                          className={cn(
                            "flex-1 min-w-0 text-left rounded-md px-2 py-1.5 text-xs hover:bg-muted/70",
                            isActive && "bg-muted",
                          )}
                          onClick={() => {
                            setSelectedSectionId(null)
                            setSelectedQuestionId(q.id)
                            if (!expandedQuestions.has(q.id)) {
                              expandedQuestions.add(q.id)
                              setExpandedQuestions(new Set(expandedQuestions))
                            }
                          }}
                        >
                          <span className="truncate block">{q.title || "Untitled question"}</span>
                        </button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive-foreground shrink-0"
                          onClick={() => deleteQuestion(q.id)}
                          aria-label="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )
                  })
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No standalone questions</div>
                )}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main content */}
        <section className="flex-1 min-w-0 flex flex-col">
          {/* Top toolbar (sticky) */}
          <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="h-14 flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} aria-label="Go back">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-base font-semibold text-foreground">Edit Test</h1>
                <Badge
                  className={cn(
                    "ml-1 px-2 py-0.5 rounded-full text-xs",
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
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSaveTest} disabled={saving}>
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-4">
              <div className="border-b">
                <nav className="-mb-px flex space-x-6">
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
            </div>
          </div>

          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="px-4 py-6">
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
                        <Select
                          value={test.status}
                          onValueChange={(value) => updateTestField("status", value as TestStatus)}
                        >
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
                      <QuestionEditor
                        initialContent={test.description}
                        onChange={(html) => updateTestField("description", html)}
                        placeholder="Enter test description"
                        type="question"
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
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Sections area */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-semibold text-foreground">Sections</h2>
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
                  </div>

                  {/* Standalone questions area */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-base font-semibold text-foreground">
                        {test.sections && test.sections.length > 0 ? "Standalone Questions" : "Questions"}
                      </h2>
                      <div className="flex items-center gap-2">
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
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
