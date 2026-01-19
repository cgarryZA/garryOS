// Common types for the HomeOS application

export interface Task {
  id: string
  title: string
  description?: string
  completed: boolean
  dueDate?: string
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  allDay: boolean
  createdAt: string
  updatedAt: string
}

export interface Reminder {
  id: string
  title: string
  description?: string
  reminderDate: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}
