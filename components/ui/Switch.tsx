'use client'

import { cn } from '@/lib/utils'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
}

export default function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      {label && <span className="text-sm font-medium text-gray-700">{label}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-primary' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute left-1 top-1 size-4 rounded-full bg-white transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </label>
  )
}
