import type { Picks } from './types'

const B64URL = {
  encode(bytes: Uint8Array): string {
    let s = ''
    bytes.forEach((b) => (s += String.fromCharCode(b)))
    return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  },
  decode(s: string): Uint8Array {
    s = s.replace(/-/g, '+').replace(/_/g, '/')
    while (s.length % 4) s += '='
    const bin = atob(s)
    return Uint8Array.from(bin, (c) => c.charCodeAt(0))
  },
}

function pack(obj: unknown): string {
  return B64URL.encode(new TextEncoder().encode(JSON.stringify(obj)))
}

function unpack<T>(s: string): T | null {
  try {
    return JSON.parse(new TextDecoder().decode(B64URL.decode(s))) as T
  } catch {
    return null
  }
}

export interface BracketShare {
  v: 1
  n: string
  p: Picks
  t: number
}

export interface TournamentShare {
  v: 1
  p: Picks
  t: number
}

export function encodeBracket(name: string, picks: Picks, lockedAt: number): string {
  return pack({ v: 1, n: name, p: picks, t: lockedAt } satisfies BracketShare)
}

export function decodeBracket(encoded: string): BracketShare | null {
  const data = unpack<BracketShare>(encoded)
  if (!data || data.v !== 1 || !data.p) return null
  return data
}

export function encodeTournament(results: Picks, lockedAt: number): string {
  return pack({ v: 1, p: results, t: lockedAt } satisfies TournamentShare)
}

export function decodeTournament(encoded: string): TournamentShare | null {
  const data = unpack<TournamentShare>(encoded)
  if (!data || data.v !== 1 || !data.p) return null
  return data
}

export function parseHash(): { bracket: BracketShare | null; tournament: TournamentShare | null } {
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
  const params = new URLSearchParams()
  if (opts.bracket) params.set('b', encodeBracket(opts.bracket.name, opts.bracket.picks, opts.bracket.lockedAt))
  if (opts.tournament)
    params.set('t', encodeTournament(opts.tournament.results, opts.tournament.lockedAt))
  const hash = params.toString()
  return `${window.location.origin}${window.location.pathname}${hash ? `#${hash}` : ''}`
}

/** Write share state into the address bar (call on lock, not every render). */
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
    // fallback for older browsers / non-HTTPS
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
