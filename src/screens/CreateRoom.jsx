import { useState } from 'react';
import ProfileHud from '../components/ProfileHud.jsx';
const asset = '/assets/liars-dice/create-room/';
const shared = '/assets/liars-dice/room-select/';

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

function OptionButton({ value, active = false, className = '', tx, onClick }) {
  return (
    <button className={`create-room-option ${active ? 'is-active' : ''} ${className}`} type="button" onClick={onClick}>
      <img className="create-room-option__skin" src={`${asset}${active ? 'b2.png' : 'b1.png'}`} alt="" draggable="false" />
      <span className="create-room-option__text">{tx(value)}</span>
    </button>
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
  const bidStyles = settings.bidStyles || [];
  const isCreating = backendStatus?.loading && backendStatus?.lastAction === 'rooms.create';

  const [roomName, setRoomName] = useState(settings.roomName || `${user?.displayName || user?.username || 'Player'}’s Room`);
  const [selectedPlayers, setSelectedPlayers] = useState(settings.selectedPlayers || '2');
  const [selectedCups, setSelectedCups] = useState('5');
  const [selectedTimer, setSelectedTimer] = useState(settings.selectedTimer || '15s');
  const [selectedBidStyle, setSelectedBidStyle] = useState(settings.selectedBidStyle || 'Classic');
  const [selectedRoomMode, setSelectedRoomMode] = useState(String(settings.selectedRoomMode || settings.roomMode || 'normal').toLowerCase() === 'bots' ? 'bots' : 'normal');
  const [isPrivate, setIsPrivate] = useState(settings.isPrivate ?? true);

  const isBotsMode = selectedRoomMode === 'bots';
  const selectedRulesCopy = selectedBidStyle === 'Wild Ones'
    ? 'Rules: 5 dice each • ones are wild unless first bid is ones • bid or call liar only'
    : 'Rules: 5 dice each • bid or call liar only';

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
    turnTimer: Number(String(selectedTimer).replace(/[^0-9]/g, '')) || 15,
    selectedBidStyle,
    bidStyle: selectedBidStyle,
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
            <span className="create-room-label">{tx('BID STYLE')}</span>
            <div className="create-room-optionRow create-room-optionRow--bid">
              {bidStyles.map((value) => <OptionButton key={value} value={value} active={value === selectedBidStyle} className="create-room-option--wide" tx={tx} onClick={createSelectedHandler(setSelectedBidStyle, value)} />)}
            </div>
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

          <span className="create-room-rules">{tx(isBotsMode ? 'Bots mode starts immediately with CPU players.' : selectedRulesCopy)}</span>

          {backendStatus?.error && backendStatus?.lastAction === 'rooms.create' ? <span className="create-room-rules" style={{ top: '366px', color: '#8a1a11' }}>{backendStatus.error}</span> : null}

          <button
            className="create-room-bottom create-room-bottom--create"
            type="button"
            onClick={() => backendActions?.createRoom?.(currentSettings) || navigation.goRoomLobby()}
            disabled={isCreating}
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
