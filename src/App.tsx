import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import { autoFill, completion } from './bracket'
import GroupsView from './components/GroupsView'
import ThirdsView from './components/ThirdsView'
import KnockoutView, { MONO_CONFETTI } from './components/KnockoutView'
import ScoreView from './components/ScoreView'
import ShareBar from './components/ShareBar'
import { initialState, useAppState } from './store'
import { buildShareUrl, copyShareUrl, parseHash, syncUrl } from './share'
import type { Picks } from './types'

type Stage = 'groups' | 'thirds' | 'bracket'
type Mode = 'picks' | 'results' | 'score'

const STAGES: { id: Stage; label: string }[] = [
  { id: 'groups', label: 'Groups' },
  { id: 'thirds', label: 'Best 3rds' },
  { id: 'bracket', label: 'Knockouts' },
]

export default function App() {
  const [state, setState] = useAppState()
  const [stage, setStage] = useState<Stage>('groups')
  const [mode, setMode] = useState<Mode>('picks')
  const [hashView, setHashView] = useState(() => parseHash())
  const [copied, setCopied] = useState(false)

  // Someone else's shared link — show read-only page until you start your own bracket.
  const viewingShared = hashView.bracket !== null && !state.locked

  const sharedOnlyTournament =
    hashView.tournament !== null && !hashView.bracket && !state.locked

  const displayName = viewingShared ? hashView.bracket!.n : state.name
  const displayPicks = viewingShared ? hashView.bracket!.p : state.picks
  const displayLockedAt = viewingShared ? hashView.bracket!.t : state.lockedAt

  // Tournament results: URL share overrides local when present.
  const activeResults = useMemo(() => {
    if (hashView.tournament) return hashView.tournament.p
    return state.results
  }, [hashView.tournament, state.results])

  const resultsFromUrl = hashView.tournament !== null

  const prog = completion(state.picks)
  const resultsProg = completion(activeResults)
  const editingResults = state.locked && mode === 'results' && !resultsFromUrl && !state.resultsLocked
  const activePicks = editingResults ? state.results : viewingShared ? hashView.bracket!.p : state.picks

  const shareUrl = useMemo(
    () =>
      buildShareUrl({
        bracket: state.locked
          ? { name: state.name, picks: state.picks, lockedAt: state.lockedAt! }
          : viewingShared
            ? {
                name: hashView.bracket!.n,
                picks: hashView.bracket!.p,
                lockedAt: hashView.bracket!.t,
              }
            : null,
        tournament:
          state.resultsLocked || resultsFromUrl
            ? {
                results: resultsFromUrl ? hashView.tournament!.p : state.results,
                lockedAt: resultsFromUrl ? hashView.tournament!.t : state.resultsLockedAt!,
              }
            : null,
      }),
    [
      state.locked,
      state.lockedAt,
      state.name,
      state.picks,
      state.results,
      state.resultsLocked,
      state.resultsLockedAt,
      viewingShared,
      hashView.bracket,
      hashView.tournament,
      resultsFromUrl,
    ],
  )

  useEffect(() => {
    // Import shared tournament results into local state for scoring (keeps user's bracket).
    if (hashView.tournament && state.locked && !state.resultsLocked) {
      setState((s) => ({
        ...s,
        results: hashView.tournament!.p,
        resultsLocked: true,
        resultsLockedAt: hashView.tournament!.t,
      }))
      setMode('score')
    }
  }, [hashView.tournament, state.locked, state.resultsLocked, setState])

  useEffect(() => {
    // Restore shareable URL after refresh when bracket/tournament is locked locally.
    if (!state.locked && !state.resultsLocked) return
    const params = new URLSearchParams(window.location.hash.slice(1))
    const needsBracket = state.locked && !params.get('b')
    const needsTournament = state.resultsLocked && !params.get('t')
    if (needsBracket || needsTournament) {
      syncUrl({
        bracket: state.locked
          ? { name: state.name, picks: state.picks, lockedAt: state.lockedAt! }
          : null,
        tournament: state.resultsLocked
          ? { results: state.results, lockedAt: state.resultsLockedAt! }
          : null,
      })
    }
  }, [state.locked, state.resultsLocked, state.lockedAt, state.resultsLockedAt, state.name, state.picks, state.results])

  const setPicks = (picks: Picks) => setState((s) => ({ ...s, picks }))
  const setResults = (results: Picks) => setState((s) => ({ ...s, results }))
  const onChange = editingResults ? setResults : state.locked || viewingShared ? undefined : setPicks

  const lockIn = () => {
    if (!prog.done) return
    const lockedAt = Date.now()
    setState((s) => ({ ...s, locked: true, lockedAt }))
    setMode('picks')
    const url = syncUrl({ bracket: { name: state.name, picks: state.picks, lockedAt } })
    copyShareUrl(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
    const blast = (x: number) =>
      confetti({
        particleCount: 160,
        spread: 100,
        origin: { x, y: 0.7 },
        startVelocity: 45,
        colors: MONO_CONFETTI,
      })
    blast(0.2)
    setTimeout(() => blast(0.8), 250)
    setTimeout(() => blast(0.5), 500)
  }

  const lockTournament = () => {
    if (!resultsProg.done) return
    const lockedAt = Date.now()
    setState((s) => ({ ...s, resultsLocked: true, resultsLockedAt: lockedAt }))
    const url = syncUrl({
      bracket: state.locked
        ? { name: state.name, picks: state.picks, lockedAt: state.lockedAt! }
        : null,
      tournament: { results: state.results, lockedAt },
    })
    copyShareUrl(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
  }

  const startOwn = () => {
    setHashView({ bracket: null, tournament: hashView.tournament })
    syncUrl({
      tournament: hashView.tournament
        ? { results: hashView.tournament.p, lockedAt: hashView.tournament.t }
        : null,
    })
    setStage('groups')
    setMode('picks')
  }

  const startOver = () => {
    if (window.confirm('Wipe everything — picks, results, and all locks?')) {
      setState(initialState())
      setHashView({ bracket: null, tournament: null })
      syncUrl({})
      setStage('groups')
      setMode('picks')
    }
  }

  // ── Shared bracket page (someone else's locked picks) ──
  if (viewingShared) {
    return (
      <div className="min-h-screen font-sans text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
            <div className="mr-auto">
              <h1 className="text-xl font-black tracking-tight">
                {displayName ? `${displayName}'s Bracket` : 'Shared Bracket'}
              </h1>
              <p className="text-[11px] text-neutral-400">
                Locked{' '}
                {new Date(displayLockedAt!).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={startOwn}
              className="cursor-pointer bg-neutral-900 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700"
            >
              Make your own
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <ShareBar label="link" url={shareUrl} />
          <nav className="mb-6 flex gap-2">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className={`cursor-pointer border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  stage === s.id
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
          {stage === 'groups' && <GroupsView picks={displayPicks} />}
          {stage === 'thirds' && <ThirdsView picks={displayPicks} />}
          {stage === 'bracket' && <KnockoutView picks={displayPicks} />}
        </main>
      </div>
    )
  }

  // ── Shared tournament-only page ──
  if (sharedOnlyTournament) {
    return (
      <div className="min-h-screen font-sans text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6">
            <div className="mr-auto">
              <h1 className="text-xl font-black tracking-tight">Tournament Results</h1>
              <p className="text-[11px] text-neutral-400">
                Locked{' '}
                {new Date(hashView.tournament!.t).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <button
              onClick={startOwn}
              className="cursor-pointer bg-neutral-900 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700"
            >
              Build your bracket
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
          <ShareBar label="results link" url={shareUrl} />
          <nav className="mb-6 flex gap-2">
            {STAGES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStage(s.id)}
                className={`cursor-pointer border px-4 py-1.5 text-sm font-semibold transition-colors ${
                  stage === s.id
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 bg-white text-neutral-400 hover:text-neutral-900'
                }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
          {stage === 'groups' && <GroupsView picks={hashView.tournament!.p} />}
          {stage === 'thirds' && <ThirdsView picks={hashView.tournament!.p} />}
          {stage === 'bracket' && <KnockoutView picks={hashView.tournament!.p} />}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28 font-sans text-neutral-900">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
          <div className="mr-auto">
            <h1 className="text-xl font-black tracking-tight text-neutral-900">
              WORLD CUP <span className="font-light">’26</span> BRACKET
            </h1>
            <p className="text-[11px] tracking-wide text-neutral-400">
              48 teams · 104 matches · one champion
            </p>
          </div>

          {state.locked && (
            <nav className="flex border border-neutral-200 bg-white p-0.5">
              {(
                [
                  ['picks', 'My Bracket'],
                  ['results', 'Live Results'],
                  ['score', 'Scoreboard'],
                ] as [Mode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`cursor-pointer px-4 py-1.5 text-sm font-semibold transition-colors ${
                    mode === m
                      ? 'bg-neutral-900 text-white'
                      : 'text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </nav>
          )}

          <button
            onClick={startOver}
            className="cursor-pointer text-xs text-neutral-300 underline-offset-2 transition-colors hover:text-neutral-900 hover:underline"
            title="Start over"
          >
            reset
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {state.locked && mode === 'picks' && (
          <>
            <div className="mb-5 flex items-center gap-2.5 border border-neutral-900 bg-white px-4 py-2.5 text-sm text-neutral-900">
              <span>🔒</span>
              <span>
                <strong>{state.name ? `${state.name}'s bracket` : 'Bracket'} locked in</strong>
                {state.lockedAt
                  ? ` on ${new Date(state.lockedAt).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                    })} at ${new Date(state.lockedAt).toLocaleTimeString(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}`
                  : ''}
                . No takebacks.
                {copied && (
                  <span className="ml-2 text-neutral-500">Share link copied to clipboard.</span>
                )}
              </span>
            </div>
            <ShareBar label="bracket link" url={shareUrl} />
          </>
        )}

        {state.resultsLocked && mode !== 'picks' && (
          <>
            <div className="mb-5 flex items-center gap-2.5 border border-neutral-900 bg-white px-4 py-2.5 text-sm text-neutral-900">
              <span>🏁</span>
              <span>
                <strong>Tournament locked in</strong>
                {state.resultsLockedAt
                  ? ` on ${new Date(state.resultsLockedAt).toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                    })}`
                  : ''}
                . Official results — share this link so everyone scores against the same outcome.
              </span>
            </div>
            <ShareBar label="results link" url={shareUrl} />
          </>
        )}

        {editingResults && (
          <div className="mb-5 flex items-center gap-2.5 border border-neutral-300 bg-neutral-100 px-4 py-2.5 text-sm text-neutral-700">
            <span>📺</span>
            <span>
              Entering <strong>real tournament results</strong> — your scoreboard updates as you go.
            </span>
          </div>
        )}

        {mode === 'score' ? (
          <ScoreView picks={state.picks} results={activeResults} name={state.name} />
        ) : (
          <>
            <nav className="mb-6 flex gap-2">
              {STAGES.map((s) => {
                const c = completion(activePicks)
                const done =
                  s.id === 'groups'
                    ? c.groups === 12
                    : s.id === 'thirds'
                      ? c.thirds === 8
                      : c.matches === 32
                return (
                  <button
                    key={s.id}
                    onClick={() => setStage(s.id)}
                    className={`cursor-pointer border px-4 py-1.5 text-sm font-semibold transition-colors ${
                      stage === s.id
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 bg-white text-neutral-400 hover:text-neutral-900'
                    }`}
                  >
                    {s.label}
                    {done && <span className={stage === s.id ? '' : 'text-neutral-900'}> ✓</span>}
                  </button>
                )
              })}
            </nav>

            {stage === 'groups' && <GroupsView picks={activePicks} onChange={onChange} />}
            {stage === 'thirds' && <ThirdsView picks={activePicks} onChange={onChange} />}
            {stage === 'bracket' && <KnockoutView picks={activePicks} onChange={onChange} />}
          </>
        )}
      </main>

      {!state.locked && (
        <footer className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
            <div className="flex gap-4 text-xs text-neutral-400">
              <span className={prog.groups === 12 ? 'font-semibold text-neutral-900' : ''}>
                Groups {prog.groups}/12
              </span>
              <span className={prog.thirds === 8 ? 'font-semibold text-neutral-900' : ''}>
                3rds {prog.thirds}/8
              </span>
              <span className={prog.matches === 32 ? 'font-semibold text-neutral-900' : ''}>
                Matches {prog.matches}/32
              </span>
            </div>
            <button
              onClick={() => setPicks(autoFill(state.picks))}
              className="cursor-pointer text-xs text-neutral-400 underline underline-offset-2 transition-colors hover:text-neutral-900"
            >
              auto-fill the rest
            </button>
            <div className="ml-auto flex items-center gap-3">
              <input
                value={state.name}
                onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
                placeholder="Your name"
                maxLength={24}
                className="w-36 border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-300 outline-none focus:border-neutral-900"
              />
              <button
                onClick={lockIn}
                disabled={!prog.done}
                className={`px-5 py-2 text-sm font-bold transition-colors ${
                  prog.done
                    ? 'cursor-pointer bg-neutral-900 text-white hover:bg-neutral-700'
                    : 'cursor-not-allowed bg-neutral-100 text-neutral-300'
                }`}
              >
                🔒 Lock & Share
              </button>
            </div>
          </div>
        </footer>
      )}

      {state.locked && editingResults && (
        <footer className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6">
            <div className="flex gap-4 text-xs text-neutral-400">
              <span className={resultsProg.groups === 12 ? 'font-semibold text-neutral-900' : ''}>
                Groups {resultsProg.groups}/12
              </span>
              <span className={resultsProg.thirds === 8 ? 'font-semibold text-neutral-900' : ''}>
                3rds {resultsProg.thirds}/8
              </span>
              <span className={resultsProg.matches === 32 ? 'font-semibold text-neutral-900' : ''}>
                Matches {resultsProg.matches}/32
              </span>
            </div>
            <button
              onClick={() => setResults(autoFill(state.results))}
              className="cursor-pointer text-xs text-neutral-400 underline underline-offset-2 transition-colors hover:text-neutral-900"
            >
              auto-fill the rest
            </button>
            <button
              onClick={lockTournament}
              disabled={!resultsProg.done}
              className={`ml-auto px-5 py-2 text-sm font-bold transition-colors ${
                resultsProg.done
                  ? 'cursor-pointer bg-neutral-900 text-white hover:bg-neutral-700'
                  : 'cursor-not-allowed bg-neutral-100 text-neutral-300'
              }`}
            >
              🏁 Lock Tournament & Share
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}
