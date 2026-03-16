'use client'

interface Props {
  value: string
}

const SMS_SINGLE = 160
const SMS_DOUBLE = 306

export function SmsCharCounter({ value }: Props) {
  const len      = value.length
  const segments = len <= SMS_SINGLE ? 1 : len <= SMS_DOUBLE ? 2 : Math.ceil(len / 153)
  const color    = len <= SMS_SINGLE
    ? 'text-green-600'
    : len <= SMS_DOUBLE
      ? 'text-yellow-600'
      : 'text-red-600'

  return (
    <p className={`text-xs mt-1 ${color}`}>
      {len} caracteres · {segments} SMS
      {len > SMS_DOUBLE && <span className="ml-1 font-medium">(fragmentado — mayor costo)</span>}
    </p>
  )
}
