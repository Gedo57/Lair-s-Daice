export const mockGameState = {
  matchId: 'mock_match_001',
  room: {
    id: 'sakura_garden',
    name: 'My Sakura Room',
  },
  round: 'East 1',
  timer: 18,
  players: [
    { id: 'player_bunbun', name: 'BUNBUN', avatar: 'Bunbun.png', coins: '24,500', position: 'top' },
    { id: 'player_stevie', name: 'STEIVE', avatar: 'Stevie.png', coins: '28,900', position: 'left' },
    { id: 'player_kiki', name: 'Kiki', avatar: 'KIKI.png', coins: '22,100', position: 'right' },
  ],
};

export const mockGameResult = {
  matchId: 'mock_match_001',
  winnerId: 'player_stevie',
  result: 'win',
  rewards: {
    coins: 2000,
    xp: 120,
  },
};
