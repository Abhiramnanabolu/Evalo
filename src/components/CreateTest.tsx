"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Plus, Calendar, Eye, Percent, Timer, Users, FileText, AlertCircle, Settings, Loader2, CheckCircle } from "lucide-react"
import { DateTimeRangePicker } from "@/components/ui/datetime-range-picker"
import { useRouter } from "next/navigation"

export default function CreateTest() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    startDateTime: undefined as Date | undefined,
    endDateTime: undefined as Date | undefined,
    questionOrder: "SEQUENTIAL",
    attemptLimit: "",
    resultVisibility: "after_submission",
    passPercentage: "",
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const handleInputChange = (name: string, value: string | boolean | Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.title.trim()) errors.title = "Test title is required"
    if (!formData.duration) errors.duration = "Duration is required"
    if (!formData.passPercentage) errors.passPercentage = "Pass percentage is required"
    if (!formData.startDateTime) errors.startDateTime = "Start date and time is required"
    if (!formData.endDateTime) errors.endDateTime = "End date and time is required"

    if (formData.startDateTime && formData.endDateTime && formData.startDateTime >= formData.endDateTime) {
      errors.endDateTime = "End date must be after start date"
    }

    const passPercentage = Number.parseInt(formData.passPercentage)
    if (passPercentage < 1 || passPercentage > 100) {
      errors.passPercentage = "Pass percentage must be between 1 and 100"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")
    setSubmitSuccess(false)

    if (validateForm()) {
      setIsSubmitting(true)

      try {
        const response = await fetch("/api/tests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            startDateTime: formData.startDateTime?.toISOString(),
            endDateTime: formData.endDateTime?.toISOString(),
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to create test")
        }

        const testId = data.test.id
        setSubmitSuccess(true)

        // Reset form after successful submission
        setFormData({
          title: "",
          description: "",
          duration: "",
          startDateTime: undefined,
          endDateTime: undefined,
          questionOrder: "SEQUENTIAL",
          attemptLimit: "",
          resultVisibility: "after_submission",
          passPercentage: "",
        })
        setFormErrors({})

        // Redirect to test edit page after a short delay
        setTimeout(() => {
          router.push(`/dashboard/test/${testId}/edit`)
        }, 2000)

      } catch (error) {
        console.error("Error creating test:", error)
        setSubmitError(error instanceof Error ? error.message : "Failed to create test")
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="w-full space-y-6 pt-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Create New Test</h1>
        <p className="text-muted-foreground text-sm">
          Design and configure your test with advanced settings and scheduling options.
        </p>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-green-800 font-medium">Test created successfully! Redirecting to dashboard...</p>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800 font-medium">{submitError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">
                  Test Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive test title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className={cn(formErrors.title && "border-destructive")}
                />
                {formErrors.title && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.title}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of what this test covers..."
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>

            {/* Availability & Timing Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Availability & Timing</h3>
              </div>

              <div className="space-y-2">
                <DateTimeRangePicker
                  startDateTime={formData.startDateTime}
                  endDateTime={formData.endDateTime}
                  onStartDateTimeChange={(date: Date | undefined) => handleInputChange("startDateTime", date)}
                  onEndDateTimeChange={(date: Date | undefined) => handleInputChange("endDateTime", date)}
                  placeholder="Select when the test will be available"
                />
                {(formErrors.startDateTime || formErrors.endDateTime) && (
                  <p className="text-sm text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {formErrors.startDateTime || formErrors.endDateTime}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">Users can only take the test during this time period</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-sm font-medium flex items-center gap-2">
                    <Timer className="h-4 w-4" />
                    Test Duration (minutes) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    placeholder="e.g., 60"
                    min="1"
                    max="480"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    className={cn(formErrors.duration && "border-destructive")}
                  />
                  {formErrors.duration && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.duration}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passPercentage" className="text-sm font-medium flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Pass Percentage <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="passPercentage"
                    type="number"
                    placeholder="e.g., 70"
                    min="1"
                    max="100"
                    value={formData.passPercentage}
                    onChange={(e) => handleInputChange("passPercentage", e.target.value)}
                    className={cn(formErrors.passPercentage && "border-destructive")}
                  />
                  {formErrors.passPercentage && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {formErrors.passPercentage}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Test Configuration Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <h3 className="text-lg font-semibold">Test Configuration</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Question Order</Label>
                  <Select
                    value={formData.questionOrder}
                    onValueChange={(value: string) => handleInputChange("questionOrder", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEQUENTIAL">Sequential Order</SelectItem>
                      <SelectItem value="SHUFFLED">Random Order</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="attemptLimit" className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Attempt Limit
                  </Label>
                  <Input
                    id="attemptLimit"
                    type="number"
                    placeholder="Unlimited"
                    min="1"
                    max="10"
                    value={formData.attemptLimit}
                    onChange={(e) => handleInputChange("attemptLimit", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty for unlimited attempts</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Result Visibility
                  </Label>
                  <Select
                    value={formData.resultVisibility}
                    onValueChange={(value: string) => handleInputChange("resultVisibility", value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediately">Show Immediately</SelectItem>
                      <SelectItem value="after_submission">After Submission</SelectItem>
                      <SelectItem value="after_test_end">After Test Period Ends</SelectItem>
                      <SelectItem value="never">Never Show Results</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between pt-4 pb-6 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span>Fields marked with * are required</span>
          </div>
          <div className="flex gap-3">
            <Button 
              type="submit" 
              className="px-8" 
              disabled={isSubmitting || submitSuccess}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Test...
                </>
              ) : submitSuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Test Created!
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Test
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
