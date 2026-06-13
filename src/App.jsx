import { useEffect, useMemo, useState } from 'react';
import { useFixedViewport } from './hooks.js';
import { useLanguage } from './i18n/useLanguage.js';
import { initialGameData } from './data/mockData.js';
import { backendBridge } from './services/backendBridge.js';
import StarterScreen from './screens/StarterScreen.jsx';
import LoginScreen from './screens/LoginScreen.jsx';
import LoadingScreen from './screens/LoadingScreen.jsx';
import MainMenu from './screens/MainMenu.jsx';
import RoomSelect from './screens/RoomSelect.jsx';
import HelpScreen from './screens/HelpScreen.jsx';
import Matchmaking from './screens/Matchmaking.jsx';
import Gameplay from './screens/Gameplay.jsx';
import WinScreen from './screens/WinScreen.jsx';
import CreateRoom from './screens/CreateRoom.jsx';
import JoinRoom from './screens/JoinRoom.jsx';
import ProfileScreen from './screens/ProfileScreen.jsx';
import PlaceholderScreen from './screens/PlaceholderScreen.jsx';
import SpecialEvent from './screens/SpecialEvent.jsx';
import DailyReward from './screens/DailyReward.jsx';
import TournamentPass from './screens/TournamentPass.jsx';

const SCREENS = {
  starter: StarterScreen,
  login: LoginScreen,
  loading: LoadingScreen,
  mainmenu: MainMenu,
  roomselect: RoomSelect,
  createroom: CreateRoom,
  joinroom: JoinRoom,
  profile: ProfileScreen,
  matchmaking: Matchmaking,
  gameplay: Gameplay,
  win: WinScreen,
  help: HelpScreen,
  specialevent: SpecialEvent,
  dailyreward: DailyReward,
  tournamentpass: TournamentPass,
};

const SCREEN_TO_PATH = {
  starter: '/',
  login: '/login',
  loading: '/loading',
  mainmenu: '/main-menu',
  roomselect: '/room-select',
  createroom: '/create-room',
  joinroom: '/join-room',
  profile: '/profile',
  matchmaking: '/matchmaking',
  gameplay: '/gameplay',
  win: '/win',
  help: '/help',
  specialevent: '/special-event',
  dailyreward: '/daily-reward',
  tournamentpass: '/tournament-pass',
};

const PATH_TO_SCREEN = Object.entries(SCREEN_TO_PATH).reduce((routes, [screenName, path]) => {
  routes[path] = screenName;
  return routes;
}, {
  '/mainmenu': 'mainmenu',
  '/rooms': 'roomselect',
  '/game': 'gameplay',
  '/result': 'win',
  '/create': 'createroom',
  '/join': 'joinroom',
});

function normalizePathname(pathname = '/') {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  return cleanPath.toLowerCase();
}

function getScreenFromPathname(pathname) {
  const cleanPath = normalizePathname(pathname);
  if (cleanPath.startsWith('/game/')) return 'gameplay';
  if (cleanPath.startsWith('/result/')) return 'win';
  return PATH_TO_SCREEN[cleanPath] || 'starter';
}

function getPathForScreen(screenName) {
  return SCREEN_TO_PATH[screenName] || '/';
}

async function tryLockLandscapeOrientation() {
  try {
    if (screen.orientation?.lock) {
      await screen.orientation.lock('landscape');
    }
  } catch (error) {
    // Browser support is inconsistent, especially on iOS/Safari.
    // The CSS orientation guard remains the reliable fallback.
  }
}

