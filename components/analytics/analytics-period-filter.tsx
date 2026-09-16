'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui-select'
import type { PeriodType } from '@/types/analytics.types'

interface AnalyticsPeriodFilterProps {
  onPeriodChange: (period: PeriodType, startDate?: string, endDate?: string) => void
  defaultPeriod?: PeriodType
}

const periodLabels: Record<PeriodType, string> = {
  today: "Aujourd'hui",
  '7d': '7 derniers jours',
  '30d': '30 derniers jours',
  month: 'Ce mois',
  year: 'Cette année',
  custom: 'Personnalisée',
}

export function AnalyticsPeriodFilter({ onPeriodChange, defaultPeriod = 'month' }: AnalyticsPeriodFilterProps) {
  const [period, setPeriod] = useState<PeriodType>(defaultPeriod)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [customDateError, setCustomDateError] = useState('')

  const handlePeriodChange = (newPeriod: PeriodType) => {
    setPeriod(newPeriod)
    setCustomDateError('')

    if (newPeriod === 'custom') {
      // Keep custom dates, don't trigger change yet
      return
    }

    onPeriodChange(newPeriod)
  }

  const handleCustomDateSubmit = () => {
    setCustomDateError('')

    if (!customStartDate || !customEndDate) {
      setCustomDateError('Les dates de début et de fin sont requises')
      return
    }

    const start = new Date(customStartDate)
    const end = new Date(customEndDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setCustomDateError('Dates invalides')
      return
    }

    if (start > end) {
      setCustomDateError('La date de début doit être antérieure à la date de fin')
      return
    }

    onPeriodChange('custom', customStartDate, customEndDate)
  }

  const handleCustomDateCancel = () => {
    setCustomStartDate('')
    setCustomEndDate('')
    setCustomDateError('')
    setPeriod('month')
    onPeriodChange('month')
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 flex-1">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">Période :</span>
        </div>

        {period === 'custom' ? (
          <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-1">
            <div className="flex-1">
              <label htmlFor="startDate" className="text-xs text-slate-500 block mb-1">Début</label>
              <input
                id="startDate"
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="endDate" className="text-xs text-slate-500 block mb-1">Fin</label>
              <input
                id="endDate"
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <div className="flex gap-2 mt-4 sm:mt-5">
              <button
                onClick={handleCustomDateSubmit}
                className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Appliquer
              </button>
              <button
                onClick={handleCustomDateCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1">
            <Select
              value={periodLabels[period]}
              onValueChange={(value) => {
                const periodKey = Object.keys(periodLabels).find(key => periodLabels[key as PeriodType] === value) as PeriodType
                if (periodKey) {
                  handlePeriodChange(periodKey)
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(periodLabels).map(([key, label]) => (
                  <SelectItem
                    key={key}
                    value={label}
                    onClick={() => handlePeriodChange(key as PeriodType)}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {customDateError && (
        <p className="text-sm text-red-600 mt-2">{customDateError}</p>
      )}
    </div>
  )
}
