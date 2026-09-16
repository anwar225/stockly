export interface PeriodInfo {
  type: string
  startDate: Date
  endDate: Date
  granularity: 'day' | 'month'
}

export function getPeriodInfo(period?: string, startDate?: string, endDate?: string): PeriodInfo {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  // If custom date range provided
  if (startDate && endDate) {
    if (period) {
      throw new Error('Ne pouvez pas spécifier à la fois une période et des dates personnalisées')
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Dates invalides')
    }

    if (start > end) {
      throw new Error('La date de début doit être antérieure à la date de fin')
    }

    // Determine granularity based on date range
    const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const granularity: 'day' | 'month' = daysDiff > 365 ? 'month' : 'day'

    return {
      type: 'custom',
      startDate: start,
      endDate: end,
      granularity,
    }
  }

  // Validate individual dates if provided without both
  if (startDate || endDate) {
    throw new Error('Les paramètres startDate et endDate doivent être fournis ensemble')
  }

  // Validate period parameter if provided
  if (period && !['today', '7d', '30d', 'month', 'year'].includes(period)) {
    throw new Error('Période invalide')
  }

  switch (period) {
    case 'today':
      return {
        type: 'today',
        startDate: now,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1),
        granularity: 'day',
      }

    case '7d':
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return {
        type: '7d',
        startDate: sevenDaysAgo,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1),
        granularity: 'day',
      }

    case '30d':
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return {
        type: '30d',
        startDate: thirtyDaysAgo,
        endDate: new Date(now.getTime() + 24 * 60 * 60 * 1000 - 1),
        granularity: 'day',
      }

    case 'month':
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return {
        type: 'month',
        startDate: startOfMonth,
        endDate: endOfMonth,
        granularity: 'day',
      }

    case 'year':
      const startOfYear = new Date(now.getFullYear(), 0, 1)
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999)
      return {
        type: 'year',
        startDate: startOfYear,
        endDate: endOfYear,
        granularity: 'month',
      }

    default:
      // Default to current month if no period specified
      const defaultStartOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const defaultEndOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      return {
        type: 'month',
        startDate: defaultStartOfMonth,
        endDate: defaultEndOfMonth,
        granularity: 'day',
      }
  }
}
