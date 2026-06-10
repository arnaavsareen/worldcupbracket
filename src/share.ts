import { GROUP_IDS, MATCHES, TEAMS, teamsInGroup } from './data'
import type { GroupId, Picks } from './types'

const TEAM_IDX = new Map(TEAMS.map((t, i) => [t.id, i]))
const EMPTY_TEAM = 63 // 6-bit sentinel (not a valid team index)

const PERMS: number[][] = (() => {
  const go = (arr: number[]): number[][] => {
    if (arr.length <= 1) return [arr]
    const out: number[][] = []
    for (let i = 0; i < arr.length; i++) {
      for (const p of go([...arr.slice(0, i), ...arr.slice(i + 1)])) out.push([arr[i], ...p])
    }
    return out
  }
  return go([0, 1, 2, 3])
})()
const PERM_IDX = new Map(PERMS.map((p, i) => [p.join(','), i]))

const B64URL = {
  encode(bytes: Uint8Array): string {
    let s = ''
    bytes.forEach((b) => (s += String.fromCharCode(b)))
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  },
  decode(s: string): Uint8Array | null {
    try {
      s = s.replace(/-/g, '+').replace(/_/g, '/')
      while (s.length % 4) s += '='
      const bin = atob(s)
      return Uint8Array.from(bin, (c) => c.charCodeAt(0))
    } catch {
      return null
    }
  },
}

// ── Compact binary codec (v2 bracket / v3 tournament) ──────────────────────
// ~50 bytes → ~70 char code vs ~900 char JSON blob

function pack6(values: number[]): Uint8Array {
  const out = new Uint8Array(24)
  let bit = 0
  for (const v of values) {
    for (let b = 0; b < 6; b++) {
      if (v & (1 << b)) {
        const bi = Math.floor(bit / 8)
        out[bi] |= 1 << (bit % 8)
      }
      bit++
    }
  }
  return out
}

function unpack6(buf: Uint8Array, n: number): number[] {
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    let v = 0
    for (let b = 0; b < 6; b++) {
      const bit = i * 6 + b
      if (buf[Math.floor(bit / 8)] & (1 << (bit % 8))) v |= 1 << b
    }
    out.push(v)
  }
  return out
}

function encodeGroups(groupRanks: Partial<Record<GroupId, string[]>>): Uint8Array {
  const out = new Uint8Array(12)
  GROUP_IDS.forEach((g, gi) => {
    const teams = teamsInGroup(g)
    const order = groupRanks[g] ?? teams.map((t) => t.id)
    const idx = order.map((id) => teams.findIndex((t) => t.id === id))
    out[gi] = PERM_IDX.get(idx.join(',')) ?? 0
  })
  return out
}

function decodeGroups(buf: Uint8Array): Partial<Record<GroupId, string[]>> {
  const out: Partial<Record<GroupId, string[]>> = {}
  GROUP_IDS.forEach((g, gi) => {
    const perm = PERMS[buf[gi]] ?? PERMS[0]
    out[g] = perm.map((i) => teamsInGroup(g)[i].id)
  })
  return out
}

function encodeThirdMask(picks: Picks): number {
  let mask = 0
  GROUP_IDS.forEach((g, i) => {
    const third = picks.groupRanks[g]?.[2]
    if (third && picks.thirds.includes(third)) mask |= 1 << i
  })
  return mask
}

function decodeThirds(mask: number, groupRanks: Partial<Record<GroupId, string[]>>): string[] {
  const thirds: string[] = []
  GROUP_IDS.forEach((g, i) => {
    if (mask & (1 << i)) {
      const t = groupRanks[g]?.[2]
      if (t) thirds.push(t)
    }
  })
  return thirds
}

function encodeWinners(winners: Record<number, string>): Uint8Array {
  const vals = MATCHES.map((m) => {
    const id = winners[m.id]
    return id != null ? (TEAM_IDX.get(id) ?? EMPTY_TEAM) : EMPTY_TEAM
  })
  return pack6(vals)
}

function decodeWinners(buf: Uint8Array): Record<number, string> {
  const winners: Record<number, string> = {}
  unpack6(buf, MATCHES.length).forEach((idx, i) => {
    if (idx !== EMPTY_TEAM && idx < TEAMS.length) winners[MATCHES[i].id] = TEAMS[idx].id
  })
  return winners
}

function encodePicks(name: string, picks: Picks, lockedAt: number, type: 2 | 3): string {
  const nameBytes = type === 2 ? new TextEncoder().encode(name.slice(0, 31)) : new Uint8Array(0)
  const groups = encodeGroups(picks.groupRanks)
  const mask = encodeThirdMask(picks)
  const wins = encodeWinners(picks.winners)
  const ts = Math.floor(lockedAt / 1000)

  const buf = new Uint8Array(1 + 1 + nameBytes.length + 12 + 2 + 24 + 4)
  let o = 0
  buf[o++] = type
  buf[o++] = nameBytes.length
  buf.set(nameBytes, o)
  o += nameBytes.length
  buf.set(groups, o)
  o += 12
  buf[o++] = (mask >> 8) & 0xff
  buf[o++] = mask & 0xff
  buf.set(wins, o)
  o += 24
  buf[o++] = (ts >>> 24) & 0xff
  buf[o++] = (ts >>> 16) & 0xff
  buf[o++] = (ts >>> 8) & 0xff
  buf[o++] = ts & 0xff
  return B64URL.encode(buf)
}

