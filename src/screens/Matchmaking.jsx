import ProfileHud from '../components/ProfileHud.jsx';
const asset = '/assets/liars-dice/matchmaking/';
const sparkles = Array.from({ length: 18 }, (_, index) => index + 1);

function TopHud({ user, wallet }) {
  return (
    <>
      <ProfileHud className="matchmaking-profile" user={user} />

      <div className="matchmaking-currency matchmaking-currency--coins">
        <img className="matchmaking-currency__icon" src={`${asset}66.png`} alt="" draggable="false" />
        <span className="matchmaking-currency__value">{wallet?.coins || '125,680'}</span>
        <img className="matchmaking-currency__plus" src={`${asset}88.png`} alt="" draggable="false" />
      </div>

      <div className="matchmaking-currency matchmaking-currency--gems">
        <img className="matchmaking-currency__icon" src={`${asset}77.png`} alt="" draggable="false" />
        <span className="matchmaking-currency__value">{wallet?.gems || '2,350'}</span>
        <img className="matchmaking-currency__plus" src={`${asset}88.png`} alt="" draggable="false" />
      </div>
    </>
  );
}

function PlayerSlot({ className = '', avatar, title, subtitle, caption, tx }) {
  return (
    <div className={`matchmaking-slot ${className}`}>
      <img className="matchmaking-slot__skin" src={`${asset}panal2.png`} alt="" draggable="false" />
      <div className="matchmaking-slot__inner">
        <img className="matchmaking-slot__avatar" src={`${asset}${avatar}`} alt="" draggable="false" />
        <span className="matchmaking-slot__title">{tx(title)}</span>
        {subtitle ? <span className="matchmaking-slot__subtitle">{tx(subtitle)}</span> : null}
        {caption ? <span className="matchmaking-slot__caption">{caption}</span> : null}
      </div>
    </div>
  );
}

export default function Matchmaking({ navigation, data, backendActions, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const matchmaking = data?.matchmaking || {};
  const filters = matchmaking.filters || [];
  const metrics = matchmaking.metrics || [];
  const steps = matchmaking.steps || [];

  return (
    <section className="screen matchmaking-screen" aria-label={tx('Matchmaking')}>
      <div className="matchmaking-vfx matchmaking-vfx--vignette" aria-hidden="true" />
      <div className="matchmaking-vfx matchmaking-vfx--lightRays" aria-hidden="true" />
      <div className="matchmaking-vfx matchmaking-vfx--panelGlow" aria-hidden="true" />
      <div className="matchmaking-sparkles" aria-hidden="true">
        {sparkles.map((sparkle) => (
          <span className={`matchmaking-sparkle matchmaking-sparkle--${sparkle}`} key={sparkle} />
        ))}
      </div>

      <TopHud user={user} wallet={wallet} />

      <div className="matchmaking-panel">
        <img className="matchmaking-panel__skin" src={`${asset}panal.png`} alt="" draggable="false" />

        <div className="matchmaking-filters">
          {filters.map((item) => (
            <div className="matchmaking-filter" key={tx(item.label)}>
              <img className="matchmaking-filter__icon" src={`${asset}${item.icon}`} alt="" draggable="false" />
              <span className="matchmaking-filter__label">{tx(item.label)}</span>
              <span className="matchmaking-filter__value">{tx(item.value)}</span>
            </div>
          ))}

          <div className="matchmaking-signal">
            <img className="matchmaking-signal__icon" src={`${asset}6.png`} alt="" draggable="false" />
            <span className="matchmaking-signal__title">{tx('EXCELLENT')}</span>
            <span className="matchmaking-signal__sub">45ms</span>
          </div>
        </div>

        <div className="matchmaking-center">
          <div className="matchmaking-center__ringWrap">
            <img className="matchmaking-center__ring" src={`${asset}42.png`} alt="" draggable="false" />
            <img className="matchmaking-center__cup" src={`${asset}213.png`} alt="" draggable="false" />
          </div>
          <span className="matchmaking-center__title">{tx('FINDING OPPONENTS')}</span>
          <span className="matchmaking-center__copy">{tx('Looking for players with similar stakes and skill')}</span>
          <div className="matchmaking-center__stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <img key={i} src={`${asset}8.png`} alt="" draggable="false" />
            ))}
          </div>
        </div>

        <img className="matchmaking-link matchmaking-link--left-top" src={`${asset}54.png`} alt="" draggable="false" />
        <img className="matchmaking-link matchmaking-link--left-bottom" src={`${asset}54.png`} alt="" draggable="false" />
        <img className="matchmaking-link matchmaking-link--right-top" src={`${asset}54.png`} alt="" draggable="false" />
        <img className="matchmaking-link matchmaking-link--right-bottom" src={`${asset}54.png`} alt="" draggable="false" />

        <PlayerSlot className="matchmaking-slot--left-top" avatar="22f.png" title="EMMA" subtitle="YOU" tx={tx} />
        <PlayerSlot className="matchmaking-slot--left-bottom matchmaking-slot--searching" avatar="ic2.png" title="Searching..." caption="••••" tx={tx} />
        <PlayerSlot className="matchmaking-slot--right-top" avatar="222.png" title="Dragon" subtitle="25k / 50k" tx={tx} />
        <PlayerSlot className="matchmaking-slot--right-bottom matchmaking-slot--searching" avatar="ic2.png" title="Searching..." caption="••••" tx={tx} />

        <div className="matchmaking-metrics">
          {metrics.map((item) => (
            <div className={`matchmaking-metric matchmaking-metric--${item.type}`} key={tx(item.label)}>
              <div className="matchmaking-metric__head">
                {item.icon ? <img className="matchmaking-metric__icon" src={`${asset}${item.icon}`} alt="" draggable="false" /> : <span className="matchmaking-metric__iconGap" />}
                <span className="matchmaking-metric__label">{tx(item.label)}</span>
              </div>
              {item.type === 'quality' ? (
                <div className="matchmaking-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <img key={i} src={`${asset}8.png`} alt="" draggable="false" />
                  ))}
                </div>
              ) : null}
              <span className="matchmaking-metric__value">{tx(item.value)}</span>
            </div>
          ))}
        </div>

        <div className="matchmaking-steps">
          {steps.map((step, index) => (
            <div className="matchmaking-step" key={step.text}>
              <img className="matchmaking-step__badge" src={`${asset}${step.icon}`} alt="" draggable="false" />
              <span className="matchmaking-step__text">{tx(step.text)}</span>
              <span className="matchmaking-step__sub">{step.sub}</span>
              {index < steps.length - 1 ? <img className="matchmaking-step__line" src={`${asset}15.png`} alt="" draggable="false" /> : null}
            </div>
          ))}
        </div>
      </div>

      <button className="matchmaking-action matchmaking-action--keep" type="button" onClick={() => backendActions?.startMatchmaking?.({ mode: 'keep-searching' }) || navigation.goGameplay()}>
        <img className="matchmaking-action__skin" src={'/assets/liars-dice/room-select/bottom-play.png'} alt="" draggable="false" />
        <span className="matchmaking-action__title">{tx('KEEP SEARCHING')}</span>
        <span className="matchmaking-action__subtitle">{tx("We'll find you the best table")}</span>
      </button>

      <button className="matchmaking-action matchmaking-action--cancel" type="button" onClick={() => backendActions?.cancelMatchmaking?.() || navigation.goRoomSelect()}>
        <img className="matchmaking-action__skin" src={`${asset}b1.png`} alt="" draggable="false" />
        <span className="matchmaking-action__title">{tx('CANCEL')}</span>
      </button>
    </section>
  );
}
