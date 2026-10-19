import { useState, type KeyboardEvent } from 'react'
import { BadgeCheck, Check, Keyboard, LoaderCircle, LockKeyhole, Package, Paperclip, Send, type LucideIcon } from 'lucide-react'

const quickPrompts: { icon: LucideIcon; label: string; color: string }[] = [
  { icon: LockKeyhole, label: '+ JWT Auth guard', color: 'text-tertiary' },
  { icon: Package, label: 'Sinh Dockerfile', color: 'text-secondary' },
  { icon: BadgeCheck, label: 'pytest suite runner', color: 'text-primary' },
]

interface ChatInputProps {
  isSending: boolean
  onSubmit: (requirement: string) => Promise<boolean>
}

export function ChatInput({ isSending, onSubmit }: ChatInputProps) {
  const [prompt, setPrompt] = useState('')

  const sendPrompt = async () => {
    if (!prompt.trim() || isSending) return
    const sent = await onSubmit(prompt.trim())
    if (sent) setPrompt('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault()
      void sendPrompt()
    }
  }

  return (
    <div className="pointer-events-none fixed right-0 bottom-4 left-0 z-30 flex justify-center px-3 md:left-64 lg:px-8 xl:right-80">
      <div className="pointer-events-auto w-full max-w-4xl space-y-2">
        <div className="flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {quickPrompts.map(({ icon: Icon, label, color }) => (
            <button key={label} className="flex shrink-0 items-center gap-1 rounded-full bg-surface-container px-3 py-1.5 font-label text-[11px] font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high" type="button" onClick={() => setPrompt((current) => `${current}${current ? ' ' : ''}${label}`)}>
              <Icon className={`size-3.5 ${color}`} aria-hidden="true" />{label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 rounded-2xl bg-surface-container-low/95 p-2 shadow-[0_18px_48px_rgba(0,0,0,0.42)] backdrop-blur-xl">
          <div className="flex items-end gap-2">
            <button className="icon-button shrink-0" type="button" aria-label="Đính kèm tệp"><Paperclip className="size-5" aria-hidden="true" /></button>
            <textarea className="min-h-12 flex-1 resize-none bg-transparent px-2 py-1.5 leading-6 text-on-surface caret-primary outline-none placeholder:text-outline" value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={handleKeyDown} placeholder="Nhập yêu cầu về chương trình bạn muốn tạo..." rows={2} aria-label="Nội dung yêu cầu" />
            <div className="flex shrink-0 items-center gap-2">
              <span className="hidden items-center gap-1 rounded bg-surface-container px-2 py-1 font-label text-[10px] text-outline sm:flex"><Keyboard className="size-3.5" aria-hidden="true" />Ctrl + Enter</span>
              <button className="grid size-10 place-items-center rounded-xl bg-primary text-on-primary shadow-md transition-[background-color,transform] hover:bg-primary-container active:scale-95 disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => void sendPrompt()} disabled={!prompt.trim() || isSending} aria-label={isSending ? 'Đang gửi yêu cầu' : 'Gửi yêu cầu'}>
                {isSending ? <LoaderCircle className="size-5 animate-spin" aria-hidden="true" /> : <Send className="size-5" aria-hidden="true" />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 px-2 pb-1">
            <div className="flex items-center gap-4 font-code text-xs text-outline"><span className="flex items-center gap-1"><Check className="size-3.5 text-tertiary" aria-hidden="true" />Context Ready</span><span className="hidden sm:inline">Model: Ollama</span></div>
            <span className="hidden font-label text-[10px] text-outline sm:inline">APGF // AUTO-ORCHESTRATION</span>
          </div>
        </div>
      </div>
    </div>
  )
}