export default function App() {
  const [screen, setScreen] = useState(() => getScreenFromPathname(window.location.pathname));
  const [gameData, setGameData] = useState(initialGameData);
  const [backendStatus, setBackendStatus] = useState({ loading: false, error: null, lastAction: null });
  const layout = useFixedViewport();
  const i18n = useLanguage();
  const ScreenComponent = SCREENS[screen] || StarterScreen;

  useEffect(() => {
    document.documentElement.dataset.device = layout.mode;
  }, [layout.mode]);

  useEffect(() => {
    document.documentElement.dataset.language = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    const handlePopState = () => {
      setScreen(getScreenFromPathname(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const visualViewport = window.visualViewport;

    const isEditableElement = (element) => {
      if (!element) return false;
      const tagName = element.tagName?.toLowerCase();
      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || element.isContentEditable;
    };

    const setKeyboardOpen = (isOpen) => {
      root.classList.toggle('keyboard-open', isOpen);
      body?.classList.toggle('keyboard-open', isOpen);
    };

    const refreshKeyboardState = () => {
      const hasFocusedInput = isEditableElement(document.activeElement);
      const viewportHeight = window.innerHeight || root.clientHeight || 0;
      const visualHeight = visualViewport?.height || viewportHeight;
      const keyboardConsumesViewport = viewportHeight - visualHeight > 80;
      setKeyboardOpen(layout.mode === 'mobile' && (hasFocusedInput || keyboardConsumesViewport));
    };

    const handleFocusIn = (event) => {
      if (isEditableElement(event.target)) refreshKeyboardState();
    };

    const handleFocusOut = () => {
      window.setTimeout(refreshKeyboardState, 120);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    visualViewport?.addEventListener('resize', refreshKeyboardState);
    visualViewport?.addEventListener('scroll', refreshKeyboardState);
    refreshKeyboardState();

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      visualViewport?.removeEventListener('resize', refreshKeyboardState);
      visualViewport?.removeEventListener('scroll', refreshKeyboardState);
      setKeyboardOpen(false);
    };
  }, [layout.mode]);

  const appStyle = useMemo(() => ({
    '--design-width': `${layout.resolution.width}px`,
    '--design-height': `${layout.resolution.height}px`,
    '--ui-scale': layout.scale,
  }), [layout]);

  const navigateToScreen = (nextScreen) => {
    const safeScreen = SCREENS[nextScreen] ? nextScreen : 'starter';
    const nextPath = getPathForScreen(safeScreen);
    setScreen(safeScreen);

    if (window.location.pathname !== nextPath) {
      window.history.pushState({ screen: safeScreen }, '', nextPath);
    }
  };

  const navigation = {
    goStarter: () => navigateToScreen('starter'),
    goLogin: () => navigateToScreen('login'),
    goLoading: () => navigateToScreen('loading'),
    goMainMenu: () => navigateToScreen('mainmenu'),
    goRoomSelect: () => navigateToScreen('roomselect'),
    goCreateRoom: () => navigateToScreen('createroom'),
    goJoinRoom: () => navigateToScreen('joinroom'),
    goMatchmaking: () => navigateToScreen('matchmaking'),
    goGameplay: () => navigateToScreen('gameplay'),
    goWin: () => navigateToScreen('win'),
    goHelp: () => navigateToScreen('help'),
    goProfile: () => navigateToScreen('profile'),
    goSpecialEvent: () => navigateToScreen('specialevent'),
    goDailyReward: () => navigateToScreen('dailyreward'),
    goTournamentPass: () => navigateToScreen('tournamentpass'),
  };

  const runBackendAction = async (actionName, callback, fallbackNavigation) => {
    setBackendStatus({ loading: true, error: null, lastAction: actionName });
    try {
      const result = callback ? await callback() : null;
      setBackendStatus({ loading: false, error: null, lastAction: actionName });
      if (fallbackNavigation) fallbackNavigation(result);
      return result;
    } catch (error) {
      setBackendStatus({ loading: false, error: error.message || 'Backend request failed', lastAction: actionName });
      return null;
    }
  };

  const backendActions = {
    login: (credentials) => runBackendAction('auth.login', () => backendBridge.login(credentials), navigation.goLoading),
    register: (payload) => runBackendAction('auth.register', () => backendBridge.register(payload)),
    loginAsGuest: () => runBackendAction('auth.guest', () => backendBridge.loginAsGuest(), navigation.goLoading),
    updateProfile: (payload) => runBackendAction('profile.update', async () => {
      const result = await backendBridge.updateProfile(payload);
      if (payload?.username) {
        setGameData((current) => ({
          ...current,
          user: {
            ...current.user,
            username: payload.username,
          },
        }));
      }
      return result;
    }),
    joinRoom: (room) => runBackendAction('rooms.join', () => backendBridge.joinRoom(room), navigation.goMatchmaking),
    createRoom: (settings) => runBackendAction('rooms.create', () => backendBridge.createRoom(settings), navigation.goGameplay),
    startMatchmaking: (payload) => runBackendAction('matchmaking.start', () => backendBridge.startMatchmaking(payload), navigation.goGameplay),
    cancelMatchmaking: () => runBackendAction('matchmaking.cancel', () => backendBridge.cancelMatchmaking(), navigation.goRoomSelect),
    claimDailyReward: (reward) => runBackendAction('rewards.claimDaily', async () => {
      setGameData((current) => ({
        ...current,
        dailyRewards: current.dailyRewards.map((item) => (
          item.id === reward.id ? { ...item, status: 'Claimed', state: 'claimed' } : item
        )),
      }));
      return backendBridge.claimDailyReward(reward);
    }),
    enterTournament: (tournament) => runBackendAction('tournaments.enter', () => backendBridge.enterTournament(tournament), navigation.goMatchmaking),
    upgradePass: () => runBackendAction('tournaments.upgradePass', () => backendBridge.upgradePass()),
    playSpecialEvent: (event) => runBackendAction('events.play', () => backendBridge.playSpecialEvent(event), navigation.goMatchmaking),
    submitGameAction: (action) => runBackendAction('match.action', () => backendBridge.submitGameAction(action)),
    finishMockWin: () => runBackendAction('match.result', () => backendBridge.getMatchResult(), navigation.goWin),
  };

  return (
    <main
      className={`app-shell app-shell--${layout.mode} app-shell--${screen}`}
      style={appStyle}
      data-backend-action={backendStatus.lastAction || undefined}
      onPointerDown={tryLockLandscapeOrientation}
    >
      <div className="orientation-guard" aria-hidden="true">
        <div className="orientation-guard__card">
          <div className="orientation-guard__phone">
            <span className="orientation-guard__arrow">↻</span>
          </div>
          <div className="orientation-guard__title">Rotate your device</div>
          <div className="orientation-guard__text">Please turn your phone to landscape mode to continue playing.</div>
        </div>
      </div>

      <div className="game-frame">
        <ScreenComponent
          name={screen}
          navigation={navigation}
          mode={layout.mode}
          data={gameData}
          backendActions={backendActions}
          backendStatus={backendStatus}
          i18n={i18n}
        />
      </div>
    </main>
  );
}
