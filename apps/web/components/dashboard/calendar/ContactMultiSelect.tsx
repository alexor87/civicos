'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Search } from 'lucide-react'

export interface LinkedContact {
  id: string
  first_name: string
  last_name: string
}

interface Props {
  value: LinkedContact[]
  onChange: (contacts: LinkedContact[]) => void
  campaignId: string
}

interface SearchResult {
  id: string
  first_name: string
  last_name: string
  phone: string | null
}

export function ContactMultiSelect({ value, onChange, campaignId }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showResults, setShowResults] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
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
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedIds = new Set(value.map(c => c.id))

  const selectContact = (contact: SearchResult) => {
    if (selectedIds.has(contact.id)) return
    onChange([...value, { id: contact.id, first_name: contact.first_name, last_name: contact.last_name }])
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  const removeContact = (contactId: string) => {
    onChange(value.filter(c => c.id !== contactId))
  }

  const filteredResults = results.filter(r => !selectedIds.has(r.id))

  return (
    <div ref={containerRef} className="relative">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {value.map(c => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium px-2 py-1 rounded-md"
            >
              {c.first_name} {c.last_name}
              <button
                type="button"
                onClick={() => removeContact(c.id)}
                className="hover:text-red-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => filteredResults.length > 0 && setShowResults(true)}
          placeholder="Buscar contacto por nombre…"
          className="w-full border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-primary/50 outline-none bg-white dark:bg-slate-800"
        />
      </div>

      {showResults && filteredResults.length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-hidden">
          {filteredResults.map(contact => (
            <button
              key={contact.id}
              type="button"
              onClick={() => selectContact(contact)}
              className="flex items-center justify-between w-full px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="font-medium text-slate-900 dark:text-white">
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
