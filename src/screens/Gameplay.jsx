import { useEffect, useMemo, useState } from 'react';
import { resolveProfileAvatarSrc as resolveAvatarSrc } from '../utils/profileAvatars.js';

const asset = '/assets/liars-dice/gameplay/';

const FALLBACK_DICE = [4, 2, 5, 5, 1, 1];
const faceOptions = [1, 2, 3, 4, 5, 6];
const quantityOptions = [1, 2, 3, 4, 5, 6, 7];
const PANEL_SKINS = {
  left: 'bb3.png',
  center: 'bb2.png',
  right: 'bb1.png',
  fourth: 'bb3.png',
};

const panelLayoutBySlot = {
  fourth: { className: 'gameplay-player--fourth', skin: PANEL_SKINS.fourth, fallbackName: 'Player 4' },
  left: { className: 'gameplay-player--sophie', skin: PANEL_SKINS.left, fallbackName: 'Player 2' },
  center: { className: 'gameplay-player--you', skin: PANEL_SKINS.center, fallbackName: 'You' },
  right: { className: 'gameplay-player--dragon', skin: PANEL_SKINS.right, fallbackName: 'Player 3' },
};

function clampDie(value) {
  const die = Number(value);
  return Number.isInteger(die) && die >= 1 && die <= 6 ? die : 1;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function playerName(player, fallback = 'Player') {
  return player?.displayName || player?.username || player?.name || fallback;
}

function playerId(player) {
  return player?.id || player?.userId || player?.playerId || player?._id || player?.socketUserId || null;
}

function playerIdentityValues(player) {
  if (!player || typeof player !== 'object') return [];
  return [player.id, player.userId, player.playerId, player._id, player.socketUserId, player.accountId]
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(String);
}

function samePlayer(left, right) {
  const leftIds = playerIdentityValues(left);
  const rightIds = playerIdentityValues(right);
  if (!leftIds.length || !rightIds.length) return false;
  return leftIds.some((id) => rightIds.includes(id));
}

function formatTimer(value) {
  const timer = toNumber(value, 15);
  return `${Math.max(0, Math.trunc(timer))}S`;
}

function getLiveTurnSeconds(match, tick = Date.now()) {
  if (!match || match.status !== 'active') return toNumber(match?.turnTimer, 15);

  if (match.turnDeadlineAt) {
    const deadline = new Date(match.turnDeadlineAt).getTime();
    if (Number.isFinite(deadline)) return Math.max(0, Math.ceil((deadline - tick) / 1000));
  }

  if (Number.isFinite(Number(match.turnTimeRemainingMs))) {
    return Math.max(0, Math.ceil(Number(match.turnTimeRemainingMs) / 1000));
  }

  return toNumber(match.turnTimer, 15);
}

function Die({ value, className = '' }) {
  return <img className={className} src={`${asset}n${clampDie(value)}.png`} alt="" draggable="false" />;
}

function HiddenDie({ className = '' }) {
  return <span className={`${className} gameplay-hidden-die`} aria-label="Hidden die" />;
}

function renderDice(player, className, max = 6) {
  const visibleDice = Array.isArray(player?.dice) ? player.dice.filter((value) => Number(value) >= 1) : [];
  if (visibleDice.length) {
    return visibleDice.slice(0, max).map((value, index) => (
      <Die key={`${playerId(player) || playerName(player)}-${index}-${value}`} value={value} className={className} />
    ));
  }

  const hiddenCount = Math.min(toNumber(player?.diceCount || player?.lives, 0), max);
  return Array.from({ length: hiddenCount }, (_, index) => (
    <HiddenDie key={`${playerId(player) || playerName(player)}-hidden-${index}`} className={className} />
  ));
}

function PlayerPanel({ className, skin, player, fallbackName, isTurnPlayer = false }) {
  if (!player) return null;

  const count = toNumber(player?.diceCount ?? player?.lives ?? player?.dice?.length, 0);
  const isEliminated = Boolean(player?.eliminated || player?.active === false || count <= 0);

  return (
    <div className={`gameplay-player ${className} ${isTurnPlayer ? 'is-active' : ''} ${isEliminated ? 'is-eliminated' : ''}`}>
      <img className="gameplay-player__skin" src={`${asset}${skin}`} alt="" draggable="false" />
      <img className="gameplay-player__avatar" src={resolveAvatarSrc(player)} alt="" draggable="false" />
      <span className="gameplay-player__name">{playerName(player, fallbackName)}</span>
      <div className="gameplay-player__countRow">
        <Die value={4} className="gameplay-player__countDie" />
        <span className="gameplay-player__countValue">{count || '-'}</span>
      </div>
      <div className="gameplay-player__diceRow">
        {renderDice(player, 'gameplay-player__miniDie', 5)}
      </div>
    </div>
  );
}

function ActionButton({ className, skin, title, subtitle, onClick, disabled, tx }) {
  return (
    <button className={`gameplay-action ${className}`} type="button" onClick={onClick} disabled={disabled}>
      <img className="gameplay-action__skin" src={`${asset}${skin}`} alt="" draggable="false" />
      <span className="gameplay-action__title">{tx(title)}</span>
      <span className="gameplay-action__subtitle">{tx(subtitle)}</span>
    </button>
  );
}

function getActivePlayer(match) {
  if (!match?.players?.length) return null;
  const activeId = match.turnPlayerId || match.activePlayerId;
  return match.players.find((player) => playerId(player) === activeId) || match.players.find((player) => player.active) || match.players[0];
}

function getViewerPlayer(match, user) {
  if (!match?.players?.length) return null;

  const viewerRefs = [match.me, match.viewer, match.currentUser, user]
    .filter((item) => item && typeof item === 'object');

  for (const viewerRef of viewerRefs) {
    const matchPlayer = match.players.find((player) => samePlayer(player, viewerRef));
    if (matchPlayer) return matchPlayer;
  }

  return match.players.find((player) => !player?.isBot) || match.players[0];
}

function getPanelItems(match, user) {
  const players = Array.isArray(match?.players) ? match.players.filter(Boolean) : [];
  const viewer = getViewerPlayer(match, user) || {
    id: user?.id || user?.userId || user?.playerId || 'viewer',
    username: user?.displayName || user?.username || 'You',
    avatar: user?.avatar,
    avatarId: user?.avatarId,
    avatarUrl: user?.avatarUrl,
    dice: FALLBACK_DICE.slice(0, 5),
    diceCount: 5,
    active: true,
  };

  const opponents = players.filter((player) => !samePlayer(player, viewer));
  const items = [{ slot: 'center', player: viewer }];

  if (opponents[0]) items.push({ slot: 'left', player: opponents[0] });
  if (opponents[1]) items.push({ slot: 'right', player: opponents[1] });
  if (opponents[2]) items.push({ slot: 'fourth', player: opponents[2] });

  const renderOrder = ['fourth', 'left', 'center', 'right'];
  return items
    .sort((left, right) => renderOrder.indexOf(left.slot) - renderOrder.indexOf(right.slot))
    .map((item) => ({ ...item, ...panelLayoutBySlot[item.slot] }));
}

function getActorName(match, actorId) {
  const player = match?.players?.find((item) => playerId(item) === actorId);
  return playerName(player, actorId || 'Player');
}

function describeLastAction(match, tx) {
  const action = match?.lastAction || null;
  if (!action) return tx('Waiting for first bid');

  const actor = getActorName(match, action.by || action.playerId);
  if (action.type === 'bid') return `${actor} ${tx('raised the bid')}`;
  if (action.type === 'call_liar' || action.type === 'call_lira') return `${actor} ${tx('called liar')}`;
  if (action.type === 'slam') return `${actor} ${tx('used slam')}`;
  if (action.type === 'reroll') return `${actor} ${tx('re-rolled dice')}`;
  if (action.type === 'finish') return `${actor} ${tx('finished the match')}`;
  return tx('Match updated');
}

function getMatchRoundResult(match, data) {
  if (match?.roundResult) return match.roundResult;
  if (data?.roundResult) return data.roundResult;
  if (match?.lastRoundResult) return match.lastRoundResult;
  return null;
}

function normalizedActionList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => String(item || '').toLowerCase()).filter(Boolean);
}

