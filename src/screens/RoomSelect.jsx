import ProfileHud from '../components/ProfileHud.jsx';
const asset = '/assets/liars-dice/room-select/';
const sparkles = Array.from({ length: 20 }, (_, index) => index + 1);

function RoomCard({ room, onJoin, tx }) {
  return (
    <button className={`room-select-card room-select-card--${room.key}`} type="button" onClick={() => onJoin?.(room)}>
      <img className="room-select-card__skin" src={`${asset}${room.card}`} alt="" draggable="false" />
      <span className="room-select-card__title">{tx(room.title)}</span>
      <img className={`room-select-card__art room-select-card__art--${room.key}`} src={`${asset}${room.tableArt}`} alt="" draggable="false" />
      <span className="room-select-card__label">{tx('Stakes')}</span>
      <span className="room-select-card__stakes">{room.stakes}</span>
      <span className="room-select-card__buyLabel">{tx('Buy-in')}</span>
      <span className="room-select-card__buyValue">{room.buyIn}</span>
      <span className="room-select-card__rules">
        {room.rows.map((row) => (
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

export default function RoomSelect({ navigation, data, backendActions, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const rooms = data?.rooms || [];

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
        <span className="room-select-currency__value">{wallet.coins || '125,680'}</span>
        <img className="room-select-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <div className="room-select-currency room-select-currency--gems">
        <img className="room-select-currency__icon" src={`${asset}7.png`} alt="" draggable="false" />
        <span className="room-select-currency__value">{wallet.gems || '2,350'}</span>
        <img className="room-select-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <img className="room-select-titleArt" src={`${asset}select-title.png`} alt={tx('Select Table')} draggable="false" />

      <div className="room-select-cards" aria-label={tx('Available tables')}>
        {rooms.map((room) => <RoomCard key={room.key} room={room} onJoin={backendActions?.joinRoom || navigation.goMatchmaking} tx={tx} />)}
      </div>

      <button className="room-select-bottom room-select-bottom--play" type="button" onClick={() => backendActions?.startMatchmaking?.({ mode: 'quick' }) || navigation.goMatchmaking()}>
        <img className="room-select-bottom__skin" src={`${asset}bottom-play.png`} alt="" draggable="false" />
        <span className="room-select-bottom__title">{tx('PLAY NOW')}</span>
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
