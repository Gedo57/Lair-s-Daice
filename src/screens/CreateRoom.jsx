const asset = '/assets/liars-dice/create-room/';
const shared = '/assets/liars-dice/room-select/';

const players = ['2', '3', '4'];
const cups = ['3', '4', '5'];
const timers = ['10s', '15s', '20s'];
const bidStyles = ['Classic', 'Wild Ones'];

function TopHud() {
  return (
    <>
      <div className="create-room-profile">
        <img className="create-room-profile__avatar" src={`${shared}2.png`} alt="" draggable="false" />
        <div className="create-room-profile__plate">
          <span className="create-room-profile__name">EMMA</span>
          <div className="create-room-profile__progressRow">
            <img className="create-room-profile__badge" src={`${shared}563.png`} alt="" draggable="false" />
            <span className="create-room-profile__badgeValue">23</span>
            <div className="create-room-profile__progressBar">
              <div className="create-room-profile__progressFill" />
            </div>
            <span className="create-room-profile__progressText">
              <span>1,450</span><span>/ 2,500</span>
            </span>
          </div>
        </div>
      </div>

      <div className="create-room-currency create-room-currency--coins">
        <img className="create-room-currency__icon" src={`${shared}6.png`} alt="" draggable="false" />
        <span className="create-room-currency__value">125,680</span>
        <img className="create-room-currency__plus" src={`${shared}8.png`} alt="" draggable="false" />
      </div>

      <div className="create-room-currency create-room-currency--gems">
        <img className="create-room-currency__icon" src={`${shared}7.png`} alt="" draggable="false" />
        <span className="create-room-currency__value">2,350</span>
        <img className="create-room-currency__plus" src={`${shared}8.png`} alt="" draggable="false" />
      </div>
    </>
  );
}

function OptionButton({ value, active = false, className = '' }) {
  return (
    <button className={`create-room-option ${active ? 'is-active' : ''} ${className}`} type="button">
      <img className="create-room-option__skin" src={`${asset}${active ? 'b2.png' : 'b1.png'}`} alt="" draggable="false" />
      <span className="create-room-option__text">{value}</span>
    </button>
  );
}

export default function CreateRoom({ navigation }) {
  return (
    <section className="screen create-room-screen" aria-label="Create Room">
      <TopHud />

      <div className="create-room-board">
        <img className="create-room-board__skin" src={`${asset}Pannal.png`} alt="" draggable="false" />

        <img className="create-room-character" src={`${asset}p1.png`} alt="" draggable="false" />

        <div className="create-room-form">
          <div className="create-room-block create-room-block--name">
            <span className="create-room-label">ROOM NAME</span>
            <div className="create-room-input create-room-input--name">
              <img className="create-room-input__skin" src={`${asset}pana44.png`} alt="" draggable="false" />
              <span className="create-room-input__text">Emma’s Room</span>
            </div>
          </div>

          <div className="create-room-block create-room-block--players">
            <span className="create-room-label">PLAYERS</span>
            <div className="create-room-optionRow create-room-optionRow--players">
              {players.map((value) => <OptionButton key={value} value={value} active={value === '4'} />)}
            </div>
          </div>

          <div className="create-room-block create-room-block--cups">
            <span className="create-room-label">STARTING CUPS</span>
            <div className="create-room-optionRow create-room-optionRow--cups">
              {cups.map((value) => <OptionButton key={value} value={value} active={value === '5'} />)}
            </div>
          </div>

          <div className="create-room-block create-room-block--timer">
            <span className="create-room-label">TURN TIMER</span>
            <div className="create-room-optionRow create-room-optionRow--timer">
              {timers.map((value) => <OptionButton key={value} value={value} active={value === '15s'} />)}
            </div>
          </div>

          <div className="create-room-block create-room-block--bid">
            <span className="create-room-label">BID STYLE</span>
            <div className="create-room-optionRow create-room-optionRow--bid">
              {bidStyles.map((value) => <OptionButton key={value} value={value} active={value === 'Classic'} className="create-room-option--wide" />)}
            </div>
          </div>

          <div className="create-room-block create-room-block--private">
            <span className="create-room-label">TURN TIMER</span>
            <img className="create-room-privateToggle" src={`${asset}on.png`} alt="" draggable="false" />
          </div>

          <div className="create-room-block create-room-block--code">
            <span className="create-room-label">ROOM CODE</span>
            <div className="create-room-codeWrap">
              <img className="create-room-codeWrap__skin" src={`${asset}pana44.png`} alt="" draggable="false" />
              <span className="create-room-codeWrap__text">LD-4729</span>
              <button className="create-room-copy" type="button">
                <img src={`${asset}b5.png`} alt="" draggable="false" />
              </button>
            </div>
          </div>

          <button className="create-room-invite" type="button">
            <img className="create-room-invite__skin" src={`${asset}b4.png`} alt="" draggable="false" />
            <span className="create-room-invite__text">INVITE FRIENDS</span>
          </button>

          <span className="create-room-rules">Custom Rules:Standard • bluff Re-roll • enabled • Slam enabled</span>

          <button className="create-room-bottom create-room-bottom--create" type="button" onClick={navigation.goGameplay}>
            <img className="create-room-bottom__skin" src={`${asset}b3.png`} alt="" draggable="false" />
            <span className="create-room-bottom__text">CREATE ROOM</span>
          </button>

          <button className="create-room-bottom create-room-bottom--back" type="button" onClick={navigation.goMainMenu}>
            <img className="create-room-bottom__skin" src={`${asset}232.png`} alt="" draggable="false" />
            <span className="create-room-bottom__text">BACK</span>
          </button>
        </div>
      </div>
    </section>
  );
}
