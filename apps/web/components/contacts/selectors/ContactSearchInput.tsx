'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'

interface ContactResult {
  id: string
  first_name: string
  last_name: string
  phone: string | null
}

interface Props {
  value: string
  onChange: (value: string) => void
  campaignId: string
  placeholder?: string
}

export function ContactSearchInput({ value, onChange, campaignId, placeholder = 'Buscar contacto...' }: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<ContactResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    try {
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(q)}&campaign_id=${encodeURIComponent(campaignId)}`)
      const data = await res.json()
      setResults(data.results ?? [])
      setShowResults(true)
    } catch {
      setResults([])
    }
  }, [campaignId])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectContact = (contact: ContactResult) => {
    const fullName = `${contact.first_name} ${contact.last_name}`
    setQuery(fullName)
    onChange(fullName)
    setShowResults(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
        }}
        onFocus={() => results.length > 0 && setShowResults(true)}
        placeholder={placeholder}
        aria-label="Buscar contacto"
      />
      {showResults && results.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden">
          {results.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => selectContact(contact)}
              className="flex items-center justify-between w-full px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
            >
              <span className="font-medium text-slate-900">
                {contact.first_name} {contact.last_name}
              </span>
              {contact.phone && (
                <span className="text-xs text-slate-400">{contact.phone}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
