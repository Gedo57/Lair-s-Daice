import { ROUTES } from '../router/routes.js';
import ScreenHeader from '../components/ScreenHeader.jsx';
import FlowNav from '../components/FlowNav.jsx';
import PlaceholderCard from '../components/PlaceholderCard.jsx';
import { useLanguage } from '../i18n/useLanguage.js';

export default function JoinRoomPage() {
  const { t, tx } = useLanguage();

  return (
    <section className="screen">
      <ScreenHeader
        eyebrow={t('matchmaking')}
        title={t('joinRoom')}
        description={t('joinRoomDescription')}
      />

      <PlaceholderCard title={t('selectedRoom')} subtitle={`${tx('Beginner Room')} / ${tx('100 coins')}`}>
        <div className="waiting-list">
          <span>{t('playerOneYou')}</span>
          <span>{t('playerWaiting2')}</span>
          <span>{t('playerWaiting3')}</span>
          <span>{t('playerWaiting4')}</span>
        </div>
      </PlaceholderCard>

      <FlowNav backTo={ROUTES.rooms} nextTo={ROUTES.matchmaking} nextLabel={t('enterGame')} />
    </section>
  );
}
