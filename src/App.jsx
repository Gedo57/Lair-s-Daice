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

export default function App() {
  const [screen, setScreen] = useState('starter');
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

  const appStyle = useMemo(() => ({
    '--design-width': `${layout.resolution.width}px`,
    '--design-height': `${layout.resolution.height}px`,
    '--ui-scale': layout.scale,
  }), [layout]);

  const navigation = {
    goStarter: () => setScreen('starter'),
    goLogin: () => setScreen('login'),
    goLoading: () => setScreen('loading'),
    goMainMenu: () => setScreen('mainmenu'),
    goRoomSelect: () => setScreen('roomselect'),
    goCreateRoom: () => setScreen('createroom'),
    goJoinRoom: () => setScreen('joinroom'),
    goMatchmaking: () => setScreen('matchmaking'),
    goGameplay: () => setScreen('gameplay'),
    goWin: () => setScreen('win'),
    goHelp: () => setScreen('help'),
    goProfile: () => setScreen('profile'),
    goSpecialEvent: () => setScreen('specialevent'),
    goDailyReward: () => setScreen('dailyreward'),
    goTournamentPass: () => setScreen('tournamentpass'),
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
    <main className={`app-shell app-shell--${layout.mode} app-shell--${screen}`} style={appStyle} data-backend-action={backendStatus.lastAction || undefined}>
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
