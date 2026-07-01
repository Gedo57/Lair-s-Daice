import { useState } from 'react';
import ProfileHud from '../components/ProfileHud.jsx';
const asset = '/assets/liars-dice/create-room/';
const shared = '/assets/liars-dice/room-select/';

const MIN_BUY_IN = 500;
const MIN_RANGE_PER_GAME_BASE = 500;
const MIN_STATIC_PER_GAME = 100;
const PEK_PERCENTAGE_OPTIONS = [25, 50, 100];
const PER_GAME_MODES = ['range', 'static'];

function parseCoinAmount(value, fallback = 0) {
  const number = Number(String(value ?? '').replace(/,/g, '').trim());
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.trunc(number));
}

function walletCoinAmount(wallet = {}) {
  return parseCoinAmount(
    wallet?.coins
      ?? wallet?.coinBalance
      ?? wallet?.walletCoins
      ?? wallet?.balance?.coins
      ?? wallet?.economy?.coins,
    0,
  );
}

function formatStakeOption(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value);
  if (number >= 1000) return `${Number((number / 1000).toFixed(1))}K`;
  return new Intl.NumberFormat('en-US').format(number);
}

function getBuyInStep(value) {
  const amount = parseCoinAmount(value, MIN_BUY_IN);
  if (amount < 5000) return 500;
  if (amount < 30000) return 5000;
  if (amount < 100000) return 10000;
  return 50000;
}

function getPreviousBuyInStep(value) {
  const amount = parseCoinAmount(value, MIN_BUY_IN);
  if (amount <= 5000) return 500;
  if (amount <= 30000) return 5000;
  if (amount <= 100000) return 10000;
  return 50000;
}

function stepBuyIn(value, direction) {
  const amount = Math.max(MIN_BUY_IN, parseCoinAmount(value, MIN_BUY_IN));
  if (direction < 0) return Math.max(MIN_BUY_IN, amount - getPreviousBuyInStep(amount));
  return amount + getBuyInStep(amount);
}

function getStaticPerGameStep(value) {
  const amount = parseCoinAmount(value, MIN_STATIC_PER_GAME);
  if (amount < 500) return 100;
  if (amount < 5000) return 500;
  if (amount < 30000) return 5000;
  if (amount < 100000) return 10000;
  return 50000;
}

function getPreviousStaticPerGameStep(value) {
  const amount = parseCoinAmount(value, MIN_STATIC_PER_GAME);
  if (amount <= 500) return 100;
  if (amount <= 5000) return 500;
  if (amount <= 30000) return 5000;
  if (amount <= 100000) return 10000;
  return 50000;
}

function stepStaticPerGame(value, direction, buyInAmount) {
  const maxValue = Math.max(MIN_STATIC_PER_GAME, parseCoinAmount(buyInAmount, MIN_BUY_IN));
  const amount = Math.min(maxValue, Math.max(MIN_STATIC_PER_GAME, parseCoinAmount(value, MIN_STATIC_PER_GAME)));
  if (direction < 0) return Math.max(MIN_STATIC_PER_GAME, amount - getPreviousStaticPerGameStep(amount));
  return Math.min(maxValue, amount + getStaticPerGameStep(amount));
}

function stepRangePerGameBase(value, direction, buyInAmount) {
  const maxValue = Math.max(MIN_RANGE_PER_GAME_BASE, parseCoinAmount(buyInAmount, MIN_BUY_IN));
  const amount = Math.min(maxValue, Math.max(MIN_RANGE_PER_GAME_BASE, parseCoinAmount(value, maxValue)));
  if (direction < 0) return Math.max(MIN_RANGE_PER_GAME_BASE, amount - getPreviousBuyInStep(amount));
  return Math.min(maxValue, amount + getBuyInStep(amount));
}

function normalizeStake(value, fallback = MIN_BUY_IN) {
  const number = parseCoinAmount(value, fallback);
  return Math.max(MIN_BUY_IN, number || fallback);
}

function normalizePerGameMode(value) {
  const normalized = String(value || 'range').trim().toLowerCase();
  return PER_GAME_MODES.includes(normalized) ? normalized : 'range';
}

