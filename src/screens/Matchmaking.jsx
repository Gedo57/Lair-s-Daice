import { useEffect, useMemo, useState } from 'react';
import ProfileHud from '../components/ProfileHud.jsx';
import { resolveProfileAvatarSrc as resolveAvatarSrc } from '../utils/profileAvatars.js';

const asset = '/assets/liars-dice/matchmaking/';
const sparkles = Array.from({ length: 18 }, (_, index) => index + 1);

function TopHud({ user, wallet }) {
  return (
    <>
      <ProfileHud className="matchmaking-profile" user={user} />

      <div className="matchmaking-currency matchmaking-currency--coins">
        <img className="matchmaking-currency__icon" src={`${asset}66.png`} alt="" draggable="false" />
        <span className="matchmaking-currency__value">{wallet?.coins || '0'}</span>
        <img className="matchmaking-currency__plus" src={`${asset}88.png`} alt="" draggable="false" />
      </div>

      <div className="matchmaking-currency matchmaking-currency--gems">
        <img className="matchmaking-currency__icon" src={`${asset}77.png`} alt="" draggable="false" />
        <span className="matchmaking-currency__value">{wallet?.gems || '0'}</span>
        <img className="matchmaking-currency__plus" src={`${asset}88.png`} alt="" draggable="false" />
      </div>
    </>
  );
}

function normalizeId(value) {
  if (value === null || value === undefined) return '';
  return String(value);
}

function PlayerSlot({ className = '', avatar, avatarSrc, title, subtitle, caption, tx }) {
  return (
    <div className={`matchmaking-slot ${className}`}>
      <img className="matchmaking-slot__skin" src={`${asset}panal2.png`} alt="" draggable="false" />
      <div className="matchmaking-slot__inner">
        <img className="matchmaking-slot__avatar" src={avatarSrc || resolveAvatarSrc(avatar)} alt="" draggable="false" />
        <span className="matchmaking-slot__title">{tx(title)}</span>
        {subtitle ? <span className="matchmaking-slot__subtitle">{tx(subtitle)}</span> : null}
        {caption ? <span className="matchmaking-slot__caption">{caption}</span> : null}
      </div>
    </div>
  );
}

function getPlayerId(player = {}) {
  return player.id || player.userId || player._id || player.playerId || null;
}

function getMatchPlayers(playerSource, user) {
  const players = Array.isArray(playerSource?.players) ? playerSource.players : [];
  const userId = normalizeId(user?.id || user?.userId || user?._id || null);
  const viewer = players.find((player) => userId && normalizeId(getPlayerId(player)) === userId) || null;
  const opponents = players.filter((player) => !userId || normalizeId(getPlayerId(player)) !== userId);
  return { viewer, opponents };
}

function displayName(player, fallback) {
  return player?.displayName || player?.username || player?.name || fallback;
}

function getCountdownRemainingMs(serverMatchmaking = {}, match = null, tick = Date.now()) {
  const explicit = Number(serverMatchmaking?.matchStartRemainingMs);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const startsAt = serverMatchmaking?.startsAt || match?.startsAt || null;
  if (!startsAt) return 0;

  const target = new Date(startsAt).getTime();
  if (!Number.isFinite(target)) return 0;
  return Math.max(0, target - tick);
}

function countdownSeconds(ms) {
  return Math.max(0, Math.ceil(Number(ms || 0) / 1000));
}


