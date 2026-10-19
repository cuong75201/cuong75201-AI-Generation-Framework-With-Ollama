import { Braces, Database, FolderTree, Layers3, Route } from 'lucide-react'
import type { PlannerResult } from '../api/projects'

const methodStyles: Record<string, string> = {
  GET: 'text-secondary',
  POST: 'text-tertiary',
  PUT: 'text-primary',
  PATCH: 'text-primary',
  DELETE: 'text-red-300',
}

export function PlannerResultView({ planner }: { planner: PlannerResult }) {
  return (
    <article className="overflow-hidden rounded-2xl bg-surface-container-low shadow-[0_16px_40px_rgba(0,0,0,0.22)]" aria-labelledby="planner-result-title">
      <header className="bg-surface-container px-5 py-5 sm:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="planner-result-title" className="font-headline text-xl font-semibold tracking-tight text-on-surface sm:text-2xl">{planner.project_name}</h2>
            <p className="mt-2 max-w-[72ch] leading-6 text-on-surface-variant">{planner.description}</p>
          </div>
          <span className="shrink-0 rounded-md bg-tertiary-container px-2 py-1 font-label text-[10px] font-semibold tracking-wide text-on-surface uppercase">Plan ready</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {planner.technologies.map((technology) => <span key={technology} className="rounded-md bg-surface-container-high px-2.5 py-1 font-code text-xs text-secondary">{technology}</span>)}
        </div>
      </header>

      <div className="grid gap-7 px-5 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
        <div className="space-y-7">
          <section aria-labelledby="features-title">
            <div className="mb-3 flex items-center gap-2 text-primary"><Layers3 className="size-4" aria-hidden="true" /><h3 id="features-title" className="font-label text-xs font-semibold tracking-wide uppercase">Tính năng</h3></div>
            <ul className="space-y-2 text-on-surface-variant">
              {planner.features.map((feature) => <li key={feature} className="flex gap-3 leading-6"><span className="mt-[0.65rem] size-1.5 shrink-0 rounded-full bg-primary" />{feature}</li>)}
            </ul>
          </section>

          <section aria-labelledby="apis-title">
            <div className="mb-3 flex items-center gap-2 text-secondary"><Route className="size-4" aria-hidden="true" /><h3 id="apis-title" className="font-label text-xs font-semibold tracking-wide uppercase">API dự kiến</h3></div>
            {planner.apis.length > 0 ? (
              <div className="overflow-x-auto rounded-xl bg-surface-container-lowest">
                <table className="w-full min-w-[34rem] border-collapse text-left">
                  <thead><tr className="text-outline"><th className="px-4 py-3 font-label text-[10px] tracking-wide uppercase">Method</th><th className="px-4 py-3 font-label text-[10px] tracking-wide uppercase">Endpoint</th><th className="px-4 py-3 font-label text-[10px] tracking-wide uppercase">Mục đích</th></tr></thead>
                  <tbody>{planner.apis.map((api) => (
                    <tr key={`${api.method}-${api.path}`} className="border-t border-outline-variant/40">
                      <td className={`px-4 py-3 font-code text-xs font-semibold ${methodStyles[api.method] ?? 'text-on-surface'}`}>{api.method}</td>
                      <td className="px-4 py-3 font-code text-xs text-on-surface">{api.path}</td>
                      <td className="px-4 py-3 text-xs leading-5 text-on-surface-variant">{api.description}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ) : <p className="text-sm text-outline">Planner không đề xuất API cho project này.</p>}
          </section>
        </div>

        <div className="space-y-7 lg:border-l lg:border-outline-variant/40 lg:pl-7">
          <section aria-labelledby="database-title">
            <div className="mb-3 flex items-center gap-2 text-tertiary"><Database className="size-4" aria-hidden="true" /><h3 id="database-title" className="font-label text-xs font-semibold tracking-wide uppercase">Database</h3></div>
            <p className="font-code text-sm text-on-surface">{planner.database ?? 'Không cần database'}</p>
          </section>

          <section aria-labelledby="structure-title">
            <div className="mb-3 flex items-center gap-2 text-primary"><FolderTree className="size-4" aria-hidden="true" /><h3 id="structure-title" className="font-label text-xs font-semibold tracking-wide uppercase">Cấu trúc project</h3></div>
            <ul className="overflow-hidden rounded-xl bg-surface-container-lowest py-2 font-code text-xs text-on-surface-variant">
              {planner.project_structure.map((path) => <li key={path} className="flex items-start gap-2 px-3 py-1.5"><Braces className="mt-0.5 size-3.5 shrink-0 text-outline" aria-hidden="true" /><span className="break-all">{path}</span></li>)}
            </ul>
          </section>
        </div>
      </div>
    </article>
  )
}
