import type { GroupId, MatchDef, Round, SlotRef, Team } from './types'

export const GROUP_IDS: GroupId[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

// Official 2026 FIFA World Cup group stage (final draw, Dec 5 2025).
export const TEAMS: Team[] = [
  { id: 'mex', name: 'Mexico', flag: 'mx', group: 'A' },
  { id: 'kor', name: 'South Korea', flag: 'kr', group: 'A' },
  { id: 'rsa', name: 'South Africa', flag: 'za', group: 'A' },
  { id: 'cze', name: 'Czechia', flag: 'cz', group: 'A' },

  { id: 'can', name: 'Canada', flag: 'ca', group: 'B' },
  { id: 'sui', name: 'Switzerland', flag: 'ch', group: 'B' },
  { id: 'qat', name: 'Qatar', flag: 'qa', group: 'B' },
  { id: 'bih', name: 'Bosnia & Herz.', flag: 'ba', group: 'B' },

  { id: 'bra', name: 'Brazil', flag: 'br', group: 'C' },
  { id: 'mar', name: 'Morocco', flag: 'ma', group: 'C' },
  { id: 'sco', name: 'Scotland', flag: 'gb-sct', group: 'C' },
  { id: 'hai', name: 'Haiti', flag: 'ht', group: 'C' },

  { id: 'usa', name: 'United States', flag: 'us', group: 'D' },
  { id: 'par', name: 'Paraguay', flag: 'py', group: 'D' },
  { id: 'aus', name: 'Australia', flag: 'au', group: 'D' },
  { id: 'tur', name: 'Türkiye', flag: 'tr', group: 'D' },

  { id: 'ger', name: 'Germany', flag: 'de', group: 'E' },
  { id: 'ecu', name: 'Ecuador', flag: 'ec', group: 'E' },
  { id: 'civ', name: 'Ivory Coast', flag: 'ci', group: 'E' },
  { id: 'cuw', name: 'Curaçao', flag: 'cw', group: 'E' },

  { id: 'ned', name: 'Netherlands', flag: 'nl', group: 'F' },
  { id: 'jpn', name: 'Japan', flag: 'jp', group: 'F' },
  { id: 'tun', name: 'Tunisia', flag: 'tn', group: 'F' },
  { id: 'swe', name: 'Sweden', flag: 'se', group: 'F' },

  { id: 'bel', name: 'Belgium', flag: 'be', group: 'G' },
  { id: 'irn', name: 'Iran', flag: 'ir', group: 'G' },
  { id: 'egy', name: 'Egypt', flag: 'eg', group: 'G' },
  { id: 'nzl', name: 'New Zealand', flag: 'nz', group: 'G' },

  { id: 'esp', name: 'Spain', flag: 'es', group: 'H' },
  { id: 'uru', name: 'Uruguay', flag: 'uy', group: 'H' },
  { id: 'ksa', name: 'Saudi Arabia', flag: 'sa', group: 'H' },
  { id: 'cpv', name: 'Cape Verde', flag: 'cv', group: 'H' },

  { id: 'fra', name: 'France', flag: 'fr', group: 'I' },
  { id: 'sen', name: 'Senegal', flag: 'sn', group: 'I' },
  { id: 'nor', name: 'Norway', flag: 'no', group: 'I' },
  { id: 'irq', name: 'Iraq', flag: 'iq', group: 'I' },

  { id: 'arg', name: 'Argentina', flag: 'ar', group: 'J' },
  { id: 'aut', name: 'Austria', flag: 'at', group: 'J' },
  { id: 'alg', name: 'Algeria', flag: 'dz', group: 'J' },
  { id: 'jor', name: 'Jordan', flag: 'jo', group: 'J' },

  { id: 'por', name: 'Portugal', flag: 'pt', group: 'K' },
  { id: 'col', name: 'Colombia', flag: 'co', group: 'K' },
  { id: 'uzb', name: 'Uzbekistan', flag: 'uz', group: 'K' },
  { id: 'cod', name: 'DR Congo', flag: 'cd', group: 'K' },

  { id: 'eng', name: 'England', flag: 'gb-eng', group: 'L' },
  { id: 'cro', name: 'Croatia', flag: 'hr', group: 'L' },
  { id: 'pan', name: 'Panama', flag: 'pa', group: 'L' },
  { id: 'gha', name: 'Ghana', flag: 'gh', group: 'L' },
]

export const TEAM_BY_ID = new Map(TEAMS.map((t) => [t.id, t]))
export const teamsInGroup = (g: GroupId) => TEAMS.filter((t) => t.group === g)

const W = (group: GroupId): SlotRef => ({ kind: 'group', group, pos: 1 })
const RU = (group: GroupId): SlotRef => ({ kind: 'group', group, pos: 2 })
const T3 = (...allowed: GroupId[]): SlotRef => ({ kind: 'third', allowed })
const WM = (match: number): SlotRef => ({ kind: 'winner', match })
const LM = (match: number): SlotRef => ({ kind: 'loser', match })

// Official knockout structure (FIFA World Cup 26 match schedule, matches 73–104).
export const MATCHES: MatchDef[] = [
  { id: 73, round: 'R32', slots: [RU('A'), RU('B')], date: 'Jun 28', venue: 'Inglewood' },
  { id: 74, round: 'R32', slots: [W('E'), T3('A', 'B', 'C', 'D', 'F')], date: 'Jun 29', venue: 'Foxborough' },
  { id: 75, round: 'R32', slots: [W('F'), RU('C')], date: 'Jun 29', venue: 'Guadalupe' },
  { id: 76, round: 'R32', slots: [W('C'), RU('F')], date: 'Jun 29', venue: 'Houston' },
  { id: 77, round: 'R32', slots: [W('I'), T3('C', 'D', 'F', 'G', 'H')], date: 'Jun 30', venue: 'East Rutherford' },
  { id: 78, round: 'R32', slots: [RU('E'), RU('I')], date: 'Jun 30', venue: 'Arlington' },
  { id: 79, round: 'R32', slots: [W('A'), T3('C', 'E', 'F', 'H', 'I')], date: 'Jun 30', venue: 'Mexico City' },
  { id: 80, round: 'R32', slots: [W('L'), T3('E', 'H', 'I', 'J', 'K')], date: 'Jul 1', venue: 'Atlanta' },
  { id: 81, round: 'R32', slots: [W('D'), T3('B', 'E', 'F', 'I', 'J')], date: 'Jul 1', venue: 'Seattle' },
  { id: 82, round: 'R32', slots: [W('G'), T3('A', 'E', 'H', 'I', 'J')], date: 'Jul 1', venue: 'Santa Clara' },
  { id: 83, round: 'R32', slots: [RU('K'), RU('L')], date: 'Jul 2', venue: 'Toronto' },
  { id: 84, round: 'R32', slots: [W('H'), RU('J')], date: 'Jul 2', venue: 'Inglewood' },
  { id: 85, round: 'R32', slots: [W('B'), T3('E', 'F', 'G', 'I', 'J')], date: 'Jul 2', venue: 'Vancouver' },
  { id: 86, round: 'R32', slots: [W('J'), RU('H')], date: 'Jul 3', venue: 'Atlanta' },
  { id: 87, round: 'R32', slots: [W('K'), T3('D', 'E', 'I', 'J', 'L')], date: 'Jul 3', venue: 'Kansas City' },
  { id: 88, round: 'R32', slots: [RU('D'), RU('G')], date: 'Jul 3', venue: 'Arlington' },

  { id: 89, round: 'R16', slots: [WM(74), WM(77)], date: 'Jul 4', venue: 'Philadelphia' },
  { id: 90, round: 'R16', slots: [WM(73), WM(75)], date: 'Jul 4', venue: 'Houston' },
  { id: 91, round: 'R16', slots: [WM(76), WM(78)], date: 'Jul 5', venue: 'East Rutherford' },
  { id: 92, round: 'R16', slots: [WM(79), WM(80)], date: 'Jul 5', venue: 'Mexico City' },
  { id: 93, round: 'R16', slots: [WM(83), WM(84)], date: 'Jul 6', venue: 'Arlington' },
  { id: 94, round: 'R16', slots: [WM(81), WM(82)], date: 'Jul 6', venue: 'Seattle' },
  { id: 95, round: 'R16', slots: [WM(86), WM(88)], date: 'Jul 7', venue: 'Atlanta' },
  { id: 96, round: 'R16', slots: [WM(85), WM(87)], date: 'Jul 7', venue: 'Vancouver' },

  { id: 97, round: 'QF', slots: [WM(89), WM(90)], date: 'Jul 9', venue: 'Foxborough' },
  { id: 98, round: 'QF', slots: [WM(93), WM(94)], date: 'Jul 10', venue: 'Inglewood' },
  { id: 99, round: 'QF', slots: [WM(91), WM(92)], date: 'Jul 11', venue: 'Miami Gardens' },
  { id: 100, round: 'QF', slots: [WM(95), WM(96)], date: 'Jul 11', venue: 'Kansas City' },

  { id: 101, round: 'SF', slots: [WM(97), WM(98)], date: 'Jul 14', venue: 'Arlington' },
  { id: 102, round: 'SF', slots: [WM(99), WM(100)], date: 'Jul 15', venue: 'Atlanta' },

  { id: 103, round: 'TP', slots: [LM(101), LM(102)], date: 'Jul 18', venue: 'Miami Gardens' },
  { id: 104, round: 'F', slots: [WM(101), WM(102)], date: 'Jul 19', venue: 'East Rutherford' },
]

export const MATCH_BY_ID = new Map(MATCHES.map((m) => [m.id, m]))

/** Display order (top → bottom) per bracket column, matching the official bracket layout. */
export const BRACKET_COLUMNS: { round: Round; label: string; matches: number[] }[] = [
  { round: 'R32', label: 'Round of 32', matches: [74, 77, 73, 75, 83, 84, 81, 82, 76, 78, 79, 80, 86, 88, 85, 87] },
  { round: 'R16', label: 'Round of 16', matches: [89, 90, 93, 94, 91, 92, 95, 96] },
  { round: 'QF', label: 'Quarterfinals', matches: [97, 98, 99, 100] },
  { round: 'SF', label: 'Semifinals', matches: [101, 102] },
  { round: 'F', label: 'Final', matches: [104] },
]

/** R32 matches that take a third-place team, with their allowed source groups. */
export const THIRD_SLOT_MATCHES = MATCHES.filter(
  (m) => m.round === 'R32' && m.slots.some((s) => s.kind === 'third'),
).map((m) => ({
  match: m.id,
  allowed: (m.slots.find((s) => s.kind === 'third') as { allowed: GroupId[] }).allowed,
}))

export const POINTS = {
  groupAdvance: 1, // picked a team that finishes top 2
  groupExact: 1, // bonus: exact position (1st or 2nd)
  third: 2, // correctly picked a third-place side that advances
  R32: 2,
  R16: 4,
  QF: 8,
  SF: 16,
  TP: 8,
  F: 32,
} as const

export const MAX_POINTS =
  12 * 2 * (POINTS.groupAdvance + POINTS.groupExact) +
  8 * POINTS.third +
  16 * POINTS.R32 +
  8 * POINTS.R16 +
  4 * POINTS.QF +
  2 * POINTS.SF +
  POINTS.TP +
  POINTS.F
