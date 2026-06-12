import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ROUTES, buildGameRoute } from '../router/routes.js';
import { finishGame, getGameState, leaveGame, sendGameAction } from '../services/gameService.js';
import { connectGameSocket } from '../services/socket.js';
import { clearActiveMatch, getActiveMatch, saveActiveMatch } from '../store/gameStore.js';
import { mockGameState } from '../mocks/mockGameState.js';
import { useLanguage } from '../i18n/useLanguage.js';

const asset = (name) => `/assets/gameplay/${name}`;

const handTiles = [
  'Characters_2.png',
  'Characters_3.png',
  'Characters_5.png',
  'Characters_5.png',
  'Characters_8.png',
  'Circles-Dots_4.png',
  'Circles-Dots_6.png',
  'Circles-Dots_8.png',
  'Bamboo_2.png',
  'Bamboo_4.png',
  'Bamboo_6.png',
  'Bamboo_8.png',
  'Characters_1.png',
];

const centerMeldTiles = [
  'Characters_5.png',
  'Characters_5.png',
  'Bamboo_8.png',
  'Characters_1.png',
  'Bamboo_8.png',
];

const topDiscardTiles = ['Characters_3.png', 'Characters_5.png', 'Characters_5.png'];
const rightDiscardTiles = ['Circles-Dots_2.png', 'Circles-Dots_4.png', 'Circles-Dots_6.png', 'Circles-Dots_8.png'];

const actionDefinitions = {
  chow: { labelKey: 'chow', className: 'blue' },
  pong: { labelKey: 'pong', className: 'green' },
  kong: { labelKey: 'kong', className: 'purple' },
  pass: { labelKey: 'pass', className: 'black' },
};

function GameplayTile({ name, className = '', label = '' }) {
  return <img className={`gameplay-tile ${className}`} src={asset(name)} alt={label} draggable="false" />;
}

function TileWall({ count = 14, direction = 'horizontal', className = '' }) {
  return (
    <div className={`gameplay-tile-wall ${direction} ${className}`} aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <img src={asset('card back.png')} alt="" draggable="false" key={index} />
      ))}
    </div>
  );
}

function SideTool({ icon, label, onClick, className = '' }) {
  return (
    <button
      className={`gameplay-side-tool ${className}`}
      type="button"
      aria-label={label}
      onClick={onClick}
    >
      <span className="gameplay-side-icon-shell">
        <img src={asset(icon)} alt="" draggable="false" />
      </span>
      <span className="gameplay-side-label">{label}</span>
    </button>
  );
}

