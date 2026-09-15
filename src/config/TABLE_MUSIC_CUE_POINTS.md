# Combined playlist cue points

The three MP3 files contain multiple songs in one continuous file. `tableMusic.js`
stores the detected start time of each song.

## Patch 3 synchronization behavior

`tableMusicPlayer.js` no longer chooses a random cue when gameplay opens. The
backend exposes `/api/tables/music-sync` with an authoritative server timestamp
and a stable shared timeline anchor. The frontend calculates:

`playbackPosition = (serverNow - timelineAnchor) % mp3Duration`

Players using the same table music track therefore hear the same song and
approximately the same playback position even if one joins later, refreshes, or
reconnects. The cue points below are retained as playlist metadata/reference.

## Beginner — 7 songs

`0`, `225.2`, `434.4`, `668.2`, `969.4`, `1253.9`, `1524.1`

## High Roller — 5 songs

`0`, `215.5`, `564.0`, `871.5`, `1121.2`

## Create Room — 10 songs

`0`, `303.0`, `596.1`, `865.0`, `1128.4`, `1446.5`, `1723.7`,
`2021.8`, `2299.7`, `2573.2`

The values are seconds from the beginning of each combined MP3 file.