function bidLabel(bid) {
  if (!bid) return '-';
  return `${toNumber(bid.quantity, 0)} x ${toNumber(bid.face, 0)}`;
}

function describeRoundResult(roundResult, tx) {
  if (!roundResult) return '';

  if (roundResult.challengeType === 'forfeit') {
    return `${roundResult.loserName || tx('Player')} ${tx('forfeited the match')}`;
  }

  const loserName = roundResult.loserName || tx('Player');
  const diceLost = toNumber(roundResult.diceLost, 1);
  const bidTruth = roundResult.bidWasTrue ? tx('Bid was true') : tx('Bid was false');
  return `${bidTruth}. ${loserName} ${tx('lost')} ${diceLost} ${diceLost === 1 ? tx('die') : tx('dice')}.`;
}

function roundResultTitle(roundResult, tx) {
  if (!roundResult) return tx('Round Result');
  if (roundResult.challengeType === 'forfeit') return tx('Forfeit');
  return roundResult.bidWasTrue ? tx('Bid Confirmed') : tx('Liar Caught');
}

function revealedDiceRows(roundResult) {
  return Array.isArray(roundResult?.revealedDice) ? roundResult.revealedDice.filter(Boolean) : [];
}

function nextDefaultBid(currentBid, totalDice) {
  if (!currentBid) return { quantity: Math.min(1, totalDice || 1), face: 1 };
  if (toNumber(currentBid.face, 1) < 6) return { quantity: currentBid.quantity, face: toNumber(currentBid.face, 1) + 1 };
  return { quantity: Math.min(toNumber(currentBid.quantity, 1) + 1, totalDice || 7), face: 1 };
}