function PlayerBadge({ variant = 'small', avatar, name, coins, className = '', isActiveTurn = false, turnLabel = '' }) {
  return (
    <article className={`gameplay-player-badge ${variant} ${className} ${isActiveTurn ? 'active-turn' : ''}`}>
      {isActiveTurn ? (
        <>
          <span className="gameplay-turn-badge">{turnLabel}</span>
          <span className="gameplay-turn-arrow" aria-hidden="true">➤</span>
        </>
      ) : null}
      <img src={asset(avatar)} alt="" className="gameplay-player-avatar" draggable="false" />
      <div className="gameplay-player-info">
        <strong>{name}</strong>
        {coins ? (
          <span>
            <i aria-hidden="true" />
            {coins}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function Compass({ round = 'East 1', timer = 18, turnLabel = 'YOUR TURN' }) {
  return (
    <div className="gameplay-center-compass" aria-label={`Round ${round}. ${turnLabel}`}>
      <span className="timer">{timer}</span>
      <span className="north">N</span>
      <span className="east">E</span>
      <strong>{round}</strong>
      <em>{turnLabel}</em>
      <span className="south">S</span>
      <span className="west">W</span>
    </div>
  );
}

export default function MahjongGamePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const location = useLocation();
  const { matchId: routeMatchId } = useParams();
  const [storedMatch] = useState(() => getActiveMatch());
  const resolvedMatchId = routeMatchId || location.state?.matchId || storedMatch?.matchId || mockGameState.matchId;

  const [selectedAction, setSelectedAction] = useState(null);
  const [gameState, setGameState] = useState({
    ...mockGameState,
    matchId: resolvedMatchId,
  });
  const [gameError, setGameError] = useState('');

  useEffect(() => {
    if (!routeMatchId && resolvedMatchId) {
      navigate(buildGameRoute(resolvedMatchId), { replace: true, state: location.state });
      return undefined;
    }

    let isMounted = true;

    getGameState(resolvedMatchId)
      .then((state) => {
        if (isMounted && state) {
          setGameState((current) => ({ ...current, ...state, matchId: state.matchId || resolvedMatchId }));
          saveActiveMatch({
            ...storedMatch,
            matchId: state.matchId || resolvedMatchId,
            roomId: state.room?.id || storedMatch?.roomId,
          });
        }
      })
      .catch((error) => {
        console.error('Failed to load game state:', error);
        if (isMounted) {
          setGameError(error.message || t('gameLoadFailed'));
        }
      });

    const gameSocket = connectGameSocket({
      matchId: resolvedMatchId,
      onMessage(message) {
        if (!isMounted) {
          return;
        }

        if (message.type === 'game_state') {
          setGameState((current) => ({ ...current, ...message.payload, matchId: message.payload.matchId || resolvedMatchId }));
        }
      },
      onError(error) {
        console.error('Game socket error:', error);
      },
    });

    return () => {
      isMounted = false;
      gameSocket.disconnect();
    };
  }, [location.state, navigate, resolvedMatchId, routeMatchId]);

  const players = useMemo(() => gameState.players || mockGameState.players, [gameState.players]);
  const topPlayer = players.find((player) => player.position === 'top') || mockGameState.players[0];
  const leftPlayer = players.find((player) => player.position === 'left') || mockGameState.players[1];
  const rightPlayer = players.find((player) => player.position === 'right') || mockGameState.players[2];

  // Change this value from the backend later: 'left' = Stevie / user, 'top' = Bunbun, 'right' = Kiki.
  const activeTurnPosition = gameState.activeTurnPosition || gameState.currentTurnPosition || gameState.turnPosition || 'left';
  const isUserTurn = activeTurnPosition === 'left';
  const activeTurnName = activeTurnPosition === 'top'
    ? (topPlayer.name === 'BUNBUN' ? 'Bunbun' : topPlayer.name)
    : activeTurnPosition === 'right'
      ? rightPlayer.name
      : 'Your';
  const activeTurnLabel = isUserTurn ? t('yourTurn') : `${activeTurnName}${t('turnSuffix')}`;

  const handleMahjongAction = async (actionKey) => {
    setSelectedAction(actionKey);
    await sendGameAction(gameState.matchId || resolvedMatchId, { type: actionKey });
  };

  return (
    <section className="gameplay-screen" aria-label="Mahjong gameplay screen">
      <img className="gameplay-bg" src={asset('BG.png')} alt="" draggable="false" />
      <div className="gameplay-vignette" aria-hidden="true" />
      <div className="gameplay-sakura-particles" aria-hidden="true">
        {Array.from({ length: 18 }).map((_, index) => (
          <span key={index} />
        ))}
      </div>

      {gameError ? <div className="gameplay-error" role="alert">{gameError}</div> : null}

      <header className="gameplay-room-title">
        <span>{t('room')}</span>
        <strong>{gameState.room?.name || 'My Sakura Room'}</strong>
      </header>

      <PlayerBadge
        className="top-player"
        variant="top"
        avatar={topPlayer.avatar}
        name={topPlayer.name === 'BUNBUN' ? 'Bunbun' : topPlayer.name}
        coins={topPlayer.coins}
        isActiveTurn={activeTurnPosition === 'top'}
        turnLabel={activeTurnPosition === 'top' ? activeTurnLabel : ''}
      />

      <PlayerBadge
        className="left-player"
        variant="left"
        avatar={leftPlayer.avatar}
        name={leftPlayer.name === 'STEIVE' ? 'Stevie' : leftPlayer.name}
        coins={leftPlayer.coins}
        isActiveTurn={activeTurnPosition === 'left'}
        turnLabel={activeTurnPosition === 'left' ? activeTurnLabel : ''}
      />

      <PlayerBadge
        className="right-player"
        variant="right"
        avatar={rightPlayer.avatar}
        name={rightPlayer.name}
        coins={rightPlayer.coins}
        isActiveTurn={activeTurnPosition === 'right'}
        turnLabel={activeTurnPosition === 'right' ? activeTurnLabel : ''}
      />

      <main className="gameplay-table-zone">
        <img className="gameplay-table" src={asset('table.png')} alt="Mahjong table" draggable="false" />

        <TileWall count={14} direction="horizontal" className="wall-top" />
        <TileWall count={13} direction="vertical" className="wall-right" />

        <Compass round={gameState.round || 'East 1'} timer={gameState.timer || 18} turnLabel={activeTurnLabel} />

        <div className="gameplay-upper-discard" aria-label="Top discard tiles">
          {topDiscardTiles.map((tile, index) => (
            <GameplayTile name={tile} key={`${tile}-${index}`} />
          ))}
        </div>

        <div className="gameplay-right-discard" aria-label="Right discard tiles">
          {rightDiscardTiles.map((tile, index) => (
            <GameplayTile name={tile} key={`${tile}-${index}`} />
          ))}
        </div>

        <div className="gameplay-center-discard" aria-label="Center meld tiles">
          {centerMeldTiles.map((tile, index) => (
            <GameplayTile name={tile} key={`${tile}-${index}`} />
          ))}
        </div>

        <div className="gameplay-hand" aria-label="Player hand tiles">
          {handTiles.map((tile, index) => (
            <button className="gameplay-hand-tile" type="button" key={`${tile}-${index}`} aria-label={`Tile ${index + 1}`}>
              <GameplayTile name={tile} />
            </button>
          ))}
        </div>
      </main>

      <nav className={`gameplay-actions ${isUserTurn ? 'player-turn' : 'waiting-turn'}`} aria-label={t('mahjongActions')}>
        {['chow', 'pong', 'kong', 'pass'].map((actionKey) => {
          const action = actionDefinitions[actionKey];
          const isActive = selectedAction === actionKey;

          return (
            <button
              className={`gameplay-action ${action.className} ${isActive ? 'active' : ''}`}
              type="button"
              key={actionKey}
              onClick={() => handleMahjongAction(actionKey)}
              aria-pressed={isActive}
            >
              {t(action.labelKey)}
            </button>
          );
        })}
        <button
          className="gameplay-action orange"
          type="button"
          onClick={async () => {
            await finishGame(gameState.matchId || resolvedMatchId, { result: 'win' });
            navigate(ROUTES.result, { state: { matchId: gameState.matchId || resolvedMatchId, result: 'win' } });
          }}
        >
          {t('win')}
        </button>
      </nav>

      <aside className="gameplay-side-menu" aria-label="Gameplay side menu">
        <SideTool
          icon="exit.png"
          label={t('leave')}
          className="leave"
          onClick={async () => {
            await leaveGame(gameState.matchId || resolvedMatchId);
            clearActiveMatch();
            navigate(ROUTES.mainMenu);
          }}
        />
      </aside>
    </section>
  );
}
