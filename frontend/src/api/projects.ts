export type ProjectStatus = 'queued' | 'running' | 'completed' | 'failed'
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ApiSpec {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  description: string
}

export interface PlannerResult {
  project_name: string
  description: string
  technologies: string[]
  features: string[]
  database: string | null
  apis: ApiSpec[]
  project_structure: string[]
}

export interface ProjectStatusData {
  project_id: string
  status: ProjectStatus
  current_agent: string | null
  steps: Record<string, AgentStatus>
  planner_result: PlannerResult | null
  error: string | null
}

interface ProjectCreateData {
  project_id: string
  status: ProjectStatus
  message: string
  created_at: string
}

interface ApiResponse<T> {
  status: boolean
  message: string
  data: T | null
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  const payload = await response.json() as ApiResponse<T>

  if (!response.ok || !payload.status || payload.data === null) {
    throw new Error(payload.message || 'Không thể kết nối với máy chủ.')
  }

  return payload.data
}

export function createProject(requirement: string): Promise<ProjectCreateData> {
  return apiRequest<ProjectCreateData>('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requirement }),
  })
}

export function getProjectStatus(projectId: string): Promise<ProjectStatusData> {
  return apiRequest<ProjectStatusData>(`/api/projects/${encodeURIComponent(projectId)}`)
}
