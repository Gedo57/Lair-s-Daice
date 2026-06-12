import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../router/routes.js';
import { getFeaturedRooms } from '../services/roomService.js';
import { getProfile } from '../services/profileService.js';
import { saveMatchmakingContext } from '../store/gameStore.js';
import { mockFeaturedRooms } from '../mocks/mockRooms.js';
import { mockPlayerProfile } from '../mocks/mockProfile.js';
import { getStoredAuthUser } from '../services/authService.js';
import { useLanguage } from '../i18n/useLanguage.js';

const asset = (name) => `/assets/main-menu/${name}`;

const fallbackRoomCards = [
  {
    title: 'SAKURA GARDEN',
    level: 'Beginner',
    bg: 'room-card-green.png',
    character: 'panda.png',
    players: '4,326',
    fee: '500',
    prize: '2,000',
    button: 'button-green.png',
    route: ROUTES.matchmaking,
  },
  {
    title: 'BLOSSOM TABLE',
    level: 'Intermediate',
    bg: 'room-card-blue.png',
    character: 'fox.png',
    players: '1,842',
    fee: '1,000',
    prize: '5,000',
    button: 'button-blue.png',
    route: ROUTES.matchmaking,
  },
  {
    title: 'LUCKY BAMBOO',
    level: 'Advanced',
    bg: 'room-card-purple.png',
    character: 'bunny.png',
    players: '812',
    fee: '5,000',
    prize: '20,000',
    button: 'button-violet.png',
    route: ROUTES.matchmaking,
  },
  {
    title: 'DRAGON PAVILION',
    level: 'Master',
    bg: 'room-card-gold.png',
    character: 'bird.png',
    players: '320',
    fee: '50,000',
    prize: '200,000',
    button: 'button-gold.png',
    route: ROUTES.matchmaking,
  },
];

const friends = [
  { name: 'Momo', state: 'Online', action: 'INVITE', avatar: 'friend-panda.png' },
  { name: 'Panda', state: 'In Lobby', action: 'INVITE', avatar: 'friend-panda.png' },
  { name: 'Bunbun', state: 'Playing', action: 'WATCH', avatar: 'friend-bunny.png' },
  { name: 'Ryu', state: 'Online', action: 'INVITE', avatar: 'friend-dragon.png' },
  { name: 'Kiki', state: 'Online', action: 'INVITE', avatar: 'friend-bird.png' },
  { name: 'Stevie', state: 'In Game', action: 'WATCH', avatar: 'friend-girl.png' },
];

function CurrencyPill({ icon, value }) {
  return (
    <div className="currency-pill">
      <img src={asset(icon)} alt="" />
      <span>{value}</span>
    </div>
  );
}

function SakuraBrand() {
  return (
    <div className="sakura-brand" aria-label="Sakura Mahjong">
      <span className="sakura-brand-flower">✿</span>
      <div className="sakura-brand-text">
        <strong>SAKURA</strong>
        <span>MAHJONG</span>      </div>
    </div>
  );
}

function SakuraPass({ onOpen }) {
  return (
    <aside className='sakura-pass-card' style={{ backgroundImage: `url(${asset('sakura-pass.png')})` }}>
      <div className='pass-copy'>              </div>          </aside>
  );
}

function getRoomSparkleTheme(roomBg = '') {
  if (roomBg.includes('green')) return 'room-theme-green';
  if (roomBg.includes('blue')) return 'room-theme-blue';
  if (roomBg.includes('purple') || roomBg.includes('violet')) return 'room-theme-purple';
  if (roomBg.includes('gold') || roomBg.includes('yellow') || roomBg.includes('orange')) return 'room-theme-gold';
  return 'room-theme-green';
}

function RoomCard({ room, onPlay, t, tx }) {
  const sparkleTheme = getRoomSparkleTheme(room.bg);

  return (
    <article className={`sakura-room-card ${sparkleTheme}`} style={{ backgroundImage: `url(${asset(room.bg)})` }}>
      <div className="room-card-sparkles" aria-hidden="true">
        <span className="card-sparkle sparkle-1" />
        <span className="card-sparkle sparkle-2" />
        <span className="card-sparkle sparkle-3" />
        <span className="card-sparkle sparkle-4" />
        <span className="card-sparkle sparkle-5" />
        <span className="card-sparkle sparkle-6" />
        <span className="card-sparkle sparkle-7" />
        <span className="card-sparkle sparkle-8" />
        <span className="card-sparkle sparkle-9" />
        <span className="card-sparkle sparkle-10" />
        <span className="card-sparkle sparkle-11" />
        <span className="card-sparkle sparkle-12" />
      </div>

      <div className="room-card-header">
        <h3>{room.title}</h3>
        <p>{tx(room.level)}</p>
      </div>
      <img className='room-character' src={asset(room.character)} alt="" />
      <div className='room-stat-list'>
        <div><span className='lui-c65c7da8 lui-1e673fb0'>{t('playersOnline')}</span><strong className='lui-f014cab0 lui-16b816a0'>{room.players}</strong></div>
        <div><span className='lui-6646a870 lui-a7479fb4'>{t('bet')}</span><strong className='lui-80d469b8 lui-bdcac1ee lui-d210bc28'><img src={asset('coin.png')} alt="" />{room.fee}</strong></div>
        <div><span className='lui-589aefc0 lui-5c5e0744'>{t('prizePool')}</span><strong className='lui-249bee60 lui-8ff2b4fc'><img src={asset('prize.png')} alt="" />{room.prize}</strong></div>
      </div>
      <button className="image-button room-play-button" type="button" onClick={onPlay} style={{ backgroundImage: `url(${asset(room.button)})` }}>
        {t('playNow')}
      </button>
    </article>
  );
}

