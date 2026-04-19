'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X, User } from 'lucide-react'

interface Contact {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface Props {
  campaignId: string
  selectedIds: string[]
  selectedContacts: Contact[]
  onChange: (ids: string[], contacts: Contact[]) => void
}

export function ContactPicker({ campaignId, selectedIds, selectedContacts, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Contact[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (!q.trim() || !campaignId) {
      setResults([])
      return
    }
    setIsSearching(true)
    try {
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(q)}&campaign_id=${campaignId}`)
      const data = await res.json()
      // Only show contacts that have email and aren't already selected
      const filtered = (data.results ?? []).filter(
        (c: Contact) => c.email && !selectedIds.includes(c.id)
      )
      setResults(filtered)
    } catch {
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }, [campaignId, selectedIds])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, search])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function addContact(contact: Contact) {
    onChange([...selectedIds, contact.id], [...selectedContacts, contact])
    setQuery('')
    setResults([])
  }

  function removeContact(id: string) {
    onChange(
      selectedIds.filter(cid => cid !== id),
      selectedContacts.filter(c => c.id !== id),
    )
  }

  const displayName = (c: Contact) =>
    [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || 'Sin nombre'

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Buscar por nombre o email..."
          className="pl-7 text-xs h-8"
        />
      </div>

      {/* Search results dropdown */}
      {showDropdown && (query.trim() || isSearching) && (
        <div className="border rounded-md bg-background shadow-md max-h-40 overflow-y-auto">
          {isSearching ? (
            <p className="text-xs text-muted-foreground px-3 py-2">Buscando...</p>
          ) : results.length === 0 && query.trim() ? (
            <p className="text-xs text-muted-foreground px-3 py-2">No se encontraron contactos</p>
          ) : (
            results.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => addContact(c)}
                className="w-full text-left px-3 py-1.5 hover:bg-muted/50 flex items-center gap-2 transition-colors"
              >
                <User className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium truncate block">{displayName(c)}</span>
                  {c.email && <span className="text-[10px] text-muted-foreground truncate block">{c.email}</span>}
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected contacts as chips */}
      {selectedContacts.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedContacts.map(c => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 bg-muted text-xs px-2 py-0.5 rounded-full max-w-full"
            >
              <span className="truncate max-w-[120px]">{displayName(c)}</span>
              <button
                type="button"
                onClick={() => removeContact(c.id)}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
