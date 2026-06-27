import { useEffect, useMemo, useRef } from 'react';
import ProfileHud from '../components/ProfileHud.jsx';
import { extractAvatarValue as resolveAvatarValue, resolveProfileAvatarSrc as resolveAvatarSrc } from '../utils/profileAvatars.js';

const asset = '/assets/liars-dice/win/';

const fallbackPlayers = [
  { className: 'quetzal', avatar: 'icc2.png', name: 'Player 2', place: '2ND PLACE', score: '- 8' },
  { className: 'ganesha', avatar: 'icc3.png', name: 'Player 3', place: '3RD PLACE', score: '- 10' },
  { className: 'fenrir', avatar: 'icc4.png', name: 'Player 4', place: '4TH PLACE', score: '- 12' },
];

const summaryIcons = {
  mode: '123214.png',
  players: '12415124.png',
  finalBid: '12312414312.png',
  score: '1242352523.png',
  duration: '123125151234.png',
  rank: '1232132131.png',
  status: '12312452312.png',
};


function normalizeId(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function compactNumber(value, fallback = 0) {
  const parsed = Number(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function formatNumber(value, fallback = '0') {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = compactNumber(value, Number.NaN);
  if (!Number.isFinite(parsed)) return String(value);
  return new Intl.NumberFormat('en-US').format(parsed);
}

function formatReward(value) {
  const reward = compactNumber(value, 0);
  return reward > 0 ? `+ ${formatNumber(reward)}` : '+ 0';
}

function formatDuration(match = {}) {
  const seconds = compactNumber(match.durationSeconds ?? match.duration ?? match.elapsedSeconds, Number.NaN);
  if (Number.isFinite(seconds) && seconds > 0) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}m ${String(rest).padStart(2, '0')}s`;
  }

  const started = match.startedAt ? new Date(match.startedAt).getTime() : null;
  const ended = match.finishedAt || match.endedAt || match.updatedAt;
  const finished = ended ? new Date(ended).getTime() : null;
  if (Number.isFinite(started) && Number.isFinite(finished) && finished > started) {
    const totalSeconds = Math.floor((finished - started) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const rest = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}m ${String(rest).padStart(2, '0')}s`;
  }

  return '—';
}

function formatBid(bid) {
  if (!bid) return '—';
  const quantity = bid.quantity ?? bid.count ?? bid.diceCount;
  const face = bid.face ?? bid.value ?? bid.diceValue;
  if (!quantity || !face) return '—';
  return `${quantity} x ${face}`;
}

function playerId(player = {}) {
  return normalizeId(player.id || player.userId || player.playerId || player._id || player.socketUserId);
}

function playerName(player = {}, fallback = 'Player') {
  return player.displayName || player.username || player.name || fallback;
}

function identityValues(source = {}) {
  return [source.id, source.userId, source.playerId, source._id, source.socketUserId]
    .map(normalizeId)
    .filter(Boolean);
}

function hasMatchingIdentity(left = {}, right = {}) {
  const leftIds = identityValues(left);
  const rightIds = identityValues(right);
  if (!leftIds.length || !rightIds.length) return false;
  return leftIds.some((id) => rightIds.includes(id));
}

function isSameId(left, right) {
  const a = normalizeId(left);
  const b = normalizeId(right);
  return Boolean(a && b && a === b);
}

function getMatchResult(data = {}) {
  const match = data.match || {};
  const stored = data.matchResult || null;
  const viewerMatchResult = data.viewerMatchResult || stored?.viewerMatchResult || null;
  const rawResult = stored?.raw || stored || match.result || match.lastAction?.result || null;
  const viewerResult = data.result || viewerMatchResult?.outcome || viewerMatchResult?.result || stored?.viewerResult || rawResult?.viewerResult || null;
  const userId = normalizeId(data.user?.id || data.user?._id || data.user?.userId || data.user?.playerId);
  const winnerId = rawResult?.winnerId || viewerMatchResult?.winnerId || match.winnerId || (viewerResult === 'win' ? userId : null);
  const loserId = rawResult?.loserId || viewerMatchResult?.loserId || match.loserId || (viewerResult === 'loss' ? userId : null);
  const status = match.status || rawResult?.status || (rawResult || viewerMatchResult ? 'finished' : 'unknown');
  const outcome = String(viewerResult || viewerMatchResult?.outcome || '').toLowerCase();
  const userWon = outcome === 'win' || outcome === 'winner' || isSameId(winnerId, userId);
  const userLost = outcome === 'loss' || outcome === 'lose' || outcome === 'loser' || isSameId(loserId, userId) || (status === 'finished' && Boolean(winnerId) && !isSameId(winnerId, userId));

  return {
    raw: rawResult,
    viewerMatchResult,
    viewerResult: userWon ? 'win' : userLost ? 'loss' : viewerResult,
    status,
    winnerId: normalizeId(winnerId),
    loserId: normalizeId(loserId),
    reward: viewerMatchResult?.reward ?? rawResult?.reward ?? data.matchReward ?? match.winReward ?? 0,
    xp: viewerMatchResult?.xpEarned ?? rawResult?.xpEarned ?? rawResult?.xp ?? rawResult?.xpGained ?? (userWon ? 120 : userLost ? 40 : 0),
    rankPoints: viewerMatchResult?.rankPoints ?? rawResult?.rankPoints ?? (userWon ? 15 : userLost ? 5 : 0),
    reason: rawResult?.reason || rawResult?.challenge || match.lastAction?.type || 'match_result',
    actualCount: rawResult?.actualCount,
    bidWasTrue: rawResult?.bidWasTrue,
    penalty: rawResult?.penalty,
    isFinished: status === 'finished' || Boolean(rawResult || viewerMatchResult),
    userWon,
    userLost,
  };
}

function buildWinner(match = {}, result = {}, user = {}) {
  const players = Array.isArray(match.players) ? match.players : [];
  const viewerPlayer = players.find((player) => hasMatchingIdentity(player, user));
  const winnerPlayer = players.find((player) => isSameId(playerId(player), result.winnerId));
  const loserPlayer = players.find((player) => isSameId(playerId(player), result.loserId));
  const fallbackPlayer = result.userWon ? winnerPlayer : result.userLost ? loserPlayer : winnerPlayer;
  const displayPlayer = viewerPlayer || fallbackPlayer || players[0] || user;

  const mergedPlayer = {
    ...user,
    ...displayPlayer,
    displayName: playerName(displayPlayer, user.displayName || user.username || 'Player'),
    username: displayPlayer.username || user.username,
    avatarUrl: resolveAvatarValue(displayPlayer.avatarUrl) ? displayPlayer.avatarUrl : user.avatarUrl,
    avatar: resolveAvatarValue(displayPlayer.avatar) ? displayPlayer.avatar : user.avatar,
    avatarId: resolveAvatarValue(displayPlayer.avatarId) ? displayPlayer.avatarId : user.avatarId,
    eventAvatar: resolveAvatarValue(displayPlayer.eventAvatar) ? displayPlayer.eventAvatar : user.eventAvatar,
  };

  return {
    ...mergedPlayer,
    avatarSrc: resolveAvatarSrc(mergedPlayer),
  };
}

function buildPlayerRows(match = {}, result = {}, featuredPlayer = {}) {
  const players = Array.isArray(match.players) ? match.players : [];
  const featuredId = playerId(featuredPlayer);
  const ordered = players
    .filter((player) => !isSameId(playerId(player), featuredId))
    .slice(0, 3)
    .map((player, index) => ({
      className: ['quetzal', 'ganesha', 'fenrir'][index] || `player-${index}`,
      avatar: fallbackPlayers[index]?.avatar || 'A3.png',
      avatarSrc: resolveAvatarSrc(player || fallbackPlayers[index]),
      name: playerName(player, fallbackPlayers[index]?.name || 'Player'),
      place: `${index + 2}${index === 0 ? 'ND' : index === 1 ? 'RD' : 'TH'} PLACE`,
      score: `${compactNumber(player.lives ?? player.diceCount ?? player.dice?.length, 0)} DICE`,
    }));

  return ordered.length ? ordered : fallbackPlayers.map((player) => ({
    ...player,
    avatarSrc: resolveAvatarSrc(player.avatar),
  }));
}

function buildSummary(match = {}, result = {}, tx) {
  const players = Array.isArray(match.players) ? match.players : [];
  const finalBid = result.raw?.bid || match.currentBid || match.previousBid;
  const statusText = result.userWon ? 'WINNER' : result.userLost ? 'LOSER' : 'COMPLETE';
  const titleAsset = result.userLost ? 'defeat.png' : 'vic.png';
  const mode = match.mode || match.type || 'Quick Match';
  const rankValue = result.rankPoints ? `+${result.rankPoints}` : '—';
  const scoreValue = result.actualCount !== undefined
    ? `${result.actualCount} actual`
    : result.penalty
      ? `Penalty ${result.penalty}`
      : result.reason || 'Complete';

  return [
    { icon: summaryIcons.mode, label: 'MODE', value: mode },
    { icon: summaryIcons.players, label: 'PLAYERS', value: String(players.length || match.maxPlayers || 4) },
    { icon: summaryIcons.finalBid, label: 'FINAL BID', value: formatBid(finalBid) },
    { icon: summaryIcons.score, label: 'ROUND SCORE', value: scoreValue },
    { icon: summaryIcons.duration, label: 'MATCH DURATION', value: formatDuration(match) },
    { icon: summaryIcons.rank, label: 'RANK PROGRESS', value: rankValue },
    { icon: summaryIcons.status, label: 'STATUS', value: statusText },
  ].map((item) => ({ ...item, label: tx(item.label), value: tx(String(item.value)) }));
}

function buildReplayTable(data = {}, match = {}) {
  const source = match.selectedTable || match.table || data.selectedTable || data.playNowTable || data.defaultTable || {};
  const tableId = match.tableId || match.selectedTableId || source.tableId || source.selectedTableId || source.id || source.key || source.tableKey || 'beginner';
  const selectedTableId = match.selectedTableId || match.tableId || source.selectedTableId || source.tableId || source.id || tableId;
  const tableKey = match.tableKey || source.tableKey || source.key || tableId;
  const maxPlayers = match.requiredPlayers || match.maxPlayers || source.requiredPlayers || source.maxPlayers || source.selectedPlayers;

  return {
    ...source,
    id: source.id || selectedTableId,
    tableId,
    selectedTableId,
    tableKey,
    key: source.key || tableKey,
    tableName: match.tableName || match.selectedTableName || source.tableName || source.name,
    selectedTableName: match.selectedTableName || match.tableName || source.selectedTableName || source.tableName || source.name,
    tableTitle: match.tableTitle || source.tableTitle || source.title,
    tableTier: match.tableTier || match.selectedTableTier || source.tableTier || source.tier,
    selectedTableTier: match.selectedTableTier || match.tableTier || source.selectedTableTier || source.tableTier || source.tier,
    tableType: match.tableType || source.tableType || source.type,
    ...(maxPlayers ? { maxPlayers, selectedPlayers: maxPlayers, requiredPlayers: maxPlayers } : {}),
  };
}


export default function WinScreen({ navigation, data, backendActions, backendStatus, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const match = data?.match || {};
  const currentMatchId = data?.currentMatchId || match?.id || match?.matchId || null;
  const requestedResultRef = useRef(null);
  const result = useMemo(() => getMatchResult(data), [data]);
  const winner = useMemo(() => buildWinner(match, result, user), [match, result, user]);
  const playerRows = useMemo(() => buildPlayerRows(match, result, winner), [match, result, winner]);
  const summary = useMemo(() => buildSummary(match, result, tx), [match, result, tx]);

  useEffect(() => {
    if (!currentMatchId || !backendActions?.loadMatchResult) return;
    if (requestedResultRef.current === currentMatchId) return;
    if (result.isFinished && result.raw) return;

    requestedResultRef.current = currentMatchId;
    backendActions.loadMatchResult(currentMatchId);
  }, [backendActions, currentMatchId, result.isFinished, result.raw]);

  const isLoadingResult = backendStatus?.loading && String(backendStatus.lastAction || '').startsWith('match.result');
  const statusText = result.userWon ? 'WINNER' : result.userLost ? 'LOSER' : 'COMPLETE';
  const titleAsset = result.userLost ? 'defeat.png' : 'vic.png';
  const completeTitle = result.userWon ? 'Quick Match Complete' : result.userLost ? 'Match Complete' : 'Match Result';
  const completeCopy = result.userWon
    ? 'You outplayed the table!'
    : result.userLost
      ? 'You lost this round. Try another table.'
      : 'Result loaded from the server.';
  const rewardAmount = result.userWon ? result.reward : 0;
  const xpAmount = result.xp || 0;
  const rankPoints = result.rankPoints || 0;

  const refreshThenNavigate = (target) => {
    backendActions?.refreshGameData?.();
    target?.();
  };

  const playAgainSameTable = () => {
    const replayTable = buildReplayTable(data, match);
    if (backendActions?.startMatchmaking) {
      backendActions.startMatchmaking(replayTable);
      return;
    }
    refreshThenNavigate(navigation.goRoomSelect || navigation.goMatchmaking);
  };

  const shareResult = async () => {
    const message = `${playerName(winner, 'Player')} finished a Liar’s Dice match as ${statusText}.`;
    try {
      if (navigator.share) await navigator.share({ title: 'Liar’s Dice Result', text: message });
      else await navigator.clipboard?.writeText(message);
    } catch (_error) {
      // Sharing is optional. Keep the button non-blocking.
    }
  };

  return (
    <section className={`screen win-screen win-screen--${result.userWon ? 'winner' : result.userLost ? 'loser' : 'complete'}`} aria-label={tx('Victory Screen')}>
      <ProfileHud className="win-profile" user={user} name={user.displayName || user.username || 'Player'} />

      <div className="win-currency win-currency--coins">
        <img className="win-currency__icon" src={`${asset}6.png`} alt="" draggable="false" />
        <span className="win-currency__value">{formatNumber(wallet.coins, '0')}</span>
        <img className="win-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>
      <div className="win-currency win-currency--gems">
        <img className="win-currency__icon" src={`${asset}7.png`} alt="" draggable="false" />
        <span className="win-currency__value">{formatNumber(wallet.gems, '0')}</span>
        <img className="win-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <img className="win-title" src={`${asset}${titleAsset}`} alt={tx(result.userLost ? 'Defeat You Lose' : 'Victory You Win')} draggable="false" />

      <div className="win-main-panel">
        <img className="win-main-panel__skin" src={`${asset}Pannal.png`} alt="" draggable="false" />

        <img className="win-treasure" src={`${asset}tr.png`} alt="" draggable="false" />

        <div className="win-winner">
          <img className="win-winner__avatar" src={resolveAvatarSrc(winner)} alt="" draggable="false" />
          <span className="win-winner__name">{playerName(winner, user.displayName || 'Player')}</span>
        </div>

        <div className="win-complete">
          <span className="win-complete__title">{tx(completeTitle)}</span>
          <span className="win-complete__copy">{tx(completeCopy)}</span>
        </div>

        <div className="win-rewards">
          <span className="win-rewards__title">{tx('YOUR REWARDS')}</span>
          <div className="win-reward win-reward--chips">
            <img src={`${asset}6.png`} alt="" draggable="false" />
            <span className="win-reward__label">{tx('CHIPS')}</span>
            <span className="win-reward__value">{formatReward(rewardAmount)}</span>
          </div>
          <div className="win-reward win-reward--xp">
            <img src={`${asset}10.png`} alt="" draggable="false" />
            <span className="win-reward__label">{tx('XP GAINED')}</span>
            <span className="win-reward__value">+ {formatNumber(xpAmount)} XP</span>
          </div>
        </div>

        <div className="win-rank-bonus">
          <img src={`${asset}1232132131.png`} alt="" draggable="false" />
          <span>{tx('RANK POINTS BONUS')}</span>
          <strong>{rankPoints ? `+${rankPoints}` : '—'}</strong>
          <img src={`${asset}23423423432.png`} alt="" draggable="false" />
        </div>

        <div className="win-summary">
          <span className="win-summary__header">{tx('MATCH SUMMARY')}</span>
          {summary.map((item) => (
            <div className="win-summary__row" key={item.label}>
              <img src={`${asset}${item.icon}`} alt="" draggable="false" />
              <span className="win-summary__label">{item.label}</span>
              <strong className="win-summary__value">{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="win-players">
          {playerRows.map((player) => (
            <div className={`win-player win-player--${player.className}`} key={`${player.name}-${player.place}`}>
              <img className="win-player__avatar" src={player.avatarSrc || resolveAvatarSrc(player.avatar)} alt="" draggable="false" />
              <span className="win-player__name">{player.name}</span>
              <span className="win-player__place">{tx(player.place)}</span>
              <img className="win-player__cup" src={`${asset}223432432.png`} alt="" draggable="false" />
              <span className="win-player__score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      {isLoadingResult ? <div className="win-network-status">{tx('Loading result...')}</div> : null}
      {backendStatus?.error ? <div className="win-network-status win-network-status--error">{backendStatus.error}</div> : null}

      <button className="win-action win-action--again" type="button" onClick={playAgainSameTable} disabled={isLoadingResult || backendStatus?.loading}>
        <img className="win-action__skin" src={`${asset}B1.png`} alt="" draggable="false" />
        <span className="win-action__title">{tx('PLAY AGAIN')}</span>
        <span className="win-action__subtitle">{tx('Join same table queue')}</span>
      </button>
      <button className="win-action win-action--share" type="button" onClick={shareResult}>
        <img className="win-action__skin" src={`${asset}bt1.png`} alt="" draggable="false" />
        <span className="win-action__title">{tx('SHARE')}</span>
        <span className="win-action__subtitle">{tx('Share with friends!')}</span>
      </button>
      <button className="win-action win-action--lobby" type="button" onClick={() => refreshThenNavigate(navigation.goMainMenu)} disabled={isLoadingResult}>
        <img className="win-action__skin" src={`${asset}bt2.png`} alt="" draggable="false" />
        <span className="win-action__title">{tx('BACK TO LOBBY')}</span>
        <span className="win-action__subtitle">{tx('Return to main menu')}</span>
      </button>
    </section>
  );
}
