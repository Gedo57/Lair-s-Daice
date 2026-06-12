import ProfileHud from '../components/ProfileHud.jsx';
const asset = '/assets/liars-dice/daily-reward/';

function TopProfile({ navigation, user, tx }) {
  return <ProfileHud className="daily-reward-profile" user={user} onClick={navigation.goProfile} ariaLabel={tx('Open Profile')} />;
}

function Currency({ type, icon, value }) {
  return (
    <div className={`daily-reward-currency daily-reward-currency--${type}`}>
      <img className="daily-reward-currency__icon" src={`${asset}${icon}`} alt="" draggable="false" />
      <span className="daily-reward-currency__value">{value}</span>
      <img className="daily-reward-currency__plus" src={`${asset}8.png`} alt="" draggable="false" />
    </div>
  );
}

function RewardCard({ reward, onClaim, tx }) {
  return (
    <article className={`daily-reward-card daily-reward-card--${reward.key} daily-reward-card--${reward.state}`}>
      <img className="daily-reward-card__skin" src={`${asset}${reward.card}`} alt="" draggable="false" />
      <button className="daily-reward-card__button" type="button" disabled={reward.state === 'locked'} onClick={() => reward.state === 'claimable' ? onClaim?.(reward) : null}>
        <span>{tx(reward.status)}</span>
      </button>
    </article>
  );
}

export default function DailyReward({ navigation, data, backendActions, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const isChinese = i18n?.language === 'zh';
  const dailyBannerSrc = isChinese ? '/assets/liars-dice/localized/zh/daily-banner.png' : `${asset}pbaer.png`;
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const rewardDays = data?.dailyRewards || [];

  return (
    <section className="screen daily-reward-screen" aria-label={tx('Daily Reward')}>
      <TopProfile navigation={navigation} user={user} tx={tx} />
      <Currency type="coins" icon="6.png" value={wallet.coins || '125,680'} />
      <Currency type="gems" icon="7.png" value={wallet.gems || '2,350'} />

      <img className="daily-reward-banner" src={dailyBannerSrc} alt={tx('Claim 7 days in a row to unlock the Royal Chest')} draggable="false" />

      <div className="daily-reward-cards" aria-label={tx('Daily rewards')}>
        {rewardDays.map((reward) => <RewardCard key={reward.key} reward={reward} onClaim={backendActions?.claimDailyReward} tx={tx} />)}
      </div>

      <button className="daily-reward-back" type="button" onClick={navigation.goMainMenu}>
        <img className="daily-reward-back__skin" src={`${asset}B2.png`} alt="" draggable="false" />
        <span>{tx('BACK')}</span>
      </button>
    </section>
  );
}