export default function Matchmaking({ navigation, data, backendActions, backendStatus, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const matchmaking = data?.matchmaking || {};
  const serverMatchmaking = data?.serverMatchmaking || {};
  const match = data?.match || null;
  const currentMatchId = data?.currentMatchId || match?.id || match?.matchId || serverMatchmaking?.matchId || null;
  const currentQueueId = data?.currentQueueId || serverMatchmaking?.queueId || serverMatchmaking?.id || null;
  const rawQueueStatus = String(serverMatchmaking?.status || serverMatchmaking?.matchStatus || match?.status || '').toLowerCase();
  const [clockTick, setClockTick] = useState(() => Date.now());
  const countdownMs = getCountdownRemainingMs(serverMatchmaking, match, clockTick);
  const countdown = countdownSeconds(countdownMs);
  const isCountdown = Boolean(currentMatchId && (rawQueueStatus.includes('starting') || rawQueueStatus.includes('countdown') || match?.status === 'countdown') && countdown > 0);
  const signalTitle = String(serverMatchmaking?.quality || serverMatchmaking?.matchQuality || 'EXCELLENT').toUpperCase();
  const signalSub = serverMatchmaking?.ping ? `${serverMatchmaking.ping}ms` : '45ms';
  const filters = matchmaking.filters || [];
  const metrics = matchmaking.metrics || [];
  const steps = matchmaking.steps || [];
  const isStarting = backendStatus?.loading && backendStatus.lastAction === 'matchmaking.start';
  const isSearching = Boolean(currentQueueId && !currentMatchId && !['cancelled', 'matched', 'match_found'].includes(rawQueueStatus));
  const queuedPlayerSource = !match && Array.isArray(serverMatchmaking?.players) ? { players: serverMatchmaking.players } : null;
  const { viewer, opponents } = getMatchPlayers(match || queuedPlayerSource, user);

  useEffect(() => {
    if (!isCountdown) return undefined;
    const interval = window.setInterval(() => setClockTick(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [isCountdown]);

  const centerTitle = currentMatchId
    ? isCountdown
      ? `MATCH STARTS IN ${countdown}`
      : 'MATCH FOUND'
    : 'FINDING OPPONENTS';
  const centerCopy = currentMatchId
    ? isCountdown
      ? 'Entry fee charged. Cancel now to refund before start.'
      : 'Your table is ready. Enter the match.'
    : 'Looking for players with similar skill';

  const buildOpponentSlot = (index, className) => {
    const opponent = opponents[index];

    return {
      className,
      avatar: opponent || null,
      avatarSrc: opponent ? resolveAvatarSrc(opponent) : resolveAvatarSrc(null),
      title: opponent ? displayName(opponent, 'Player') : 'Searching...',
      subtitle: opponent ? 'READY' : '',
      caption: opponent ? '' : '•••',
    };
  };

  const viewerProfile = viewer || user;
  const playerSlots = [
    {
      className: 'matchmaking-slot--left-top',
      avatar: null,
      avatarSrc: resolveAvatarSrc(viewerProfile),
      title: displayName(viewerProfile, user.displayName || user.username || 'YOU'),
      subtitle: 'YOU',
    },
    buildOpponentSlot(0, 'matchmaking-slot--left-bottom'),
    buildOpponentSlot(1, 'matchmaking-slot--right-top'),
    buildOpponentSlot(2, 'matchmaking-slot--right-bottom'),
  ];

  const startOrEnterMatch = () => {
    if (currentMatchId) {
      if (!isCountdown) navigation.goGameplay();
      return;
    }
    if (isStarting || isSearching) return;
    backendActions?.startMatchmaking?.({});
  };

  return (
    <section className="screen matchmaking-screen" aria-label={tx('Matchmaking')}>
      <div className="matchmaking-vfx matchmaking-vfx--vignette" aria-hidden="true" />
      <div className="matchmaking-vfx matchmaking-vfx--lightRays" aria-hidden="true" />
      <div className="matchmaking-vfx matchmaking-vfx--panelGlow" aria-hidden="true" />
      <div className="matchmaking-sparkles" aria-hidden="true">
        {sparkles.map((sparkle) => (
          <span className={`matchmaking-sparkle matchmaking-sparkle--${sparkle}`} key={sparkle} />
        ))}
      </div>

      <TopHud user={user} wallet={wallet} />

      <div className="matchmaking-panel">
        <img className="matchmaking-panel__skin" src={`${asset}panal.png`} alt="" draggable="false" />

        <div className="matchmaking-filters">
          {filters.map((item) => (
            <div className="matchmaking-filter" key={tx(item.label)}>
              <img className="matchmaking-filter__icon" src={`${asset}${item.icon}`} alt="" draggable="false" />
              <span className="matchmaking-filter__label">{tx(item.label)}</span>
              <span className="matchmaking-filter__value">{tx(item.value)}</span>
            </div>
          ))}

          <div className="matchmaking-signal">
            <img className="matchmaking-signal__icon" src={`${asset}6.png`} alt="" draggable="false" />
            <span className="matchmaking-signal__title">{tx(signalTitle)}</span>
            <span className="matchmaking-signal__sub">{tx(signalSub)}</span>
          </div>
        </div>

        <div className="matchmaking-center">
          <div className="matchmaking-center__ringWrap">
            <img className="matchmaking-center__ring" src={`${asset}42.png`} alt="" draggable="false" />
            <img className="matchmaking-center__cup" src={`${asset}213.png`} alt="" draggable="false" />
          </div>
          <span className="matchmaking-center__title">{tx(centerTitle)}</span>
          {isCountdown ? <strong className="matchmaking-center__countdown" aria-live="polite">{countdown}</strong> : null}
          <span className="matchmaking-center__copy">{tx(centerCopy)}</span>
          <div className="matchmaking-center__stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <img key={i} src={`${asset}8.png`} alt="" draggable="false" />
            ))}
          </div>
        </div>

        <img className="matchmaking-link matchmaking-link--left-top" src={`${asset}54.png`} alt="" draggable="false" />
        <img className="matchmaking-link matchmaking-link--left-bottom" src={`${asset}54.png`} alt="" draggable="false" />
        <img className="matchmaking-link matchmaking-link--right-top" src={`${asset}54.png`} alt="" draggable="false" />
        <img className="matchmaking-link matchmaking-link--right-bottom" src={`${asset}54.png`} alt="" draggable="false" />

        {playerSlots.map((slot) => (
          <PlayerSlot key={slot.className} {...slot} tx={tx} />
        ))}

        <div className="matchmaking-metrics">
          {metrics.map((item) => (
            <div className={`matchmaking-metric matchmaking-metric--${item.type}`} key={tx(item.label)}>
              <div className="matchmaking-metric__head">
                {item.icon ? <img className="matchmaking-metric__icon" src={`${asset}${item.icon}`} alt="" draggable="false" /> : <span className="matchmaking-metric__iconGap" />}
                <span className="matchmaking-metric__label">{tx(item.label)}</span>
              </div>
              {item.type === 'quality' ? (
                <div className="matchmaking-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <img key={i} src={`${asset}8.png`} alt="" draggable="false" />
                  ))}
                </div>
              ) : null}
              <span className="matchmaking-metric__value">{tx(item.value)}</span>
            </div>
          ))}
        </div>

        <div className="matchmaking-steps">
          {steps.map((step, index) => (
            <div className="matchmaking-step" key={step.text || step.label || index}>
              <span className="matchmaking-step__badge" aria-hidden="true">{step.badge || index + 1}</span>
              <span className="matchmaking-step__text">{tx(step.text || step.label)}</span>
              <span className="matchmaking-step__sub">{step.sub}</span>
              {index < steps.length - 1 ? <span className="matchmaking-step__line" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>
      </div>

      <button className="matchmaking-action matchmaking-action--keep" type="button" onClick={startOrEnterMatch} disabled={isStarting || isCountdown}>
        <img className="matchmaking-action__skin" src={'/assets/liars-dice/room-select/bottom-play.png'} alt="" draggable="false" />
        <span className="matchmaking-action__title">{tx(currentMatchId ? isCountdown ? `STARTING IN ${countdown}` : 'ENTER MATCH' : isStarting ? 'MATCHING...' : isSearching ? 'KEEP SEARCHING' : 'START MATCH')}</span>
        <span className="matchmaking-action__subtitle">{tx(currentMatchId ? isCountdown ? 'Starting automatically' : 'Match is ready' : isSearching ? 'Waiting for real players' : "We'll find you the best table")}</span>
      </button>

      <button className="matchmaking-action matchmaking-action--cancel" type="button" onClick={() => backendActions?.cancelMatchmaking?.() || navigation.goRoomSelect()} disabled={backendStatus?.loading && backendStatus.lastAction === 'matchmaking.cancel'}>
        <img className="matchmaking-action__skin" src={`${asset}b1.png`} alt="" draggable="false" />
        <span className="matchmaking-action__title">{tx('CANCEL')}</span>
      </button>

      {backendStatus?.error ? <div className="matchmaking-status matchmaking-status--error">{backendStatus.error}</div> : null}
    </section>
  );
}
