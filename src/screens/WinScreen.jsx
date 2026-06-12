import ProfileHud from '../components/ProfileHud.jsx';
const asset = '/assets/liars-dice/win/';

const players = [
  { className: 'quetzal', avatar: 'A3.png', name: 'Quetzal', place: '2ND PLACE', score: '- 8' },
  { className: 'ganesha', avatar: 'A2.png', name: 'Ganesha', place: '3RD PLACE', score: '- 10' },
  { className: 'fenrir', avatar: 'A1.png', name: 'Fenrir', place: '4TH PLACE', score: '- 12' },
];

const summary = [
  { icon: '123214.png', label: 'MODE', value: 'Quick Match' },
  { icon: '12415124.png', label: 'PLAYERS', value: '4' },
  { icon: '12312414312.png', label: 'FINAL BID', value: '5 x 4' },
  { icon: '1242352523.png', label: 'ROUND SCORE', value: '1,250' },
  { icon: '123125151234.png', label: 'MATCH DURATION', value: '08m 32s' },
  { icon: '1232132131.png', label: 'RANK PROGRESS', value: '+15' },
  { icon: '12312452312.png', label: 'STATUS', value: 'WINNER' },
];

export default function WinScreen({ navigation, data, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};

  return (
    <section className="screen win-screen" aria-label={tx('Victory Screen')}>
      <ProfileHud className="win-profile" user={user} name={user.displayName || user.username || 'Emma'} />

      <div className="win-currency win-currency--coins">
        <img className="win-currency__icon" src={`${asset}6.png`} alt="" draggable="false" />
        <span className="win-currency__value">{wallet.coins || '125,680'}</span>
        <img className="win-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>
      <div className="win-currency win-currency--gems">
        <img className="win-currency__icon" src={`${asset}7.png`} alt="" draggable="false" />
        <span className="win-currency__value">{wallet.gems || '2,350'}</span>
        <img className="win-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
      </div>

      <img className="win-title" src={`${asset}vic.png`} alt={tx('Victory You Win')} draggable="false" />

      <div className="win-main-panel">
        <img className="win-main-panel__skin" src={`${asset}Pannal.png`} alt="" draggable="false" />

        <img className="win-treasure" src={`${asset}tr.png`} alt="" draggable="false" />

        <div className="win-winner">
          <img className="win-winner__avatar" src={`${asset}B2.png`} alt="" draggable="false" />
          <span className="win-winner__ribbon">{tx('WINNER')}</span>
          <span className="win-winner__name">{user.displayName || 'Emma'}</span>
        </div>

        <div className="win-complete">
          <span className="win-complete__title">{tx('Quick Match Complete')}</span>
          <span className="win-complete__copy">{tx('You outplayed the table!')}</span>
        </div>

        <div className="win-rewards">
          <span className="win-rewards__title">{tx('YOUR REWARDS')}</span>
          <div className="win-reward win-reward--chips">
            <img src={`${asset}6.png`} alt="" draggable="false" />
            <span className="win-reward__label">{tx('CHIPS')}</span>
            <span className="win-reward__value">+ 25,000</span>
          </div>
          <div className="win-reward win-reward--xp">
            <img src={`${asset}10.png`} alt="" draggable="false" />
            <span className="win-reward__label">{tx('XP GAINED')}</span>
            <span className="win-reward__value">+ 350 XP</span>
          </div>
        </div>

        <div className="win-rank-bonus">
          <img src={`${asset}1232132131.png`} alt="" draggable="false" />
          <span>{tx('RANK POINTS BONUS')}</span>
          <strong>+15</strong>
          <img src={`${asset}23423423432.png`} alt="" draggable="false" />
        </div>

        <div className="win-summary">
          <span className="win-summary__header">{tx('MATCH SUMMARY')}</span>
          {summary.map((item) => (
            <div className="win-summary__row" key={tx(item.label)}>
              <img src={`${asset}${item.icon}`} alt="" draggable="false" />
              <span className="win-summary__label">{tx(item.label)}</span>
              <strong className="win-summary__value">{tx(item.value)}</strong>
            </div>
          ))}
        </div>

        <div className="win-players">
          {players.map((player) => (
            <div className={`win-player win-player--${player.className}`} key={player.name}>
              <img className="win-player__avatar" src={`${asset}${player.avatar}`} alt="" draggable="false" />
              <span className="win-player__name">{player.name}</span>
              <span className="win-player__place">{player.place}</span>
              <img className="win-player__cup" src={`${asset}223432432.png`} alt="" draggable="false" />
              <span className="win-player__score">{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      <button className="win-action win-action--again" type="button" onClick={navigation.goMatchmaking}>
        <img className="win-action__skin" src={`${asset}B1.png`} alt="" draggable="false" />
        <span className="win-action__title">{tx('PLAY AGAIN')}</span>
        <span className="win-action__subtitle">{tx('Play another match')}</span>
      </button>
      <button className="win-action win-action--share" type="button">
        <img className="win-action__skin" src={`${asset}bt1.png`} alt="" draggable="false" />
        <span className="win-action__title">{tx('SHARE')}</span>
        <span className="win-action__subtitle">{tx('Share with friends!')}</span>
      </button>
      <button className="win-action win-action--lobby" type="button" onClick={navigation.goMainMenu}>
        <img className="win-action__skin" src={`${asset}bt2.png`} alt="" draggable="false" />
        <span className="win-action__title">{tx('BACK TO LOBBY')}</span>
        <span className="win-action__subtitle">{tx('Return to main menu')}</span>
      </button>
    </section>
  );
}
