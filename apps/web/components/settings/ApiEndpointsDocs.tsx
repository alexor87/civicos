'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Endpoint {
  method: 'GET' | 'POST'
  path: string
  description: string
  scope: string
  request?: string
  response: string
}

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/public/contacts',
    description: 'Lista de contactos',
    scope: 'contacts:read',
    response: `{
  "contacts": [
    {
      "id": "uuid",
      "full_name": "María López",
      "phone": "+573001234567",
      "email": "maria@ejemplo.com",
      "tags": ["voluntario", "zona-norte"]
    }
  ],
  "total": 142
}`,
  },
  {
    method: 'POST',
    path: '/api/public/contacts',
    description: 'Crear contacto',
    scope: 'contacts:write',
    request: `{
  "full_name": "Carlos Ruiz",
  "phone": "+573009876543",
  "email": "carlos@ejemplo.com",
  "tags": ["evento-marzo"]
}`,
    response: `{
  "id": "uuid",
  "full_name": "Carlos Ruiz",
  "created_at": "2026-03-26T10:00:00Z"
}`,
  },
  {
    method: 'GET',
    path: '/api/public/campaigns/:id',
    description: 'Info de la campaña',
    scope: 'campaigns:read',
    response: `{
  "id": "uuid",
  "name": "Campaña Alcaldía 2026",
  "election_type": "alcaldia",
  "election_date": "2026-10-29",
  "territory": "Bogotá D.C."
}`,
  },
]

const METHOD_STYLES: Record<string, string> = {
  GET:  'bg-green-100 text-green-700',
  POST: 'bg-blue-100 text-blue-700',
}

export function ApiEndpointsDocs() {
  const [expanded, setExpanded] = useState<number | null>(null)

  return (
    <div className="rounded-lg border border-[#dcdee6] bg-gray-50 p-4 space-y-2">
      <p className="text-xs font-semibold text-[#6a737d] tracking-normal">Endpoints disponibles</p>
      <div className="space-y-1">
        {ENDPOINTS.map((ep, i) => (
          <div key={ep.path + ep.method}>
            <button
              type="button"
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center gap-2 py-1.5 text-left hover:bg-gray-100 rounded px-1 -mx-1 transition-colors"
              aria-expanded={expanded === i}
              aria-label={`${ep.method} ${ep.path}`}
            >
              <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${METHOD_STYLES[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-xs text-[#1b1f23]">{ep.path}</code>
              <span className="text-xs text-[#6a737d]">— {ep.description} (scope: {ep.scope})</span>
              <ChevronDown className={`h-3.5 w-3.5 ml-auto text-slate-400 transition-transform ${expanded === i ? 'rotate-180' : ''}`} />
            </button>
            {expanded === i && (
              <div className="ml-1 mt-1 mb-2 space-y-2 text-xs">
                {ep.request && (
                  <div>
                    <p className="font-semibold text-[#6a737d] mb-1">Request body</p>
                    <pre className="bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto">{ep.request}</pre>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-[#6a737d] mb-1">Response</p>
                  <pre className="bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto">{ep.response}</pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
