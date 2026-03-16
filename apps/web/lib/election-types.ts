export type ElectionScope = 'municipal' | 'departamental' | 'nacional' | 'local'

export interface ElectionType {
  value: string
  label: string
  scope: ElectionScope
}

export const COLOMBIA_ELECTION_TYPES: ElectionType[] = [
  { value: 'alcalde',       label: 'Alcalde Municipal',                 scope: 'municipal'     },
  { value: 'concejal',      label: 'Concejal Municipal',                scope: 'municipal'     },
  { value: 'personero',     label: 'Personero Municipal',               scope: 'municipal'     },
  { value: 'edil',          label: 'Edil — Junta Administradora Local', scope: 'local'         },
  { value: 'gobernador',    label: 'Gobernador Departamental',          scope: 'departamental' },
  { value: 'diputado',      label: 'Diputado a la Asamblea',            scope: 'departamental' },
  { value: 'representante', label: 'Representante a la Cámara',         scope: 'nacional'      },
  { value: 'senador',       label: 'Senador de la República',           scope: 'nacional'      },
  { value: 'presidente',    label: 'Presidente de la República',        scope: 'nacional'      },
]

/** Given an election_type value, returns its scope level */
export function getElectionScope(electionType: string | null | undefined): ElectionScope | null {
  if (!electionType) return null
  return COLOMBIA_ELECTION_TYPES.find(t => t.value === electionType)?.scope ?? null
}
