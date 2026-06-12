import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../router/routes.js';
import { clearActiveMatch, getActiveMatch, saveMatchmakingContext } from '../store/gameStore.js';
import { useLanguage } from '../i18n/useLanguage.js';

const asset = (name) => `/assets/win-screen/${name}`;

const losers = [
  { name: 'Panda', score: '-4,000', avatar: 'ic2.png' },
  { name: 'Ryu', score: '-4,000', avatar: 'ic3.png' },
];

const summaryRows = [
  ['winningHand', 'allPungs'],
  ['selfDraw', '+2,000'],
  ['pungOfDragons', '+4,000'],
  ['concealedHand', '+2,000'],
  ['roundWindEast', '+1,000'],
];

export default function ResultPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const location = useLocation();
  const activeMatch = getActiveMatch();
  const matchId = location.state?.matchId || activeMatch?.matchId;

  return (
    <section className="win-screen" aria-label="Round result win screen">
      <img className="win-screen-bg" src={asset('BG.png')} alt="" />
      <div className="win-screen-vignette" aria-hidden="true" />

      <header className='win-header lui-0221aed4'>      </header>

      <main className="win-content">
        <h2 className="win-title">{t('youWin')}</h2>

        <section className="win-layout" aria-label="Win screen details">
          <section className="winner-panel" aria-label="Player results">
            <div className="winner-main-row">
              <img className='winner-avatar lui-c8bd0ff4' src={asset('ic1.png')} alt="Stevie avatar" />

              <div className="winner-info">
                <strong className='winner-name lui-3a1371cc'>Stevie</strong>
                <span className='winner-score lui-28150694'>+12,000</span>
                <em className='winner-badge lui-208c9614'>{t('winner')}</em>
              </div>
            </div>

            <div className="loser-list">
              {losers.map((player) => (
                <article className="loser-row" key={player.name}>
                  <img className='loser-avatar lui-95d32e6f' src={asset(player.avatar)} alt={`${player.name} avatar`} />
                  <strong className='loser-name lui-f155ac3b'>{player.name}</strong>
                  <span className="loser-score">{player.score}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="round-summary-panel" aria-label="Round summary">
            <div className="summary-panel-content">
              <h3 className='lui-6395eacc'><span>✽</span> {t('roundSummary')} <span>✽</span></h3>
              <div className="summary-divider" aria-hidden="true" />

              <div className="summary-rows">
                {summaryRows.map(([label, value]) => (
                  <div className="summary-row" key={label}>
                    <span>{t(label)}</span>
                    <strong className='lui-be221808'>{value}</strong>
                  </div>
                ))}
              </div>

              <div className="summary-footer-divider" aria-hidden="true"><span>✽</span></div>
              <div className="summary-total">
                <strong className='lui-613d8f20'>{t('totalScore')}</strong>
                <span className='summary-total-value lui-8d5746d0'>
                  <span className="summary-coin" aria-hidden="true">✿</span>
                  12,000
                </span>
              </div>
            </div>
          </section>
        </section>

        <footer className="win-actions">
          <button
            type="button"
            className="win-image-button lobby"
            onClick={() => {
              clearActiveMatch();
              navigate(ROUTES.mainMenu);
            }}
          >
            {t('backToMainMenuCaps')}
          </button>

          <button
            type="button"
            className="win-image-button again lui-85f70a04"
            onClick={() => {
              saveMatchmakingContext({
                roomId: activeMatch?.roomId || 'quick_match',
                maxPlayers: activeMatch?.maxPlayers || 3,
                source: 'play-again',
                previousMatchId: matchId,
              });
              navigate(ROUTES.matchmaking, {
                state: {
                  roomId: activeMatch?.roomId || 'quick_match',
                  maxPlayers: activeMatch?.maxPlayers || 3,
                  source: 'play-again',
                  previousMatchId: matchId,
                },
              });
            }}
          >
            {t('playAgain')}
          </button>
        </footer>
      </main>
    </section>
  );
}
