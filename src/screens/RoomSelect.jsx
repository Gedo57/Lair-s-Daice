const asset = '/assets/liars-dice/room-select/';
const sparkles = Array.from({ length: 20 }, (_, index) => index + 1);

const rooms = [
  {
    key: 'beginner',
    title: 'BEGINNER',
    card: 'card-1.png',
    tableArt: '213.png',
    button: '15.png',
    stakes: '1k / 5k',
    buyIn: '500 - 2k',
    rows: [
      { icon: 'IC1.png', text: '2 - 4 Players' },
      { icon: 'IC2.png', text: 'No Bluff' },
      { icon: 'IC3.png', text: 'Daily Rewards' },
    ],
  },
  {
    key: 'classic',
    title: 'CLASSIC',
    card: 'card-2.png',
    tableArt: '213124.png',
    button: '14.png',
    stakes: '1k / 5k',
    buyIn: '500 - 2k',
    rows: [
      { icon: 'IC1.png', text: '2 - 4 Players' },
      { icon: 'IC2.png', text: 'Some Bluff' },
      { icon: 'IC5.png', text: 'Bonus Rewards' },
    ],
  },
  {
    key: 'high-roller',
    title: 'HIGH ROLLER',
    card: 'card-3.png',
    tableArt: '3323423.png',
    button: '12.png',
    stakes: '1k / 75k',
    buyIn: '500 - 2k',
    rows: [
      { icon: 'IC1.png', text: '2 - 4 Players' },
      { icon: 'IC4.png', text: 'Premium Bluff' },
      { icon: 'IC5.png', text: 'Premium Rewards' },
    ],
  },
  {
    key: 'vip',
    title: 'VIP',
    card: 'card-4.png',
    tableArt: '3123213.png',
    button: '13.png',
    stakes: '1k / 5k',
    buyIn: '500 - 2k',
    rows: [
      { icon: 'IC1.png', text: '2 - 8 Players' },
      { icon: 'IC4.png', text: 'Exclusive Tables' },
      { icon: 'IC6.png', text: 'High Rewards' },
    ],
  },
  {
    key: 'private',
    title: 'PRIVET ROOM',
    card: 'card-5.png',
    tableArt: '1232131.png',
    button: 'back-button.png',
    stakes: '1k / 75k',
    buyIn: '500 - 2k',
    rows: [
      { icon: 'IC1.png', text: '1 - 2 Players' },
      { icon: 'IC1.png', text: 'Invite Friends' },
      { icon: 'IC7.png', text: 'Create Rules' },
    ],
  },
];

function RoomCard({ room, navigation }) {
  return (
    <button className={`room-select-card room-select-card--${room.key}`} type="button" onClick={navigation.goMatchmaking}>
      <img className="room-select-card__skin" src={`${asset}${room.card}`} alt="" draggable="false" />
      <span className="room-select-card__title">{room.title}</span>
      <img className={`room-select-card__art room-select-card__art--${room.key}`} src={`${asset}${room.tableArt}`} alt="" draggable="false" />
      <span className="room-select-card__label">Stakes</span>
      <span className="room-select-card__stakes">{room.stakes}</span>
      <span className="room-select-card__buyLabel">Buy-in</span>
      <span className="room-select-card__buyValue">{room.buyIn}</span>
      <span className="room-select-card__rules">
        {room.rows.map((row) => (
          <span className="room-select-card__rule" key={`${room.key}-${row.text}`}>
            <img src={`${asset}${row.icon}`} alt="" draggable="false" />
            <span>{row.text}</span>
          </span>
        ))}
      </span>
      <span className="room-select-card__playSkinWrap">
        <img className="room-select-card__playSkin" src={`${asset}${room.button}`} alt="" draggable="false" />
        <span className="room-select-card__playText">PLAY</span>
      </span>
    </button>
  );
}

export default function RoomSelect({ navigation }) {
  return (
    <section className="screen room-select-screen" aria-label="Room Select">
      <div className="room-select-vfx room-select-vfx--vignette" aria-hidden="true" />
      <div className="room-select-vfx room-select-vfx--lightRays" aria-hidden="true" />
      <div className="room-select-vfx room-select-vfx--titleShine" aria-hidden="true" />
      <div className="room-select-sparkles" aria-hidden="true">
        {sparkles.map((sparkle) => (
          <span className={`room-select-sparkle room-select-sparkle--${sparkle}`} key={sparkle} />
        ))}
      </div>

      <div className="room-select-profile">
        <img className="room-select-profile__avatar" src={`${asset}2.png`} alt="" draggable="false" />
        <div className="room-select-profile__plate">
          <span className="room-select-profile__name">EMMA</span>
          <div className="room-select-profile__progressRow">
            <img className="room-select-profile__badge" src={`${asset}563.png`} alt="" draggable="false" />
            <span className="room-select-profile__badgeValue">23</span>
            <div className="room-select-profile__progressBar">
              <div className="room-select-profile__progressFill" />
            </div>
            <span className="room-select-profile__progressText">
              <span className="room-select-profile__progressCurrent">1,450</span>
              <span className="room-select-profile__progressRest">/ 2,500</span>
            </span>
          </div>
        </div>
      </div>

      <div className="room-select-currency room-select-currency--coins">
        <img className="room-select-currency__icon" src={`${asset}6.png`} alt="" draggable="false" />
        <span className="room-select-currency__value">125,680</span>
        <img className="room-select-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <div className="room-select-currency room-select-currency--gems">
        <img className="room-select-currency__icon" src={`${asset}7.png`} alt="" draggable="false" />
        <span className="room-select-currency__value">2,350</span>
        <img className="room-select-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <img className="room-select-titleArt" src={`${asset}select-title.png`} alt="Select Table" draggable="false" />

      <div className="room-select-cards" aria-label="Available tables">
        {rooms.map((room) => <RoomCard key={room.key} room={room} navigation={navigation} />)}
      </div>

      <button className="room-select-bottom room-select-bottom--play" type="button" onClick={navigation.goMatchmaking}>
        <img className="room-select-bottom__skin" src={`${asset}bottom-play.png`} alt="" draggable="false" />
        <span className="room-select-bottom__title">PLAY NOW</span>
        <span className="room-select-bottom__subtitle">Jump into a quick game</span>
      </button>

      <button className="room-select-bottom room-select-bottom--create" type="button" onClick={navigation.goCreateRoom}>
        <img className="room-select-bottom__skin" src={`${asset}bottom-create.png`} alt="" draggable="false" />
        <span className="room-select-bottom__title">CREATE ROOM</span>
        <span className="room-select-bottom__subtitle">Invite friends &amp; play</span>
      </button>

      <button className="room-select-back" type="button" onClick={navigation.goMainMenu}>
        <img className="room-select-back__skin" src={`${asset}B2.png`} alt="" draggable="false" />
        <span className="room-select-back__text">BACK</span>
      </button>
    </section>
  );
}
