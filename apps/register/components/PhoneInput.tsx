'use client'

import { useState } from 'react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

export function PhoneInput({ value, onChange, error, required }: PhoneInputProps) {
  const [focused, setFocused] = useState(false)

  const handleChange = (raw: string) => {
    // Only allow digits
    const digits = raw.replace(/\D/g, '')
    // Limit to 10 digits (Colombian mobile without country code)
    onChange(digits.slice(0, 10))
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Celular {required && <span className="text-red-500">*</span>}
      </label>
      <div
        className={`flex items-center border rounded-lg overflow-hidden transition-colors ${
          error
            ? 'border-red-400'
            : focused
            ? 'border-blue-500 ring-2 ring-blue-500/20'
            : 'border-slate-300'
        }`}
      >
        <span className="px-3 py-2.5 bg-slate-50 text-slate-500 text-sm border-r border-slate-300">
          +57
        </span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="300 123 4567"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
          required={required}
        />
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  )
}
