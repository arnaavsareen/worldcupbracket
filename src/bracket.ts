import { GROUP_IDS, MATCHES, POINTS, TEAM_BY_ID, THIRD_SLOT_MATCHES, teamsInGroup } from './data'
import type { Picks, ScoreRow, SlotRef } from './types'

export const emptyPicks = (): Picks => ({ groupRanks: {}, thirds: [], winners: {} })

/** Third-place team of each completed group, in group order. */
export function thirdPlaceTeams(picks: Picks): string[] {
  return GROUP_IDS.map((g) => picks.groupRanks[g]?.[2]).filter((t): t is string => !!t)
}

/**
 * Assign the 8 chosen third-place teams to the 8 third-place bracket slots.
 * Slots constrain which groups they accept, so this is a small bipartite
 * matching solved with Kuhn's augmenting-path algorithm. Only runs once all
 * 8 thirds are chosen (mirrors FIFA locking the bracket after the groups).
 */
export function assignThirds(picks: Picks): Map<number, string> {
  const out = new Map<number, string>()
  if (picks.thirds.length !== 8) return out

  const teams = picks.thirds
    .map((id) => TEAM_BY_ID.get(id)!)
    .sort((a, b) => a.group.localeCompare(b.group))
  const slotForTeam: number[] = new Array(teams.length).fill(-1)

  const tryAssign = (slotIdx: number, seen: boolean[]): boolean => {
    const { allowed } = THIRD_SLOT_MATCHES[slotIdx]
    for (let t = 0; t < teams.length; t++) {
      if (seen[t] || !allowed.includes(teams[t].group)) continue
      seen[t] = true
      if (slotForTeam[t] === -1 || tryAssign(slotForTeam[t], seen)) {
        slotForTeam[t] = slotIdx
        return true
      }
    }
    return false
  }

  for (let s = 0; s < THIRD_SLOT_MATCHES.length; s++) {
    tryAssign(s, new Array(teams.length).fill(false))
  }
  for (let t = 0; t < teams.length; t++) {
    if (slotForTeam[t] !== -1) out.set(THIRD_SLOT_MATCHES[slotForTeam[t]].match, teams[t].id)
  }
  return out
}

export interface Bracket {
  /** matchId -> the two teams in that match (null while undetermined) */
  pairs: Map<number, [string | null, string | null]>
  /** winners map with any invalidated downstream picks removed */
  winners: Record<number, string>
}

/**
 * Resolve every match's participants from the picks, walking matches in
 * official order so winner/loser references cascade. Winner picks that no
 * longer match their slot (because something upstream changed) are dropped.
 */
export function computeBracket(picks: Picks): Bracket {
  const thirds = assignThirds(picks)
  const pairs = new Map<number, [string | null, string | null]>()
  const winners: Record<number, string> = {}

  const resolveSlot = (slot: SlotRef, matchId: number): string | null => {
    switch (slot.kind) {
      case 'group': {
        const ranks = picks.groupRanks[slot.group]
        return ranks?.[slot.pos - 1] ?? null
      }
      case 'third':
        return thirds.get(matchId) ?? null
      case 'winner':
        return winners[slot.match] ?? null
      case 'loser': {
        const w = winners[slot.match]
        const pair = pairs.get(slot.match)
        if (!w || !pair || !pair[0] || !pair[1]) return null
        return pair[0] === w ? pair[1] : pair[0]
      }
    }
  }

  for (const m of MATCHES) {
    const pair: [string | null, string | null] = [
      resolveSlot(m.slots[0], m.id),
      resolveSlot(m.slots[1], m.id),
    ]
    pairs.set(m.id, pair)
    const picked = picks.winners[m.id]
    if (picked && (pair[0] === picked || pair[1] === picked)) {
      winners[m.id] = picked
    }
  }
  return { pairs, winners }
}

/** Drop any stored picks invalidated by an upstream change. */
export function sanitize(picks: Picks): Picks {
  const validThirds = new Set(thirdPlaceTeams(picks))
  const thirds = picks.thirds.filter((t) => validThirds.has(t))
  const next: Picks = { ...picks, thirds }
  return { ...next, winners: computeBracket(next).winners }
}

export interface Completion {
  groups: number
  thirds: number
  matches: number
  done: boolean
}

export function completion(picks: Picks): Completion {
  const groups = GROUP_IDS.filter((g) => (picks.groupRanks[g]?.length ?? 0) >= 3).length
  const thirds = picks.thirds.length
  const matches = Object.keys(computeBracket(picks).winners).length
  return { groups, thirds, matches, done: groups === 12 && thirds === 8 && matches === 32 }
}

