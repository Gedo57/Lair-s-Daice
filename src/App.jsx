import { useEffect, useMemo, useState } from 'react';
import { useFixedViewport } from './hooks.js';
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
import ProfileScreen from './screens/ProfileScreen.jsx';
import PlaceholderScreen from './screens/PlaceholderScreen.jsx';

const SCREENS = {
  starter: StarterScreen,
  login: LoginScreen,
  loading: LoadingScreen,
  mainmenu: MainMenu,
  roomselect: RoomSelect,
  createroom: CreateRoom,
  profile: ProfileScreen,
  matchmaking: Matchmaking,
  gameplay: Gameplay,
  win: WinScreen,
  help: HelpScreen,
};

export default function App() {
  const [screen, setScreen] = useState('starter');
  const layout = useFixedViewport();
  const ScreenComponent = SCREENS[screen] || StarterScreen;

  useEffect(() => {
    document.documentElement.dataset.device = layout.mode;
  }, [layout.mode]);

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
    goMatchmaking: () => setScreen('matchmaking'),
    goGameplay: () => setScreen('gameplay'),
    goWin: () => setScreen('win'),
    goHelp: () => setScreen('help'),
    goProfile: () => setScreen('profile'),
  };

  return (
    <main className={`app-shell app-shell--${layout.mode} app-shell--${screen}`} style={appStyle}>
      <div className="game-frame">
        <ScreenComponent name={screen} navigation={navigation} mode={layout.mode} />
      </div>
    </main>
  );
}
