import { GROUP_IDS, teamsInGroup } from '../data'
import { sanitize } from '../bracket'
import type { GroupId, Picks } from '../types'
import { SectionHint, TeamLabel } from './ui'

const RANK_STYLE = [
  'bg-neutral-900 text-white',
  'bg-neutral-900 text-white',
  'border border-neutral-400 text-neutral-700',
  'text-neutral-300',
]
const RANK_LABEL = ['1st', '2nd', '3rd', '4th']

interface Props {
  picks: Picks
  onChange?: (p: Picks) => void
}

export default function GroupsView({ picks, onChange }: Props) {
  const readonly = !onChange

  const tap = (g: GroupId, teamId: string) => {
    if (readonly) return
    const order = picks.groupRanks[g] ?? []
    const idx = order.indexOf(teamId)
    let next: string[]
    if (idx >= 0) {
      next = order.slice(0, idx)
    } else {
      next = [...order, teamId]
      if (next.length === 3) {
        const last = teamsInGroup(g).find((t) => !next.includes(t.id))
        if (last) next = [...next, last.id]
      }
    }
    onChange(sanitize({ ...picks, groupRanks: { ...picks.groupRanks, [g]: next } }))
  }

  return (
    <div className="rise">
      {!readonly && (
        <SectionHint>
          Tap teams in finishing order. The top two advance; third place keeps a lifeline. Tap a
          ranked team to re-pick from there.
        </SectionHint>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {GROUP_IDS.map((g) => {
          const order = picks.groupRanks[g] ?? []
          return (
            <div key={g} className="overflow-hidden border border-neutral-200 bg-white">
              <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-2">
                <span className="text-[11px] font-bold tracking-[0.15em] text-neutral-900">
                  GROUP {g}
                </span>
                {order.length >= 3 && (
                  <span className="text-[11px] font-medium text-neutral-400">set ✓</span>
                )}
              </div>
              <div className="divide-y divide-neutral-100">
                {teamsInGroup(g).map((t) => {
                  const rank = order.indexOf(t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => tap(g, t.id)}
                      disabled={readonly}
                      className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors ${
                        readonly ? '' : 'cursor-pointer hover:bg-neutral-50'
                      }`}
                    >
                      <TeamLabel team={t} dim={rank === 3} />
                      {rank >= 0 ? (
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${RANK_STYLE[rank]}`}
                        >
                          {RANK_LABEL[rank]}
                        </span>
                      ) : (
                        !readonly && (
                          <span className="shrink-0 text-[11px] text-neutral-300">
                            {RANK_LABEL[order.length]}?
                          </span>
                        )
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
