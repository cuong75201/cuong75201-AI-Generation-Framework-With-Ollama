import { Bell, SlidersHorizontal, UserRound } from 'lucide-react'

export function Header() {
  return (
    <header className="fixed top-0 right-0 left-0 z-40 h-14 bg-surface-container-low/95 shadow-[0_8px_24px_rgba(0,0,0,0.18)] backdrop-blur-xl md:left-64">
      <div className="flex h-full items-center justify-between gap-4 px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <span className="truncate font-headline text-lg font-semibold tracking-tight text-on-surface sm:text-xl">AI Program Generation Framework</span>
          <div className="hidden h-4 w-px bg-outline-variant xl:block" />
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button className="icon-button" type="button" aria-label="Cài đặt"><SlidersHorizontal className="size-5" aria-hidden="true" /></button>
          <button className="icon-button hidden sm:grid" type="button" aria-label="Thông báo"><Bell className="size-5" aria-hidden="true" /></button>
          <div className="grid size-8 place-items-center rounded-full bg-primary text-on-primary" aria-label="Tài khoản người dùng"><UserRound className="size-4.5" aria-hidden="true" /></div>
        </div>
      </div>
    </header>
  )
}
