import { useMemo, useState } from 'react';
import ProfileHud from '../components/ProfileHud.jsx';

const asset = '/assets/liars-dice/create-room/';
const shared = '/assets/liars-dice/room-select/';

function TopHud({ user, wallet }) {
  return (
    <>
      <ProfileHud className="join-room-profile" user={user} />

      <div className="join-room-currency join-room-currency--coins">
        <img className="join-room-currency__icon" src={`${shared}6.png`} alt="" draggable="false" />
        <span className="join-room-currency__value">{wallet?.coins || '125,680'}</span>
        <img className="join-room-currency__plus" src={`${shared}8.png`} alt="" draggable="false" />
      </div>

      <div className="join-room-currency join-room-currency--gems">
        <img className="join-room-currency__icon" src={`${shared}7.png`} alt="" draggable="false" />
        <span className="join-room-currency__value">{wallet?.gems || '2,350'}</span>
        <img className="join-room-currency__plus" src={`${shared}8.png`} alt="" draggable="false" />
      </div>
    </>
  );
}

function normalizeRoomCode(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '');
}

function RecentRoom({ room, tx, onJoin }) {
  return (
    <button className="join-room-recent" type="button" onClick={() => onJoin(room.code)}>
      <span className="join-room-recent__code">{room.code}</span>
      <span className="join-room-recent__name">{tx(room.name)}</span>
      <span className="join-room-recent__players">{room.players}</span>
      <span className="join-room-recent__join">{tx('JOIN')}</span>
    </button>
  );
}

export default function JoinRoom({ navigation, data, backendActions, backendStatus, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const joinRoomData = data?.joinRoom || {};
  const recentRooms = joinRoomData.recentRooms || [];
  const [roomCode, setRoomCode] = useState(joinRoomData.defaultCode || '');

  const cleanCode = useMemo(() => normalizeRoomCode(roomCode), [roomCode]);
  const canJoin = cleanCode.length >= 4;
  const isJoining = backendStatus?.loading && backendStatus?.lastAction === 'rooms.join';

  const submitJoin = (code = cleanCode) => {
    const nextCode = normalizeRoomCode(code);
    if (nextCode.length < 4) return;
    backendActions?.joinRoom?.({ id: nextCode, key: nextCode, code: nextCode }) || navigation.goMatchmaking();
  };

  const pasteCode = async () => {
    try {
      const clipboardText = await navigator.clipboard?.readText?.();
      const pastedCode = normalizeRoomCode(clipboardText);
      if (pastedCode) setRoomCode(pastedCode);
    } catch (_error) {
      /* Clipboard access can be blocked by the browser. The input remains editable. */
    }
  };

  return (
    <section className="screen join-room-screen" aria-label={tx('Join Room')}>
      <TopHud user={user} wallet={wallet} />

      <div className="join-room-board">
        <img className="join-room-board__skin" src={`${asset}Pannal.png`} alt="" draggable="false" />
        <img className="join-room-character" src={`${asset}p1.png`} alt="" draggable="false" />

        <div className="join-room-form">
          <h1 className="join-room-title">{tx('JOIN ROOM')}</h1>
          <p className="join-room-subtitle">{tx('Enter the private room code to join your friends')}</p>

          <div className="join-room-codeBlock">
            <span className="join-room-label">{tx('ROOM CODE')}</span>
            <div className="join-room-codeWrap">
              <img className="join-room-codeWrap__skin" src={`${asset}pana433.png`} alt="" draggable="false" />
              <input
                className="join-room-codeWrap__field"
                type="text"
                value={roomCode}
                onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))}
                placeholder="LD-4729"
                aria-label={tx('ROOM CODE')}
                maxLength={12}
                inputMode="text"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                enterKeyHint="go"
              />
              <button className="join-room-paste" type="button" onClick={pasteCode} aria-label={tx('Paste room code')}>
                <img src={`${asset}b5.png`} alt="" draggable="false" />
              </button>
            </div>
          </div>

          <span className="join-room-or">{tx('OR')}</span>

          <div className="join-room-recentBlock">
            <span className="join-room-label join-room-label--recent">{tx('RECENT ROOMS')}</span>
            <div className="join-room-recentList">
              {recentRooms.map((room) => <RecentRoom key={room.code} room={room} tx={tx} onJoin={submitJoin} />)}
            </div>
          </div>

          <span className="join-room-helper">{tx('Use a valid room code like LD-4729')}</span>

          <button
            className={`join-room-bottom join-room-bottom--join ${canJoin ? 'is-ready' : 'is-disabled'}`}
            type="button"
            onClick={() => submitJoin()}
            disabled={!canJoin || isJoining}
          >
            <img className="join-room-bottom__skin" src={`${asset}b3.png`} alt="" draggable="false" />
            <span className="join-room-bottom__text">{tx(isJoining ? 'JOINING...' : 'JOIN ROOM')}</span>
          </button>

          <button className="join-room-bottom join-room-bottom--back" type="button" onClick={navigation.goMainMenu}>
            <img className="join-room-bottom__skin" src={`${asset}232.png`} alt="" draggable="false" />
            <span className="join-room-bottom__text">{tx('BACK')}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
