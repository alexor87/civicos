'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  campaignId: string
}

export function ContactEntryModal({ open, onOpenChange }: Props) {
  const router = useRouter()

  useEffect(() => {
    if (open) {
      onOpenChange(false)
      router.push('/dashboard/contacts/new')
    }
  }, [open])

  return null
}
