import { GROUP_IDS, TEAM_BY_ID } from '../data'
import { sanitize } from '../bracket'
import type { Picks } from '../types'
import { Flag, SectionHint } from './ui'

interface Props {
  picks: Picks
  onChange?: (p: Picks) => void
}

export default function ThirdsView({ picks, onChange }: Props) {
  const readonly = !onChange
  const remaining = GROUP_IDS.filter((g) => (picks.groupRanks[g]?.length ?? 0) < 3)

  if (remaining.length > 0) {
    return (
      <div className="rise border border-neutral-200 bg-white p-10 text-center">
        <p className="text-lg font-bold text-neutral-900">Finish your groups first</p>
        <p className="mt-2 text-sm text-neutral-500">
          The third-place race needs a 3rd in every group — {remaining.length} group
          {remaining.length > 1 ? 's' : ''} to go ({remaining.join(', ')}).
        </p>
      </div>
    )
  }

  const toggle = (teamId: string) => {
    if (readonly) return
    const has = picks.thirds.includes(teamId)
    if (!has && picks.thirds.length >= 8) return
    const thirds = has ? picks.thirds.filter((t) => t !== teamId) : [...picks.thirds, teamId]
    onChange(sanitize({ ...picks, thirds }))
  }

  return (
    <div className="rise">
      {!readonly && (
        <SectionHint>
          Only 8 of the 12 third-place sides survive the group stage. Pick your lucky eight.
        </SectionHint>
      )}
      <div className="mb-5 inline-flex items-baseline gap-2 border-b-2 border-neutral-900 pb-1">
        <span className="text-2xl font-black text-neutral-900">{picks.thirds.length} / 8</span>
        <span className="text-sm text-neutral-500">advancing</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {GROUP_IDS.map((g) => {
          const team = TEAM_BY_ID.get(picks.groupRanks[g]![2])!
          const selected = picks.thirds.includes(team.id)
          const full = !selected && picks.thirds.length >= 8
          return (
            <button
              key={g}
              onClick={() => toggle(team.id)}
              disabled={readonly}
              className={`flex items-center justify-between gap-2 border px-4 py-3 text-left transition-all ${
                selected
                  ? 'border-neutral-900 bg-neutral-900 text-white'
                  : 'border-neutral-200 bg-white text-neutral-900'
              } ${readonly ? '' : 'cursor-pointer'} ${
                full ? 'opacity-30' : readonly || selected ? '' : 'hover:border-neutral-400'
              }`}
            >
              <div className="min-w-0">
                <span
                  className={`block text-[10px] font-bold tracking-[0.15em] ${
                    selected ? 'text-neutral-400' : 'text-neutral-400'
                  }`}
                >
                  3RD · GROUP {g}
                </span>
                <span className="mt-1 flex min-w-0 items-center gap-2.5">
                  <Flag code={team.flag} />
                  <span className="truncate text-sm font-medium">{team.name}</span>
                </span>
              </div>
              <span
                className={`shrink-0 text-base font-bold ${
                  selected ? 'text-white' : 'text-neutral-200'
                }`}
              >
                {selected ? '✓' : '○'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
