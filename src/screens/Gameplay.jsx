import { useEffect, useMemo, useRef, useState } from 'react';
import { resolveProfileAvatarSrc as resolveAvatarSrc } from '../utils/profileAvatars.js';
import { startVoiceChatSession } from '../services/voiceChatService.js';

const asset = '/assets/liars-dice/gameplay/';

const FALLBACK_DICE = [4, 2, 5, 5, 1, 1];
const faceOptions = [1, 2, 3, 4, 5, 6];
const DEFAULT_COIN_BET_OPTIONS = [100, 200, 500, 1000];
const TURN_INTRO_PHASE = Object.freeze({
  IDLE: 'idle',
  SHAKE: 'shake',
  CENTER: 'center',
  FLY: 'fly',
  DONE: 'done',
});
const TURN_INTRO_TIMINGS = {
  shakeMs: 650,
  centerMs: 600,
  flyMs: 500,
  settleMs: 150,
};
const TURN_INTRO_ACTIVE_PHASES = new Set([
  TURN_INTRO_PHASE.SHAKE,
  TURN_INTRO_PHASE.CENTER,
  TURN_INTRO_PHASE.FLY,
  TURN_INTRO_PHASE.DONE,
]);
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
  if (!left || !right) return false;

  const leftIds = playerIdentityValues(left);
  const rightIds = playerIdentityValues(right);
  if (leftIds.length && rightIds.length && leftIds.some((id) => rightIds.includes(id))) return true;

  // Some guest/bot payloads arrive without stable ids. In that case, keep turn detection usable by name.
  const leftName = playerName(left, '').trim().toLowerCase();
  const rightName = playerName(right, '').trim().toLowerCase();
  return Boolean(leftName && rightName && leftName === rightName);
}

const PLAYER_DICE_KEYS = [
  'dice',
  'diceValues',
  'diceValue',
  'currentDice',
  'rolledDice',
  'rolls',
  'diceRolls',
  'hand',
  'handDice',
  'ownDice',
  'privateDice',
  'visibleDice',
  'viewerDice',
  'myDice',
];

const PLAYER_DICE_COUNT_KEYS = [
  'diceCount',
  'lives',
  'diceLeft',
  'remainingDice',
  'remainingDiceCount',
  'diceTotal',
  'totalDice',
  'handSize',
];

const MATCH_VIEWER_DICE_KEYS = [
  'myDice',
  'viewerDice',
  'ownDice',
  'privateDice',
  'currentPlayerDice',
  'activePlayerDice',
  'playerDice',
];

function readDiceArray(source, keys = PLAYER_DICE_KEYS) {
  if (!source || typeof source !== 'object') return [];

  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      const dice = value.map((item) => Number(item)).filter((item) => Number.isInteger(item) && item >= 1 && item <= 6);
      if (dice.length) return dice;
    }
  }

  const nestedSources = [source.state, source.roundState, source.privateState, source.publicState, source.playerState].filter(Boolean);
  for (const nestedSource of nestedSources) {
    const dice = readDiceArray(nestedSource, keys);
    if (dice.length) return dice;
  }

  return [];
}

function getPlayerDiceValues(player) {
  return readDiceArray(player);
}

function getMatchViewerDiceValues(match) {
  return readDiceArray(match, MATCH_VIEWER_DICE_KEYS);
}

function getPlayerDiceCount(player, fallback = 0) {
  if (!player || typeof player !== 'object') return fallback;

  for (const key of PLAYER_DICE_COUNT_KEYS) {
    const count = Number(player[key]);
    if (Number.isFinite(count) && count > 0) return Math.trunc(count);
  }

  const dice = getPlayerDiceValues(player);
  if (dice.length) return dice.length;

  return fallback;
}

function getTurnDicePlayer(match, activePlayer, viewerPlayer, user, myTurn) {
  const activeDice = getPlayerDiceValues(activePlayer);
  const viewerDice = getPlayerDiceValues(viewerPlayer);
  const matchViewerDice = getMatchViewerDiceValues(match);
  const shouldUseViewerDice = Boolean(myTurn || samePlayer(activePlayer, viewerPlayer) || samePlayer(activePlayer, user));

  const dice = activeDice.length
    ? activeDice
    : shouldUseViewerDice && viewerDice.length
      ? viewerDice
      : shouldUseViewerDice && matchViewerDice.length
        ? matchViewerDice
        : [];

  const count = getPlayerDiceCount(activePlayer, getPlayerDiceCount(viewerPlayer, dice.length || 0));

  return {
    ...(activePlayer || viewerPlayer || user || {}),
    ...(shouldUseViewerDice && viewerPlayer ? {
      diceCount: getPlayerDiceCount(viewerPlayer, count),
      lives: viewerPlayer.lives ?? viewerPlayer.diceCount ?? count,
    } : {}),
    dice,
    diceCount: count || dice.length || (shouldUseViewerDice ? 5 : 0),
  };
}

function formatTimer(value) {
  const timer = toNumber(value, 30);
  return `${Math.max(0, Math.trunc(timer))}s`;
}

function formatAmount(value, fallback = '0') {
  const sanitized = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
  const number = Number(sanitized);
  if (!Number.isFinite(number)) return fallback;
  return number.toLocaleString('en-US');
}

function getPlayerStack(player, fallback = 0) {
  const values = [
    player?.stack,
    player?.currentStack,
    player?.matchStack,
    player?.coinsStack,
    player?.coins,
    player?.coinBalance,
    player?.walletCoins,
    player?.chipStack,
    player?.balance,
  ];

  for (const value of values) {
    const sanitized = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
    const number = Number(sanitized);
    if (Number.isFinite(number)) return number;
  }

  return fallback;
}

function readNumber(value, fallback = undefined) {
  if (value === undefined || value === null || value === '') return fallback;
  const sanitized = typeof value === 'string' ? value.replace(/,/g, '').trim() : value;
  const number = Number(sanitized);
  return Number.isFinite(number) ? number : fallback;
}

