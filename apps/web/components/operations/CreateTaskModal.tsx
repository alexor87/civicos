'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Target, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Popover, PopoverTrigger, PopoverContent,
} from '@/components/ui/popover'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import { toast } from 'sonner'

type Mission = { id: string; name: string }
type Member = { id: string; full_name: string }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
  missions: Mission[]
  members: Member[]
  defaultMissionId?: string | null
}

const PRIORITIES = [
  { value: 'low', label: 'Baja', color: 'bg-slate-400' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-500' },
  { value: 'high', label: 'Alta', color: 'bg-orange-500' },
  { value: 'urgent', label: 'Urgente', color: 'bg-red-500' },
]

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function CreateTaskModal({ open, onOpenChange, campaignId, missions, members, defaultMissionId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [missionId, setMissionId] = useState(defaultMissionId ?? '')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [dueDate, setDueDate] = useState('')
  const [missionOpen, setMissionOpen] = useState(false)
  const [assigneeOpen, setAssigneeOpen] = useState(false)

  const selectedMission = missions.find(m => m.id === missionId)
  const selectedAssignee = members.find(m => m.id === assigneeId)
  const selectedPriority = PRIORITIES.find(p => p.value === priority)

  function reset() {
    setTitle('')
    setDescription('')
    setMissionId(defaultMissionId ?? '')
    setAssigneeId('')
    setPriority('normal')
    setDueDate('')
  }

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('El título es obligatorio')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/operations/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaign_id: campaignId,
          title: title.trim(),
          description: description.trim() || null,
          mission_id: missionId || null,
          assignee_id: assigneeId || null,
          priority,
          due_date: dueDate || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? 'Error al crear tarea')
        return
      }
      toast.success('Tarea creada')
      reset()
      onOpenChange(false)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Nueva tarea</DialogTitle>
          <DialogDescription>Crea una tarea y asígnala a un miembro del equipo</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Título *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Preparar lista de voluntarios" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Descripción</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Detalla qué se debe hacer..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Misión</Label>
              <Popover open={missionOpen} onOpenChange={setMissionOpen}>
                <PopoverTrigger
                  className={cn(
                    'flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors hover:bg-accent/50',
                    !selectedMission && 'text-muted-foreground'
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {selectedMission ? (
                      <>
                        <Target className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                        <span className="truncate text-foreground">{selectedMission.name}</span>
                      </>
                    ) : (
                      'Sin misión'
                    )}
                  </span>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start" sideOffset={4}>
                  <Command>
                    <CommandInput placeholder="Buscar misión..." />
                    <CommandList>
                      <CommandEmpty>No se encontró.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__none__"
                          onSelect={() => { setMissionId(''); setMissionOpen(false) }}
                        >
                          <span className="text-muted-foreground">Sin misión</span>
                        </CommandItem>
                        {missions.map(m => (
                          <CommandItem
                            key={m.id}
                            value={m.name}
                            onSelect={() => { setMissionId(m.id); setMissionOpen(false) }}
                          >
                            <Target className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                            {m.name}
                            <Check className={cn('ml-auto h-4 w-4', missionId === m.id ? 'opacity-100' : 'opacity-0')} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Responsable</Label>
              <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                <PopoverTrigger
                  className={cn(
                    'flex h-8 w-full items-center justify-between rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors hover:bg-accent/50',
                    !selectedAssignee && 'text-muted-foreground'
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    {selectedAssignee ? (
                      <>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
                          {getInitials(selectedAssignee.full_name)}
                        </span>
                        <span className="truncate text-foreground">{selectedAssignee.full_name}</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3.5 w-3.5 shrink-0" />
                        Sin asignar
                      </>
                    )}
                  </span>
                  <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start" sideOffset={4}>
                  <Command>
                    <CommandInput placeholder="Buscar miembro..." />
                    <CommandList>
                      <CommandEmpty>No se encontró.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="__none__"
                          onSelect={() => { setAssigneeId(''); setAssigneeOpen(false) }}
                        >
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">Sin asignar</span>
                        </CommandItem>
                        {members.map(m => (
                          <CommandItem
                            key={m.id}
                            value={m.full_name}
                            onSelect={() => { setAssigneeId(m.id); setAssigneeOpen(false) }}
                          >
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-semibold text-blue-700">
                              {getInitials(m.full_name)}
                            </span>
                            {m.full_name}
                            <Check className={cn('ml-auto h-4 w-4', assigneeId === m.id ? 'opacity-100' : 'opacity-0')} />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Prioridad</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {selectedPriority && (
                      <span className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', selectedPriority.color)} />
                        {selectedPriority.label}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span className={cn('h-2 w-2 rounded-full', p.color)} />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-slate-700">Fecha límite</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear tarea'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
