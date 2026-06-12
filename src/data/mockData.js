export const mockUser = {
  id: 'mock-user-001',
  username: 'EMMA',
  displayName: 'Emma',
  avatar: '2.png',
  eventAvatar: '22f.png',
  level: 23,
  xp: 1450,
  nextLevelXp: 2500,
  rankProgress: 15,
};

export const mockWallet = {
  coins: '125,680',
  gems: '2,350',
};

export const mockMainMenuCards = {
  daily: {
    header: 'DAILY REWARDS',
    copy: 'Come back bigger\nrewards!',
    cta: 'CLAIM',
  },
  pass: {
    header: 'LUCKY PASS',
    copy: 'Jump into a quick game',
    cta: 'VIEW PASS',
  },
  tournaments: {
    header: 'TOURNAMENTS',
    copy: 'Compete for big prizes!',
    cta: 'ENTER',
  },
  events: {
    header: 'SPECIAL EVENTS',
    copy: 'Join events, win more!',
    cta: 'SEE EVENTS',
  },
};

export const mockDailyRewards = [
  { id: 'day1', key: 'day1', day: 'Day 1', card: 'd11.png', status: 'Claimed', state: 'claimed' },
  { id: 'day2', key: 'day2', day: 'Day 2', card: 'd22.png', status: 'Claimed', state: 'claimed' },
  { id: 'day3', key: 'day3', day: 'Day 3', card: 'd33.png', status: 'Claimed', state: 'claimed' },
  { id: 'day4', key: 'day4', day: 'Day 4', card: 'd44.png', status: 'Claim', state: 'claimable' },
  { id: 'day5', key: 'day5', day: 'Day 5', card: 'd55.png', status: 'Locked', state: 'locked' },
  { id: 'day6', key: 'day6', day: 'Day 6', card: 'd66.png', status: 'Locked', state: 'locked' },
  { id: 'day7', key: 'day7', day: 'Day 7', card: 'd77.png', status: 'Locked', state: 'locked' },
];

export const mockTournaments = [
  { id: 'bronze', key: 'bronze', card: 'Card1.png', button: '15.png', entry: '25,000', prize: '250,000', time: '02h 15m', players: '48 / 100' },
  { id: 'royal', key: 'royal', card: 'Card2.png', button: '13.png', entry: '25,000', prize: '250,000', time: '06h 45m', players: '128 / 200' },
  { id: 'grand', key: 'grand', card: 'Card3.png', button: '12.png', entry: '25,000', prize: '250,000', time: '1d 12h', players: '256 / 500' },
];