function firstPositiveNumber(...values) {
  for (const value of values) {
    const number = readNumber(value);
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return undefined;
}

function getBidControls(match = {}) {
  if (match?.bidControls && typeof match.bidControls === 'object') return match.bidControls;
  if (match?.bidRules && typeof match.bidRules === 'object') return match.bidRules;
  return {};
}

const OPENING_BID_DEFAULTS = Object.freeze({
  2: { ones: 2, open: 3 },
  3: { ones: 3, open: 4 },
  4: { ones: 4, open: 6 },
});

const CHAI_DEFAULT_STEP = 2;

function truthyFlag(value) {
  return value === true || value === 1 || value === '1' || String(value || '').toLowerCase() === 'true';
}

function normalizeJokerMode(source = {}) {
  const mode = String(
    source?.jokerMode
      ?? source?.jokerStatus
      ?? source?.wildMode
      ?? source?.onesMode
      ?? ''
  ).toLowerCase();

  if (truthyFlag(source?.zai) || truthyFlag(source?.isZai) || ['zai', 'zai_locked', 'joker_off', 'joker_still_off', 'wild_off'].includes(mode)) return 'zai';
  if (truthyFlag(source?.chai) || truthyFlag(source?.isChai) || ['chai', 'joker_on', 'open_joker', 'reopen_joker', 'wild_on'].includes(mode)) return 'chai';
  if (
    truthyFlag(source?.jokerLockedThisRound)
    || truthyFlag(source?.onesWereCalledThisRound)
    || truthyFlag(source?.onesLocked)
    || mode === 'ones_locked'
    || mode === 'locked'
  ) return 'ones_locked';

  return 'normal';
}

function isBidZai(bid = {}) {
  return normalizeJokerMode(bid) === 'zai';
}

function isBidChai(bid = {}) {
  return normalizeJokerMode(bid) === 'chai';
}

function getChaiQuantityStep(match = {}) {
  const controls = getBidControls(match);
  return Math.max(1, Math.trunc(readNumber(
    controls.chaiQuantityStep
      ?? match?.chaiQuantityStep
      ?? match?.gameRules?.chaiQuantityStep
      ?? CHAI_DEFAULT_STEP,
    CHAI_DEFAULT_STEP,
  )));
}

function getOpeningBidRules(match = {}, playerCount = 2) {
  const controls = getBidControls(match);
  const rawRules = controls.openingBidRules || match?.openingBidRules || match?.gameRules?.openingBidRules || {};
  const count = Math.max(2, Math.min(4, Math.trunc(readNumber(
    rawRules.playerCount
      ?? controls.playerCount
      ?? match?.playerCount
      ?? match?.players?.length
      ?? playerCount,
    playerCount,
  ))));
  const fallback = OPENING_BID_DEFAULTS[count] || OPENING_BID_DEFAULTS[4];

  return {
    playerCount: count,
    minOnesQuantity: Math.max(1, Math.trunc(readNumber(
      rawRules.minOnesQuantity
        ?? rawRules.minimumOnesQuantity
        ?? rawRules.minOnesBid
        ?? rawRules.ones
        ?? controls.minOpeningOnesQuantity,
      fallback.ones,
    ))),
    minOpenQuantity: Math.max(1, Math.trunc(readNumber(
      rawRules.minOpenQuantity
        ?? rawRules.minimumOpenQuantity
        ?? rawRules.minOpenBid
        ?? rawRules.open
        ?? controls.minOpeningOpenQuantity,
      fallback.open,
    ))),
  };
}

function getOpeningMinimumQuantity(match = {}, playerCount = 2, face = 1) {
  const rules = getOpeningBidRules(match, playerCount);
  return Number(face) === 1 ? rules.minOnesQuantity : rules.minOpenQuantity;
}

function getOpeningBidError(match = {}, currentBid = null, quantity = 1, face = 1, playerCount = 2, tx = (value) => value) {
  if (currentBid) return '';
  const minQuantity = getOpeningMinimumQuantity(match, playerCount, face);
  if (toNumber(quantity, 0) >= minQuantity) return '';

  const faceText = Number(face) === 1 ? '1' : tx('any face');
  return `${tx('Opening bid is too low')} (${minQuantity} x ${faceText})`;
}

function getBidJokerTag(bid = {}) {
  if (!bid) return '';
  const mode = normalizeJokerMode(bid);
  if (mode === 'zai') return 'ZAI';
  if (mode === 'chai') return 'CHAI';
  if (mode === 'ones_locked' || Number(bid?.face) === 1) return '1s LOCKED';
  return '';
}

function getMatchJokerDisplay(match = {}, bid = null, tx = (value) => value) {
  const source = {
    ...(match || {}),
    ...(bid || {}),
    jokerMode: bid?.jokerMode ?? match?.jokerMode,
    zai: bid?.zai ?? bid?.isZai ?? match?.zaiActive,
    chai: bid?.chai ?? bid?.isChai ?? match?.chaiActive,
  };
  const mode = normalizeJokerMode(source);
  const bidFace = Number(bid?.face);
  const onesLocked = mode === 'ones_locked' || bidFace === 1 || truthyFlag(match?.jokerLockedThisRound) || truthyFlag(match?.onesWereCalledThisRound);

  if (mode === 'zai') {
    return { mode: 'zai', label: tx('ZAI'), detail: tx('Joker OFF'), className: 'is-zai', jokerWildActive: false };
  }

  if (mode === 'chai') {
    return { mode: 'chai', label: tx('CHAI'), detail: tx('Joker ON'), className: 'is-chai', jokerWildActive: true };
  }

  if (onesLocked) {
    return { mode: 'ones_locked', label: tx('1s LOCKED'), detail: tx('Joker OFF'), className: 'is-locked', jokerWildActive: false };
  }

  return { mode: 'normal', label: tx('Joker ON'), detail: tx('1s are wild'), className: 'is-normal', jokerWildActive: true };
}

function buildBidJokerPayload({ currentBid, selectedQuantity, selectedFace, zaiEnabled, match }) {
  const currentQuantity = toNumber(currentBid?.quantity, 0);
  const chaiStep = getChaiQuantityStep(match);
  const currentJokerInfo = getMatchJokerDisplay(match, currentBid);
  const face = toNumber(selectedFace, 1);
  const zai = Boolean(zaiEnabled && face !== 1);
  const chai = Boolean(
    !zai
      && currentBid
      && currentJokerInfo.mode === 'zai'
      && face !== 1
      && toNumber(selectedQuantity, 0) >= currentQuantity + chaiStep
  );
  const onesLocked = face === 1;
  const jokerMode = zai ? 'zai' : chai ? 'chai' : onesLocked ? 'ones_locked' : 'normal';

  return {
    zai,
    isZai: zai,
    chai,
    isChai: chai,
    jokerMode,
    jokerWildActive: jokerMode === 'normal' || jokerMode === 'chai',
  };
}

function getSelectedBidJokerInfo({ currentBid, selectedQuantity, selectedFace, zaiEnabled, match, tx = (value) => value }) {
  const payload = buildBidJokerPayload({ currentBid, selectedQuantity, selectedFace, zaiEnabled, match });
  if (payload.zai) return { ...payload, label: tx('ZAI'), detail: tx('Joker OFF'), className: 'is-zai' };
  if (payload.chai) return { ...payload, label: tx('CHAI'), detail: tx('Joker ON'), className: 'is-chai' };
  if (payload.jokerMode === 'ones_locked') return { ...payload, label: tx('1s LOCKED'), detail: tx('Joker OFF'), className: 'is-locked' };
  return { ...payload, label: tx('Joker ON'), detail: tx('1s are wild'), className: 'is-normal' };
}

function cleanCoinOptions(options = [], min = 0, max = Infinity) {
  if (!Array.isArray(options)) return [];
  return Array.from(new Set(options
    .map((value) => readNumber(value))
    .filter((value) => Number.isFinite(value) && value > 0)
    .map((value) => Math.trunc(value))))
    .filter((value) => value >= min && value <= max)
    .sort((left, right) => left - right);
}

function getMinimumCoinBet(match = {}) {
  const controls = getBidControls(match);
  return firstPositiveNumber(
    controls.nextMinCoinAmount,
    controls.minCoinAmount,
    controls.minCoinBet,
    controls.minBidCoins,
    match?.nextMinCoinAmount,
    match?.minCoinBet,
    match?.minBidCoins,
    match?.pricing?.minCoinBet,
    match?.pricing?.minBidCoins,
    1,
  );
}

function isPlayerEliminatedForMatch(match = {}, player = null) {
  if (!player) return false;
  const stack = getPlayerStack(player, 0);
  const minimumStack = getMinimumCoinBet(match) || 1;
  const lives = readNumber(player?.lives ?? player?.diceCount);

  return Boolean(
    player?.eliminated
      || player?.bustedBelowMinimumBid
      || player?.eliminationReason === 'below_minimum_bid'
      || stack <= 0
      || (stack > 0 && stack < minimumStack)
      || lives === 0
  );
}

function getMaximumCoinBet(match = {}) {
  const controls = getBidControls(match);
  const value = firstPositiveNumber(
    controls.viewerMaxCoinAmount,
    controls.maxCoinAmount,
    controls.maxCoinBet,
    controls.maxBidCoins,
    match?.viewerMaxCoinAmount,
    match?.maxCoinBet,
    match?.maxBidCoins,
    match?.pricing?.maxCoinBet,
    match?.pricing?.maxBidCoins,
  );
  return value ?? Infinity;
}

function getCoinBetOptions(match = {}) {
  const controls = getBidControls(match);
  const min = getMinimumCoinBet(match);
  const max = getMaximumCoinBet(match);
  const rawOptions = Array.isArray(controls.coinBetOptions) && controls.coinBetOptions.length
    ? controls.coinBetOptions
    : Array.isArray(match?.coinBetOptions) && match.coinBetOptions.length
      ? match.coinBetOptions
      : Array.isArray(match?.pricing?.coinBetOptions) && match.pricing.coinBetOptions.length
        ? match.pricing.coinBetOptions
        : DEFAULT_COIN_BET_OPTIONS;
  const cleaned = cleanCoinOptions(rawOptions, min, max);
  if (cleaned.length) return cleaned;

  return cleanCoinOptions([min, match?.defaultCoinBet, match?.pricing?.defaultCoinBet, max], min, max);
}

function getMatchCoinBet(match) {
  const controls = getBidControls(match);
  const current = firstPositiveNumber(
    match?.currentBid?.coinBet,
    match?.currentBid?.coinAmount,
    match?.currentBid?.bidAmount,
    match?.currentBid?.betAmount,
    match?.currentBid?.amount,
    match?.currentBid?.coins,
    match?.currentBidCoinBet,
    match?.currentBidAmount,
    match?.currentCoinBet,
    match?.currentBet,
    match?.coinBet,
    match?.betAmount,
    match?.currentRoundCoinBet,
    controls.defaultCoinAmount,
    controls.minCoinAmount,
    match?.defaultCoinBet,
    match?.pricing?.defaultCoinBet,
  );
  return current ?? getMinimumCoinBet(match);
}

function getPerGameAmount(match = {}) {
  return firstPositiveNumber(
    match?.perGameAmount,
    match?.perGameCoins,
    match?.roundStake,
    match?.pricing?.perGameAmount,
    match?.pricing?.roundStake,
    match?.gameRules?.perGameAmount,
    match?.gameRules?.roundStake,
    getMatchCoinBet(match),
  );
}

function normalizePekPercentage(value, fallback = 25) {
  const number = Math.trunc(Number(value));
  return [25, 50, 100].includes(number) ? number : fallback;
}

function getPekSettings(match = {}) {
  const pricing = match?.pricing || {};
  const rules = match?.gameRules || match?.rules || {};
  const pekEnabled = Boolean(
    match?.pekEnabled ??
    match?.slamEnabled ??
    pricing.pekEnabled ??
    pricing.slamEnabled ??
    rules.pekEnabled ??
    rules.slamEnabled ??
    false,
  );
  const perGameAmount = getPerGameAmount(match) || 0;
  const pekPercentage = normalizePekPercentage(
    match?.pekPercentage ??
    match?.slamPercentage ??
    pricing.pekPercentage ??
    pricing.slamPercentage ??
    rules.pekPercentage ??
    rules.slamPercentage,
    25,
  );
  const finalPekAmount = firstPositiveNumber(
    match?.finalPekAmount,
    match?.finalSlamAmount,
    pricing.finalPekAmount,
    pricing.finalSlamAmount,
    rules.finalPekAmount,
    rules.finalSlamAmount,
  ) ?? (perGameAmount + Math.floor((perGameAmount * pekPercentage) / 100));

  return { pekEnabled, perGameAmount, pekPercentage, finalPekAmount };
}

function readPotValue(value) {
  if (value && typeof value === 'object') {
    return firstPositiveNumber(
      value.grossPot,
      value.grossPotPreview,
      value.totalPot,
      value.totalPotPreview,
      value.currentPot,
      value.netPot,
      value.netPotPreview,
      value.winnerPayout,
      value.winnerPayoutPreview,
    );
  }
  return readNumber(value);
}

function getTotalPot(match) {
  const values = [
    match?.totalPot,
    match?.grossPot,
    match?.grossPotPreview,
    match?.tablePot,
    match?.currentPot,
    match?.pot,
    match?.potCoins,
    match?.totalCoinPot,
    match?.pricing?.grossPot,
    match?.pricing?.grossPotPreview,
  ];

  for (const value of values) {
    const number = readPotValue(value);
    if (Number.isFinite(number) && number >= 0) return number;
  }

  return 0;
}

function getQuantityValues(totalDice) {
  const max = Math.max(1, Math.min(20, toNumber(totalDice, 1)));
  return Array.from({ length: max }, (_, index) => index + 1);
}


function turnIntroKeyPart(value) {
  if (value === null || value === undefined || value === '') return '';
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString() : '';
  return String(value);
}

function firstTurnIntroKeyPart(...values) {
  for (const value of values) {
    const normalized = turnIntroKeyPart(value);
    if (normalized) return normalized;
  }
  return '';
}

function hasTurnTimerStarted(match) {
  if (!match || match.status !== 'active') return false;
  if (match.turnStartedAt || match.turnDeadlineAt) return true;

  const remainingMs = Number(match.turnTimeRemainingMs);
  if (Number.isFinite(remainingMs) && remainingMs > 0) return true;

  // Local/bot matches often only expose a live turnTimer. Treat it as the timer-start signal.
  const timerSeconds = Number(match.turnTimer ?? match.turnSeconds ?? match.timer);
  if (Number.isFinite(timerSeconds) && timerSeconds > 0) return true;

  return false;
}

function getTurnIntroKey(match, activePlayer) {
  if (!match || match.status !== 'active' || !activePlayer || !hasTurnTimerStarted(match)) return '';

  const matchKey = firstTurnIntroKeyPart(match.id, match.matchId, match._id, 'local-match');
  const roundKey = firstTurnIntroKeyPart(match.roundId, match.roundNumber, match.round, 'round-1');
  const playerKey = firstTurnIntroKeyPart(...playerIdentityValues(activePlayer), playerName(activePlayer, 'active-player'));
  const explicitTurnKey = firstTurnIntroKeyPart(
    match.turnId,
    match.currentTurnId,
    match.turnSequence,
    match.turnNumber,
    match.turnIndex,
    match.turnStartedAt,
    match.turnDeadlineAt,
  );

  if (explicitTurnKey) return [matchKey, roundKey, playerKey, explicitTurnKey].join('::');

  const bid = match.currentBid || {};
  const lastAction = match.lastAction || {};
  const fallbackTurnKey = [
    firstTurnIntroKeyPart(lastAction.id, lastAction.actionId, lastAction.createdAt, lastAction.updatedAt, lastAction.type),
    firstTurnIntroKeyPart(lastAction.by, lastAction.playerId, lastAction.actorId),
    firstTurnIntroKeyPart(bid.id, bid.bidId, bid.createdAt, bid.updatedAt),
    firstTurnIntroKeyPart(bid.by, bid.playerId, bid.actorId),
    firstTurnIntroKeyPart(bid.quantity),
    firstTurnIntroKeyPart(bid.face),
    firstTurnIntroKeyPart(match.actionSequence, match.actionCount, match.version),
  ].filter(Boolean).join(':') || 'initial-turn';

  return [matchKey, roundKey, playerKey, fallbackTurnKey].join('::');
}


function getTurnIntroResetKey(match) {
  if (!match) return 'no-match';
  return [
    firstTurnIntroKeyPart(match.id, match.matchId, match._id, 'local-match'),
    firstTurnIntroKeyPart(match.roundId, match.roundNumber, match.round, 'round-1'),
    firstTurnIntroKeyPart(match.status, 'unknown-status'),
  ].join('::');
}

function getLiveTurnSeconds(match, tick = Date.now()) {
  if (!match || match.status !== 'active') return toNumber(match?.turnTimer, 30);

  if (match.turnDeadlineAt) {
    const deadline = new Date(match.turnDeadlineAt).getTime();
    if (Number.isFinite(deadline)) return Math.max(0, Math.ceil((deadline - tick) / 1000));
  }

  if (Number.isFinite(Number(match.turnTimeRemainingMs))) {
    return Math.max(0, Math.ceil(Number(match.turnTimeRemainingMs) / 1000));
  }

  return toNumber(match.turnTimer, 30);
}

function Die({ value, className = '', variant = 'white' }) {
  const die = clampDie(value);
  const filename = variant === 'red' ? `n${die}${die}.png` : `n${die}.png`;
  return <img className={className} src={`${asset}${filename}`} alt="" draggable="false" />;
}

function HiddenDie({ className = '' }) {
  return <span className={`${className} gameplay-hidden-die`} aria-label="Hidden die" />;
}

function renderDice(player, className, max = 6) {
  const visibleDice = getPlayerDiceValues(player);
  if (visibleDice.length) {
    return visibleDice.slice(0, max).map((value, index) => (
      <Die key={`${playerId(player) || playerName(player)}-${index}-${value}`} value={value} className={className} />
    ));
  }

  const hiddenCount = Math.min(getPlayerDiceCount(player, 0), max);
  return Array.from({ length: hiddenCount }, (_, index) => (
    <HiddenDie key={`${playerId(player) || playerName(player)}-hidden-${index}`} className={className} />
  ));
}

function isBotPlayer(player) {
  if (!player || typeof player !== 'object') return false;
  return Boolean(player.isBot || player.bot || player.cpu || player.isCpu || player.isAI || String(player.type || player.playerType || '').toLowerCase() === 'bot');
}

function isBotsMatch(match) {
  if (!match || typeof match !== 'object') return false;
  const mode = String(match.roomMode || match.gameMode || match.playMode || match.mode || '').toLowerCase();
  return mode === 'bots' || Boolean(match.botsEnabled || match.playWithBots || match.withBots) || (Array.isArray(match.players) && match.players.some(isBotPlayer));
}

function PlayerPanel({ className, skin, player, fallbackName, isTurnPlayer = false, match = null }) {
  if (!player) return null;

  const count = getPlayerDiceCount(player, 0);
  const stack = getPlayerStack(player, 0);
  const isEliminated = isPlayerEliminatedForMatch(match, player);
  const botClass = isBotPlayer(player) ? 'gameplay-player--bot' : '';

  const displayName = playerName(player, fallbackName);

  return (
    <div
      className={`gameplay-player ${className} ${botClass} ${isTurnPlayer ? 'is-active' : 'is-inactive'} ${isEliminated ? 'is-eliminated' : ''}`}
      data-active-player={isTurnPlayer ? 'true' : 'false'}
      title={displayName}
    >
      <img className="gameplay-player__skin" src={`${asset}${skin}`} alt="" draggable="false" />
      <img className="gameplay-player__avatar" src={resolveAvatarSrc(player)} alt="" draggable="false" />
      <span className="gameplay-player__name" title={displayName}>{displayName}</span>
      <div className="gameplay-player__coinRow">
        <img className="gameplay-player__coinIcon" src={`${asset}coin.png`} alt="" draggable="false" />
        <span className="gameplay-player__coinValue">{formatAmount(stack)}</span>
      </div>
      <div className="gameplay-player__diceRow">
        {renderDice(player, 'gameplay-player__miniDie', 5)}
      </div>
    </div>
  );
}


function chatMessageText(message = {}) {
  return String(message.text ?? message.message ?? message.body ?? '').trim();
}

function chatMessageName(message = {}) {
  return message.displayName || message.username || message.senderName || message.name || 'Player';
}

function chatMessageAvatar(message = {}) {
  return resolveAvatarSrc({
    avatar: message.avatar,
    avatarId: message.avatarId || message.avatar,
    avatarUrl: message.avatarUrl,
    username: chatMessageName(message),
  });
}

function formatChatTime(value) {
  const date = value ? new Date(value) : new Date();
  if (!Number.isFinite(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isOwnChatMessage(message = {}, user = {}, viewerPlayer = null) {
  const messageRefs = [
    message.userId,
    message.playerId,
    message.senderId,
    message.accountId,
  ].filter(Boolean).map(String);

  const viewerRefs = [
    user.id,
    user.userId,
    user.playerId,
    user._id,
    viewerPlayer?.id,
    viewerPlayer?.userId,
    viewerPlayer?.playerId,
    viewerPlayer?._id,
  ].filter(Boolean).map(String);

  return messageRefs.length > 0 && messageRefs.some((id) => viewerRefs.includes(id));
}

function ChatMessage({ message, user, viewerPlayer }) {
  const text = chatMessageText(message);
  if (!text) return null;

  const ownMessage = isOwnChatMessage(message, user, viewerPlayer);
  return (
    <div className={`gameplay-chat-message ${ownMessage ? 'gameplay-chat-message--own' : ''}`}>
      <img className="gameplay-chat-message__avatar" src={chatMessageAvatar(message)} alt="" draggable="false" />
      <div className="gameplay-chat-message__body">
        <div className="gameplay-chat-message__meta">
          <span className="gameplay-chat-message__name">{chatMessageName(message)}</span>
          <span className="gameplay-chat-message__time">{formatChatTime(message.createdAt || message.timestamp)}</span>
        </div>
        <div className="gameplay-chat-message__text">{text}</div>
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
  const playablePlayers = match.players.filter((player) => !isPlayerEliminatedForMatch(match, player));
  return playablePlayers.find((player) => playerId(player) === activeId)
    || playablePlayers.find((player) => player.active)
    || playablePlayers[0]
    || null;
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

function getBidderPlayer(match) {
  if (!match?.players?.length || !match?.currentBid) return null;
  const bidRefs = [
    match.currentBid.playerId,
    match.currentBid.userId,
    match.currentBid.bidderUserId,
  ].filter(Boolean).map(String);

  return match.players.find((player) => playerIdentityValues(player).some((id) => bidRefs.includes(id))) || null;
}

function getPekStackBlockReason({ pekSettings, viewerPlayer, bidderPlayer, tx }) {
  if (!pekSettings?.pekEnabled) return '';
  const required = Number(pekSettings.finalPekAmount || 0);
  if (!required) return '';
  if (getPlayerStack(viewerPlayer, 0) < required) return tx(`Need ${formatAmount(required)} stack`);
  if (bidderPlayer && getPlayerStack(bidderPlayer, 0) < required) return tx(`Bidder needs ${formatAmount(required)} stack`);
  return '';
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

function getTablePlayerCount(match, fallback = 2) {
  const values = [
    match?.requiredPlayers,
    match?.maxPlayers,
    match?.selectedPlayers,
    match?.playersCount,
    Array.isArray(match?.players) ? match.players.length : null,
    fallback,
  ];

  for (const value of values) {
    const count = Number(value);
    if (Number.isFinite(count) && count >= 2 && count <= 4) return count;
  }

  return 2;
}

function renderCupSlots(playerCount) {
  const safeCount = Math.min(Math.max(Number(playerCount) || 2, 2), 4);
  return Array.from({ length: safeCount }, (_, index) => (
    <img
      key={`cup-${safeCount}-${index}`}
      className={`gameplay-cups__cup gameplay-cups__cup--${safeCount}-${index + 1}`}
      src="/assets/liars-dice/gameplay/cup.png"
      alt=""
      draggable="false"
    />
  ));
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
  if (action.type === 'pek' || action.type === 'call_pek' || action.type === 'slam' || action.type === 'call_slam') return `${actor} ${tx('called Pek/Slam')}`;
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


function getRoundResultKey(roundResult) {
  if (!roundResult) return '';

  const bid = roundResult.bid || {};
  const revealedDiceSignature = Array.isArray(roundResult.revealedDice)
    ? roundResult.revealedDice.map((row) => `${playerId(row) || playerName(row, 'Player')}:${Array.isArray(row.dice) ? row.dice.join(',') : ''}`).join('|')
    : '';

  return [
    roundResult.id,
    roundResult.roundId,
    roundResult.roundNumber,
    roundResult.challengeType,
    bid.quantity,
    bid.face,
    roundResult.actualCount,
    roundResult.bidWasTrue,
    roundResult.loserId,
    roundResult.loserName,
    roundResult.createdAt,
    roundResult.updatedAt,
    roundResult.settledAt,
    revealedDiceSignature,
  ].filter((value) => value !== null && value !== undefined && value !== '').join('|');
}

function normalizedActionList(list) {
  if (!Array.isArray(list)) return [];
  return list.map((item) => String(item || '').toLowerCase()).filter(Boolean);
}

function readRerollState(match = {}, activePlayer = null) {
  const state = [
    match?.activeRerollState,
    match?.rerollState,
    match?.bidControls?.rerollState,
    match?.bidRules?.rerollState,
    match?.bidControls?.reroll,
    match?.bidRules?.reroll,
    match?.turnPlayer?.rerollState,
    activePlayer?.rerollState,
  ].find((candidate) => candidate && typeof candidate === 'object') || {};

  const limit = Math.max(1, Math.trunc(toNumber(
    state.limit
      ?? state.rerollLimitPerRound
      ?? match?.gameRules?.rerollLimitPerRound
      ?? match?.bidControls?.rerollLimitPerRound
      ?? 3,
    3,
  )));
  const used = Math.max(0, Math.trunc(toNumber(
    state.used
      ?? state.rerollsUsedThisRound
      ?? activePlayer?.rerollsUsedThisRound
      ?? match?.turnPlayer?.rerollsUsedThisRound
      ?? 0,
    0,
  )));
  const remaining = Math.max(0, Math.trunc(toNumber(state.remaining ?? (limit - used), limit - used)));
  const required = truthyFlag(state.required)
    || truthyFlag(state.mustReroll)
    || truthyFlag(match?.rerollRequired)
    || truthyFlag(match?.forcedReroll);

  return {
    ...state,
    enabled: state.enabled !== false,
    required,
    mustReroll: required,
    canReroll: truthyFlag(state.canReroll) || required,
    hasNoPair: truthyFlag(state.hasNoPair) || truthyFlag(state.noPair),
    limit,
    used,
    remaining,
    penalty: Math.max(0, Math.trunc(toNumber(
      state.penalty
        ?? state.rerollNoPairPenalty
        ?? match?.gameRules?.rerollNoPairPenalty
        ?? match?.bidControls?.rerollNoPairPenalty
        ?? 25,
      25,
    ))),
  };
}

function rerollSubtitle(state, tx = (value) => value) {
  if (state?.required) return tx('No pair - reroll required');
  if (state?.used || state?.limit) return `${tx('Rerolls')}: ${toNumber(state.used, 0)}/${toNumber(state.limit, 3)}`;
  return tx('Max 3 rerolls');
}

function bidLabel(bid, tx = (value) => value) {
  if (!bid) return '-';
  const tag = getBidJokerTag(bid);
  const base = `${toNumber(bid.quantity, 0)} x ${toNumber(bid.face, 0)}`;
  return tag ? `${base} ${tx(tag)}` : base;
}

function describeRoundResult(roundResult, tx) {
  if (!roundResult) return '';

  if (roundResult.challengeType === 'forfeit') {
    return `${roundResult.loserName || tx('Player')} ${tx('forfeited the match')}`;
  }

  const loserName = roundResult.loserName || tx('Player');
  const bidTruth = roundResult.bidWasTrue ? tx('Bid was true') : tx('Bid was false');
  const challengeType = String(roundResult.challengeType || roundResult.actionType || '').toLowerCase();
  const isPekChallenge = ['pek', 'call_pek', 'slam', 'call_slam'].includes(challengeType) || roundResult.isPek || roundResult.isSlam;
  const lostCoins = firstPositiveNumber(
    roundResult.challengeAmount,
    roundResult.riskAmount,
    roundResult.stackLost,
    roundResult.lossAmount,
    roundResult.finalPekAmount,
    roundResult.finalSlamAmount,
  );

  if (Number.isFinite(lostCoins) && lostCoins > 0) {
    const label = isPekChallenge ? tx('Pek/Slam') : tx('Call Liar');
    const bustSuffix = roundResult.bustedBelowMinimumBid
      ? ` ${tx('Eliminated because stack is below minimum bid')}.`
      : '';
    return `${bidTruth}. ${label}: ${loserName} ${tx('lost')} ${formatAmount(lostCoins)} ${tx('coins')}.${bustSuffix}`;
  }

  return `${bidTruth}.`;
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

function isValidBid(currentBid, quantity, face, options = {}) {
  const normalizedQuantity = toNumber(quantity, 0);
  const normalizedFace = toNumber(face, 0);
  if (!currentBid) {
    if (normalizedFace < 1 || normalizedFace > 6) return false;
    const minOpeningQuantity = getOpeningMinimumQuantity(options.match || {}, options.playerCount || 2, normalizedFace);
    return normalizedQuantity >= minOpeningQuantity;
  }
  const currentQuantity = toNumber(currentBid.quantity, 0);
  const currentFace = toNumber(currentBid.face, 0);
  return normalizedQuantity > currentQuantity || (normalizedQuantity === currentQuantity && normalizedFace > currentFace);
}

function getDirectZaiBid({ currentBid, selectedQuantity, selectedFace }) {
  const currentQuantity = toNumber(currentBid?.quantity, 0);
  const currentFace = toNumber(currentBid?.face, 0);

  if (currentBid && currentQuantity > 0 && currentFace >= 2 && currentFace <= 6 && !isBidZai(currentBid)) {
    return { quantity: currentQuantity, face: currentFace, source: 'current_bid' };
  }

  return {
    quantity: toNumber(selectedQuantity, 0),
    face: toNumber(selectedFace, 0),
    source: 'selected_bid',
  };
}

function isValidZaiBid(currentBid, quantity, face, options = {}) {
  const normalizedQuantity = toNumber(quantity, 0);
  const normalizedFace = toNumber(face, 0);
  if (normalizedFace === 1) return false;

  if (currentBid) {
    const currentQuantity = toNumber(currentBid.quantity, 0);
    const currentFace = toNumber(currentBid.face, 0);
    const sameDiceClaim = normalizedQuantity === currentQuantity && normalizedFace === currentFace;
    if (sameDiceClaim) return !isBidZai(currentBid);
  }

  return isValidBid(currentBid, normalizedQuantity, normalizedFace, options);
}

function TurnIntroOverlay({ player, phase }) {
  if (!player || phase === TURN_INTRO_PHASE.IDLE) return null;

  return (
    <div className={`gameplay-turn-intro gameplay-turn-intro--${phase}`} aria-hidden="true">
      <div className="gameplay-turn-intro__cupWrap">
        <img className="gameplay-turn-intro__cup" src={`${asset}cup.png`} alt="" draggable="false" />
      </div>
      <div className="gameplay-turn-intro__diceWrap">
        {renderDice(player, 'gameplay-turn-intro__die', 5)}
      </div>
    </div>
  );
}

export default function Gameplay({ navigation, data, backendActions, backendStatus, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const isChinese = i18n?.language === 'zh';
  const bidSelectorSkin = `${asset}PP22.png`;
  const match = data?.match || null;
  const currentMatchId = data?.currentMatchId || match?.id || match?.matchId || null;
  const user = data?.user || {};
  const activePlayer = getActivePlayer(match);
  const panelItems = getPanelItems(match, user);
  const tablePlayerCount = getTablePlayerCount(match, panelItems.length || 2);
  const botsMatch = isBotsMatch(match);
  const totalDice = toNumber(match?.totalDiceInPlay, (match?.players || []).reduce((sum, player) => sum + getPlayerDiceCount(player, 0), 0));
  const currentBid = match?.currentBid || null;
  const previousBid = match?.previousBid || null;
  const viewerPlayer = getViewerPlayer(match, user);
  const viewerEliminated = isPlayerEliminatedForMatch(match, viewerPlayer);
  const myTurn = !viewerEliminated && (Boolean(match?.myTurn) || samePlayer(activePlayer, viewerPlayer) || samePlayer(activePlayer, user));
  const turnDicePlayer = getTurnDicePlayer(match, activePlayer, viewerPlayer, user, myTurn);
  const [turnIntroPhase, setTurnIntroPhase] = useState(TURN_INTRO_PHASE.IDLE);
  const [turnIntroPlayer, setTurnIntroPlayer] = useState(null);
  const completedTurnIntroKeyRef = useRef('');
  const activeTurnIntroKeyRef = useRef('');
  const turnIntroTimersRef = useRef([]);
  const turnIntroRunIdRef = useRef(0);
  const turnIntroKey = getTurnIntroKey(match, activePlayer);
  const turnIntroResetKey = getTurnIntroResetKey(match);
  const isTurnIntroPlaying = TURN_INTRO_ACTIVE_PHASES.has(turnIntroPhase);
  const isFinished = match?.status === 'finished';
  const isBusy = Boolean(backendStatus?.loading && String(backendStatus.lastAction || '').startsWith('match.'));
  const canAct = Boolean(currentMatchId && match && !isFinished && myTurn && !viewerEliminated && !isBusy && !isTurnIntroPlaying);
  const availableActions = normalizedActionList(match?.availableActions);
  const disabledActions = normalizedActionList(match?.disabledActions);
  const hasServerActionRules = availableActions.length > 0 || disabledActions.length > 0;
  const canSubmitBid = canAct && (!hasServerActionRules || availableActions.includes('bid')) && !disabledActions.includes('bid');
  const canCallLiar = canAct && Boolean(currentBid) && (!hasServerActionRules || availableActions.includes('call_liar') || availableActions.includes('call_lira')) && !disabledActions.includes('call_liar') && !disabledActions.includes('call_lira');
  const pekSettings = getPekSettings(match);
  const bidderPlayer = getBidderPlayer(match);
  const pekStackBlockReason = getPekStackBlockReason({ pekSettings, viewerPlayer, bidderPlayer, tx });
  const pekActionAliases = ['call_pek', 'pek', 'call_slam', 'slam'];
  const serverAllowsPek = !hasServerActionRules || pekActionAliases.some((action) => availableActions.includes(action));
  const serverDisablesPek = pekActionAliases.some((action) => disabledActions.includes(action));
  const canCallPek = canAct && Boolean(currentBid) && pekSettings.pekEnabled && serverAllowsPek && !serverDisablesPek && !pekStackBlockReason;
  const rerollState = readRerollState(match, activePlayer);
  const serverAllowsReroll = availableActions.includes('reroll') || (!hasServerActionRules && rerollState.canReroll);
  const serverDisablesReroll = disabledActions.includes('reroll');
  const canReroll = canAct && serverAllowsReroll && !serverDisablesReroll;
  const roundResult = getMatchRoundResult(match, data);
  const roundResultKey = getRoundResultKey(roundResult);
  const revealedRows = revealedDiceRows(roundResult);
  const [roundResultVisible, setRoundResultVisible] = useState(false);
  const showRoundResult = Boolean(match && roundResult && roundResultVisible && !isFinished);
  const [clockTick, setClockTick] = useState(() => Date.now());
  const liveTurnSeconds = getLiveTurnSeconds(match, clockTick);
  const chatMessages = Array.isArray(data?.chatMessages) ? data.chatMessages : [];
  const chatStatus = data?.chatStatus || {};
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const chatListRef = useRef(null);
  const voiceSessionRef = useRef(null);
  const canUseChat = Boolean(currentMatchId && !botsMatch);
  const canUseVoice = canUseChat;
  const [voiceState, setVoiceState] = useState({
    connected: false,
    connecting: false,
    muted: true,
    participants: [],
    error: null,
  });

  const clearTurnIntroTimers = () => {
    turnIntroRunIdRef.current += 1;
    activeTurnIntroKeyRef.current = '';

    if (typeof window === 'undefined') {
      turnIntroTimersRef.current = [];
      return;
    }

    turnIntroTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    turnIntroTimersRef.current = [];
  };

  const stopTurnIntro = () => {
    clearTurnIntroTimers();
    setTurnIntroPhase(TURN_INTRO_PHASE.IDLE);
    setTurnIntroPlayer(null);
  };

  useEffect(() => {
    return () => clearTurnIntroTimers();
    // This cleanup only needs the timer ref from the initial render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!turnIntroKey) {
      completedTurnIntroKeyRef.current = '';
      activeTurnIntroKeyRef.current = '';
      stopTurnIntro();
      return;
    }

    if (completedTurnIntroKeyRef.current === turnIntroKey || activeTurnIntroKeyRef.current === turnIntroKey) return;

    clearTurnIntroTimers();
    activeTurnIntroKeyRef.current = turnIntroKey;
    const runId = turnIntroRunIdRef.current;
    const introPlayerSnapshot = turnDicePlayer || activePlayer || null;
    setTurnIntroPlayer(introPlayerSnapshot);
    setTurnIntroPhase(TURN_INTRO_PHASE.SHAKE);

    if (typeof window === 'undefined') {
      setTurnIntroPhase(TURN_INTRO_PHASE.IDLE);
      setTurnIntroPlayer(null);
      return;
    }

    const setPhaseSafely = (phase) => {
      if (turnIntroRunIdRef.current !== runId || activeTurnIntroKeyRef.current !== turnIntroKey) return;
      setTurnIntroPhase(phase);
    };

    const finishSafely = () => {
      if (turnIntroRunIdRef.current !== runId || activeTurnIntroKeyRef.current !== turnIntroKey) return;
      completedTurnIntroKeyRef.current = turnIntroKey;
      activeTurnIntroKeyRef.current = '';
      setTurnIntroPhase(TURN_INTRO_PHASE.IDLE);
      setTurnIntroPlayer(null);
      turnIntroTimersRef.current = [];
    };

    const centerAt = TURN_INTRO_TIMINGS.shakeMs;
    const flyAt = centerAt + TURN_INTRO_TIMINGS.centerMs;
    const doneAt = flyAt + TURN_INTRO_TIMINGS.flyMs;
    const idleAt = doneAt + TURN_INTRO_TIMINGS.settleMs;

    turnIntroTimersRef.current = [
      window.setTimeout(() => setPhaseSafely(TURN_INTRO_PHASE.CENTER), centerAt),
      window.setTimeout(() => setPhaseSafely(TURN_INTRO_PHASE.FLY), flyAt),
      window.setTimeout(() => setPhaseSafely(TURN_INTRO_PHASE.DONE), doneAt),
      window.setTimeout(finishSafely, idleAt),
    ];
  }, [turnIntroKey, turnDicePlayer, activePlayer]);

  useEffect(() => {
    if (!match || match.status !== 'active') {
      completedTurnIntroKeyRef.current = '';
      activeTurnIntroKeyRef.current = '';
      stopTurnIntro();
    }
  }, [turnIntroResetKey]);

  useEffect(() => {
    if (!roundResult || isFinished) {
      setRoundResultVisible(false);
      return;
    }

    setRoundResultVisible(true);
  }, [roundResultKey, Boolean(roundResult), isFinished]);

  useEffect(() => {
    if (!match || match.status !== 'active') return undefined;
    const interval = window.setInterval(() => setClockTick(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [match?.id, match?.status, match?.turnDeadlineAt]);

  const defaultBid = useMemo(() => nextDefaultBid(currentBid, totalDice || 7), [currentBid, totalDice]);
  const quantityValues = useMemo(() => getQuantityValues(totalDice), [totalDice]);
  const dynamicCoinBetOptions = useMemo(() => getCoinBetOptions(match), [
    match?.id,
    match?.matchId,
    match?.bidControls,
    match?.bidRules,
    match?.coinBetOptions,
    match?.pricing?.coinBetOptions,
    match?.currentBid?.coinBet,
    match?.currentBid?.coinAmount,
    match?.currentBid?.betAmount,
    match?.currentBidCoinBet,
    match?.currentBidAmount,
  ]);
  const [selectedQuantity, setSelectedQuantity] = useState(defaultBid.quantity || 1);
  const [selectedFace, setSelectedFace] = useState(defaultBid.face || 1);
  const [selectedCoinBet, setSelectedCoinBet] = useState(getMatchCoinBet(match));
  const [zaiEnabled, setZaiEnabled] = useState(false);

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
    setSelectedQuantity(Math.max(1, Math.min(quantityValues.length, defaultBid.quantity || 1)));
    setSelectedFace(Math.max(1, Math.min(6, defaultBid.face || 1)));
    setZaiEnabled(false);
  }, [defaultBid.quantity, defaultBid.face, quantityValues.length]);

  useEffect(() => {
    if (selectedFace === 1 && zaiEnabled) setZaiEnabled(false);
  }, [selectedFace, zaiEnabled]);

  useEffect(() => {
    const min = getMinimumCoinBet(match);
    const max = getMaximumCoinBet(match);
    const preferred = getMatchCoinBet(match);
    const available = dynamicCoinBetOptions.filter((value) => value >= min && value <= max);
    const nextValue = available.includes(preferred)
      ? preferred
      : available.find((value) => value >= preferred)
        ?? available[0]
        ?? Math.min(Math.max(preferred, min), max);
    setSelectedCoinBet(nextValue);
  }, [
    dynamicCoinBetOptions.join('|'),
    match?.currentBid?.coinBet,
    match?.currentBid?.coinAmount,
    match?.currentBid?.betAmount,
    match?.currentBidCoinBet,
    match?.currentBidAmount,
    match?.coinBet,
    match?.betAmount,
    match?.currentRoundCoinBet,
  ]);

  useEffect(() => {
    if (!canUseChat) {
      setChatOpen(false);
      return;
    }

    backendActions?.loadChatHistory?.(currentMatchId);
    // Only reload history when the match id or mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentMatchId, canUseChat]);

  useEffect(() => {
    if (!chatOpen || !chatListRef.current) return;
    chatListRef.current.scrollTop = chatListRef.current.scrollHeight;
  }, [chatOpen, chatMessages.length]);

  useEffect(() => {
    if (!canUseVoice && voiceSessionRef.current) {
      voiceSessionRef.current.stop();
      voiceSessionRef.current = null;
    }

    return () => {
      if (voiceSessionRef.current) {
        voiceSessionRef.current.stop();
        voiceSessionRef.current = null;
      }
    };
  }, [currentMatchId, canUseVoice]);

  useEffect(() => {
    if (isFinished) navigation?.goWin?.();
  }, [isFinished, navigation]);

  const submitBid = () => {
    if (!canSubmitBid || isTurnIntroPlaying) return;
    const jokerPayload = buildBidJokerPayload({ currentBid, selectedQuantity, selectedFace, zaiEnabled, match });
    backendActions?.submitGameAction?.({
      matchId: currentMatchId,
      type: 'bid',
      bid: {
        quantity: selectedQuantity,
        face: selectedFace,
        coinBet: selectedCoinBet,
        coinAmount: selectedCoinBet,
        betAmount: selectedCoinBet,
        ...jokerPayload,
      },
      ...jokerPayload,
      coinBet: selectedCoinBet,
      betAmount: selectedCoinBet,
    });
  };

  const submitZaiBid = () => {
    if (!canSubmitBid || isTurnIntroPlaying) return;
    const directZaiBid = getDirectZaiBid({ currentBid, selectedQuantity, selectedFace });
    if (!isValidZaiBid(currentBid, directZaiBid.quantity, directZaiBid.face, { match, playerCount: tablePlayerCount })) return;

    const jokerPayload = buildBidJokerPayload({
      currentBid,
      selectedQuantity: directZaiBid.quantity,
      selectedFace: directZaiBid.face,
      zaiEnabled: true,
      match,
    });

    backendActions?.submitGameAction?.({
      matchId: currentMatchId,
      type: 'bid',
      bid: {
        quantity: directZaiBid.quantity,
        face: directZaiBid.face,
        coinBet: selectedCoinBet,
        coinAmount: selectedCoinBet,
        betAmount: selectedCoinBet,
        ...jokerPayload,
      },
      ...jokerPayload,
      coinBet: selectedCoinBet,
      betAmount: selectedCoinBet,
    });
  };

  const submitSimpleAction = (type) => {
    if (!canAct || isTurnIntroPlaying) return;
    backendActions?.submitGameAction?.({ matchId: currentMatchId, type });
  };

  const submitReroll = () => {
    if (!canReroll || isTurnIntroPlaying) return;
    backendActions?.submitGameAction?.({ matchId: currentMatchId, type: 'reroll' });
  };

  const submitLeaveMatch = () => {
    if (!currentMatchId || isBusy) return;
    const confirmed = typeof window === 'undefined'
      ? true
      : window.confirm(tx('Leave this match? This will count as a loss.'));
    if (!confirmed) return;
    backendActions?.leaveMatch?.(currentMatchId);
  };
  const submitChatMessage = async (event) => {
    event?.preventDefault?.();
    const text = chatDraft.trim().slice(0, 200);
    if (!text || !canUseChat || chatStatus.sending) return;

    const result = await backendActions?.sendChatMessage?.({ matchId: currentMatchId, text });
    if (result !== null) setChatDraft('');
  };

  const toggleVoiceChat = async () => {
    if (!canUseVoice || !currentMatchId) return;

    if (!voiceSessionRef.current) {
      setVoiceState((current) => ({ ...current, connecting: true, error: null }));
      const session = startVoiceChatSession({
        matchId: currentMatchId,
        muted: false,
        onState: (patch) => setVoiceState((current) => ({ ...current, ...patch })),
        onError: (message) => setVoiceState((current) => ({ ...current, connecting: false, error: message })),
      });
      voiceSessionRef.current = session;
      const started = await session.start();
      if (!started) voiceSessionRef.current = null;
      return;
    }

    voiceSessionRef.current.toggleMute();
  };

  const bidIsValid = isValidBid(currentBid, selectedQuantity, selectedFace, { match, playerCount: tablePlayerCount });
  const openingBidError = getOpeningBidError(match, currentBid, selectedQuantity, selectedFace, tablePlayerCount, tx);
  const minRequiredCoinBet = getMinimumCoinBet(match);
  const maxAllowedCoinBet = getMaximumCoinBet(match);
  const coinBetIsValid = selectedCoinBet >= minRequiredCoinBet && selectedCoinBet <= maxAllowedCoinBet;
  const quantityMin = currentBid ? 1 : getOpeningMinimumQuantity(match, tablePlayerCount, selectedFace);
  const quantityMax = quantityValues[quantityValues.length - 1] || Math.max(1, toNumber(totalDice, 1));
  const directZaiBid = getDirectZaiBid({ currentBid, selectedQuantity, selectedFace });
  const zaiAvailable = isValidZaiBid(currentBid, directZaiBid.quantity, directZaiBid.face, { match, playerCount: tablePlayerCount });
  const currentBidJokerInfo = getMatchJokerDisplay(match, currentBid, tx);
  const selectedBidJokerInfo = getSelectedBidJokerInfo({ currentBid, selectedQuantity, selectedFace, zaiEnabled, match, tx });
  const directZaiSubtitle = zaiAvailable
    ? `${directZaiBid.quantity} x ${directZaiBid.face} · ${tx('Joker OFF')}`
    : tx('Joker OFF');
  const chaiStep = getChaiQuantityStep(match);
  const chaiHint = currentBid && currentBidJokerInfo.mode === 'zai' && !zaiEnabled
    ? `${tx('Increase by +2 to reopen joker')} (${toNumber(currentBid.quantity, 0) + chaiStep}+)`
    : '';
  const bidSubmitSubtitle = openingBidError || (bidIsValid ? (coinBetIsValid ? selectedBidJokerInfo.detail : tx('Coin bet out of range')) : tx('Bid must be higher'));
  const decreaseQuantity = () => setSelectedQuantity((value) => Math.max(quantityMin, toNumber(value, quantityMin) - 1));
  const increaseQuantity = () => setSelectedQuantity((value) => Math.min(quantityMax, toNumber(value, quantityMin) + 1));
  const challengeDisabled = !canCallLiar;
  const pekDisabled = !canCallPek;
  const rerollDisabled = !canReroll;
  const bidDisabled = !canSubmitBid || !bidIsValid || !coinBetIsValid;
  const zaiDisabled = !canSubmitBid || !zaiAvailable || !coinBetIsValid;
  const rerollButtonSubtitle = rerollSubtitle(rerollState, tx);
  const turnName = playerName(activePlayer, myTurn ? 'You' : 'Player');
  const currentCoinBet = getMatchCoinBet(match);
  const totalPot = getTotalPot(match);
  const viewerStack = getPlayerStack(viewerPlayer || user, 0);
  const turnIntroDisplayPlayer = turnIntroPlayer || turnDicePlayer || activePlayer || viewerPlayer;

  return (
    <section
      className={`screen gameplay-screen gameplay-screen--players-${panelItems.length} ${botsMatch ? 'gameplay-screen--bots' : 'gameplay-screen--normal'} ${activePlayer ? 'has-active-player' : ''} ${isTurnIntroPlaying ? 'is-turn-intro-playing' : ''}`}
      data-turn-intro-phase={turnIntroPhase}
      data-turn-intro-player={playerId(turnIntroPlayer) || playerName(turnIntroPlayer, '') || undefined}
      data-turn-intro-count={tablePlayerCount}
      aria-label={tx('Gameplay')}
    >
      {panelItems.map((item) => (
        <PlayerPanel
          key={`${item.slot}-${playerId(item.player) || playerName(item.player, item.fallbackName)}`}
          className={item.className}
          skin={item.skin}
          player={item.player}
          fallbackName={item.fallbackName}
          isTurnPlayer={samePlayer(item.player, activePlayer)}
          match={match}
        />
      ))}

      <div className="gameplay-turnbar">
        <img className="gameplay-turnbar__skin" src={`${asset}11.png`} alt="" draggable="false" />
        <img className="gameplay-turnbar__avatarBg" src={`${asset}BGBB.png`} alt="" draggable="false" />
        <img className="gameplay-turnbar__avatar" src={resolveAvatarSrc(activePlayer || viewerPlayer || user)} alt="" draggable="false" />
        <span className="gameplay-turnbar__title">{tx(myTurn ? 'YOUR TURN' : `${turnName}’S TURN`)}</span>
        <div className="gameplay-turnbar__countRow">
          <Die value={4} className="gameplay-turnbar__countDie" />
          <span className="gameplay-turnbar__countValue">{getPlayerDiceCount(turnDicePlayer || activePlayer, 0) || '-'}</span>
        </div>
        <div className={`gameplay-turnbar__diceRow ${isTurnIntroPlaying ? 'is-turn-intro-waiting' : ''}`}>
          {renderDice(turnDicePlayer || activePlayer || viewerPlayer, 'gameplay-turnbar__die', 5)}
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

      {canUseChat ? (
        <button
          className={`gameplay-chat-button ${chatOpen ? 'is-open' : ''}`}
          type="button"
          onClick={() => setChatOpen((open) => !open)}
          aria-expanded={chatOpen}
          aria-controls="gameplay-chat-drawer"
        >
          <img
            className="gameplay-chat-button__skin"
            src="/assets/liars-dice/gameplay/chat-button-red.png"
            alt=""
            draggable="false"
          />
          <span className="gameplay-chat-button__title">{tx('CHAT')}</span>
          <span className="gameplay-chat-button__count">{chatMessages.length}</span>
        </button>
      ) : null}

      {canUseVoice ? (
        <button
          className={`gameplay-voice-button ${voiceState.connected ? 'is-connected' : ''} ${voiceState.muted ? 'is-muted' : ''} ${voiceState.connected && !voiceState.muted ? 'is-live' : ''} ${voiceState.connecting ? 'is-connecting' : ''}`}
          type="button"
          onClick={toggleVoiceChat}
          disabled={voiceState.connecting}
          aria-pressed={voiceState.connected && !voiceState.muted}
          title={voiceState.connected ? tx(voiceState.muted ? 'Mic muted' : 'Mic live') : tx('Join voice chat')}
        >
          <img
            className="gameplay-voice-button__skin"
            src="/assets/liars-dice/gameplay/chat-button-red.png"
            alt=""
            draggable="false"
          />
          <span className="gameplay-voice-button__icon" aria-hidden="true">🎙</span>
          <span className="gameplay-voice-button__title">
            {voiceState.connecting ? tx('CONNECTING') : tx(voiceState.connected ? (voiceState.muted ? 'MUTED' : 'LIVE') : 'VOICE')}
          </span>
        </button>
      ) : null}

      {canUseVoice && voiceState.error ? (
        <div className="gameplay-voice-status gameplay-voice-status--error">{voiceState.error}</div>
      ) : null}

      <div className="gameplay-current-bid">
        <img className="gameplay-current-bid__skin" src={`${asset}4.png`} alt="" draggable="false" />
        <div className="gameplay-current-bid__header">{tx('CURRENT BID')}</div>
        <div className="gameplay-current-bid__main">
          {currentBid ? <span>{toNumber(currentBid.quantity, 0)} x</span> : <span>- x</span>}
          <Die value={currentBid?.face || 1} className="gameplay-current-bid__die" />
        </div>
        <div className="gameplay-current-bid__cleanSpacer" aria-hidden="true" />
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
            <span>{tx('Bid')}: {bidLabel(roundResult?.bid, tx)}</span>
            <span>{tx('Actual')}: {toNumber(roundResult?.actualCount, 0)}</span>
            {roundResult?.wildOnesCount !== undefined || roundResult?.jokerWildActive !== undefined ? <span>{tx('Wild ones counted')}: {toNumber(roundResult?.wildOnesCount, 0)}</span> : null}
            {roundResult?.jokerMode || roundResult?.bid?.jokerMode ? <span>{tx('Joker')}: {getMatchJokerDisplay(roundResult, roundResult?.bid, tx).detail}</span> : null}
            {roundResult?.onesWereCalledThisRound && toNumber(roundResult?.wildOnesCount, 0) <= 0 ? <span>{tx('Ones stopped being wild')}</span> : null}
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
          <button
            type="button"
            className="gameplay-round-result__ok"
            onClick={() => setRoundResultVisible(false)}
          >
            {tx('OK')}
          </button>
        </div>
      ) : null}

      <TurnIntroOverlay key={turnIntroKey || 'turn-intro-idle'} player={turnIntroDisplayPlayer} phase={turnIntroPhase} />

      <div className={`gameplay-cups gameplay-cups--count-${tablePlayerCount} ${isTurnIntroPlaying ? 'is-turn-intro-hidden' : ''}`} aria-hidden="true">
        {renderCupSlots(tablePlayerCount)}
      </div>

      <div className="gameplay-bid-selector">
        <img className="gameplay-bid-selector__skin" src={bidSelectorSkin} alt="" draggable="false" />
        <div className="gameplay-bid-selector__quantityCaption">{tx('Total dice in play')}: {totalDice || '-'}</div>
        <div className="gameplay-bid-selector__quantityTrack">
          <img className="gameplay-bid-selector__quantityTrackSkin" src={`${asset}p4.png`} alt="" draggable="false" />
          <div className="gameplay-bid-selector__quantityRow gameplay-bid-selector__quantityStepper" role="group" aria-label={tx('Quantity')}>
            <button
              type="button"
              className="gameplay-bid-selector__quantityStep gameplay-bid-selector__quantityStep--minus"
              onClick={decreaseQuantity}
              disabled={selectedQuantity <= quantityMin}
              aria-label={tx('Decrease quantity')}
            >
              −
            </button>
            <div className="gameplay-bid-selector__quantityValue" aria-live="polite">
              <span className="gameplay-bid-selector__quantityValueNumber">{selectedQuantity}</span>
              <span className="gameplay-bid-selector__quantityValueMax">/ {quantityMax}</span>
            </div>
            <button
              type="button"
              className="gameplay-bid-selector__quantityStep gameplay-bid-selector__quantityStep--plus"
              onClick={increaseQuantity}
              disabled={selectedQuantity >= quantityMax}
              aria-label={tx('Increase quantity')}
            >
              +
            </button>
          </div>
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
                <Die value={value} variant={value === selectedFace ? 'red' : 'white'} className="gameplay-bid-selector__die" />
              </button>
            );
          })}
        </div>
        <div className="gameplay-bid-selector__actionRow" role="group" aria-label={tx('Bid actions')}>
          <ActionButton className="gameplay-action--reroll gameplay-action--compact" skin="B!.png" title="REROLL" subtitle={rerollButtonSubtitle} onClick={submitReroll} disabled={rerollDisabled} tx={tx} />
          <ActionButton className="gameplay-action--raise gameplay-action--compact" skin="B!.png" title="CONFIRM BID" subtitle={bidSubmitSubtitle} onClick={submitBid} disabled={bidDisabled} tx={tx} />
          <ActionButton className="gameplay-action--call gameplay-action--compact" skin="B2.png" title="CALL LIAR" subtitle={`Risk ${formatAmount(pekSettings.perGameAmount || currentCoinBet)}`} onClick={() => submitSimpleAction('call_liar')} disabled={challengeDisabled} tx={tx} />
          {pekSettings.pekEnabled ? (
            <ActionButton className="gameplay-action--slam gameplay-action--compact" skin="B3.png" title="SLAM" subtitle={pekStackBlockReason || `Risk ${formatAmount(pekSettings.finalPekAmount)}`} onClick={() => submitSimpleAction('call_pek')} disabled={pekDisabled} tx={tx} />
          ) : null}
          <button
            type="button"
            className="gameplay-action gameplay-action--zai gameplay-action--compact"
            onClick={submitZaiBid}
            aria-pressed={false}
            disabled={zaiDisabled}
          >
            <img className="gameplay-action__skin" src={`${asset}B3.png`} alt="" draggable="false" />
            <span className="gameplay-action__title">{tx('ZAI')}</span>
            <span className="gameplay-action__subtitle">{directZaiSubtitle}</span>
          </button>
        </div>
      </div>


      {canUseChat && chatOpen ? (
        <aside id="gameplay-chat-drawer" className="gameplay-chat-drawer" aria-label={tx('Match Chat')}>
          <div className="gameplay-chat-drawer__header">
            <div>
              <div className="gameplay-chat-drawer__title">{tx('MATCH CHAT')}</div>
              <div className="gameplay-chat-drawer__subtitle">{tx('Normal mode only')} · {tx('Voice')}: {tx(voiceState.connected ? (voiceState.muted ? 'Muted' : 'Live') : 'Off')}</div>
            </div>
            <button className="gameplay-chat-drawer__close" type="button" onClick={() => setChatOpen(false)} aria-label={tx('Close chat')}>×</button>
          </div>

          <div className="gameplay-chat-drawer__messages" ref={chatListRef}>
            {chatStatus.loading ? (
              <div className="gameplay-chat-drawer__empty">{tx('Loading chat...')}</div>
            ) : chatMessages.length ? (
              chatMessages.map((message) => (
                <ChatMessage key={message.id || message.messageId || `${message.createdAt}-${chatMessageText(message)}`} message={message} user={user} viewerPlayer={viewerPlayer} />
              ))
            ) : (
              <div className="gameplay-chat-drawer__empty">{tx('No messages yet')}</div>
            )}
          </div>

          {chatStatus.error ? <div className="gameplay-chat-drawer__error">{chatStatus.error}</div> : null}

          <form className="gameplay-chat-drawer__form" onSubmit={submitChatMessage}>
            <input
              className="gameplay-chat-drawer__input"
              type="text"
              value={chatDraft}
              maxLength={200}
              placeholder={tx('Type a message')}
              onChange={(event) => setChatDraft(event.target.value.slice(0, 200))}
              disabled={chatStatus.sending}
            />
            <button className="gameplay-chat-drawer__send" type="submit" disabled={!chatDraft.trim() || chatStatus.sending}>
              {chatStatus.sending ? tx('SENDING...') : tx('SEND')}
            </button>
          </form>
        </aside>
      ) : null}

      {!currentMatchId ? (
        <div className="gameplay-status gameplay-status--warning">{tx('No active match. Start matchmaking first.')}</div>
      ) : null}
      {backendStatus?.error ? (
        <div className="gameplay-status gameplay-status--error">{backendStatus.error}</div>
      ) : null}
      {isBusy ? (
        <div className="gameplay-status gameplay-status--loading">{tx('Updating match...')}</div>
      ) : null}
      {viewerEliminated && !isFinished ? (
        <div className="gameplay-status gameplay-status--warning">
          {tx('You are eliminated. Stack is below minimum bid')} ({formatAmount(minRequiredCoinBet)})
        </div>
      ) : null}
    </section>
  );
}