function buildRangeCoinBetOptions(baseAmount) {
  const base = Math.max(MIN_RANGE_PER_GAME_BASE, parseCoinAmount(baseAmount, MIN_RANGE_PER_GAME_BASE));
  const low = Math.max(MIN_STATIC_PER_GAME, Math.floor(base * 0.2));
  const mid = Math.max(low, Math.floor(base * 0.4));
  return Array.from(new Set([low, mid, base])).sort((left, right) => left - right);
}

function normalizePerGameAmount(value, mode, baseAmount, buyInAmount) {
  const buyIn = normalizeStake(buyInAmount, MIN_BUY_IN);
  const raw = parseCoinAmount(value, 0);

  if (mode === 'static') {
    if (!raw) return Math.min(buyIn, MIN_STATIC_PER_GAME);
    return Math.min(buyIn, Math.max(MIN_STATIC_PER_GAME, raw));
  }

  const options = buildRangeCoinBetOptions(Math.min(buyIn, Math.max(MIN_RANGE_PER_GAME_BASE, parseCoinAmount(baseAmount, buyIn))));
  return options.includes(raw) ? raw : options[0];
}

function normalizePekPercentage(value, fallback = 25) {
  const number = Number(String(value || '').replace(/[^0-9]/g, ''));
  if (PEK_PERCENTAGE_OPTIONS.includes(number)) return number;
  return PEK_PERCENTAGE_OPTIONS.includes(fallback) ? fallback : 25;
}

function calculateFinalPekAmount(perGameAmount, percentage) {
  const base = Number(perGameAmount) || 0;
  const percent = normalizePekPercentage(percentage, 25);
  return base + Math.floor((base * percent) / 100);
}

function TopHud({ user, wallet }) {
  return (
    <>
      <ProfileHud className="create-room-profile" user={user} />

      <div className="create-room-currency create-room-currency--coins">
        <img className="create-room-currency__icon" src={`${shared}6.png`} alt="" draggable="false" />
        <span className="create-room-currency__value">{wallet?.coins || '0'}</span>
        <img className="create-room-currency__plus" src={`${shared}8.png`} alt="" draggable="false" />
      </div>

      <div className="create-room-currency create-room-currency--gems">
        <img className="create-room-currency__icon" src={`${shared}7.png`} alt="" draggable="false" />
        <span className="create-room-currency__value">{wallet?.gems || '0'}</span>
        <img className="create-room-currency__plus" src={`${shared}8.png`} alt="" draggable="false" />
      </div>
    </>
  );
}

function OptionButton({ value, active = false, disabled = false, className = '', tx, onClick }) {
  return (
    <button className={`create-room-option ${active ? 'is-active' : ''} ${disabled ? 'is-disabled' : ''} ${className}`} type="button" onClick={onClick} disabled={disabled}>
      <img className="create-room-option__skin" src={`${asset}${active ? 'b2.png' : 'b1.png'}`} alt="" draggable="false" />
      <span className="create-room-option__text">{tx(value)}</span>
    </button>
  );
}

function StepperControl({ value, displayValue, disabled = false, className = '', onDecrease, onIncrease, decreaseDisabled = false, increaseDisabled = false, tx }) {
  return (
    <div className={`create-room-stepper ${className} ${disabled ? 'is-disabled' : ''}`}>
      <button
        className="create-room-stepper__button create-room-stepper__button--minus"
        type="button"
        onClick={onDecrease}
        disabled={disabled || decreaseDisabled}
        aria-label={tx('Decrease')}
      >
        −
      </button>
      <span className="create-room-stepper__value">{displayValue ?? value}</span>
      <button
        className="create-room-stepper__button create-room-stepper__button--plus"
        type="button"
        onClick={onIncrease}
        disabled={disabled || increaseDisabled}
        aria-label={tx('Increase')}
      >
        +
      </button>
    </div>
  );
}

function getVisibleRoomCode(data, settings) {
  return data?.currentRoom?.roomCode || data?.currentRoom?.code || data?.currentRoomCode || settings.roomCode || 'CREATE FIRST';
}

