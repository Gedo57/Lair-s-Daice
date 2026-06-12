import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../router/routes.js';
import { createRoom } from '../services/roomService.js';
import { saveMatchmakingContext } from '../store/gameStore.js';
import { useLanguage } from '../i18n/useLanguage.js';

const asset = (name) => `/assets/create-room/${name}`;

export default function CreateRoomPage() {
  const navigate = useNavigate();
  const { t, tx } = useLanguage();
  const [maxPlayers, setMaxPlayers] = useState(3);
  const [bet, setBet] = useState(5000);
  const [roomType, setRoomType] = useState('Public');
  const [roomName, setRoomName] = useState('My Sakura Room');
  const [password, setPassword] = useState('');

  const formattedBet = useMemo(() => bet.toLocaleString('en-US'), [bet]);

  const handleCreateRoom = async () => {
    const room = await createRoom({
      name: roomName || 'My Sakura Room',
      mode: 'Classic Mahjong',
      maxPlayers,
      bet,
      type: roomType,
      password: password || null,
    });

    const roomId = room.id || room.roomId || roomName || 'created_room';
    saveMatchmakingContext({ roomId, maxPlayers, source: 'create-room' });
    navigate(ROUTES.matchmaking, {
      state: { roomId, maxPlayers, source: 'create-room' },
    });
  };

  const changeBet = (delta) => {
    setBet((current) => Math.max(500, Math.min(50000, current + delta)));
  };

  return (
    <section className="create-room-screen">
      <header className="create-room-header">
        <button type="button" className="create-back-button" onClick={() => navigate(ROUTES.mainMenu)} aria-label={t('backToMainMenu')}>
          ←
        </button>
        <h1>{t('createRoomTitle')}</h1>
      </header>

      <main className="create-room-layout">
        <section className='create-settings-card lui-c8c2bb58'>
          <h2>{t('roomSettings')}</h2>

          <div className="create-form-row">
            <label htmlFor="room-name">{t('roomName')}</label>
            <input
              id="room-name"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              aria-label={t('roomName')}
            />
          </div>

          <div className="create-form-row">
            <label htmlFor="game-mode">{t('gameMode')}</label>
            <div className="create-select-wrap">
              <select id="game-mode" defaultValue="Classic Mahjong" aria-label={t('gameMode')}>
                <option>{t('classicMahjong')}</option>
                <option>{t('dragonMahjong')}</option>
                <option>{t('quickMatch')}</option>
              </select>
              <span>⌄</span>
            </div>
          </div>

          <div className="create-form-row players-row">
            <label>{t('maxPlayers')}</label>
            <div className="segmented-options">
              {[2, 3].map((value) => (
                <button
                  type="button"
                  key={value}
                  className={maxPlayers === value ? 'active' : ''}
                  onClick={() => setMaxPlayers(value)}
                >
                  {value} {t('players')}
                </button>
              ))}
            </div>
          </div>

          <div className="create-form-row bet-row">
            <label>{t('bet')}</label>
            <div className="bet-controls">
              <button type="button" className="square-control" onClick={() => changeBet(-500)} aria-label="Decrease bet">−</button>
              <div className="bet-value"><span>●</span>{formattedBet}</div>
              <button type="button" className="square-control" onClick={() => changeBet(500)} aria-label="Increase bet">+</button>
              <button type="button" className="square-control large" onClick={() => changeBet(5000)} aria-label="Increase bet by 5000">+</button>
            </div>
          </div>

          <div className="create-form-row">
            <label htmlFor="room-password">{t('passwordOptional')}</label>
            <input
              id="room-password"
              type="password"
              placeholder={t('enterPassword')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-label={t('passwordOptional')}
            />
          </div>

          <div className="create-form-row room-type-row">
            <label>{t('roomType')}</label>
            <div className="segmented-options room-type-options">
              {['Public', 'Private'].map((type) => (
                <button
                  type="button"
                  key={type}
                  className={roomType === type ? 'active' : ''}
                  onClick={() => setRoomType(type)}
                >
                  <span>●</span>{tx(type)}
                </button>
              ))}
            </div>
          </div>

          <button type="button" className="create-room-submit" onClick={handleCreateRoom}>
            {t('createRoom')}
          </button>
        </section>

        <aside className='room-preview-card lui-f6c5a7a8'>
          <h2>{t('roomPreview')}</h2>
          <div className="preview-image" />

          <dl className="preview-list">
            <div><dt>{t('roomName')}</dt><dd>{roomName || tx('My Sakura Room')}</dd></div>
            <div><dt>{t('mode')}</dt><dd>{t('classicMahjong')}</dd></div>
            <div><dt>{t('players')}</dt><dd>{maxPlayers} {t('players')}</dd></div>
            <div><dt>{t('bet')}</dt><dd className="preview-bet"><span>●</span>{formattedBet}</dd></div>
            <div><dt>{t('type')}</dt><dd>{tx(roomType)}</dd></div>
          </dl>
        </aside>
      </main>
    </section>
  );
}
