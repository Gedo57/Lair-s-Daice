import ProfileHud from '../components/ProfileHud.jsx';
const asset = '/assets/liars-dice/room-select/';
const sparkles = Array.from({ length: 20 }, (_, index) => index + 1);

function hasCardValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function formatCardAmount(value) {
  if (!hasCardValue(value)) return '—';
  if (typeof value === 'string' && /[a-z]/i.test(value)) return value;
  const number = Number(String(value).replace(/,/g, ''));
  if (!Number.isFinite(number)) return String(value);
  if (number >= 1000000) return `${Number((number / 1000000).toFixed(1))}M`;
  if (number >= 1000) return `${Number((number / 1000).toFixed(1))}K`;
  return new Intl.NumberFormat('en-US').format(number);
}

function formatCardMultiplier(value) {
  if (!hasCardValue(value)) return '—';
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  return `${Number(number.toFixed(2))}x`;
}

function firstCardValue(...values) {
  return values.find((value) => hasCardValue(value));
}

function formatCardRange(min, max) {
  const minText = formatCardAmount(min);
  const maxText = formatCardAmount(max);
  if (minText === '—' && maxText === '—') return '—';
  if (minText === maxText || maxText === '—') return minText;
  if (minText === '—') return maxText;
  return `${minText}-${maxText}`;
}

function buildCardInfo(room = {}) {
  const pricing = room.pricing && typeof room.pricing === 'object' ? room.pricing : {};
  const rewards = room.rewards && typeof room.rewards === 'object' ? room.rewards : {};

  const buyInAmount = firstCardValue(pricing.buyInAmount, pricing.entryFee, room.buyInAmount, room.entryFee, room.fee, pricing.buyIn, room.buyIn);
  const winnerPayout = firstCardValue(
    rewards.winnerPayoutPreview,
    rewards.winnerPayout,
    rewards.winnerReward,
    pricing.winnerPayoutPreview,
    pricing.winnerPayout,
    pricing.winnerReward,
    room.winnerPayoutPreview,
    room.winnerPayout,
    room.winnerReward,
    room.winReward,
  );
  const totalPot = firstCardValue(
    pricing.grossPotPreview,
    pricing.grossPot,
    rewards.grossPotPreview,
    rewards.grossPot,
    room.grossPotPreview,
    room.grossPot,
    room.totalPotPreview,
    room.totalPot,
  );
  const minCoinBet = firstCardValue(pricing.minCoinBet, pricing.minBidCoins, pricing.stakeMin, room.minCoinBet, room.minBidCoins, room.stakeMin);
  const maxCoinBet = firstCardValue(pricing.maxCoinBet, pricing.maxBidCoins, pricing.stakeMax, room.maxCoinBet, room.maxBidCoins, room.stakeMax);

  return [
    { label: 'Buy-in', value: formatCardAmount(buyInAmount) },
    { label: 'Winner Payout', value: formatCardAmount(winnerPayout) },
    { label: 'Total Pot', value: formatCardAmount(totalPot) },
    { label: 'Bet Range', value: formatCardRange(minCoinBet, maxCoinBet) },
    { label: 'XP Win', value: formatCardAmount(rewards.xpWin ?? room.xpWin) },
  ];
}