export default function CreateRoom({ navigation, data, backendActions, backendStatus, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const settings = data?.createRoom || {};
  const players = settings.players?.length ? settings.players : ['2', '3', '4'];
  const cups = settings.cups?.length ? settings.cups : ['5'];
  const timers = settings.timers || [];
  const isCreating = backendStatus?.loading && ['rooms.create', 'bots.start'].includes(backendStatus?.lastAction);

  const initialBuyIn = normalizeStake(settings.buyInAmount || settings.buyInCoins || settings.customBuyIn || settings.customStake || settings.entryFee, MIN_BUY_IN);
  const initialPerGameMode = normalizePerGameMode(settings.perGameMode || settings.betMode || settings.coinBetMode);
  const initialPerGameBase = Math.min(
    initialBuyIn,
    Math.max(MIN_RANGE_PER_GAME_BASE, parseCoinAmount(settings.perGameBase || settings.maxCoinBet || settings.maxBidCoins || settings.rangeBase || initialBuyIn, initialBuyIn)),
  );

  const [roomName, setRoomName] = useState(settings.roomName || `${user?.displayName || user?.username || 'Player'}’s Room`);
  const [selectedPlayers, setSelectedPlayers] = useState(settings.selectedPlayers || '2');
  const [selectedCups, setSelectedCups] = useState('5');
  const [selectedTimer, setSelectedTimer] = useState(settings.selectedTimer || '30s');
  const [selectedRoomMode, setSelectedRoomMode] = useState(String(settings.selectedRoomMode || settings.roomMode || 'normal').toLowerCase() === 'bots' ? 'bots' : 'normal');
  const [selectedBuyIn, setSelectedBuyIn] = useState(initialBuyIn);
  const [perGameMode, setPerGameMode] = useState(initialPerGameMode);
  const [perGameBase, setPerGameBase] = useState(initialPerGameBase);
  const [selectedPerGame, setSelectedPerGame] = useState(() => normalizePerGameAmount(
    settings.selectedPerGame || settings.perGameAmount || settings.roundStake || settings.perGameCoins || settings.defaultCoinBet || settings.defaultBidCoins,
    initialPerGameMode,
    initialPerGameBase,
    initialBuyIn,
  ));
  const [pekEnabled, setPekEnabled] = useState(Boolean(settings.pekEnabled ?? settings.slamEnabled ?? false));
  const [selectedPekPercentage, setSelectedPekPercentage] = useState(normalizePekPercentage(settings.pekPercentage || settings.slamPercentage || settings.pekPercent || settings.slamPercent, 25));
  const [isPrivate, setIsPrivate] = useState(settings.isPrivate ?? true);

  const isBotsMode = selectedRoomMode === 'bots';
  const rangeCoinBetOptions = buildRangeCoinBetOptions(perGameBase);
  const coinBetOptionsForStake = perGameMode === 'range' ? rangeCoinBetOptions : [selectedPerGame];
  const safeSelectedPerGame = normalizePerGameAmount(selectedPerGame, perGameMode, perGameBase, selectedBuyIn);
  const finalPekAmount = calculateFinalPekAmount(safeSelectedPerGame, selectedPekPercentage);
  const perGameInvalid = safeSelectedPerGame > selectedBuyIn;
  const pekRiskInvalid = pekEnabled && finalPekAmount > selectedBuyIn;
  const walletCoins = walletCoinAmount(wallet);
  const insufficientFunds = walletCoins > 0 && selectedBuyIn > walletCoins;
  const pekRiskError = pekRiskInvalid
    ? `Pek/Slam risk ${formatStakeOption(finalPekAmount)} must not be greater than buy-in ${formatStakeOption(selectedBuyIn)}`
    : '';
  const insufficientFundsError = insufficientFunds
    ? `Buy-in ${formatStakeOption(selectedBuyIn)} is higher than wallet ${formatStakeOption(walletCoins)}`
    : '';
  const localCreateError = pekRiskError || insufficientFundsError;
  const createDisabled = isCreating || perGameInvalid || pekRiskInvalid || insufficientFunds;
  const perGameCopy = perGameMode === 'range'
    ? `Range ${formatStakeOption(perGameBase)}`
    : `Static ${formatStakeOption(safeSelectedPerGame)}`;
  const selectedRulesCopy = `Rules: 5 dice each • Buy-in ${formatStakeOption(selectedBuyIn)} • ${perGameCopy}${pekEnabled ? ` • Pek ${selectedPekPercentage}% = ${formatStakeOption(finalPekAmount)}` : ' • Pek OFF'}`;

  const currentSettings = {
    ...settings,
    roomName,
    selectedPlayers,
    maxPlayers: Number(selectedPlayers),
    playersCount: Number(selectedPlayers),
    selectedCups: '5',
    startingCups: 5,
    startingDice: 5,
    dicePerPlayer: 5,
    selectedTimer,
    turnTimer: Number(String(selectedTimer).replace(/[^0-9]/g, '')) || 30,
    buyInAmount: selectedBuyIn,
    buyInCoins: selectedBuyIn,
    customBuyIn: selectedBuyIn,
    customStake: selectedBuyIn,
    entryFee: selectedBuyIn,
    perGameMode,
    coinBetMode: perGameMode,
    perGameBase: perGameMode === 'range' ? perGameBase : safeSelectedPerGame,
    selectedPerGame: safeSelectedPerGame,
    perGameAmount: safeSelectedPerGame,
    perGameCoins: safeSelectedPerGame,
    roundStake: safeSelectedPerGame,
    minCoinBet: perGameMode === 'range' ? coinBetOptionsForStake[0] : safeSelectedPerGame,
    minBidCoins: perGameMode === 'range' ? coinBetOptionsForStake[0] : safeSelectedPerGame,
    maxCoinBet: perGameMode === 'range' ? coinBetOptionsForStake[coinBetOptionsForStake.length - 1] : safeSelectedPerGame,
    maxBidCoins: perGameMode === 'range' ? coinBetOptionsForStake[coinBetOptionsForStake.length - 1] : safeSelectedPerGame,
    defaultCoinBet: safeSelectedPerGame,
    defaultBidCoins: safeSelectedPerGame,
    bidCoinStep: perGameMode === 'static' ? getStaticPerGameStep(safeSelectedPerGame) : getBuyInStep(perGameBase),
    coinBetOptions: coinBetOptionsForStake,
    pekEnabled,
    slamEnabled: pekEnabled,
    pekPercentage: selectedPekPercentage,
    slamPercentage: selectedPekPercentage,
    finalPekAmount,
    finalSlamAmount: finalPekAmount,
    requiredPekCoverAmount: pekEnabled ? finalPekAmount : safeSelectedPerGame,
    maxChallengeAmount: pekEnabled ? finalPekAmount : safeSelectedPerGame,
    pricing: {
      buyInAmount: selectedBuyIn,
      buyInCoins: selectedBuyIn,
      entryFee: selectedBuyIn,
      startingStack: selectedBuyIn,
      minBuyIn: MIN_BUY_IN,
      maxBuyIn: 0,
      perGameMode,
      coinBetMode: perGameMode,
      perGameBase: perGameMode === 'range' ? perGameBase : safeSelectedPerGame,
      perGameOptions: coinBetOptionsForStake,
      selectedPerGame: safeSelectedPerGame,
      selectedPerGameAmount: safeSelectedPerGame,
      perGameAmount: safeSelectedPerGame,
      perGameCoins: safeSelectedPerGame,
      roundStake: safeSelectedPerGame,
      minCoinBet: perGameMode === 'range' ? coinBetOptionsForStake[0] : safeSelectedPerGame,
      minBidCoins: perGameMode === 'range' ? coinBetOptionsForStake[0] : safeSelectedPerGame,
      maxCoinBet: perGameMode === 'range' ? coinBetOptionsForStake[coinBetOptionsForStake.length - 1] : safeSelectedPerGame,
      maxBidCoins: perGameMode === 'range' ? coinBetOptionsForStake[coinBetOptionsForStake.length - 1] : safeSelectedPerGame,
      defaultCoinBet: safeSelectedPerGame,
      defaultBidCoins: safeSelectedPerGame,
      coinBetOptions: coinBetOptionsForStake,
      pekEnabled,
      slamEnabled: pekEnabled,
      pekPercentage: selectedPekPercentage,
      slamPercentage: selectedPekPercentage,
      finalPekAmount,
      finalSlamAmount: finalPekAmount,
      requiredPekCoverAmount: pekEnabled ? finalPekAmount : safeSelectedPerGame,
      maxChallengeAmount: pekEnabled ? finalPekAmount : safeSelectedPerGame,
      pekMultiplier: 1 + (selectedPekPercentage / 100),
    },
    stakeValidationClient: {
      validated: true,
      source: 'frontend_create_room',
      buyInAmount: selectedBuyIn,
      perGameMode,
      perGameBase: perGameMode === 'range' ? perGameBase : safeSelectedPerGame,
      coinBetOptions: coinBetOptionsForStake,
      selectedPerGame: safeSelectedPerGame,
      perGameAmount: safeSelectedPerGame,
      pekEnabled,
      pekPercentage: selectedPekPercentage,
      finalPekAmount,
    },
    bidStyle: 'Official Rules',
    selectedRoomMode,
    roomMode: selectedRoomMode,
    gameMode: selectedRoomMode,
    playMode: selectedRoomMode,
    botsEnabled: isBotsMode,
    playWithBots: isBotsMode,
    withBots: isBotsMode,
    isPrivate,
  };

  const roomCode = getVisibleRoomCode(data, settings);
  const createSelectedHandler = (setter, value) => () => setter(value);
  const handleBuyInStep = (direction) => () => {
    const nextBuyIn = stepBuyIn(selectedBuyIn, direction);
    setSelectedBuyIn(nextBuyIn);
    setPerGameBase(nextBuyIn);
    if (perGameMode === 'range') {
      setSelectedPerGame(buildRangeCoinBetOptions(nextBuyIn)[0]);
    } else {
      setSelectedPerGame((current) => Math.min(nextBuyIn, Math.max(MIN_STATIC_PER_GAME, parseCoinAmount(current, MIN_STATIC_PER_GAME))));
    }
  };
  const handlePerGameModeSelect = (mode) => () => {
    const nextMode = normalizePerGameMode(mode);
    setPerGameMode(nextMode);
    if (nextMode === 'range') {
      setPerGameBase(selectedBuyIn);
      setSelectedPerGame(buildRangeCoinBetOptions(selectedBuyIn)[0]);
    } else {
      setSelectedPerGame((current) => Math.min(selectedBuyIn, Math.max(MIN_STATIC_PER_GAME, parseCoinAmount(current, MIN_STATIC_PER_GAME))));
    }
  };
  const handlePerGameBaseStep = (direction) => () => {
    const nextBase = stepRangePerGameBase(perGameBase, direction, selectedBuyIn);
    const nextOptions = buildRangeCoinBetOptions(nextBase);
    setPerGameBase(nextBase);
    setSelectedPerGame((current) => (nextOptions.includes(current) ? current : nextOptions[0]));
  };
  const handleStaticPerGameStep = (direction) => () => {
    setSelectedPerGame((current) => stepStaticPerGame(current, direction, selectedBuyIn));
  };
  const handlePekPercentageStep = (direction) => () => {
    setSelectedPekPercentage((current) => {
      const index = PEK_PERCENTAGE_OPTIONS.indexOf(normalizePekPercentage(current, 25));
      const nextIndex = Math.min(PEK_PERCENTAGE_OPTIONS.length - 1, Math.max(0, index + direction));
      return PEK_PERCENTAGE_OPTIONS[nextIndex];
    });
  };

  const copyCode = async () => {
    if (!roomCode || roomCode === 'CREATE FIRST') return;
    try {
      await navigator.clipboard?.writeText?.(roomCode);
    } catch (_error) {
      // Clipboard can be unavailable. The code remains visible for manual copy.
    }
  };

  return (
    <section className="screen create-room-screen" aria-label={tx('Create Room')}>
      <TopHud user={user} wallet={wallet} />

      <div className="create-room-board">
        <img className="create-room-board__skin" src={`${asset}Pannal.png`} alt="" draggable="false" />

        <img className="create-room-character" src={`${asset}p1.png`} alt="" draggable="false" />

        <div className="create-room-form">
          <div className="create-room-block create-room-block--name">
            <span className="create-room-label">{tx('ROOM NAME')}</span>
            <div className="create-room-input create-room-input--name">
              <img className="create-room-input__skin" src={`${asset}pana44.png`} alt="" draggable="false" />
              <input
                className="create-room-input__field"
                type="text"
                value={roomName}
                onChange={(event) => setRoomName(event.target.value)}
                aria-label={tx('ROOM NAME')}
                maxLength={22}
                inputMode="text"
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck="false"
                enterKeyHint="done"
              />
            </div>
          </div>

          <div className="create-room-block create-room-block--players">
            <span className="create-room-label">{tx('PLAYERS')}</span>
            <div className="create-room-optionRow create-room-optionRow--players">
              {players.map((value) => <OptionButton key={value} value={value} active={value === selectedPlayers} tx={tx} onClick={createSelectedHandler(setSelectedPlayers, value)} />)}
            </div>
          </div>

          <div className="create-room-block create-room-block--cups">
            <span className="create-room-label">{tx('DICE PER PLAYER')}</span>
            <div className="create-room-optionRow create-room-optionRow--cups">
              {cups.map((value) => <OptionButton key={value} value={value} active={value === selectedCups} tx={tx} onClick={createSelectedHandler(setSelectedCups, '5')} />)}
            </div>
          </div>

          <div className="create-room-block create-room-block--timer">
            <span className="create-room-label">{tx('TURN TIMER')}</span>
            <div className="create-room-optionRow create-room-optionRow--timer">
              {timers.map((value) => <OptionButton key={value} value={value} active={value === selectedTimer} tx={tx} onClick={createSelectedHandler(setSelectedTimer, value)} />)}
            </div>
          </div>

          <div className="create-room-block create-room-block--bid">
            <span className="create-room-label">{tx('BUY-IN')}</span>
            <StepperControl
              className="create-room-stepper--buyIn"
              value={selectedBuyIn}
              displayValue={formatStakeOption(selectedBuyIn)}
              tx={tx}
              onDecrease={handleBuyInStep(-1)}
              onIncrease={handleBuyInStep(1)}
              decreaseDisabled={selectedBuyIn <= MIN_BUY_IN}
            />
          </div>

          <div className="create-room-block create-room-block--perGame">
            <span className="create-room-label">{tx('PER GAME')}</span>
            <div className="create-room-perGameMode">
              <OptionButton value="RANGE" active={perGameMode === 'range'} className="create-room-option--mode create-room-option--mini" tx={tx} onClick={handlePerGameModeSelect('range')} />
              <OptionButton value="STATIC" active={perGameMode === 'static'} className="create-room-option--mode create-room-option--mini" tx={tx} onClick={handlePerGameModeSelect('static')} />
            </div>

            {perGameMode === 'range' ? (
              <>
                <StepperControl
                  className="create-room-stepper--perGame"
                  value={perGameBase}
                  displayValue={formatStakeOption(perGameBase)}
                  tx={tx}
                  onDecrease={handlePerGameBaseStep(-1)}
                  onIncrease={handlePerGameBaseStep(1)}
                  decreaseDisabled={perGameBase <= MIN_RANGE_PER_GAME_BASE}
                  increaseDisabled={perGameBase >= selectedBuyIn}
                />
              </>
            ) : (
              <StepperControl
                className="create-room-stepper--perGame create-room-stepper--staticPerGame"
                value={safeSelectedPerGame}
                displayValue={formatStakeOption(safeSelectedPerGame)}
                tx={tx}
                onDecrease={handleStaticPerGameStep(-1)}
                onIncrease={handleStaticPerGameStep(1)}
                decreaseDisabled={safeSelectedPerGame <= MIN_STATIC_PER_GAME}
                increaseDisabled={safeSelectedPerGame >= selectedBuyIn}
              />
            )}
          </div>

          <div className="create-room-block create-room-block--pekToggle">
            <span className="create-room-label">{tx('PEK / SLAM')}</span>
            <button
              className={`create-room-privateToggle create-room-pekToggle ${pekEnabled ? 'is-on' : 'is-off'}`}
              type="button"
              onClick={() => setPekEnabled((value) => !value)}
              aria-pressed={pekEnabled}
              aria-label={pekEnabled ? tx('Pek on') : tx('Pek off')}
            >
              <img src={`${asset}${pekEnabled ? 'on.png' : 'off.png'}`} alt="" draggable="false" />
            </button>
          </div>

          <div className={`create-room-block create-room-block--pekPercent ${pekEnabled ? '' : 'is-disabled'}`}>
            <span className="create-room-label">{tx('PEK AMOUNT')}</span>
            <StepperControl
              className="create-room-stepper--pekPercent"
              value={selectedPekPercentage}
              displayValue={`${selectedPekPercentage}%`}
              tx={tx}
              disabled={!pekEnabled}
              onDecrease={handlePekPercentageStep(-1)}
              onIncrease={handlePekPercentageStep(1)}
              decreaseDisabled={selectedPekPercentage <= PEK_PERCENTAGE_OPTIONS[0]}
              increaseDisabled={selectedPekPercentage >= PEK_PERCENTAGE_OPTIONS[PEK_PERCENTAGE_OPTIONS.length - 1]}
            />
            <span className="create-room-pekPreview">{tx('Risk')}: {formatStakeOption(finalPekAmount)}</span>
            {pekRiskInvalid ? <span className="create-room-pekPreview create-room-pekPreview--error">{tx(pekRiskError)}</span> : null}
          </div>

          <div className="create-room-block create-room-block--mode">
            <span className="create-room-label">{tx('ROOM MODE')}</span>
            <div className="create-room-optionRow create-room-optionRow--mode">
              <OptionButton value="NORMAL" active={selectedRoomMode === 'normal'} className="create-room-option--mode" tx={tx} onClick={createSelectedHandler(setSelectedRoomMode, 'normal')} />
              <OptionButton value="BOTS" active={selectedRoomMode === 'bots'} className="create-room-option--mode" tx={tx} onClick={createSelectedHandler(setSelectedRoomMode, 'bots')} />
            </div>
          </div>

          <div className="create-room-block create-room-block--private">
            <span className="create-room-label">{tx('PRIVATE ROOM')}</span>
            <button
              className={`create-room-privateToggle ${isPrivate ? 'is-on' : 'is-off'}`}
              type="button"
              onClick={() => setIsPrivate((value) => !value)}
              aria-pressed={isPrivate}
              aria-label={isPrivate ? tx('Private room on') : tx('Private room off')}
            >
              <img src={`${asset}${isPrivate ? 'on.png' : 'off.png'}`} alt="" draggable="false" />
            </button>
          </div>

          <div className="create-room-block create-room-block--code">
            <span className="create-room-label">{tx('ROOM CODE')}</span>
            <div className="create-room-codeWrap">
              <img className="create-room-codeWrap__skin" src={`${asset}pana433.png`} alt="" draggable="false" />
              <span className="create-room-codeWrap__text">{roomCode}</span>
              <button className="create-room-copy" type="button" onClick={copyCode} aria-label={tx('Copy room code')}>
                <img src={`${asset}b5.png`} alt="" draggable="false" />
              </button>
            </div>
          </div>

          <button className="create-room-invite" type="button" onClick={() => navigation.goRoomLobby()}>
            <img className="create-room-invite__skin" src={`${asset}b4.png`} alt="" draggable="false" />
            <span className="create-room-invite__text">{tx(data?.currentRoom ? 'OPEN LOBBY' : 'INVITE FRIENDS')}</span>
          </button>

          <span className="create-room-rules">{tx(isBotsMode ? 'Bots mode starts immediately with Bots.' : selectedRulesCopy)}</span>

          {localCreateError ? <span className="create-room-rules create-room-rules--error">{tx(localCreateError)}</span> : null}

          {backendStatus?.error && ['rooms.create', 'bots.start', 'bots.start.error'].includes(backendStatus?.lastAction) ? <span className="create-room-rules create-room-rules--error create-room-rules--backendError">{backendStatus.error}</span> : null}

          <button
            className="create-room-bottom create-room-bottom--create"
            type="button"
            onClick={() => {
              if (createDisabled) return;
              if (isBotsMode && backendActions?.startBotsMatch) {
                backendActions.startBotsMatch(currentSettings);
                return;
              }
              backendActions?.createRoom?.(currentSettings) || navigation.goRoomLobby();
            }}
            disabled={createDisabled}
          >
            <img className="create-room-bottom__skin" src={`${asset}b3.png`} alt="" draggable="false" />
            <span className="create-room-bottom__text">{tx(isCreating ? 'CREATING...' : isBotsMode ? 'START SOLO' : 'CREATE ROOM')}</span>
          </button>

          <button className="create-room-bottom create-room-bottom--back" type="button" onClick={navigation.goMainMenu}>
            <img className="create-room-bottom__skin" src={`${asset}232.png`} alt="" draggable="false" />
            <span className="create-room-bottom__text">{tx('BACK')}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
