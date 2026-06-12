import ProfileHud from '../components/ProfileHud.jsx';
const asset = '/assets/liars-dice/tournament-pass/';

function TopProfile({ navigation, user, tx }) {
  return <ProfileHud className="tournament-pass-profile" user={user} onClick={navigation.goProfile} ariaLabel={tx('Open Profile')} />;
}

function Currency({ type, icon, value }) {
  return (
    <div className={`tournament-pass-currency tournament-pass-currency--${type}`}>
      <img className="tournament-pass-currency__icon" src={`${asset}${icon}`} alt="" draggable="false" />
      <span className="tournament-pass-currency__value">{value}</span>
      <img className="tournament-pass-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
    </div>
  );
}

function TournamentCard({ tournament, onEnter, tx }) {
  return (
    <article className={`tournament-pass-card tournament-pass-card--${tournament.key}`}>
      <img className="tournament-pass-card__skin" src={`${asset}${tournament.card}`} alt="" draggable="false" />
      <div className="tournament-pass-card__stats">
        <div><span>{tx('Entry Fee')}</span><img src={`${asset}6.png`} alt="" draggable="false" /><b>{tournament.entry}</b></div>
        <div><span>{tx('Prize pool')}</span><img src={`${asset}6.png`} alt="" draggable="false" /><b>{tournament.prize}</b></div>
        <div><span className="tournament-pass-card__clock"><img src={`${asset}clo.png`} alt="" draggable="false" /></span><b>{tournament.time}</b></div>
        <div><span>{tx('Players')}</span><b>{tournament.players}</b></div>
      </div>
      <button className="tournament-pass-enter" type="button" onClick={() => onEnter?.(tournament)}>
        <img src={`${asset}${tournament.button}`} alt="" draggable="false" />
        <span>{tx('ENTER')}</span>
      </button>
    </article>
  );
}

function PassReward({ reward, index, type }) {
  return (
    <div className={`tournament-pass-reward tournament-pass-reward--${type} tournament-pass-reward--${index + 1}`}>
      <img src={`${asset}${reward.icon}`} alt="" draggable="false" />
      <span>{reward.value}</span>
    </div>
  );
}

export default function TournamentPass({ navigation, data, backendActions, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const tournaments = data?.tournaments || [];
  const pass = data?.tournamentPass || {};
  const passColumns = pass.levels || [];
  const premiumRewards = pass.premiumRewards || [];
  const freeRewards = pass.freeRewards || [];

  return (
    <section className="screen tournament-pass-screen" aria-label={tx('Tournaments and Lucky Pass')}>
      <TopProfile navigation={navigation} user={user} tx={tx} />
      <Currency type="coins" icon="6.png" value={wallet.coins || '125,680'} />
      <Currency type="gems" icon="7.png" value={wallet.gems || '2,350'} />

      <section className="tournament-pass-tournaments" aria-label={tx('Tournaments')}>
        <img className="tournament-pass-tournaments__panel" src={`${asset}Tpanle.png`} alt="" draggable="false" />
        <div className="tournament-pass-tournaments__cards">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.key} tournament={tournament} onEnter={backendActions?.enterTournament} tx={tx} />
          ))}
        </div>
      </section>

      <section className="tournament-pass-lucky" aria-label={tx('LUCKY PASS')}>
        <img className="tournament-pass-lucky__panel" src={`${asset}Ppanel.png`} alt="" draggable="false" />
        <div className="tournament-pass-xp-label">{tx(pass.xpLabel || 'PASS XP')}</div>
        <div className="tournament-pass-xp-bar"><span style={{ width: `${pass.xpPercent || 0}%` }} /></div>
        <div className="tournament-pass-levels">
          {passColumns.map((label) => <span key={label}>{label}</span>)}
        </div>
        <div className="tournament-pass-rewards tournament-pass-rewards--premium">
          {premiumRewards.map((reward, index) => <PassReward key={`premium-${index}`} reward={reward} index={index} type="premium" />)}
        </div>
        <div className="tournament-pass-rewards tournament-pass-rewards--free">
          {freeRewards.map((reward, index) => <PassReward key={`free-${index}`} reward={reward} index={index} type="free" />)}
        </div>
        <button className="tournament-pass-upgrade" type="button" onClick={backendActions?.upgradePass}>
          <img src={`${asset}15.png`} alt="" draggable="false" />
          <span>{tx('UPGRADE PASS')}</span>
        </button>
      </section>

      <button className="tournament-pass-back" type="button" onClick={navigation.goMainMenu}>
        <img className="tournament-pass-back__skin" src={`${asset}B2.png`} alt="" draggable="false" />
        <span>{tx('BACK')}</span>
      </button>
    </section>
  );
}
