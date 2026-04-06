'use client'

import DOMPurify from 'isomorphic-dompurify'

interface EmailPreviewProps {
  subject: string
  bodyHtml: string
}

export function EmailPreview({ subject, bodyHtml }: EmailPreviewProps) {
  return (
    <div className="shadow-xl rounded-md overflow-hidden max-w-[680px]">
      {/* Inbox bar */}
      <div className="bg-white border border-[#dcdee6] rounded-t-md px-4 py-3 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-[#2960ec] flex items-center justify-center shrink-0">
          <span className="text-white text-xs font-bold">C</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#1b1f23]">Scrutix Campaña</span>
          </div>
          <p className="text-xs text-[#6a737d] truncate">{subject}</p>
        </div>
      </div>
      {/* Email body — sanitized client-side to prevent XSS */}
      <div
        className="bg-white"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(bodyHtml) }}
      />
    </div>
  )
}
