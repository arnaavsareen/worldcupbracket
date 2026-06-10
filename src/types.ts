export type GroupId =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'

export interface Team {
  id: string
  name: string
  flag: string
  group: GroupId
}

export type Round = 'R32' | 'R16' | 'QF' | 'SF' | 'TP' | 'F'

export type SlotRef =
  | { kind: 'group'; group: GroupId; pos: 1 | 2 }
  | { kind: 'third'; allowed: GroupId[] }
  | { kind: 'winner'; match: number }
  | { kind: 'loser'; match: number }

export interface MatchDef {
  id: number
  round: Round
  slots: [SlotRef, SlotRef]
  date: string
  venue: string
}

/** A full set of predictions (used for both user picks and real results). */
export interface Picks {
  /** groupId -> teamIds in finishing order (built by tap order, 4th auto-fills) */
  groupRanks: Partial<Record<GroupId, string[]>>
  /** teamIds of the 8 third-place sides predicted to advance */
  thirds: string[]
  /** matchId -> teamId of the predicted winner */
  winners: Record<number, string>
}

export interface AppState {
  name: string
  picks: Picks
  results: Picks
  locked: boolean
  lockedAt: number | null
  resultsLocked: boolean
  resultsLockedAt: number | null
}

export interface ScoreRow {
  label: string
  detail: string
  earned: number
  possible: number
  decided: number // how many of the units have real results so far
  total: number // total units in this category
}
