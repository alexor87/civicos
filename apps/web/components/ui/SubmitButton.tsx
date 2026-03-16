'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'
import { Button } from './button'
import type { ComponentProps } from 'react'

type Props = ComponentProps<typeof Button>

export function SubmitButton({ children, className, ...props }: Props) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className={className} {...props}>
      {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  )
}