export const mockTournamentPass = {
  xpLabel: 'PASS XP',
  levels: ['+', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
  xpPercent: 0,
  premiumRewards: [
    { icon: 'ic1.png', value: '5K' },
    { icon: 'ic3.png', value: '50' },
    { icon: 'ic2.png', value: '1' },
    { icon: 'ic7.png', value: '1' },
    { icon: 'ic1.png', value: '10K' },
    { icon: 'ic8.png', value: '1' },
    { icon: 'ic3.png', value: '100' },
    { icon: 'ic4.png', value: '1' },
    { icon: 'ic1.png', value: '20K' },
    { icon: 'ic7.png', value: '1' },
  ],
  freeRewards: [
    { icon: 'ic1.png', value: '1K' },
    { icon: 'ic3.png', value: '20' },
    { icon: 'ic2.png', value: '1' },
    { icon: 'ic7.png', value: '1' },
    { icon: 'ic1.png', value: '2K' },
    { icon: 'ic5.png', value: '1' },
    { icon: 'ic3.png', value: '20' },
    { icon: 'ic1.png', value: '2K' },
    { icon: 'ic3.png', value: '5K' },
    { icon: 'ic7.png', value: '1' },
  ],
};

export const mockSpecialEvents = [
  {
    id: 'golden', key: 'golden', skin: 'Card1.png', ribbon: 'LIMITED', ribbonClass: 'special-event-ribbon--limited',
    title: 'GOLDEN DICE RUSH', copy: 'Roll big, win bigger! Collect dice\nand claim amazing gold rewards.', time: '2d 14h',
    rewardLabel: 'FEATURED REWARD', rewardIcon: 'ic1.png', reward: '50,500', buttonSkin: '15.png', buttonClass: 'special-event-play--green',
  },
  {
    id: 'dragon', key: 'dragon', skin: 'Card2.png', ribbon: 'HOT', ribbonClass: 'special-event-ribbon--hot',
    title: 'DRAGON FORTUNE WEEK', copy: '', time: '5d 18h', rewardLabel: '', rewardIcon: 'ic2.png', reward: 'DRAGON CHEST',
    buttonSkin: '12.png', buttonClass: 'special-event-play--red',
  },
  {
    id: 'foxfire', key: 'foxfire', skin: 'Card3.png', ribbon: 'NEW', ribbonClass: 'special-event-ribbon--new',
    title: 'FOXFIRE FESTIVAL', copy: '', time: '1d 09h', rewardLabel: '', rewardIcon: 'ic3.png', reward: 'FOXFIRE PET',
    buttonSkin: '14.png', buttonClass: 'special-event-play--blue',
  },
];

export const mockEventMissions = [
  { id: 'win', key: 'win', icon: 'ic7.png', label: 'Win 3 Matches', progress: '2 / 3', coins: '2,000', fill: 66 },
  { id: 'call', key: 'call', icon: 'ic5.png', label: 'Call Lair 5 times', progress: '3 / 5', coins: '2,500', fill: 60 },
  { id: 'coin', key: 'coin', icon: 'ic4.png', label: 'Collect 100 coin', progress: '68 / 100', coins: '3,000', fill: 68 },
];

export const mockRooms = [
  { id: 'beginner', key: 'beginner', title: 'BEGINNER', card: 'card-1.png', tableArt: '213.png', button: '15.png', stakes: '1k / 5k', buyIn: '500 - 2k', rows: [{ icon: 'IC1.png', text: '2 - 4 Players' }, { icon: 'IC2.png', text: 'No Bluff' }, { icon: 'IC3.png', text: 'Daily Rewards' }] },
  { id: 'classic', key: 'classic', title: 'CLASSIC', card: 'card-2.png', tableArt: '213124.png', button: '14.png', stakes: '1k / 5k', buyIn: '500 - 2k', rows: [{ icon: 'IC1.png', text: '2 - 4 Players' }, { icon: 'IC2.png', text: 'Some Bluff' }, { icon: 'IC5.png', text: 'Bonus Rewards' }] },
  { id: 'high-roller', key: 'high-roller', title: 'HIGH ROLLER', card: 'card-3.png', tableArt: '3323423.png', button: '12.png', stakes: '1k / 75k', buyIn: '500 - 2k', rows: [{ icon: 'IC1.png', text: '2 - 4 Players' }, { icon: 'IC4.png', text: 'Premium Bluff' }, { icon: 'IC5.png', text: 'Premium Rewards' }] },
  { id: 'vip', key: 'vip', title: 'VIP', card: 'card-4.png', tableArt: '3123213.png', button: '13.png', stakes: '1k / 5k', buyIn: '500 - 2k', rows: [{ icon: 'IC1.png', text: '2 - 8 Players' }, { icon: 'IC4.png', text: 'Exclusive Tables' }, { icon: 'IC6.png', text: 'High Rewards' }] },
  { id: 'private', key: 'private', title: 'PRIVET ROOM', card: 'card-5.png', tableArt: '1232131.png', button: 'back-button.png', stakes: '1k / 75k', buyIn: '500 - 2k', rows: [{ icon: 'IC1.png', text: '1 - 2 Players' }, { icon: 'IC1.png', text: 'Invite Friends' }, { icon: 'IC7.png', text: 'Create Rules' }] },
];

export const mockCreateRoomSettings = {
  roomName: 'Emma’s Room',
  players: ['2', '3', '4'],
  selectedPlayers: '4',
  cups: ['3', '4', '5'],
  selectedCups: '5',
  timers: ['10s', '15s', '20s'],
  selectedTimer: '15s',
  bidStyles: ['Classic', 'Wild Ones'],
  selectedBidStyle: 'Classic',
  isPrivate: true,
  roomCode: 'LD-4729',
  rulesCopy: 'Custom Rules:Standard • bluff Re-roll • enabled • Slam enabled',
};

export const mockMatchmaking = {
  filters: [
    { icon: '1.png', label: 'SELECTED MODE', value: 'QUICK MATCH' },
    { icon: '3.png', label: 'STAKES', value: '10K / 50K' },
    { icon: '4.png', label: 'BUY-IN RANGE', value: '5K - 20K' },
    { icon: '4.png', label: 'REGION', value: 'GLOBAL' },
    { icon: '5.png', label: 'EST. WAIT TIME', value: '7s' },
  ],
  metrics: [
    { type: 'players', icon: null, label: 'PLAYERS FOUND', value: '2 / 4' },
    { type: 'quality', icon: '8.png', label: 'MATCH QUALITY', value: 'EXCELLENT' },
    { type: 'fair', icon: '7.png', label: 'FAIR PLAY', value: 'Real players only' },
    { type: 'skill', icon: '6.png', label: 'SKILL BALANCE', value: 'GREAT MATCH' },
  ],
  steps: [
    { icon: '11.png', text: 'FINDING TABLE', sub: '✓' },
    { icon: '22.png', text: 'MATCHING PLAYERS', sub: '••••' },
    { icon: '33.png', text: 'JOINING ROOM', sub: '•••' },
  ],
};

export const initialGameData = {
  user: mockUser,
  wallet: mockWallet,
  mainMenuCards: mockMainMenuCards,
  dailyRewards: mockDailyRewards,
  tournaments: mockTournaments,
  tournamentPass: mockTournamentPass,
  specialEvents: mockSpecialEvents,
  eventMissions: mockEventMissions,
  rooms: mockRooms,
  createRoom: mockCreateRoomSettings,
  matchmaking: mockMatchmaking,
};
