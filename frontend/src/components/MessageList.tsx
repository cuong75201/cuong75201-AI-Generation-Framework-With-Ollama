import { Fragment } from 'react'
import { AlertCircle, Workflow } from 'lucide-react'
import type { AgentStatus as ApiAgentStatus, ProjectStatusData } from '../api/projects'
import { Message, type AgentStatus as MessageAgentStatus, type ChatMessage } from './Message'
import { PlannerResultView } from './PlannerResultView'

const agentLabels: Record<string, 'Planner' | 'Coder' | 'Tester' | 'Reviewer'> = {
  planner: 'Planner',
  coder: 'Coder',
  tester: 'Tester',
  reviewer: 'Reviewer',
}

const agentDescriptions: Record<string, string> = {
  planner: 'Phân tích yêu cầu, lựa chọn công nghệ và thiết kế đặc tả triển khai.',
  coder: 'Sinh source code dựa trên đặc tả đã được Planner hoàn thành.',
  tester: 'Kiểm tra hành vi, các trường hợp biên và độ tin cậy của source code.',
  reviewer: 'Rà soát chất lượng, bảo mật và mức độ đáp ứng yêu cầu ban đầu.',
}

function toMessageStatus(status: ApiAgentStatus): MessageAgentStatus {
  if (status === 'running') return 'active'
  return status
}

function statusText(status: ApiAgentStatus): string {
  return { pending: 'Chưa bắt đầu', running: 'Đang xử lý...', completed: 'Hoàn tất', failed: 'Thất bại' }[status]
}

interface MessageListProps {
  requirement: string | null
  project: ProjectStatusData | null
  error: string | null
}

export function MessageList({ requirement, project, error }: MessageListProps) {
  const welcome: ChatMessage = {
    id: 'welcome',
    kind: 'assistant',
    author: 'Orchestrator Core',
    meta: 'READY',
    content: 'Mô tả chương trình bạn muốn xây dựng. Planner sẽ phân tích yêu cầu và trình bày bản kế hoạch ngay tại đây.',
  }

  return (
    <section className="space-y-6 pb-52" aria-label="Nội dung hội thoại" aria-live="polite">
      <Message message={welcome} />
      {requirement && <Message message={{ id: 'requirement', kind: 'user', author: 'Bạn', meta: 'YÊU CẦU', content: requirement }} />}

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-error-container/45 px-4 py-3 text-red-100" role="alert">
          <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div><p className="font-medium">Không thể hoàn thành yêu cầu</p><p className="mt-1 text-sm text-red-100/80">{error}</p></div>
        </div>
      )}

      {project && (
        <div className="space-y-4 pt-1">
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2 text-primary"><Workflow className="size-[18px]" aria-hidden="true" /><h2 className="font-label text-[11px] font-semibold tracking-wider uppercase">Pipeline Execution</h2></div>
            <span className="font-code text-xs text-outline">{project.project_id.slice(0, 8)}</span>
          </div>

          {Object.entries(project.steps).map(([agent, status]) => {
            const label = agentLabels[agent]
            if (!label) return null
            const message: ChatMessage = {
              id: agent,
              kind: 'agent',
              agent: label,
              status: toMessageStatus(status),
              statusText: statusText(status),
              meta: project.current_agent === agent ? 'ACTIVE' : agent.toUpperCase(),
              content: agent === 'planner' && project.planner_result ? project.planner_result.description : agentDescriptions[agent],
            }

            return (
              <Fragment key={agent}>
                <Message message={message} />
                {agent === 'planner' && project.planner_result && <PlannerResultView planner={project.planner_result} />}
              </Fragment>
            )
          })}
        </div>
      )}
    </section>
  )
}