function isValidBid(currentBid, quantity, face) {
  if (!currentBid) return quantity >= 1 && face >= 1 && face <= 6;
  const currentQuantity = toNumber(currentBid.quantity, 0);
  const currentFace = toNumber(currentBid.face, 0);
  return quantity > currentQuantity || (quantity === currentQuantity && face > currentFace);
}

export default function Gameplay({ navigation, data, backendActions, backendStatus, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const isChinese = i18n?.language === 'zh';
  const bidSelectorSkin = isChinese ? '/assets/liars-dice/localized/zh/gameplay-bid-panel.png' : `${asset}234.png`;
  const match = data?.match || null;
  const currentMatchId = data?.currentMatchId || match?.id || match?.matchId || null;
  const user = data?.user || {};
  const activePlayer = getActivePlayer(match);
  const panelItems = getPanelItems(match, user);
  const totalDice = toNumber(match?.totalDiceInPlay, (match?.players || []).reduce((sum, player) => sum + toNumber(player?.diceCount || player?.dice?.length, 0), 0));
  const currentBid = match?.currentBid || null;
  const previousBid = match?.previousBid || null;
  const viewerPlayer = getViewerPlayer(match, user);
  const myTurn = Boolean(match?.myTurn) || samePlayer(activePlayer, viewerPlayer) || samePlayer(activePlayer, user);
  const isFinished = match?.status === 'finished';
  const isBusy = Boolean(backendStatus?.loading && String(backendStatus.lastAction || '').startsWith('match.'));
  const canAct = Boolean(currentMatchId && match && !isFinished && myTurn && !isBusy);
  const availableActions = normalizedActionList(match?.availableActions);
  const disabledActions = normalizedActionList(match?.disabledActions);
  const hasServerActionRules = availableActions.length > 0 || disabledActions.length > 0;
  const canSubmitBid = canAct && (!hasServerActionRules || availableActions.includes('bid')) && !disabledActions.includes('bid');
  const canCallLiar = canAct && Boolean(currentBid) && (!hasServerActionRules || availableActions.includes('call_liar') || availableActions.includes('call_lira')) && !disabledActions.includes('call_liar') && !disabledActions.includes('call_lira');
  const canSlam = canAct && Boolean(currentBid) && availableActions.includes('slam') && !disabledActions.includes('slam');
  const canReroll = canAct && availableActions.includes('reroll') && !disabledActions.includes('reroll');
  const roundResult = getMatchRoundResult(match, data);
  const showRoundResult = Boolean(match && roundResult && !isFinished);
  const revealedRows = revealedDiceRows(roundResult);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const liveTurnSeconds = getLiveTurnSeconds(match, clockTick);

  useEffect(() => {
    if (!match || match.status !== 'active') return undefined;
    const interval = window.setInterval(() => setClockTick(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [match?.id, match?.status, match?.turnDeadlineAt]);

  const defaultBid = useMemo(() => nextDefaultBid(currentBid, totalDice || 7), [currentBid, totalDice]);
  const [selectedQuantity, setSelectedQuantity] = useState(defaultBid.quantity || 1);
  const [selectedFace, setSelectedFace] = useState(defaultBid.face || 1);

  useEffect(() => {
    if (!currentMatchId && match) return undefined;

    if (backendActions?.joinGameplaySocket) {
      backendActions.joinGameplaySocket(currentMatchId || undefined);
      return () => backendActions?.stopGameplaySocket?.();
    }

    if (backendActions?.refreshMatch) {
      backendActions.refreshMatch(currentMatchId || undefined);
    }

    return undefined;
    // Run only when the match id changes; backendActions is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMatchId]);

  useEffect(() => {
    setSelectedQuantity(Math.max(1, Math.min(7, defaultBid.quantity || 1)));
    setSelectedFace(Math.max(1, Math.min(6, defaultBid.face || 1)));
  }, [defaultBid.quantity, defaultBid.face]);

  useEffect(() => {
    if (isFinished) navigation?.goWin?.();
  }, [isFinished, navigation]);

  const submitBid = () => backendActions?.submitGameAction?.({
    matchId: currentMatchId,
    type: 'bid',
    bid: { quantity: selectedQuantity, face: selectedFace },
  });

  const submitSimpleAction = (type) => backendActions?.submitGameAction?.({ matchId: currentMatchId, type });
  const submitLeaveMatch = () => {
    if (!currentMatchId || isBusy) return;
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(tx('Leave this match? This will count as a loss.'));
    if (!confirmed) return;
    backendActions?.leaveMatch?.(currentMatchId);
  };
  const bidIsValid = isValidBid(currentBid, selectedQuantity, selectedFace);
  const challengeDisabled = !canCallLiar;
  const bidDisabled = !canSubmitBid || !bidIsValid;
  const slamDisabled = !canSlam;
  const rerollDisabled = !canReroll;
  const turnName = playerName(activePlayer, myTurn ? 'You' : 'Player');

  return (
    <section className={`screen gameplay-screen gameplay-screen--players-${panelItems.length}`} aria-label={tx('Gameplay')}>
      {panelItems.map((item) => (
        <PlayerPanel
          key={`${item.slot}-${playerId(item.player) || playerName(item.player, item.fallbackName)}`}
          className={item.className}
          skin={item.skin}
          player={item.player}
          fallbackName={item.fallbackName}
          isTurnPlayer={samePlayer(item.player, activePlayer)}
        />
      ))}

      <div className="gameplay-turnbar">
        <img className="gameplay-turnbar__skin" src={`${asset}11.png`} alt="" draggable="false" />
        <img className="gameplay-turnbar__avatarBg" src={`${asset}BGBB.png`} alt="" draggable="false" />
        <img className="gameplay-turnbar__avatar" src={resolveAvatarSrc(activePlayer || viewerPlayer || user)} alt="" draggable="false" />
        <span className="gameplay-turnbar__title">{tx(myTurn ? 'YOUR TURN' : `${turnName}’S TURN`)}</span>
        <div className="gameplay-turnbar__countRow">
          <Die value={4} className="gameplay-turnbar__countDie" />
          <span className="gameplay-turnbar__countValue">{toNumber(activePlayer?.diceCount ?? activePlayer?.lives ?? activePlayer?.dice?.length, 0) || '-'}</span>
        </div>
        <div className="gameplay-turnbar__diceRow">
          {renderDice(activePlayer || viewerPlayer, 'gameplay-turnbar__die', 5)}
        </div>
      </div>

      <div className="gameplay-timer">
        <img className="gameplay-timer__skin" src={`${asset}4.png`} alt="" draggable="false" />
        <img className="gameplay-timer__icon" src={`${asset}tt.png`} alt="" draggable="false" />
        <span className="gameplay-timer__value">{formatTimer(liveTurnSeconds)}</span>
      </div>

      <button className="gameplay-leave" type="button" onClick={submitLeaveMatch} disabled={!currentMatchId || isBusy || isFinished}>
        <img className="gameplay-leave__skin" src="/assets/liars-dice/gameplay/leave-button-red.png" alt="" draggable="false" />
        <span className="gameplay-leave__title">{tx('LEAVE')}</span>
        <span className="gameplay-leave__subtitle">{tx('Forfeit match')}</span>
      </button>

      <div className="gameplay-current-bid">
        <img className="gameplay-current-bid__skin" src={`${asset}4.png`} alt="" draggable="false" />
        <div className="gameplay-current-bid__header">{tx('CURRENT BID')}</div>
        <div className="gameplay-current-bid__main">
          {currentBid ? <span>{toNumber(currentBid.quantity, 0)} x</span> : <span>- x</span>}
          <Die value={currentBid?.face || 1} className="gameplay-current-bid__die" />
        </div>
        <span className="gameplay-current-bid__total">{tx('TOTAL DICE IN PLAY')}: {totalDice || '-'}</span>
        <span className="gameplay-current-bid__label">{tx('LAST ACTION')}</span>
        <span className="gameplay-current-bid__copy">{describeLastAction(match, tx)}</span>
        <div className="gameplay-current-bid__last">
          {previousBid ? <span>{toNumber(previousBid.quantity, 0)} x</span> : <span>- x</span>}
          <Die value={previousBid?.face || 1} className="gameplay-current-bid__lastDie" />
        </div>
      </div>

      <div className="gameplay-round-badge">
        <span className="gameplay-round-badge__label">{tx('ROUND')}</span>
        <span className="gameplay-round-badge__value">{toNumber(match?.roundNumber, 1)}</span>
      </div>

      {showRoundResult ? (
        <div className="gameplay-round-result">
          <div className="gameplay-round-result__title">{roundResultTitle(roundResult, tx)}</div>
          <div className="gameplay-round-result__summary">{describeRoundResult(roundResult, tx)}</div>
          <div className="gameplay-round-result__meta">
            <span>{tx('Bid')}: {bidLabel(roundResult?.bid)}</span>
            <span>{tx('Actual')}: {toNumber(roundResult?.actualCount, 0)}</span>
          </div>
          {revealedRows.length ? (
            <div className="gameplay-round-result__revealed">
              {revealedRows.map((row) => (
                <div className="gameplay-round-result__player" key={`revealed-${row.userId || row.id || row.playerId}`}>
                  <span className="gameplay-round-result__playerName">{playerName(row, 'Player')}</span>
                  <div className="gameplay-round-result__dice">
                    {(Array.isArray(row.dice) ? row.dice : []).map((value, index) => (
                      <Die key={`${row.userId || row.id || row.playerId}-${index}-${value}`} value={value} className="gameplay-round-result__die" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="gameplay-cups">
        <img className="gameplay-cups__image" src={`${asset}gameplay-cups.png`} alt="" draggable="false" />
      </div>

      <div className="gameplay-bid-selector">
        <img className="gameplay-bid-selector__skin" src={bidSelectorSkin} alt="" draggable="false" />
        <div className="gameplay-bid-selector__quantityRow">
          {quantityOptions.map((value) => {
            const maxQuantity = Math.max(1, Math.min(7, totalDice || 7));
            const disabled = value > maxQuantity;
            return (
              <button
                key={`qty-${value}`}
                type="button"
                className={`gameplay-bid-selector__quantity gameplay-bid-selector__quantity--${value} ${value === selectedQuantity ? 'is-active' : ''}`}
                onClick={() => setSelectedQuantity(value)}
                aria-pressed={value === selectedQuantity}
                disabled={disabled}
              >
                {value === selectedQuantity ? (
                  <img className="gameplay-bid-selector__selectedSkin" src={`${asset}quantity-selected.png`} alt="" draggable="false" />
                ) : null}
                <span className="gameplay-bid-selector__quantityText">{value}</span>
              </button>
            );
          })}
        </div>
        <div className="gameplay-bid-selector__faceRow">
          {faceOptions.map((value) => {
            const disabled = Boolean(currentBid && selectedQuantity === toNumber(currentBid.quantity, 0) && value <= toNumber(currentBid.face, 0));
            return (
              <button
                key={`face-${value}`}
                type="button"
                className={`gameplay-bid-selector__faceBtn ${value === selectedFace ? 'is-active' : ''}`}
                onClick={() => setSelectedFace(value)}
                aria-pressed={value === selectedFace}
                disabled={disabled}
              >
                <Die value={value} className="gameplay-bid-selector__die" />
              </button>
            );
          })}
        </div>
      </div>

      <button className="gameplay-reroll" type="button" onClick={() => submitSimpleAction('reroll')} disabled={rerollDisabled}>
        <img className="gameplay-reroll__skin" src={`${asset}1234.png`} alt="" draggable="false" />
        <span className="gameplay-reroll__title">{tx('RE-ROLL')}</span>
        <span className="gameplay-reroll__count">{canReroll ? (match?.rerollsRemaining ?? 1) : 'OFF'}</span>
      </button>

      <div className="gameplay-action-tray">
        <img className="gameplay-action-tray__skin" src={`${asset}Panal.png`} alt="" draggable="false" />
      </div>

      <ActionButton className="gameplay-action--raise" skin="B!.png" title="RAISE BID" subtitle={bidIsValid ? 'Increase the bid' : 'Bid must be higher'} onClick={submitBid} disabled={bidDisabled} tx={tx} />
      <ActionButton className="gameplay-action--call" skin="B2.png" title="CALL LIRA" subtitle="Challenge the bet" onClick={() => submitSimpleAction('call_liar')} disabled={challengeDisabled} tx={tx} />
      <ActionButton className="gameplay-action--slam" skin="B3.png" title="SLAM" subtitle="Disabled in Classic" onClick={() => submitSimpleAction('slam')} disabled={slamDisabled} tx={tx} />
      <ActionButton className="gameplay-action--confirm" skin="B4.png" title="CONFIRM" subtitle="Submit your bid" onClick={submitBid} disabled={bidDisabled} tx={tx} />

      {!currentMatchId ? (
        <div className="gameplay-status gameplay-status--warning">{tx('No active match. Start matchmaking first.')}</div>
      ) : null}
      {backendStatus?.error ? (
        <div className="gameplay-status gameplay-status--error">{backendStatus.error}</div>
      ) : null}
      {isBusy ? (
        <div className="gameplay-status gameplay-status--loading">{tx('Updating match...')}</div>
      ) : null}
    </section>
  );
}
