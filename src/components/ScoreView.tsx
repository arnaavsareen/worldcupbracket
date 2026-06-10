import { MAX_POINTS, TEAM_BY_ID } from '../data'
import { computeBracket, scoreBracket } from '../bracket'
import type { Picks } from '../types'
import { Flag } from './ui'

function verdict(pct: number, decidedPct: number): string {
  if (decidedPct === 0) return 'Waiting on the real tournament — enter results as matches finish.'
  if (pct >= 0.8) return 'Are you from the future? Untouchable bracket.'
  if (pct >= 0.6) return 'Seriously sharp. The group chat should fear you.'
  if (pct >= 0.4) return 'Solid showing — a few upsets got away from you.'
  if (pct >= 0.2) return 'Football is chaos, and chaos won this round.'
  return 'Your bracket believed. The tournament disagreed.'
}

interface Props {
  picks: Picks
  results: Picks
  name: string
}

export default function ScoreView({ picks, results, name }: Props) {
  const rows = scoreBracket(picks, results)
  const earned = rows.reduce((s, r) => s + r.earned, 0)
  const decidedPossible = rows.reduce((s, r) => s + (r.possible * r.decided) / r.total, 0)
  const decidedUnits = rows.reduce((s, r) => s + r.decided, 0)
  const totalUnits = rows.reduce((s, r) => s + r.total, 0)

  const myChamp = computeBracket(picks).winners[104]
  const realChamp = computeBracket(results).winners[104]

  return (
    <div className="rise mx-auto max-w-2xl">
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-neutral-400 uppercase">
          {name ? `${name}'s bracket` : 'Your bracket'}
        </p>
        <p className="mt-3 text-6xl font-black tracking-tight text-neutral-900">
          {earned}
          <span className="text-2xl font-semibold text-neutral-300"> / {MAX_POINTS}</span>
        </p>
        <div className="mx-auto mt-5 h-1.5 w-full max-w-sm bg-neutral-100">
          <div
            className="h-full bg-neutral-900 transition-all duration-700"
            style={{ width: `${(earned / MAX_POINTS) * 100}%` }}
          />
        </div>
        <p className="mt-5 text-sm text-neutral-500 italic">
          {verdict(decidedPossible ? earned / decidedPossible : 0, decidedUnits / totalUnits)}
        </p>
        {myChamp && realChamp && (
          <p className="mt-3 flex items-center justify-center gap-2 text-sm">
            {myChamp === realChamp ? (
              <span className="flex items-center gap-2 font-semibold text-neutral-900">
                You called the champion: <Flag code={TEAM_BY_ID.get(realChamp)!.flag} />
                {TEAM_BY_ID.get(realChamp)!.name} 🏆
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-neutral-400">
                You had <Flag code={TEAM_BY_ID.get(myChamp)!.flag} />
                {TEAM_BY_ID.get(myChamp)!.name} — it was{' '}
                <Flag code={TEAM_BY_ID.get(realChamp)!.flag} />
                {TEAM_BY_ID.get(realChamp)!.name}.
              </span>
            )}
          </p>
        )}
      </div>

      <div className="mt-4 border border-neutral-200 bg-white">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-4 border-b border-neutral-100 px-5 py-3.5 last:border-b-0"
          >
            <div className="min-w-0">
              <p className="text-sm font-semibold text-neutral-900">{r.label}</p>
              <p className="text-xs text-neutral-400">
                {r.detail} ·{' '}
                {r.decided === r.total ? 'all decided' : `${r.decided}/${r.total} decided`}
              </p>
            </div>
            <p className="shrink-0 text-sm font-bold text-neutral-900">
              {r.earned}
              <span className="font-medium text-neutral-300"> / {r.possible}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
