'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-full h-10 px-3 py-2 text-left bg-white border border-slate-200 rounded-md flex items-center justify-between hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
      >
        <span className="text-sm">{value}</span>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {children}
          </div>
        </>
      )}
    </div>
  )
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div className="py-1">{children}</div>
}

export function SelectItem({ value, children, onClick }: { value: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={() => {
        onClick?.()
      }}
      className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 focus:outline-none focus:bg-slate-50"
    >
      {children}
    </button>
  )
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function SelectValue() {
  return null
}
