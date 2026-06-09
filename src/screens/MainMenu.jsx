const asset = '/assets/liars-dice/main-menu/';
const sparkles = Array.from({ length: 22 }, (_, index) => index + 1);

export default function MainMenu({ navigation }) {
  return (
    <section className="screen main-menu-screen" aria-label="Main Menu">
      <div className="main-menu-vfx main-menu-vfx--vignette" aria-hidden="true" />
      <div className="main-menu-vfx main-menu-vfx--lightRays" aria-hidden="true" />
      <div className="main-menu-vfx main-menu-vfx--bannerShine" aria-hidden="true" />
      <div className="main-menu-sparkles" aria-hidden="true">
        {sparkles.map((sparkle) => (
          <span className={`main-menu-sparkle main-menu-sparkle--${sparkle}`} key={sparkle} />
        ))}
      </div>

      <button className="main-menu-profile" type="button" onClick={navigation.goProfile} aria-label="Open Profile">
        <img className="main-menu-profile__avatar" src={`${asset}2.png`} alt="" draggable="false" />
        <div className="main-menu-profile__plate">
          <span className="main-menu-profile__name">EMMA</span>
          <div className="main-menu-profile__progressRow">
            <img className="main-menu-profile__badge" src={`${asset}563.png`} alt="" draggable="false" />
            <span className="main-menu-profile__badgeValue">23</span>
            <div className="main-menu-profile__progressBar">
              <div className="main-menu-profile__progressFill" />
            </div>
            <span className="main-menu-profile__progressText">
              <span className="main-menu-profile__progressCurrent">1,450</span>
              <span className="main-menu-profile__progressRest">/ 2,500</span>
            </span>
          </div>
        </div>
      </button>

      <div className="main-menu-currency main-menu-currency--coins">
        <img className="main-menu-currency__icon" src={`${asset}6.png`} alt="" draggable="false" />
        <span className="main-menu-currency__value">125,680</span>
        <img className="main-menu-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <div className="main-menu-currency main-menu-currency--gems">
        <img className="main-menu-currency__icon" src={`${asset}7.png`} alt="" draggable="false" />
        <span className="main-menu-currency__value">2,350</span>
        <img className="main-menu-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <button className="main-menu-action main-menu-action--play" type="button" onClick={navigation.goRoomSelect}>
        <img className="main-menu-action__skin" src={`${asset}B1.png`} alt="" draggable="false" />
        <span className="main-menu-action__title">PLAY NOW</span>
        <span className="main-menu-action__subtitle">Jump into a quick game</span>
      </button>

      <button className="main-menu-action main-menu-action--create" type="button" onClick={navigation.goCreateRoom}>
        <img className="main-menu-action__skin" src={`${asset}B2.png`} alt="" draggable="false" />
        <span className="main-menu-action__title">CREATE ROOM</span>
        <span className="main-menu-action__subtitle">Invite friends &amp; play</span>
      </button>

      <button className="main-menu-action main-menu-action--join" type="button" onClick={navigation.goMatchmaking}>
        <img className="main-menu-action__skin" src={`${asset}B3.png`} alt="" draggable="false" />
        <span className="main-menu-action__title">JOIN ROOM</span>
        <span className="main-menu-action__subtitle">Enter a room code</span>
      </button>

      <button className="main-menu-action main-menu-action--help" type="button" onClick={navigation.goHelp}>
        <img className="main-menu-action__skin" src={`${asset}B4.png`} alt="" draggable="false" />
        <span className="main-menu-action__title">HOW TO PLAY</span>
        <span className="main-menu-action__subtitle">Learn the rules</span>
      </button>

      <button className="main-menu-card main-menu-card--daily" type="button">
        <img className="main-menu-card__skin" src={`${asset}11.png`} alt="" draggable="false" />
        <span className="main-menu-card__header">DAILY REWARDS</span>
        <img className="main-menu-card__art main-menu-card__art--chest" src={`${asset}88.png`} alt="" draggable="false" />
        <span className="main-menu-card__copy main-menu-card__copy--daily">Come back bigger<br />rewards!</span>
        <span className="main-menu-card__cta main-menu-card__cta--daily">CLAIM</span>
      </button>

      <button className="main-menu-card main-menu-card--pass" type="button">
        <img className="main-menu-card__skin" src={`${asset}22.png`} alt="" draggable="false" />
        <span className="main-menu-card__header">LUCKY PASS</span>
        <img className="main-menu-card__art main-menu-card__art--pass" src={`${asset}77.png`} alt="" draggable="false" />
        <span className="main-menu-card__copy main-menu-card__copy--pass">Jump into a quick game</span>
        <span className="main-menu-card__cta main-menu-card__cta--pass">VIEW PASS</span>
      </button>

      <button className="main-menu-card main-menu-card--tournaments" type="button">
        <img className="main-menu-card__skin" src={`${asset}33.png`} alt="" draggable="false" />
        <span className="main-menu-card__header">TOURNAMENTS</span>
        <img className="main-menu-card__art main-menu-card__art--cup" src={`${asset}66.png`} alt="" draggable="false" />
        <span className="main-menu-card__copy main-menu-card__copy--tournaments">Compete for big prizes!</span>
        <span className="main-menu-card__cta main-menu-card__cta--tournaments">ENTER</span>
      </button>

      <button className="main-menu-card main-menu-card--events" type="button">
        <img className="main-menu-card__skin" src={`${asset}44.png`} alt="" draggable="false" />
        <span className="main-menu-card__header">SPECIAL EVENTS</span>
        <img className="main-menu-card__art main-menu-card__art--gift" src={`${asset}55.png`} alt="" draggable="false" />
        <span className="main-menu-card__copy main-menu-card__copy--events">Join events, win more!</span>
        <span className="main-menu-card__cta main-menu-card__cta--events">SEE EVENTS</span>
      </button>
    </section>
  );
}
