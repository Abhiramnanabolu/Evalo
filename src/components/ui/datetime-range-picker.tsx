"use client"

import { useState, useEffect } from "react"
import { CalendarIcon } from "lucide-react"

interface DateTimeRangePickerProps {
  startDateTime?: Date
  endDateTime?: Date
  onStartDateTimeChange: (date: Date | undefined) => void
  onEndDateTimeChange: (date: Date | undefined) => void
  placeholder?: string
}

export function DateTimeRangePicker({
  startDateTime,
  endDateTime,
  onStartDateTimeChange,
  onEndDateTimeChange,
  placeholder = "Select date range",
}: DateTimeRangePickerProps) {
  const [startDateTimeLocal, setStartDateTimeLocal] = useState("")
  const [endDateTimeLocal, setEndDateTimeLocal] = useState("")

  // Only initialize local state once when component mounts or when dates are first set
  useEffect(() => {
    if (startDateTime && !startDateTimeLocal) {
      // Convert UTC Date back to local time string for input display
      const localDate = new Date(startDateTime.getTime() - startDateTime.getTimezoneOffset() * 60000)
      setStartDateTimeLocal(localDate.toISOString().slice(0, 16))
    }

    if (endDateTime && !endDateTimeLocal) {
      // Convert UTC Date back to local time string for input display
      const localDate = new Date(endDateTime.getTime() - endDateTime.getTimezoneOffset() * 60000)
      setEndDateTimeLocal(localDate.toISOString().slice(0, 16))
    }
  }, []) // Empty dependency array - only run once

  const handleStartDateTimeChange = (value: string) => {
    setStartDateTimeLocal(value)
    if (value) {
      // Create a Date object from the local time input
      const localDate = new Date(value)
      // Convert to UTC for storage
      const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000)
      onStartDateTimeChange(utcDate)
    } else {
      onStartDateTimeChange(undefined)
    }
  }

  const handleEndDateTimeChange = (value: string) => {
    setEndDateTimeLocal(value)
    if (value) {
      // Create a Date object from the local time input
      const localDate = new Date(value)
      // Convert to UTC for storage
      const utcDate = new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000)
      onEndDateTimeChange(utcDate)
    } else {
      onEndDateTimeChange(undefined)
    }
  }

  const getMinDateTime = (): string => {
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    return localDateTime.toISOString().slice(0, 16)
  }

  const getMinEndDateTime = (): string => {
    return startDateTimeLocal || getMinDateTime()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Start Date & Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Start Date & Time
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="datetime-local"
              value={startDateTimeLocal}
              onChange={(e) => handleStartDateTimeChange(e.target.value)}
              min={getMinDateTime()}
              className="w-full pl-10 pr-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>
        </div>

        {/* End Date & Time */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            End Date & Time
          </label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="datetime-local"
              value={endDateTimeLocal}
              onChange={(e) => handleEndDateTimeChange(e.target.value)}
              min={getMinEndDateTime()}
              className="w-full pl-10 pr-3 py-2 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            />
          </div>
        </div>
      </div>

    </div>
  )
}

export default DateTimeRangePicker
