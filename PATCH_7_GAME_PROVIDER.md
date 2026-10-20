# Patch 7 — Liar's Dice Frontend / Game Provider

**Branch:** `patch7/game-provider-liars-dice`. Unmerged. No change to Vercel.

## Two launch modes

**Demo:** opening `https://lair-s-daice.vercel.app/` directly continues the LOCAL/demo login and mock-money gameplay. Normal login, SideSix and legacy Platform paths are preserved.

**Provider:** operator backend requests a session from Game Provider's `POST /api/v1/launch`, with game ID `liars-dice`, mode `provider` and an external player ID. Provider returns a frontend URL of the form:

```
https://lair-s-daice.vercel.app/#provider_launch_token=ONE_TIME_TOKEN&provider_launch_id=LAUNCH_ID
```

The FE consumes and removes the URL fragment, clears any old demo token, calls `POST /api/auth/provider` **on the Liar's Dice BE**, receives a game-specific access token and navigates to `/main-menu`.

**Important:** Provider auth tokens are stored in `sessionStorage` (per tab) rather than `localStorage`, avoiding cross-tab paid session reuse. A fresh direct Vercel root navigation clears that tab's Provider access token; gameplay no longer silently falls back from invalid Provider launch to Demo.

No wallet callback or adapter key is sent from browser to Provider. Wallet operations are always game BE → Provider BE → partner wallet.

## Staging signoff checklist
- FE: `npm ci && npm run build`.
- BE: `npm run check:provider && npm run test:provider`.
- Launch both real players via the same sandbox operator; verify 1v1 multiplayer, synchronous match state, game result and one gross payout, cancel/refund, timeout/retry and cross-operator isolation.
- Keep the Provider wallet mode opt-in and DO NOT use live money before financial audit.
