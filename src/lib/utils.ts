import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Timezone utility functions
export const formatDateForInput = (date: Date): string => {
  // Convert UTC date to local timezone for display in input
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 16)
}

export const parseInputToUTC = (value: string): Date => {
  // Convert local datetime input to UTC
  const localDate = new Date(value)
  return new Date(localDate.getTime() + localDate.getTimezoneOffset() * 60000)
}

export const formatLocalTimeForDisplay = (date: Date): string => {
  // Display the time in user's local timezone
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  })
}

export const formatDateTimeRange = (startDate: Date, endDate: Date): string => {
  const startFormatted = formatLocalTimeForDisplay(startDate)
  const endFormatted = formatLocalTimeForDisplay(endDate)
  return `${startFormatted} to ${endFormatted}`
}

export const isValidDateTime = (dateString: string): boolean => {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}
