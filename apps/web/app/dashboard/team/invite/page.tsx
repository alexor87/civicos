import { redirect } from 'next/navigation'

export default function InviteRedirect() {
  redirect('/dashboard/settings/team')
}