const ROUND_MATCHES: Record<'R32' | 'R16' | 'QF' | 'SF', number[]> = {
  R32: MATCHES.filter((m) => m.round === 'R32').map((m) => m.id),
  R16: MATCHES.filter((m) => m.round === 'R16').map((m) => m.id),
  QF: MATCHES.filter((m) => m.round === 'QF').map((m) => m.id),
  SF: MATCHES.filter((m) => m.round === 'SF').map((m) => m.id),
}

/**
 * Score picks against results. Knockout rounds use "team reaches next round"
 * scoring: you earn points for every team you advanced out of a round that
 * really advanced, even if your bracket diverged elsewhere.
 */
export function scoreBracket(picks: Picks, results: Picks): ScoreRow[] {
  const rows: ScoreRow[] = []
  const p = computeBracket(picks)
  const r = computeBracket(results)

  let gEarned = 0
  let gDecided = 0
  for (const g of GROUP_IDS) {
    const actual = results.groupRanks[g] ?? []
    const mine = picks.groupRanks[g] ?? []
    if (actual.length >= 2) {
      gDecided += 2
      for (const pos of [0, 1]) {
        const team = mine[pos]
        if (!team) continue
        if (actual[0] === team || actual[1] === team) gEarned += POINTS.groupAdvance
        if (actual[pos] === team) gEarned += POINTS.groupExact
      }
    }
  }
  rows.push({
    label: 'Group stage',
    detail: '1 pt per qualifier + 1 pt exact position',
    earned: gEarned,
    possible: 12 * 2 * (POINTS.groupAdvance + POINTS.groupExact),
    decided: gDecided,
    total: 24,
  })

  const actualThirds = new Set(results.thirds)
  rows.push({
    label: 'Best third-place sides',
    detail: `${POINTS.third} pts each`,
    earned: picks.thirds.filter((t) => actualThirds.has(t)).length * POINTS.third,
    possible: 8 * POINTS.third,
    decided: results.thirds.length,
    total: 8,
  })

  for (const [round, label] of [
    ['R32', 'Round of 32'],
    ['R16', 'Round of 16'],
    ['QF', 'Quarterfinals'],
    ['SF', 'Semifinals'],
  ] as const) {
    const ids = ROUND_MATCHES[round]
    const mine = new Set(ids.map((id) => p.winners[id]).filter(Boolean))
    const actual = ids.map((id) => r.winners[id]).filter(Boolean)
    rows.push({
      label,
      detail: `${POINTS[round]} pts per team through`,
      earned: actual.filter((t) => mine.has(t)).length * POINTS[round],
      possible: ids.length * POINTS[round],
      decided: actual.length,
      total: ids.length,
    })
  }

  rows.push({
    label: 'Third place match',
    detail: `${POINTS.TP} pts`,
    earned: r.winners[103] && p.winners[103] === r.winners[103] ? POINTS.TP : 0,
    possible: POINTS.TP,
    decided: r.winners[103] ? 1 : 0,
    total: 1,
  })
  rows.push({
    label: 'Champion',
    detail: `${POINTS.F} pts`,
    earned: r.winners[104] && p.winners[104] === r.winners[104] ? POINTS.F : 0,
    possible: POINTS.F,
    decided: r.winners[104] ? 1 : 0,
    total: 1,
  })
  return rows
}

/** Fill any remaining picks randomly — for the indecisive (and for fun). */
export function autoFill(picks: Picks): Picks {
  const next: Picks = {
    groupRanks: { ...picks.groupRanks },
    thirds: [...picks.thirds],
    winners: { ...picks.winners },
  }
  for (const g of GROUP_IDS) {
    const current = next.groupRanks[g] ?? []
    if (current.length >= 4) continue
    const rest = teamsInGroup(g)
      .map((t) => t.id)
      .filter((id) => !current.includes(id))
      .sort(() => Math.random() - 0.5)
    next.groupRanks[g] = [...current, ...rest]
  }
  const candidates = thirdPlaceTeams(next).filter((t) => !next.thirds.includes(t))
  while (next.thirds.length < 8 && candidates.length) {
    const i = Math.floor(Math.random() * candidates.length)
    next.thirds.push(candidates.splice(i, 1)[0])
  }
  // Walk matches in order, flipping coins for any unpicked winner.
  for (const m of MATCHES) {
    const { pairs, winners } = computeBracket(next)
    if (winners[m.id]) continue
    const [a, b] = pairs.get(m.id)!
    if (a && b) next.winners[m.id] = Math.random() < 0.5 ? a : b
  }
  return sanitize(next)
}
