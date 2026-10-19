import { useEffect, useState } from 'react'
import { BadgeCheck, Bot, Braces, Database, GitBranch, MessageSquare, Network, SquarePlus, SquareTerminal, type LucideIcon } from 'lucide-react'
import { createProject, getProjectStatus, type ProjectStatusData } from '../api/projects'
import { ChatInput } from '../components/ChatInput'
import { Header } from '../components/Header'
import { MessageList } from '../components/MessageList'

const history: [LucideIcon, string, string][] = [
  [MessageSquare, 'student_controller.py', '2m'],
  [GitBranch, 'Schema Migration AST', '1h'],
  [BadgeCheck, 'pytest unit fixtures', '1d'],
  [Braces, 'Pydantic v2 Contract', '3d'],
  [Network, 'Multi-agent swarm', '5d'],
]

function Sidebar({ project }: { project: ProjectStatusData | null }) {
  const activeAgent = project?.current_agent
  const agentLabel = activeAgent ? `${activeAgent.charAt(0).toUpperCase()}${activeAgent.slice(1)} Agent` : 'Orchestrator'
  const agentState = project?.status === 'failed' ? 'FAILED' : activeAgent ? 'RUNNING' : project?.status === 'completed' ? 'DONE' : 'IDLE'

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col bg-surface-container-lowest shadow-[8px_0_28px_rgba(0,0,0,0.2)] md:flex">
      <div className="flex h-14 items-center justify-between bg-surface-container-low px-4">
        <div className="flex items-center gap-1"><SquareTerminal className="size-5 text-primary" aria-hidden="true" /><span className="font-label text-[11px] font-semibold tracking-widest text-primary uppercase">APGF // CORE</span></div>
        <button className="icon-button" type="button" aria-label="Tạo phiên làm việc mới"><SquarePlus className="size-[18px]" aria-hidden="true" /></button>
      </div>
      <div className="px-4 py-3">
        <div className="mb-1 flex items-center justify-between"><span className="font-label text-[10px] text-on-surface-variant uppercase">Active Agent</span><span className={`size-2 rounded-full ${activeAgent ? 'animate-pulse bg-tertiary' : 'bg-outline'}`} /></div>
        <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-2">
          <div className="flex min-w-0 items-center gap-2"><Bot className="size-[18px] shrink-0 text-tertiary" aria-hidden="true" /><span className="truncate font-code text-xs text-on-surface">{agentLabel}</span></div>
          <span className="rounded bg-surface-container-high px-1.5 py-0.5 font-label text-[10px] font-semibold text-tertiary">{agentState}</span>
        </div>
      </div>
      <p className="px-4 pt-2 pb-1 font-label text-[10px] tracking-wider text-outline uppercase">Workspaces &amp; History</p>
      <nav className="flex-1 space-y-1 overflow-y-auto px-2" aria-label="Lịch sử làm việc">
        {history.map(([Icon, label, time], index) => (
          <a key={label} className={`flex items-center justify-between rounded-lg px-2 py-2 transition-colors ${index === 0 ? 'bg-surface-container-high text-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`} href={`#${label}`} aria-current={index === 0 ? 'page' : undefined}>
            <span className="flex min-w-0 items-center gap-2"><Icon className="size-4 shrink-0" aria-hidden="true" /><span className="truncate text-xs">{label}</span></span>
            <span className="ml-2 font-code text-[10px] text-outline">{time}</span>
          </a>
        ))}
      </nav>
      <div className="m-4 flex items-center justify-between rounded-lg bg-surface-container-low p-2">
        <span className="flex items-center gap-2 font-code text-xs text-on-surface"><Database className="size-4 text-secondary" aria-hidden="true" />Project state</span><span className="font-label text-[10px] text-secondary">{project?.status.toUpperCase() ?? 'READY'}</span>
      </div>
    </aside>
  )
}

export function ChatPage() {
  const [requirement, setRequirement] = useState<string | null>(null)
  const [project, setProject] = useState<ProjectStatusData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!project?.project_id || project.status === 'completed' || project.status === 'failed') return

    let cancelled = false
    let timer: number | undefined

    const poll = async () => {
      try {
        const nextProject = await getProjectStatus(project.project_id)
        if (cancelled) return
        setProject(nextProject)
        if (nextProject.error) setError(nextProject.error)
        if (nextProject.status === 'queued' || nextProject.status === 'running') {
          timer = window.setTimeout(() => void poll(), 1500)
        }
      } catch (requestError) {
        if (cancelled) return
        setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật trạng thái project.')
        timer = window.setTimeout(() => void poll(), 3000)
      }
    }

    timer = window.setTimeout(() => void poll(), 300)
    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [project?.project_id, project?.status])

  const submitRequirement = async (nextRequirement: string): Promise<boolean> => {
    setIsSending(true)
    setError(null)
    setRequirement(nextRequirement)
    setProject(null)

    try {
      const created = await createProject(nextRequirement)
      setProject({
        project_id: created.project_id,
        status: created.status,
        current_agent: null,
        steps: { planner: 'pending', coder: 'pending', tester: 'pending', reviewer: 'pending' },
        planner_result: null,
        error: null,
      })
      return true
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tạo project.')
      return false
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface text-sm text-on-surface">
      <Sidebar project={project} />
      <Header />
      <main className="min-h-screen min-w-0 overflow-x-hidden pt-14 md:pl-64 xl:pr-80"><div className="mx-auto w-full max-w-4xl px-4 py-6 lg:px-8"><MessageList requirement={requirement} project={project} error={error} /></div></main>
      <ChatInput isSending={isSending} onSubmit={submitRequirement} />
    </div>
  )
}
