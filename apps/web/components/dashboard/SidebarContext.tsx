'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

type SidebarContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <SidebarContext.Provider value={{ open, setOpen, toggle: () => setOpen(!open) }}>
      {children}
    </SidebarContext.Provider>
  )
}

const NOOP_VALUE: SidebarContextValue = {
  open: false,
  setOpen: () => {},
  toggle: () => {},
}

export function useSidebar() {
  return useContext(SidebarContext) ?? NOOP_VALUE
}