function FriendRow({ friend, tx }) {
  return (
    <div className="friend-row">
      <img src={asset(friend.avatar)} alt="" />
      <div>
        <strong>{friend.name}</strong>
        <span>{tx(friend.state)}</span>
      </div>
      <button type="button">{tx(friend.action)}</button>
    </div>
  );
}

export default function MainMenuPage() {
  const navigate = useNavigate();
  const { t, tx } = useLanguage();
  const [roomCards, setRoomCards] = useState(fallbackRoomCards);
  const [profile, setProfile] = useState(() => getStoredAuthUser() || mockPlayerProfile);

  useEffect(() => {
    let isMounted = true;

    Promise.all([getFeaturedRooms(), getProfile()])
      .then(([rooms, playerProfile]) => {
        if (!isMounted) {
          return;
        }

        setRoomCards(rooms?.length ? rooms : mockFeaturedRooms);
        setProfile(playerProfile || mockPlayerProfile);
      })
      .catch((error) => {
        console.error('Failed to load main menu data:', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="main-menu-ui main-menu-reference">
      <aside className="sakura-sidebar">
        <SakuraBrand />
        <SakuraPass onOpen={() => navigate(ROUTES.profile)} />
      </aside>

      <div className="main-menu-content">
        <header className="sakura-topbar">
          <div className="topbar-spacer" />
          <div className="topbar-actions">
            <CurrencyPill icon="coin.png" value={profile.wallet?.coins || '125,600'} />
            <CurrencyPill icon="gem.png" value={profile.wallet?.gems || '2,450'} />
            <button className="square-top-button" type="button" aria-label={t('rewards')}><img src={asset('gift.png')} alt="" /></button>
            <button className="square-top-button has-badge" type="button" aria-label={t('notifications')}>🔔<span>3</span></button>
            <button className="profile-pill" type="button" onClick={() => navigate(ROUTES.profile)} aria-label={t('openProfile')}>
              <img src={asset('friend-girl.png')} alt="" />
              <span>⌄</span>
            </button>
          </div>
        </header>

        <div className="main-dashboard">
          <main className='room-section'>
            <div className="hero-banner" style={{ backgroundImage: `url(${asset('bg.png')})` }} aria-hidden="true" />

            <div className="sakura-room-grid">
              {roomCards.map((room) => (
                <RoomCard
                  key={room.title}
                  room={room}
                  t={t}
                  tx={tx}
                  onPlay={() => {
                    saveMatchmakingContext({
                      roomId: room.id || room.roomId || room.title,
                      maxPlayers: room.maxPlayers || 3,
                      source: 'room-card',
                    });
                    navigate(ROUTES.matchmaking, {
                      state: {
                        roomId: room.id || room.roomId || room.title,
                        maxPlayers: room.maxPlayers || 3,
                        source: 'room-card',
                      },
                    });
                  }}
                />
              ))}
            </div>

            <div className="bottom-room-actions">
              <section className="small-action-panel private-room" style={{ backgroundImage: `url(${asset('private-room-art.png')})` }}>
                <div>
                  <h3>{t('createPrivateRoom')}</h3>
                  <p>{t('createPrivateRoomText')}</p>
                  <button type="button" onClick={() => navigate(ROUTES.createRoom)}>{t('createRoom')}</button>
                </div>
              </section>

              <section className="small-action-panel room-code" style={{ backgroundImage: `url(${asset('room-code-art.png')})` }}>
                <div>
                  <h3>{t('joinWithRoomCode')}</h3>
                  <p>{t('joinWithRoomCodeText')}</p>
                  <label>
                    <input placeholder={t('enterRoomCode')} />
                    <button
                      type="button"
                      onClick={() => {
                        saveMatchmakingContext({ roomId: 'room_code', maxPlayers: 3, source: 'room-code' });
                        navigate(ROUTES.matchmaking, { state: { roomId: 'room_code', maxPlayers: 3, source: 'room-code' } });
                      }}
                    >
                      {t('join')}
                    </button>
                  </label>
                </div>
              </section>
            </div>
          </main>

          <aside className="right-panel">
            <section className="friends-panel">
              <h2>{t('friendsOnline')}</h2>
              <div className="friend-list">
                {friends.map((friend) => (
                  <FriendRow key={`${friend.name}-${friend.state}`} friend={friend} tx={tx} />
                ))}
              </div>
              <button className="view-all" type="button">{t('viewAllFriends')} <span>›</span></button>
            </section>

            <section className="cup-panel">
              <img src={asset('sakura-cup.png')} alt="" />
              <div className="cup-copy">                <p>{t('prizePool')}</p>
                <strong><img src={asset('coin.png')} alt="" />50,000</strong>
                <small>{t('endsIn')}</small>
                <button
                  type="button"
                  onClick={() => {
                    saveMatchmakingContext({ roomId: 'sakura_cup', maxPlayers: 3, source: 'sakura-cup' });
                    navigate(ROUTES.matchmaking, { state: { roomId: 'sakura_cup', maxPlayers: 3, source: 'sakura-cup' } });
                  }}
                >
                  {t('joinNow')}
                </button>
              </div>
            </section>
          </aside>
        </div>

        <footer className="sakura-footer">
          <div>
            <strong>{t('fairPlayGuaranteed')}</strong>
            <small>{t('fairPlayText')}</small>
          </div>
          <span>{t('terms')}</span>
          <span>{t('privacy')}</span>
          <span>{t('support')}</span>
          <span>{t('copyright').replace('© ', '')}</span>
        </footer>
      </div>
    </section>
  );
}
