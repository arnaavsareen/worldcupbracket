import confetti from 'canvas-confetti'
import { BRACKET_COLUMNS, MATCH_BY_ID, TEAM_BY_ID } from '../data'
import { computeBracket, sanitize } from '../bracket'
import type { Picks, SlotRef } from '../types'
import { Flag, SectionHint } from './ui'

export const MONO_CONFETTI = ['#171717', '#525252', '#a3a3a3', '#e5e5e5']

function slotPlaceholder(slot: SlotRef): string {
  switch (slot.kind) {
    case 'group':
      return slot.pos === 1 ? `Group ${slot.group} winner` : `Group ${slot.group} runner-up`
    case 'third':
      return `3rd from ${slot.allowed.join(', ')}`
    case 'winner':
      return `Winner of Match ${slot.match}`
    case 'loser':
      return `Loser of Match ${slot.match}`
  }
}

interface Props {
  picks: Picks
  onChange?: (p: Picks) => void
}

export default function KnockoutView({ picks, onChange }: Props) {
  const readonly = !onChange
  const { pairs, winners } = computeBracket(picks)

  const pick = (matchId: number, teamId: string | null) => {
    if (readonly || !teamId) return
    const next = sanitize({ ...picks, winners: { ...picks.winners, [matchId]: teamId } })
    onChange(next)
    if (matchId === 104 && next.winners[104]) {
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.7 },
        scalar: 0.9,
        colors: MONO_CONFETTI,
      })
    }
  }

  const champion = winners[104] ? TEAM_BY_ID.get(winners[104]) : null

  const MatchCard = ({ matchId }: { matchId: number }) => {
    const match = MATCH_BY_ID.get(matchId)!
    const pair = pairs.get(matchId)!
    const winner = winners[matchId]
    return (
      <div className="w-56 border border-neutral-200 bg-white">
        <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-1 text-[10px] tracking-wide text-neutral-400">
          <span className="font-semibold uppercase">{match.venue}</span>
          <span className="pl-2">{match.date}</span>
        </div>
        {([0, 1] as const).map((i) => {
          const teamId = pair[i]
          const team = teamId ? TEAM_BY_ID.get(teamId) : null
          const isWinner = !!winner && winner === teamId
          const isLoser = !!winner && !!teamId && winner !== teamId
          return (
            <button
              key={i}
              onClick={() => pick(matchId, teamId)}
              disabled={readonly || !teamId}
              className={`flex h-8 w-full items-center gap-2.5 px-3 text-left transition-colors ${
                isWinner ? 'bg-neutral-900' : ''
              } ${readonly || !teamId ? '' : 'cursor-pointer hover:bg-neutral-100'} ${
                isWinner && !readonly ? 'hover:bg-neutral-800' : ''
              }`}
            >
              {team ? (
                <>
                  <Flag code={team.flag} className="h-3 w-[18px]" />
                  <span
                    className={`truncate text-[13px] ${
                      isWinner
                        ? 'font-bold text-white'
                        : isLoser
                          ? 'font-normal text-neutral-300'
                          : 'font-medium text-neutral-900'
                    }`}
                  >
                    {team.name}
                  </span>
                  {isWinner && <span className="ml-auto text-[10px] text-neutral-400">▸</span>}
                </>
              ) : (
                <span className="truncate text-[12px] text-neutral-300 italic">
                  {slotPlaceholder(match.slots[i])}
                </span>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="rise">
      {!readonly && (
        <SectionHint>
          Tap a team to send them through. Third-place slots fill in once all 8 are chosen.
        </SectionHint>
      )}
      <div className="overflow-x-auto pb-4">
        <div className="flex min-w-max gap-8">
          {BRACKET_COLUMNS.filter((c) => c.round !== 'F').map((col, ci) => (
            <div key={col.round} className="flex flex-col">
              <div className="border-b-2 border-neutral-900 pb-2 text-center text-[11px] font-bold tracking-[0.15em] text-neutral-900 uppercase">
                {col.label}
              </div>
              <div
                className="mt-4 grid flex-1 gap-y-2"
                style={{ gridTemplateRows: 'repeat(32, minmax(0, 1fr))' }}
              >
                {col.matches.map((id, i) => {
                  const span = 2 ** (ci + 1)
                  return (
                    <div
                      key={id}
                      className="flex items-center"
                      style={{ gridRow: `${i * span + 1} / span ${span}` }}
                    >
                      <MatchCard matchId={id} />
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-col">
            <div className="border-b-2 border-neutral-900 pb-2 text-center text-[11px] font-bold tracking-[0.15em] text-neutral-900 uppercase">
              Final · Jul 19
            </div>
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <MatchCard matchId={104} />
              <div
                className={`flex w-56 flex-col items-center px-4 py-6 text-center ${
                  champion
                    ? 'border-2 border-neutral-900 bg-white'
                    : 'border border-dashed border-neutral-300'
                }`}
              >
                <span className="text-2xl">🏆</span>
                {champion ? (
                  <>
                    <Flag code={champion.flag} className="mt-2 h-6 w-9" />
                    <span className="mt-2 text-lg font-black text-neutral-900">
                      {champion.name}
                    </span>
                    <span className="text-[10px] font-semibold tracking-[0.2em] text-neutral-400 uppercase">
                      World Champions
                    </span>
                  </>
                ) : (
                  <span className="mt-2 text-xs text-neutral-400">Your champion</span>
                )}
              </div>
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-bold tracking-[0.15em] text-neutral-400 uppercase">
                  Third place · Jul 18
                </span>
                <MatchCard matchId={103} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
