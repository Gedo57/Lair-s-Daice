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
        <span className="create-room-currency__value">{wallet?.coins || '125,680'}</span>
        <img className="create-room-currency__plus" src={`${shared}8.png`} alt="" draggable="false" />
      </div>

      <div className="create-room-currency create-room-currency--gems">
        <img className="create-room-currency__icon" src={`${shared}7.png`} alt="" draggable="false" />
        <span className="create-room-currency__value">{wallet?.gems || '2,350'}</span>
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

export default function CreateRoom({ navigation, data, backendActions, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const settings = data?.createRoom || {};
  const players = settings.players || [];
  const cups = settings.cups || [];
  const timers = settings.timers || [];
  const bidStyles = settings.bidStyles || [];

  const [roomName, setRoomName] = useState(settings.roomName || 'Emma’s Room');
  const [selectedPlayers, setSelectedPlayers] = useState(settings.selectedPlayers || '4');
  const [selectedCups, setSelectedCups] = useState(settings.selectedCups || '5');
  const [selectedTimer, setSelectedTimer] = useState(settings.selectedTimer || '15s');
  const [selectedBidStyle, setSelectedBidStyle] = useState(settings.selectedBidStyle || 'Classic');
  const [isPrivate, setIsPrivate] = useState(settings.isPrivate ?? true);

  const currentSettings = {
    ...settings,
    roomName,
    selectedPlayers,
    selectedCups,
    selectedTimer,
    selectedBidStyle,
    isPrivate,
  };

  const createSelectedHandler = (setter, value) => () => setter(value);

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
            <span className="create-room-label">{tx('STARTING CUPS')}</span>
            <div className="create-room-optionRow create-room-optionRow--cups">
              {cups.map((value) => <OptionButton key={value} value={value} active={value === selectedCups} tx={tx} onClick={createSelectedHandler(setSelectedCups, value)} />)}
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

          <div className="create-room-block create-room-block--private">
            <span className="create-room-label">{tx('TURN TIMER')}</span>
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
              <span className="create-room-codeWrap__text">{settings.roomCode || 'LD-4729'}</span>
              <button className="create-room-copy" type="button">
                <img src={`${asset}b5.png`} alt="" draggable="false" />
              </button>
            </div>
          </div>

          <button className="create-room-invite" type="button">
            <img className="create-room-invite__skin" src={`${asset}b4.png`} alt="" draggable="false" />
            <span className="create-room-invite__text">{tx('INVITE FRIENDS')}</span>
          </button>

          <span className="create-room-rules">{tx(settings.rulesCopy || 'Custom Rules:Standard • bluff Re-roll • enabled • Slam enabled')}</span>

          <button className="create-room-bottom create-room-bottom--create" type="button" onClick={() => backendActions?.createRoom?.(currentSettings) || navigation.goGameplay()}>
            <img className="create-room-bottom__skin" src={`${asset}b3.png`} alt="" draggable="false" />
            <span className="create-room-bottom__text">{tx('CREATE ROOM')}</span>
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