function decodePicks(code: string, expect: 2 | 3): { name: string; picks: Picks; lockedAt: number } | null {
  const buf = B64URL.decode(code)
  if (!buf || buf.length < 44 || buf[0] !== expect) return null
  let o = 1
  const nameLen = buf[o++]
  const name = new TextDecoder().decode(buf.subarray(o, o + nameLen))
  o += nameLen
  const groupRanks = decodeGroups(buf.subarray(o, o + 12))
  o += 12
  const mask = (buf[o] << 8) | buf[o + 1]
  o += 2
  const winners = decodeWinners(buf.subarray(o, o + 24))
  o += 24
  const ts = (buf[o] << 24) | (buf[o + 1] << 16) | (buf[o + 2] << 8) | buf[o + 3]
  return { name, picks: { groupRanks, thirds: decodeThirds(mask, groupRanks), winners }, lockedAt: ts * 1000 }
}

// ── Legacy JSON codec (v1 — still readable) ────────────────────────────────

function unpackJson<T>(s: string): T | null {
  const bytes = B64URL.decode(s)
  if (!bytes) return null
  try {
    return JSON.parse(new TextDecoder().decode(bytes)) as T
  } catch {
    return null
  }
}

export interface BracketShare {
  v: 1 | 2
  n: string
  p: Picks
  t: number
}

export interface TournamentShare {
  v: 1 | 3
  p: Picks
  t: number
}

export function encodeBracket(name: string, picks: Picks, lockedAt: number): string {
  return encodePicks(name, picks, lockedAt, 2)
}

export function decodeBracket(encoded: string): BracketShare | null {
  const compact = decodePicks(encoded, 2)
  if (compact) return { v: 2, n: compact.name, p: compact.picks, t: compact.lockedAt }

  const legacy = unpackJson<BracketShare>(encoded)
  if (legacy?.v === 1 && legacy.p) return legacy
  return null
}

export function encodeTournament(results: Picks, lockedAt: number): string {
  return encodePicks('', results, lockedAt, 3)
}

export function decodeTournament(encoded: string): TournamentShare | null {
  const compact = decodePicks(encoded, 3)
  if (compact) return { v: 3, p: compact.picks, t: compact.lockedAt }

  const legacy = unpackJson<TournamentShare>(encoded)
  if (legacy?.v === 1 && legacy.p) return legacy
  return null
}

/** Read share codes from `/s/CODE`, `/r/CODE`, or legacy `#b=&t=` hash. */
export function parseHash(): { bracket: BracketShare | null; tournament: TournamentShare | null } {
  const path = window.location.pathname
  const sm = path.match(/^\/s\/([^/]+)\/?$/)
  const rm = path.match(/^\/r\/([^/]+)\/?$/)
  if (sm) return { bracket: decodeBracket(sm[1]), tournament: null }
  if (rm) return { bracket: null, tournament: decodeTournament(rm[1]) }

  const params = new URLSearchParams(window.location.hash.slice(1))
  const b = params.get('b')
  const t = params.get('t')
  return {
    bracket: b ? decodeBracket(b) : null,
    tournament: t ? decodeTournament(t) : null,
  }
}

export function buildShareUrl(opts: {
  bracket?: { name: string; picks: Picks; lockedAt: number } | null
  tournament?: { results: Picks; lockedAt: number } | null
}): string {
  const origin = window.location.origin
  const bCode = opts.bracket
    ? encodeBracket(opts.bracket.name, opts.bracket.picks, opts.bracket.lockedAt)
    : null
  const tCode = opts.tournament
    ? encodeTournament(opts.tournament.results, opts.tournament.lockedAt)
    : null

  // Short path URLs when sharing one thing; hash when sharing both.
  if (bCode && !tCode) return `${origin}/s/${bCode}`
  if (tCode && !bCode) return `${origin}/r/${tCode}`

  const params = new URLSearchParams()
  if (bCode) params.set('b', bCode)
  if (tCode) params.set('t', tCode)
  return `${origin}/${params.toString() ? `#${params}` : ''}`
}

export function syncUrl(
  opts: {
    bracket?: { name: string; picks: Picks; lockedAt: number } | null
    tournament?: { results: Picks; lockedAt: number } | null
  },
  replace = true,
) {
  const url = buildShareUrl(opts)
  const path = url.replace(window.location.origin, '')
  if (replace) history.replaceState(null, '', path)
  else history.pushState(null, '', path)
  return url
}

export async function copyShareUrl(url?: string): Promise<boolean> {
  const href = url ?? window.location.href
  try {
    await navigator.clipboard.writeText(href)
    return true
  } catch {
    const el = document.createElement('textarea')
    el.value = href
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(el)
    return ok
  }
}