function buildMatchmakingPayload(room = {}) {
  const pricing = room.pricing && typeof room.pricing === 'object' ? room.pricing : {};
  const rewards = room.rewards && typeof room.rewards === 'object' ? room.rewards : {};
  const buyInAmount = pricing.buyInAmount ?? pricing.entryFee ?? room.buyInAmount ?? room.entryFee ?? room.fee ?? undefined;
  const winnerPayout = rewards.winnerPayoutPreview
    ?? rewards.winnerPayout
    ?? rewards.winnerReward
    ?? pricing.winnerPayoutPreview
    ?? pricing.winnerPayout
    ?? pricing.winnerReward
    ?? room.winnerPayoutPreview
    ?? room.winnerPayout
    ?? room.winnerReward
    ?? room.winReward
    ?? undefined;

  return {
    tierId: room.tierId || room.id || room.key,
    tableId: room.tableId || room.id || room.key,
    key: room.key,
    mode: room.mode || room.key || room.title,
    title: room.title || room.name || room.label,
    pricing,
    rewards,
    buyIn: pricing.buyIn || pricing.buyInRange || room.buyIn || room.buyInLabel || room.entryFeeLabel || undefined,
    buyInAmount,
    buyInCoins: buyInAmount,
    minBuyIn: pricing.minBuyIn ?? room.minBuyIn,
    maxBuyIn: pricing.maxBuyIn ?? room.maxBuyIn,
    maxPlayers: room.maxPlayers,
    minPlayers: room.minPlayers,
    entryFee: buyInAmount,
    grossPotPreview: pricing.grossPotPreview ?? rewards.grossPotPreview ?? room.grossPotPreview ?? undefined,
    platformFeePreview: pricing.platformFeePreview ?? rewards.platformFeePreview ?? room.platformFeePreview ?? undefined,
    netPotPreview: pricing.netPotPreview ?? rewards.netPotPreview ?? room.netPotPreview ?? undefined,
    winnerPayoutPreview: rewards.winnerPayoutPreview ?? pricing.winnerPayoutPreview ?? room.winnerPayoutPreview ?? winnerPayout,
    winnerPayout,
    winnerReward: winnerPayout,
    winnerRewardMode: rewards.winnerRewardMode ?? pricing.winnerRewardMode ?? room.winnerRewardMode ?? 'pot',
    minCoinBet: pricing.minCoinBet ?? pricing.minBidCoins ?? room.minCoinBet ?? room.minBidCoins ?? undefined,
    minBidCoins: pricing.minCoinBet ?? pricing.minBidCoins ?? room.minCoinBet ?? room.minBidCoins ?? undefined,
    maxCoinBet: pricing.maxCoinBet ?? pricing.maxBidCoins ?? room.maxCoinBet ?? room.maxBidCoins ?? undefined,
    maxBidCoins: pricing.maxCoinBet ?? pricing.maxBidCoins ?? room.maxCoinBet ?? room.maxBidCoins ?? undefined,
    defaultCoinBet: pricing.defaultCoinBet ?? pricing.defaultBidCoins ?? room.defaultCoinBet ?? room.defaultBidCoins ?? undefined,
    defaultBidCoins: pricing.defaultCoinBet ?? pricing.defaultBidCoins ?? room.defaultCoinBet ?? room.defaultBidCoins ?? undefined,
    bidCoinStep: pricing.bidCoinStep ?? room.bidCoinStep ?? undefined,
    coinBetOptions: pricing.coinBetOptions ?? room.coinBetOptions ?? undefined,
    potMode: pricing.potMode ?? room.potMode ?? undefined,
    payoutMode: pricing.payoutMode ?? room.payoutMode ?? undefined,
    xpWin: rewards.xpWin ?? room.xpWin ?? undefined,
    xpLose: rewards.xpLose ?? room.xpLose ?? undefined,
    rewardMultiplier: rewards.rewardMultiplier ?? room.rewardMultiplier ?? room.multiplier ?? undefined,
    region: room.region || room.serverRegion || undefined,
    rows: Array.isArray(room.rows) ? room.rows : [],
  };
}

function RoomCard({ room, onPlay, onCreatePrivate, tx }) {
  const rows = Array.isArray(room.rows) ? room.rows : [];
  const cardInfo = buildCardInfo(room);

  return (
    <button className={`room-select-card room-select-card--${room.key}`} type="button" onClick={() => (room.key === 'private' ? onCreatePrivate?.() : onPlay?.(room))}>
      <img className="room-select-card__skin" src={`${asset}${room.card}`} alt="" draggable="false" />
      <span className="room-select-card__title">{tx(room.title)}</span>
      <img className={`room-select-card__art room-select-card__art--${room.key}`} src={`${asset}${room.tableArt}`} alt="" draggable="false" />
      <span className="room-select-card__stats">
        {cardInfo.map((item) => (
          <span className="room-select-card__stat" key={`${room.key}-${item.label}`}>
            <span className="room-select-card__statLabel">{tx(item.label)}</span>
            <span className="room-select-card__statValue">{item.value}</span>
          </span>
        ))}
      </span>
      <span className="room-select-card__rules">
        {rows.map((row) => (
          <span className="room-select-card__rule" key={`${room.key}-${row.text}`}>
            <img src={`${asset}${row.icon}`} alt="" draggable="false" />
            <span>{tx(row.text)}</span>
          </span>
        ))}
      </span>
      <span className="room-select-card__playSkinWrap">
        <img className="room-select-card__playSkin" src={`${asset}${room.button}`} alt="" draggable="false" />
        <span className="room-select-card__playText">{tx('PLAY')}</span>
      </span>
    </button>
  );
}

