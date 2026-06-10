# World Cup ’26 Bracket

A minimal, black-and-white bracket game for the 2026 FIFA World Cup — the real 48 teams, the real 12 groups from the final draw, and FIFA's official knockout structure (matches 73–104, including the third-place slot rules).

## How it works

1. **Groups** — tap teams in finishing order for all 12 groups. Top two advance, third place keeps a lifeline.
2. **Best 3rds** — pick the 8 of 12 third-place sides you think survive. They're slotted into the bracket using FIFA's allowed-group constraints (solved as a bipartite matching).
3. **Knockouts** — tap teams through the Round of 32 all the way to the final in East Rutherford.
4. **Lock & Share** — once complete, lock your bracket. The share link is copied automatically and lives in the URL — send it to anyone.
5. **Live Results** — enter real tournament results as matches finish.
6. **Lock Tournament & Share** — when every group and knockout match is decided, lock the official results and share that link so everyone scores against the same outcome.

### Sharing

Share links are short (~90 characters total) — the entire bracket fits in a compact code, no server needed:

- `yoursite.com/s/CODE` — someone's locked bracket
- `yoursite.com/r/CODE` — locked tournament results
- `yoursite.com/s/CODE#t=CODE` — bracket + official results together

Lock & Share copies the link automatically. Old long `#b=` links still work.

## Scoring (232 max)

| Category | Points |
| --- | --- |
| Group qualifier | 1 (+1 exact position) |
| Best third-place side | 2 each |
| Round of 32 winner | 2 each |
| Round of 16 winner | 4 each |
| Quarterfinal winner | 8 each |
| Semifinal winner | 16 each |
| Third place match | 8 |
| Champion | 32 |

Knockout rounds use "team reaches the next round" scoring, so a busted early pick doesn't zero out your whole bracket.

Everything is saved to localStorage — no account, no backend.

## Run it

```bash
npm install
npm run dev
```

Built with Vite, React, TypeScript, and Tailwind CSS.
