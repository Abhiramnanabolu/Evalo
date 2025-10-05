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
  Pencil,
} from "lucide-react"

// Import your types (assuming they're in a separate file)
import type { Test, Section, Question, Option } from "@/types/test"
import { TestStatus, QuestionOrder, ResultVisibility, QuestionType } from "@/types/test"

// Import shadcn/ui and utils for improved UI
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import QuestionEditor from "./QuestionEditor"
import QuestionRenderer from "./QuestionRenderer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  const [activeTab, setActiveTab] = useState<"details" | "sections" | "publish">("details")
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null)
  const [isAddQuestionDialogOpen, setIsAddQuestionDialogOpen] = useState(false)
  const [newQuestion, setNewQuestion] = useState<Question | null>(null)
  const [currentSectionId, setCurrentSectionId] = useState<string | undefined>(undefined)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string>("")
  const [isStructureDialogOpen, setIsStructureDialogOpen] = useState(false)
  const [testStructure, setTestStructure] = useState<"sections" | "standalone" | null>(null)
  const [isChangeStructureDialogOpen, setIsChangeStructureDialogOpen] = useState(false)
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: "success" | "error" }>>([])

  // Fetch test data
  useEffect(() => {
    fetchTestData()
  }, [testId])

  // Check if structure dialog should be shown
  useEffect(() => {
    if (!loading && test) {
      const hasSections = test.sections && test.sections.length > 0
      const hasQuestions = test.questions && test.questions.length > 0
      const hasQuestionsInSections = test.sections?.some(s => s.questions && s.questions.length > 0)
      
      // Show dialog only if there are no sections and no questions at all
      if (!hasSections && !hasQuestions && !hasQuestionsInSections && testStructure === null) {
        setIsStructureDialogOpen(true)
      } else if (hasSections || hasQuestionsInSections) {
        setTestStructure("sections")
      } else if (hasQuestions) {
        setTestStructure("standalone")
      }
    }
  }, [loading, test, testStructure])

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

      if (!test) return

      // Transform the test data to match API expectations
      const testData = {
        title: test.title,
        description: test.description,
        duration: test.duration,
        startTime: test.startTime,
        endTime: test.endTime,
        status: test.status,
        questionOrder: test.questionOrder,
        attemptLimit: test.attemptLimit,
        resultVisibility: test.resultVisibility,
        passPercentage: test.passPercentage,
        // Include sections and questions based on test structure
        sections: test.sections && test.sections.length > 0 ? test.sections.map(section => ({
          id: section.id,
          title: section.title,
          description: section.description,
          duration: section.duration,
          order: section.order,
          questions: section.questions ? section.questions.map(question => ({
            id: question.id,
            type: question.type,
            title: question.title,
            description: question.description,
            imageUrl: question.imageUrl,
            points: question.points,
            negativePoints: question.negativePoints,
            order: question.order,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            options: question.options ? question.options.map(option => ({
              id: option.id,
              text: option.text,
              imageUrl: option.imageUrl,
              isCorrect: option.isCorrect,
              order: option.order,
            })) : [],
          })) : [],
        })) : [],
        questions: (!test.sections || test.sections.length === 0) && test.questions ? test.questions.map(question => ({
          id: question.id,
          type: question.type,
          title: question.title,
          description: question.description,
          imageUrl: question.imageUrl,
          points: question.points,
          negativePoints: question.negativePoints,
          order: question.order,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          options: question.options ? question.options.map(option => ({
            id: option.id,
            text: option.text,
            imageUrl: option.imageUrl,
            isCorrect: option.isCorrect,
            order: option.order,
          })) : [],
        })) : [],
      }

      const response = await fetch(`/api/tests/${testId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save test")
      }

      const result = await response.json()

      // Update local test state with the response data
      setTest(result.test)

      // Show success message
      showNotification("Test saved successfully!", "success")
    } catch (error) {
      console.error("Error saving test:", error)
      setErrors({ save: error instanceof Error ? error.message : "Failed to save test" })
      showNotification("Failed to save test", "error")
    } finally {
      setSaving(false)
    }
  }

  const showNotification = (message: string, type: "success" | "error") => {
    const id = Date.now().toString()
    setNotifications(prev => [...prev, { id, message, type }])
    // Auto remove after 3 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 3000)
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
      positivePoints: 1,
      negativePoints: 0,
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

  const openAddQuestionDialog = (sectionId?: string) => {
    if (!test) return
    
    // Get section defaults if adding to a section
    let defaultPoints = 1
    let defaultNegativePoints = 0
    
    if (sectionId) {
      const section = test.sections?.find(s => s.id === sectionId)
      if (section) {
        defaultPoints = section.positivePoints || 1
        defaultNegativePoints = section.negativePoints || 0
      }
    }
    
    const questionId = `question-${Date.now()}`
    
    // Create default options for MCQ_SINGLE (2 options by default)
    const defaultOptions: Option[] = [
      {
        id: `option-${Date.now()}-1`,
        questionId: questionId,
        question: null as any,
        text: "",
        imageUrl: "",
        isCorrect: false,
        order: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: `option-${Date.now()}-2`,
        questionId: questionId,
        question: null as any,
        text: "",
        imageUrl: "",
        isCorrect: false,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]
    
    const question: Question = {
      id: questionId,
      testId: test.id,
      test: test,
      type: QuestionType.MCQ_SINGLE,
      title: "",
      description: "",
      imageUrl: "",
      points: defaultPoints,
      negativePoints: defaultNegativePoints,
      order: test.questions?.length || 0,
      options: defaultOptions,
      correctAnswer: "",
      explanation: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setNewQuestion(question)
    setCurrentSectionId(sectionId)
    setIsEditMode(false)
    setEditingQuestionId(null)
    setValidationError("")
    setIsAddQuestionDialogOpen(true)
  }

  const openEditQuestionDialog = (question: Question, sectionId?: string) => {
    setNewQuestion({ ...question })
    setCurrentSectionId(sectionId)
    setIsEditMode(true)
    setEditingQuestionId(question.id)
    setValidationError("")
    setIsAddQuestionDialogOpen(true)
  }

  const validateQuestion = (question: Question): string | null => {
    // Validate based on question type
    switch (question.type) {
      case QuestionType.MCQ_SINGLE:
        if (!question.options || question.options.length === 0) {
          return "Please add at least one option for single choice question"
        }
        const singleCorrect = question.options.filter(o => o.isCorrect).length
        if (singleCorrect === 0) {
          return "Please select exactly one correct answer for single choice question"
        }
        if (singleCorrect > 1) {
          return "Single choice question can only have one correct answer"
        }
        break
      
      case QuestionType.MCQ_MULTIPLE:
        if (!question.options || question.options.length === 0) {
          return "Please add at least one option for multiple choice question"
        }
        const multipleCorrect = question.options.filter(o => o.isCorrect).length
        if (multipleCorrect === 0) {
          return "Please select at least one correct answer for multiple choice question"
        }
        break
      
      case QuestionType.TRUE_FALSE:
        if (!question.correctAnswer || (question.correctAnswer !== "true" && question.correctAnswer !== "false")) {
          return "Please select the correct answer (True or False)"
        }
        break
      
      case QuestionType.SHORT_ANSWER:
      case QuestionType.NUMERIC:
        if (!question.correctAnswer || question.correctAnswer.trim() === "") {
          return `Please provide the correct answer for ${question.type === QuestionType.NUMERIC ? "numeric" : "short answer"} question`
        }
        break
    }
    
    return null
  }

  const saveNewQuestion = () => {
    if (!test || !newQuestion) return

    // Clear previous validation error
    setValidationError("")

    // Validate the question
    const error = validateQuestion(newQuestion)
    if (error) {
      setValidationError(error)
      return // Don't close dialog, show error
    }

    if (isEditMode && editingQuestionId) {
      // Update existing question
      if (currentSectionId) {
        setTest({
          ...test,
          sections: test.sections.map((s) =>
            s.id === currentSectionId
              ? {
                  ...s,
                  questions: s.questions.map((q) => (q.id === editingQuestionId ? newQuestion : q)),
                }
              : s,
          ),
        })
      } else {
        setTest({
          ...test,
          questions: test.questions.map((q) => (q.id === editingQuestionId ? newQuestion : q)),
        })
      }
    } else {
      // Add new question
      if (currentSectionId) {
        setTest({
          ...test,
          sections: test.sections.map((s) =>
            s.id === currentSectionId ? { ...s, questions: [...(s.questions || []), newQuestion] } : s,
          ),
        })
      } else {
        setTest({
          ...test,
          questions: [...(test.questions || []), newQuestion],
        })
      }
    }
    setSelectedQuestionId(newQuestion.id)
    setIsAddQuestionDialogOpen(false)
    setNewQuestion(null)
    setCurrentSectionId(undefined)
    setIsEditMode(false)
    setEditingQuestionId(null)
    setValidationError("")
  }

  const updateNewQuestion = (field: keyof Question, value: any) => {
    if (!newQuestion) return
    
    // Handle question type change - adjust options accordingly
    if (field === "type") {
      const newType = value as QuestionType
      let updatedOptions = newQuestion.options || []
      let updatedCorrectAnswer = newQuestion.correctAnswer
      
      switch (newType) {
        case QuestionType.MCQ_SINGLE:
        case QuestionType.MCQ_MULTIPLE:
          // Ensure at least 2 options for MCQ
          if (updatedOptions.length < 2) {
            const optionsToAdd = 2 - updatedOptions.length
            for (let i = 0; i < optionsToAdd; i++) {
              updatedOptions.push({
                id: `option-${Date.now()}-${updatedOptions.length + i}`,
                questionId: newQuestion.id,
                question: newQuestion,
                text: "",
                imageUrl: "",
                isCorrect: false,
                order: updatedOptions.length + i,
                createdAt: new Date(),
                updatedAt: new Date(),
              })
            }
          }
          // For MCQ_SINGLE, ensure only one correct answer
          if (newType === QuestionType.MCQ_SINGLE) {
            const correctCount = updatedOptions.filter(o => o.isCorrect).length
            if (correctCount > 1) {
              // Keep only the first correct answer
              let foundFirst = false
              updatedOptions = updatedOptions.map(o => {
                if (o.isCorrect && !foundFirst) {
                  foundFirst = true
                  return o
                }
                return { ...o, isCorrect: false }
              })
            }
          }
          updatedCorrectAnswer = ""
          break
          
        case QuestionType.TRUE_FALSE:
          // Clear options and set up for true/false
          updatedOptions = []
          updatedCorrectAnswer = ""
          break
          
        case QuestionType.SHORT_ANSWER:
        case QuestionType.NUMERIC:
          // Clear options for text-based questions
          updatedOptions = []
          updatedCorrectAnswer = ""
          break
      }
      
      setNewQuestion({ 
        ...newQuestion, 
        [field]: value,
        options: updatedOptions,
        correctAnswer: updatedCorrectAnswer
      })
    } else {
      setNewQuestion({ ...newQuestion, [field]: value })
    }
    
    // Clear validation error when user makes changes
    if (validationError) setValidationError("")
  }

  const addOptionToNewQuestion = () => {
    if (!newQuestion) return

    const newOption: Option = {
      id: `option-${Date.now()}`,
      questionId: newQuestion.id,
      question: newQuestion,
      text: "",
      imageUrl: "",
      isCorrect: false,
      order: newQuestion.options?.length || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    setNewQuestion({
      ...newQuestion,
      options: [...(newQuestion.options || []), newOption],
    })
  }

  const updateNewQuestionOption = (optionId: string, field: keyof Option, value: any) => {
    if (!newQuestion) return

    const updatedOptions = newQuestion.options.map((o) => {
      if (o.id === optionId) {
        // Handle single correct answer for MCQ_SINGLE and TRUE_FALSE
        if (
          field === "isCorrect" &&
          value &&
          (newQuestion.type === QuestionType.MCQ_SINGLE || newQuestion.type === QuestionType.TRUE_FALSE)
        ) {
          // Set all other options to false
          newQuestion.options.forEach((opt) => {
            if (opt.id !== optionId) opt.isCorrect = false
          })
        }
        return { ...o, [field]: value }
      }
      // For MCQ_SINGLE and TRUE_FALSE, ensure only one correct answer
      if (
        field === "isCorrect" &&
        value &&
        (newQuestion.type === QuestionType.MCQ_SINGLE || newQuestion.type === QuestionType.TRUE_FALSE)
      ) {
        return { ...o, isCorrect: false }
      }
      return o
    })

    setNewQuestion({ ...newQuestion, options: updatedOptions })
    // Clear validation error when user makes changes
    if (validationError) setValidationError("")
  }

  const deleteNewQuestionOption = (optionId: string) => {
    if (!newQuestion) return
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.filter((o) => o.id !== optionId),
    })
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

  const handleChangeStructure = () => {
    if (!test || !testStructure) return

    if (testStructure === "sections") {
      // Changing from sections to standalone - delete all sections
      setTest({
        ...test,
        sections: [],
      })
      setTestStructure("standalone")
    } else {
      // Changing from standalone to sections - delete all standalone questions
      setTest({
        ...test,
        questions: [],
      })
      setTestStructure("sections")
    }
    setIsChangeStructureDialogOpen(false)
    setSelectedSectionId(null)
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

  const renderNewQuestionOptions = () => {
    if (!newQuestion) return null

    switch (newQuestion.type) {
      case QuestionType.MCQ_SINGLE:
      case QuestionType.MCQ_MULTIPLE:
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-sm font-medium text-foreground">Options</Label>
              <Button onClick={addOptionToNewQuestion} size="sm" variant="secondary" className="h-8">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Option
              </Button>
            </div>
            {newQuestion.options?.map((option, index) => (
              <div
                key={option.id}
                className="flex items-start gap-2 p-2 bg-muted/50 rounded-md border border-border/50"
              >
                <div className="flex items-center gap-2 mt-1.5">
                  <input
                    type={newQuestion.type === QuestionType.MCQ_SINGLE ? "radio" : "checkbox"}
                    checked={option.isCorrect}
                    onChange={(e) => updateNewQuestionOption(option.id, "isCorrect", e.target.checked)}
                    className="mt-0.5"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <QuestionEditor
                    initialContent={option.text}
                    onChange={(html) => updateNewQuestionOption(option.id, "text", html)}
                    placeholder={`Option ${index + 1}`}
                    type="option"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteNewQuestionOption(option.id)}
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
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Answer</Label>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`tf-new`}
                  checked={newQuestion.correctAnswer === "true"}
                  onChange={() => updateNewQuestion("correctAnswer", "true")}
                />
                True
              </Label>
              <Label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name={`tf-new`}
                  checked={newQuestion.correctAnswer === "false"}
                  onChange={() => updateNewQuestion("correctAnswer", "false")}
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
              type={newQuestion.type === QuestionType.NUMERIC ? "number" : "text"}
              value={newQuestion.correctAnswer}
              onChange={(e) => updateNewQuestion("correctAnswer", e.target.value)}
              placeholder={newQuestion.type === QuestionType.NUMERIC ? "Enter numeric answer" : "Enter correct answer"}
              className="w-full"
            />
          </div>
        )

      default:
        return null
    }
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
      <Card key={question.id} className="rounded-lg border border-border/50 shadow-sm hover:shadow-md transition bg-card">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Question Header with Actions */}
            <div className="flex items-start justify-between gap-3">
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
                  aria-label={isExpanded ? "Collapse question" : "Expand question"}
                  className="mt-0.5 shrink-0 h-7 w-7"
                >
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                <div className="flex-1 min-w-0">
                  <QuestionRenderer content={question.title || "Untitled Question"} type="question" className="mb-2" />
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="h-6 px-2 text-xs">
                      {question.type.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="default" className="h-6 px-2 text-xs bg-green-600">
                      +{question.points} pts
                    </Badge>
                    {question.negativePoints > 0 && (
                      <Badge variant="destructive" className="h-6 px-2 text-xs">
                        -{question.negativePoints} pts
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditQuestionDialog(question, sectionId)}
                  className="h-8 px-3 gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteQuestion(question.id, sectionId)}
                  aria-label="Delete question"
                  className="h-8 w-8 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Expanded Content - Options and Explanation */}
            {isExpanded && (
              <>
                {/* Options Display */}
                {question.options && question.options.length > 0 && (
                  <div className="space-y-2 pl-9 border-l-2 border-muted ml-2">
                    {question.options.map((option, index) => (
                      <div key={option.id} className="flex items-start gap-3">
                        <div className="mt-2 shrink-0">
                          {question.type === QuestionType.MCQ_SINGLE ? (
                            <div className={cn(
                              "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                              option.isCorrect ? "bg-green-500 border-green-500" : "border-gray-300"
                            )}>
                              {option.isCorrect && <div className="w-2 h-2 rounded-full bg-white" />}
                            </div>
                          ) : (
                            <div className={cn(
                              "w-4 h-4 rounded border-2 flex items-center justify-center",
                              option.isCorrect ? "bg-green-500 border-green-500" : "border-gray-300"
                            )}>
                              {option.isCorrect && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <QuestionRenderer 
                            content={option.text || `Option ${index + 1}`} 
                            type="option" 
                            className="text-sm"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Explanation if exists */}
                {question.explanation && (
                  <div className="pt-3 border-t ml-2">
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block">Explanation</Label>
                    <QuestionRenderer 
                      content={question.explanation} 
                      type="option" 
                      className="text-sm bg-muted/30"
                    />
                  </div>
                )}
              </>
            )}
          </div>
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
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
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

                <div className="space-y-1">
                  <Label htmlFor={`section-positive-points-${section.id}`} className="text-xs font-medium text-muted-foreground">
                    Positive Points
                  </Label>
                  <Input
                    id={`section-positive-points-${section.id}`}
                    type="number"
                    value={section.positivePoints}
                    onChange={(e) => updateSection(section.id, "positivePoints", Number.parseFloat(e.target.value) || 0)}
                    placeholder="1"
                    min="0"
                    step="0.5"
                    className="h-10"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`section-negative-points-${section.id}`} className="text-xs font-medium text-muted-foreground">
                    Negative Points
                  </Label>
                  <Input
                    id={`section-negative-points-${section.id}`}
                    type="number"
                    value={section.negativePoints}
                    onChange={(e) => updateSection(section.id, "negativePoints", Number.parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min="0"
                    step="0.5"
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
                  <Button size="sm" className="h-9" onClick={() => openAddQuestionDialog(section.id)}>
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
                          <Button size="sm" variant="secondary" onClick={() => openAddQuestionDialog(s.id)}>
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
                <Button size="sm" onClick={() => openAddQuestionDialog()}>
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
                  <button
                    onClick={() => setActiveTab("publish")}
                    className={cn(
                      "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                      activeTab === "publish"
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                    )}
                  >
                    Publish
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
                  <CardContent className="p-6 space-y-8">
                    {/* Basic Information Section */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="test-title" className="text-sm font-medium">Test Title</Label>
                        <Input
                          id="test-title"
                          value={test.title}
                          onChange={(e) => updateTestField("title", e.target.value)}
                          placeholder="Enter test title"
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="test-description" className="text-sm font-medium">Description</Label>
                        <Textarea
                          id="test-description"
                          value={test.description}
                          onChange={(e) => updateTestField("description", e.target.value)}
                          placeholder="Enter test description"
                          rows={4}
                          className="resize-none"
                        />
                      </div>
                    </div>

                    <div className="border-t" />

                    {/* Timing & Schedule Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timing & Schedule
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="duration" className="text-sm font-medium">Duration (minutes)</Label>
                          <Input
                            id="duration"
                            type="number"
                            value={test.duration}
                            onChange={(e) => updateTestField("duration", Number.parseInt(e.target.value) || 0)}
                            min="0"
                            placeholder="60"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="start-time" className="text-sm font-medium">Start Time</Label>
                          <Input
                            id="start-time"
                            type="datetime-local"
                            value={test.startTime ? new Date(test.startTime).toISOString().slice(0, 16) : ""}
                            onChange={(e) => updateTestField("startTime", new Date(e.target.value))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="end-time" className="text-sm font-medium">End Time</Label>
                          <Input
                            id="end-time"
                            type="datetime-local"
                            value={test.endTime ? new Date(test.endTime).toISOString().slice(0, 16) : ""}
                            onChange={(e) => updateTestField("endTime", new Date(e.target.value))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t" />

                    {/* Test Configuration Section */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-foreground">Test Configuration</h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Question Order</Label>
                          <Select
                            value={test.questionOrder}
                            onValueChange={(value) => updateTestField("questionOrder", value as QuestionOrder)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={QuestionOrder.SEQUENTIAL}>Sequential</SelectItem>
                              <SelectItem value={QuestionOrder.SHUFFLED}>Shuffled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Result Visibility</Label>
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

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Attempt Limit</Label>
                          <Input
                            type="number"
                            value={test.attemptLimit}
                            onChange={(e) => updateTestField("attemptLimit", Number.parseInt(e.target.value) || 0)}
                            min="0"
                            placeholder="0"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Pass Percentage</Label>
                          <Input
                            type="number"
                            value={test.passPercentage}
                            onChange={(e) => updateTestField("passPercentage", Number.parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            placeholder="60"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : activeTab === "publish" ? (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4 text-foreground">Publish Settings</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Test Status</Label>
                        <Select
                          value={test.status}
                          onValueChange={(value) => updateTestField("status", value as TestStatus)}
                        >
                          <SelectTrigger className="w-full md:w-1/2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TestStatus.DRAFT}>Draft</SelectItem>
                            <SelectItem value={TestStatus.PUBLISHED}>Published</SelectItem>
                            <SelectItem value={TestStatus.CLOSED}>Closed</SelectItem>
                            <SelectItem value={TestStatus.ARCHIVED}>Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-2">
                          {test.status === TestStatus.DRAFT && "Test is in draft mode and not visible to students"}
                          {test.status === TestStatus.PUBLISHED && "Test is published and accessible to students"}
                          {test.status === TestStatus.CLOSED && "Test is closed and no longer accepting submissions"}
                          {test.status === TestStatus.ARCHIVED && "Test is archived and hidden from view"}
                        </p>
                      </div>

                      <div className="border-t pt-6">
                        <h4 className="text-base font-semibold mb-3 text-foreground">Publishing Checklist</h4>
                        <div className="space-y-3">
                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              test.title ? "bg-green-500" : "bg-muted-foreground/30"
                            )}>
                              {test.title && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Test title is set</p>
                              <p className="text-xs text-muted-foreground">A clear title helps students identify the test</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              (test.sections?.length > 0 || test.questions?.length > 0) ? "bg-green-500" : "bg-muted-foreground/30"
                            )}>
                              {(test.sections?.length > 0 || test.questions?.length > 0) && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Questions added</p>
                              <p className="text-xs text-muted-foreground">
                                {test.sections?.reduce((acc, s) => acc + (s.questions?.length || 0), 0) || 0} section questions, {test.questions?.length || 0} standalone questions
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              test.duration > 0 ? "bg-green-500" : "bg-muted-foreground/30"
                            )}>
                              {test.duration > 0 && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Duration configured</p>
                              <p className="text-xs text-muted-foreground">Current duration: {test.duration} minutes</p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                            <div className={cn(
                              "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                              (test.startTime && test.endTime) ? "bg-green-500" : "bg-muted-foreground/30"
                            )}>
                              {(test.startTime && test.endTime) && (
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">Schedule set</p>
                              <p className="text-xs text-muted-foreground">Start and end times are configured</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {testStructure === "sections" ? (
                    /* Sections area */
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-foreground">Sections</h2>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsChangeStructureDialogOpen(true)}>
                            <Shuffle className="w-3.5 h-3.5 mr-1.5" />
                            Change Structure
                          </Button>
                          <Button onClick={addSection}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Section
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {test.sections && test.sections.length > 0 ? (
                          test.sections.map((section) => renderSection(section))
                        ) : (
                          <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed border-border">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <ListOrdered className="w-8 h-8 text-primary" />
                              </div>
                              <div>
                                <p className="text-foreground font-medium mb-1">No sections yet</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Create sections to organize your questions
                                </p>
                              </div>
                              <Button onClick={addSection}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Section
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : testStructure === "standalone" ? (
                    /* Standalone questions area */
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h2 className="text-base font-semibold text-foreground">Questions</h2>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => setIsChangeStructureDialogOpen(true)}>
                            <ListOrdered className="w-3.5 h-3.5 mr-1.5" />
                            Change Structure
                          </Button>
                          <Button onClick={() => openAddQuestionDialog()}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Question
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {test.questions && test.questions.length > 0 ? (
                          test.questions.map((question) => renderQuestion(question))
                        ) : (
                          <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed border-border">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                                <Shuffle className="w-8 h-8 text-primary" />
                              </div>
                              <div>
                                <p className="text-foreground font-medium mb-1">No questions yet</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Add standalone questions to your test
                                </p>
                              </div>
                              <Button onClick={() => openAddQuestionDialog()}>
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Question
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed border-border">
                      <p className="text-muted-foreground">Please select a test structure to continue</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Change Structure Confirmation Dialog */}
      <Dialog open={isChangeStructureDialogOpen} onOpenChange={setIsChangeStructureDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-5 h-5" />
              Change Test Structure?
            </DialogTitle>
            <DialogDescription className="pt-2">
              {testStructure === "sections" ? (
                <div className="space-y-3">
                  <p>
                    You are about to change from <strong>Section-wise</strong> to <strong>Standalone Questions</strong>.
                  </p>
                  {test && test.sections && test.sections.length > 0 && (
                    <>
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                        <p className="text-sm font-medium text-destructive">
                          ⚠️ All {test.sections.length} section{test.sections.length > 1 ? 's' : ''} and their questions will be permanently deleted.
                        </p>
                      </div>
                      <p className="text-sm">
                        This action cannot be undone. Are you sure you want to continue?
                      </p>
                    </>
                  )}
                  {(!test || !test.sections || test.sections.length === 0) && (
                    <p className="text-sm">
                      Are you sure you want to switch to standalone questions structure?
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p>
                    You are about to change from <strong>Standalone Questions</strong> to <strong>Section-wise</strong>.
                  </p>
                  {test && test.questions && test.questions.length > 0 && (
                    <>
                      <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                        <p className="text-sm font-medium text-destructive">
                          ⚠️ All {test.questions.length} standalone question{test.questions.length > 1 ? 's' : ''} will be permanently deleted.
                        </p>
                      </div>
                      <p className="text-sm">
                        This action cannot be undone. Are you sure you want to continue?
                      </p>
                    </>
                  )}
                  {(!test || !test.questions || test.questions.length === 0) && (
                    <p className="text-sm">
                      Are you sure you want to switch to section-wise structure?
                    </p>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsChangeStructureDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleChangeStructure}>
              Yes, Change Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Structure Selection Dialog */}
      <Dialog open={isStructureDialogOpen} onOpenChange={setIsStructureDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Test Structure</DialogTitle>
            <DialogDescription>
              Select how you want to organize your test questions. You can change this later by adding sections or standalone questions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
            {/* Section-wise option */}
            <button
              onClick={() => {
                setTestStructure("sections")
                setIsStructureDialogOpen(false)
                setActiveTab("sections")
              }}
              className="group relative p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <ListOrdered className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Section-wise Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    Organize questions into sections with different durations, points, and settings for each section.
                  </p>
                </div>
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    Recommended for structured tests
                  </Badge>
                </div>
              </div>
            </button>

            {/* Standalone questions option */}
            <button
              onClick={() => {
                setTestStructure("standalone")
                setIsStructureDialogOpen(false)
                setActiveTab("sections")
              }}
              className="group relative p-6 border-2 border-border rounded-lg hover:border-primary hover:bg-accent/50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Shuffle className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-base mb-1">Standalone Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    Add questions directly without sections. Simple and quick for basic tests.
                  </p>
                </div>
                <div className="pt-2">
                  <Badge variant="outline" className="text-xs">
                    Recommended for simple quizzes
                  </Badge>
                </div>
              </div>
            </button>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <p className="text-xs text-muted-foreground text-center sm:text-left flex-1">
              Choose one structure for your test. You can add questions accordingly.
            </p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Question Dialog */}
      <Dialog open={isAddQuestionDialogOpen} onOpenChange={setIsAddQuestionDialogOpen}>
        <DialogContent 
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          onInteractOutside={(e) => {
            // Prevent closing when clicking on math-field or its popups
            const target = e.target as HTMLElement
            if (
              target.closest('math-field') || 
              target.closest('.ML__keyboard') || 
              target.closest('.ML__popover') ||
              target.closest('.ML__menu') ||
              target.closest('.ML__tooltip') ||
              target.classList.contains('ML__keyboard') ||
              target.classList.contains('ML__popover')
            ) {
              e.preventDefault()
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing on escape if math field is focused or math modal is open
            const mathField = document.querySelector('math-field')
            const mathModal = document.querySelector('.fixed.z-\\[100\\]')
            if ((mathField && document.activeElement === mathField) || mathModal) {
              e.preventDefault()
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Edit Question" : "Add New Question"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Update the question details below" 
                : `Create a new question for ${currentSectionId ? "the section" : "standalone questions"}`
              }
            </DialogDescription>
          </DialogHeader>

          {newQuestion && (
            <div className="space-y-4 py-4">
              {/* Validation Error Alert */}
              {validationError && (
                <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">{validationError}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="block text-sm font-medium mb-1">Question Type</Label>
                  <Select
                    value={newQuestion.type}
                    onValueChange={(value) => updateNewQuestion("type", value as QuestionType)}
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
                    value={newQuestion.points}
                    onChange={(e) => updateNewQuestion("points", Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                  />
                </div>

                <div>
                  <Label className="block text-sm font-medium mb-1">Negative Points</Label>
                  <Input
                    type="number"
                    value={newQuestion.negativePoints}
                    onChange={(e) => updateNewQuestion("negativePoints", Number.parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.5"
                  />
                </div>
              </div>

              <div>
                <Label className="block text-sm font-medium mb-2">Question Title</Label>
                <QuestionEditor
                  initialContent={newQuestion.title}
                  onChange={(html) => updateNewQuestion("title", html)}
                  placeholder="Enter question title"
                  type="question"
                />
              </div>

              {renderNewQuestionOptions()}

              <div>
                <Label className="block text-xs font-medium mb-2">Explanation (Optional)</Label>
                <QuestionEditor
                  initialContent={newQuestion.explanation}
                  onChange={(html) => updateNewQuestion("explanation", html)}
                  placeholder="Explain the correct answer"
                  type="question"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNewQuestion} disabled={!newQuestion?.title}>
              {isEditMode ? "Save Changes" : "Add Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={cn(
              "max-w-sm w-full p-4 rounded-lg shadow-lg transition-all transform translate-x-full animate-in slide-in-from-right-2",
              notification.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : "bg-red-50 border border-red-200 text-red-800"
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-2 h-2 rounded-full",
                notification.type === "success" ? "bg-green-500" : "bg-red-500"
              )} />
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