export default function RoomSelect({ navigation, data, backendActions, backendStatus, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const rooms = data?.rooms || [];
  const isStarting = backendStatus?.loading && backendStatus?.lastAction === 'matchmaking.start';

  const startTableMatchmaking = (room) => {
    const payload = buildMatchmakingPayload(room);
    backendActions?.startMatchmaking?.(payload);
  };

  return (
    <section className="screen room-select-screen" aria-label={tx('Room Select')}>
      <div className="room-select-vfx room-select-vfx--vignette" aria-hidden="true" />
      <div className="room-select-vfx room-select-vfx--lightRays" aria-hidden="true" />
      <div className="room-select-vfx room-select-vfx--titleShine" aria-hidden="true" />
      <div className="room-select-sparkles" aria-hidden="true">
        {sparkles.map((sparkle) => (
          <span className={`room-select-sparkle room-select-sparkle--${sparkle}`} key={sparkle} />
        ))}
      </div>

      <ProfileHud className="room-select-profile" user={user} />

      <div className="room-select-currency room-select-currency--coins">
        <img className="room-select-currency__icon" src={`${asset}6.png`} alt="" draggable="false" />
        <span className="room-select-currency__value">{wallet.coins || '0'}</span>
        <img className="room-select-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <div className="room-select-currency room-select-currency--gems">
        <img className="room-select-currency__icon" src={`${asset}7.png`} alt="" draggable="false" />
        <span className="room-select-currency__value">{wallet.gems || '0'}</span>
        <img className="room-select-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <img className="room-select-titleArt" src={`${asset}select-title.png`} alt={tx('Select Table')} draggable="false" />

      <div className="room-select-cards" aria-label={tx('Available tables')} aria-busy={isStarting}>
        {rooms.map((room) => <RoomCard key={room.key || room.id} room={room} onPlay={startTableMatchmaking} onCreatePrivate={navigation.goCreateRoom} tx={tx} />)}
      </div>

      {!rooms.length ? (
        <div className="room-select-empty">{tx('No backend tables available')}</div>
      ) : null}

      {backendStatus?.error && String(backendStatus?.lastAction || '').startsWith('matchmaking.') ? (
        <div className="room-select-empty room-select-error">{tx(backendStatus.error)}</div>
      ) : null}

      <button className="room-select-bottom room-select-bottom--play" type="button" onClick={() => backendActions?.startMatchmaking?.({})} disabled={isStarting}>
        <img className="room-select-bottom__skin" src={`${asset}bottom-play.png`} alt="" draggable="false" />
        <span className="room-select-bottom__title">{tx(isStarting ? 'MATCHING...' : 'PLAY NOW')}</span>
        <span className="room-select-bottom__subtitle">{tx('Jump into a quick game')}</span>
      </button>

      <button className="room-select-bottom room-select-bottom--create" type="button" onClick={navigation.goCreateRoom}>
        <img className="room-select-bottom__skin" src={`${asset}bottom-create.png`} alt="" draggable="false" />
        <span className="room-select-bottom__title">{tx('CREATE ROOM')}</span>
        <span className="room-select-bottom__subtitle">{tx('Invite friends &amp; play')}</span>
      </button>

      <button className="room-select-back" type="button" onClick={navigation.goMainMenu}>
        <img className="room-select-back__skin" src={`${asset}B2.png`} alt="" draggable="false" />
        <span className="room-select-back__text">{tx('BACK')}</span>
      </button>
    </section>
  );
}
