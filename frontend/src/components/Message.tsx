import { useState } from 'react'
import { Bot, Check, CircleCheck, CircleDashed, CircleX, Copy, Hourglass, RefreshCw, UserRound, type LucideIcon } from 'lucide-react'

export type AgentStatus = 'completed' | 'active' | 'queued' | 'pending' | 'failed'
export type ChatMessage =
  | { id: string; kind: 'assistant'; author: string; meta: string; content: string; tags?: string[] }
  | { id: string; kind: 'user'; author: string; meta: string; content: string; tags?: string[] }
  | { id: string; kind: 'agent'; agent: 'Planner' | 'Coder' | 'Tester' | 'Reviewer'; status: AgentStatus; statusText: string; meta: string; content: string; code?: string }

const statusStyles: Record<AgentStatus, string> = { completed: 'text-tertiary', active: 'text-primary', queued: 'text-secondary', pending: 'text-outline', failed: 'text-red-300' }
const statusIcons: Record<AgentStatus, LucideIcon> = { completed: CircleCheck, active: RefreshCw, queued: Hourglass, pending: CircleDashed, failed: CircleX }

function CodePreview({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  const copyCode = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-inner">
      <div className="flex items-center justify-between bg-surface-container-low px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="size-2.5 rounded-full bg-error-container" /><div className="size-2.5 rounded-full bg-surface-container-high" /><div className="size-2.5 rounded-full bg-tertiary-container" />
          <span className="ml-1 truncate font-code text-xs text-on-surface-variant">app/routers/students.py</span>
        </div>
        <button className="ml-4 flex items-center gap-1 rounded bg-surface-container-high px-2 py-1 font-label text-[10px] text-on-surface transition-colors hover:bg-surface-container-highest" type="button" onClick={copyCode}>
          {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}{copied ? 'ĐÃ CHÉP' : 'SAO CHÉP'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-left font-code text-[13px] leading-[1.7] text-on-surface-variant"><code>{code}</code></pre>
    </div>
  )
}

export function Message({ message }: { message: ChatMessage }) {
  if (message.kind === 'user') return (
    <article className="flex items-start justify-end gap-3 sm:gap-4">
      <div className="flex min-w-0 max-w-2xl flex-1 flex-col items-end gap-1">
        <div className="flex items-center gap-2"><span className="font-label text-[11px] font-semibold text-outline uppercase">{message.author}</span><time className="font-code text-xs text-on-surface-variant">{message.meta}</time></div>
        <div className="w-full rounded-2xl bg-surface-container p-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)]">
          <p className="leading-6 text-on-surface">{message.content}</p>
          {message.tags && <div className="mt-3 flex flex-wrap gap-1.5 border-t border-outline-variant/50 pt-2">{message.tags.map((tag) => <span key={tag} className="rounded bg-surface-container-high px-2 py-0.5 font-label text-[11px] font-semibold text-secondary">{tag}</span>)}</div>}
        </div>
      </div>
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-on-primary shadow-md"><UserRound className="size-5" aria-hidden="true" /></div>
    </article>
  )

  if (message.kind === 'assistant') return (
    <article className="flex items-start gap-3 sm:gap-4">
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-surface-container-high text-primary shadow-md"><Bot className="size-5" aria-hidden="true" /></div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2"><span className="font-label text-[11px] font-semibold text-primary uppercase">{message.author}</span><span className="font-code text-xs text-outline">{message.meta}</span><span className="rounded bg-surface-container-high px-1.5 py-0.5 font-label text-[10px] font-semibold text-tertiary">ACTIVE</span></div>
        <p className="max-w-[72ch] rounded-2xl bg-surface-container-low p-4 leading-6 text-on-surface shadow-sm">{message.content}</p>
      </div>
    </article>
  )

  const statusClass = statusStyles[message.status]
  const isActive = message.status === 'active'
  const StatusIcon = statusIcons[message.status]
  return (
    <article className={`relative overflow-hidden rounded-2xl bg-surface-container-low p-4 shadow-sm transition-colors hover:bg-surface-container ${message.status === 'pending' ? 'opacity-75' : ''}`}>
      {isActive && <div className="absolute inset-x-0 top-0 h-0.5 bg-primary" />}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded bg-surface-container-high px-2 py-0.5 font-label text-[11px] font-semibold uppercase ${statusClass}`}>{message.agent}</span>
          <span className={`flex items-center gap-1 font-code text-xs ${statusClass} ${isActive ? 'animate-pulse' : ''}`}><StatusIcon className="size-[15px]" aria-hidden="true" />{message.statusText}</span>
        </div>
        <span className="font-code text-xs text-outline">{message.meta}</span>
      </div>
      <p className="max-w-[72ch] leading-6 text-on-surface">{message.content}</p>
      {message.code && <div className="mt-3"><CodePreview code={message.code} /></div>}
    </article>
  )
}
