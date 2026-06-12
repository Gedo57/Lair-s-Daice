# Backend Integration Notes

## Environment

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_USE_MOCK_BACKEND=true
```

- Keep `VITE_USE_MOCK_BACKEND=true` while the backend is not ready.
- Set `VITE_USE_MOCK_BACKEND=false` to make buttons call the real API layer.

## Integration surface

- `src/config/apiConfig.js` contains all endpoint paths.
- `src/api/client.js` contains the shared fetch client, JWT header, credentials/cookies, timeout, and error wrapper.
- `src/api/*Api.js` contains endpoint-specific functions.
- `src/services/backendBridge.js` switches between mock behavior and real API calls.
- `src/data/mockData.js` contains UI mock data that the screens now read from props.

## Main button handlers

- Login: `backendActions.login`
- Guest login: `backendActions.loginAsGuest`
- Join room: `backendActions.joinRoom`
- Create room: `backendActions.createRoom`
- Start matchmaking: `backendActions.startMatchmaking`
- Cancel matchmaking: `backendActions.cancelMatchmaking`
- Claim daily reward: `backendActions.claimDailyReward`
- Enter tournament: `backendActions.enterTournament`
- Upgrade pass: `backendActions.upgradePass`
- Play special event: `backendActions.playSpecialEvent`
- Finish mock match: `backendActions.finishMockWin`

## Data currently separated from JSX

- User profile and level data
- Wallet values
- Main menu card copy
- Room list
- Create room defaults
- Matchmaking filters / metrics / steps
- Daily rewards
- Special events and missions
- Tournament cards
- Lucky Pass rewards and XP
