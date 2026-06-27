# Liar's Dice Frontend Patch

## Fix included
- Selecting any table from Select Table now routes to Matchmaking first.
- PLAY NOW on Select Table also routes to Matchmaking first.
- The app no longer jumps directly to Gameplay when `/api/matchmaking/start` returns a `match` or `currentMatchId` immediately.
- Gameplay is still reachable from Matchmaking through the ENTER MATCH flow when a match exists.

## Files changed
- `src/App.jsx`
- `src/screens/RoomSelect.jsx`
- rebuilt `dist/`
