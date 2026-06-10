import type { Team } from '../types'

export function Flag({ code, className = 'h-3.5 w-5' }: { code: string; className?: string }) {
  return (
    <img
      src={`https://flagcdn.com/${code}.svg`}
      alt=""
      loading="lazy"
      className={`${className} shrink-0 rounded-[2px] object-cover ring-1 ring-black/10`}
    />
  )
}

export function TeamLabel({ team, dim = false }: { team: Team; dim?: boolean }) {
  return (
    <span className={`flex min-w-0 items-center gap-2.5 ${dim ? 'opacity-40' : ''}`}>
      <Flag code={team.flag} />
      <span className="truncate text-sm font-medium">{team.name}</span>
    </span>
  )
}

export function SectionHint({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 max-w-2xl text-sm leading-relaxed text-neutral-500">{children}</p>
}
