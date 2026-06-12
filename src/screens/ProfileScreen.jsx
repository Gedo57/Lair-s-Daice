import ProfileHud from '../components/ProfileHud.jsx';
import { useEffect, useState } from 'react';

const asset = '/assets/liars-dice/profile/';
const mainMenuAsset = '/assets/liars-dice/main-menu/';

const achievements = [
  { icon: 'ic11.png', label: 'High Roller' },
  { icon: 'ic12.png', label: 'Big Winner' },
  { icon: 'ic13.png', label: 'Lucky Break' },
  { icon: 'ic14.png', label: 'Perfect Bid' },
  { icon: 'ic15.png', label: 'Dice Master' },
];

const stats = [
  { mod: 'total-wins', icon: 'ic1.png', label: 'TOTAL WINS', value: '125,680' },
  { mod: 'diamonds', icon: 'ic2.png', label: 'DIAMONDS', value: '2,350' },
  { mod: 'highest-bid', icon: 'ic3.png', label: 'HIGHEST BID', value: '482' },
  { mod: 'wins', icon: 'ic4.png', label: 'WINS', value: '312' },
  { mod: 'win-rate', icon: 'ic5.png', label: 'WIN RATE', value: '64.7%' },
  { mod: 'favorite-table', icon: 'ic6.png', label: 'FAVORITE TABLE', value: 'High Roller' },
  { mod: 'highest-rank', icon: 'ic7.png', label: 'HIGHEST RANK', value: 'Gold III' },
  { mod: 'best-streak', icon: 'ic8.png', label: 'BEST STREAK', value: '12 Wins' },
];

const seasons = [
  { name: 'Season 1', rank: 'Gold IV' },
  { name: 'Season 2', rank: 'Gold I' },
  { name: 'Season 3', rank: 'Gold II' },
  { name: 'Season 4', rank: 'Gold V' },
];

const matches = [
  { state: 'WIN', icon: 'ic16.png', room: 'High Roller', coins: '+15,000' },
  { state: 'LOSE', icon: 'ic4.png', room: 'Classic', coins: '-5,000' },
  { state: 'WIN', icon: 'ic2.png', room: 'VIP', coins: '+40,000' },
];

export default function ProfileScreen({ navigation, data, backendActions, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const user = data?.user || {};
  const wallet = data?.wallet || {};
  const [displayName, setDisplayName] = useState(user.username || 'EMMA');
  const [draftName, setDraftName] = useState(user.username || 'EMMA');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSavingName, setIsSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    const nextName = user.username || 'EMMA';
    setDisplayName(nextName);
    setDraftName(nextName);
  }, [user.username]);

  const startEditName = () => {
    setDraftName(displayName);
    setNameError('');
    setIsEditingName(true);
  };

  const cancelEditName = () => {
    setDraftName(displayName);
    setNameError('');
    setIsEditingName(false);
  };

  const saveProfileName = async () => {
    const nextName = draftName.trim();

    if (!nextName) {
      setNameError(tx('Name is required'));
      return;
    }

    setIsSavingName(true);
    setNameError('');

    try {
      await backendActions?.updateProfile?.({ username: nextName });
      setDisplayName(nextName);
      setDraftName(nextName);
      setIsEditingName(false);
    } catch (error) {
      setNameError(error?.message || tx('Failed to update name'));
    } finally {
      setIsSavingName(false);
    }
  };

  return (
    <section className="screen profile-screen" aria-label={tx('Profile Screen')}>
      <ProfileHud className="profile-mini" user={user} name={displayName} />

      <img className="profile-logo" src={`${asset}logo.png`} alt={tx('PROFILE')} draggable="false" />

      <div className="profile-wallet profile-wallet--coins">
        <img className="profile-wallet__icon profile-wallet__icon--coin" src={`${mainMenuAsset}6.png`} alt="" draggable="false" />
        <span className="profile-wallet__value">{wallet.coins || '125,680'}</span>
        <img className="profile-wallet__plus" src={`${mainMenuAsset}8.png`} alt="" draggable="false" />
      </div>

      <div className="profile-wallet profile-wallet--diamonds">
        <img className="profile-wallet__icon profile-wallet__icon--diamond" src={`${mainMenuAsset}7.png`} alt="" draggable="false" />
        <span className="profile-wallet__value">{wallet.gems || '2,350'}</span>
        <img className="profile-wallet__plus" src={`${mainMenuAsset}8.png`} alt="" draggable="false" />
      </div>

      <img className="profile-main-panel" src={`${asset}panel2.png`} alt="" draggable="false" />

      <img className="profile-player-art" src={`${asset}ll.png`} alt="" draggable="false" />

      <div className="profile-name-card">
        {isEditingName ? (
          <div className="profile-name-editor">
            <input
              className="profile-name-editor__input"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              maxLength={18}
              aria-label={tx('Avatar name')}
              autoFocus
            />
            <button className="profile-name-editor__save" type="button" onClick={saveProfileName} disabled={isSavingName}>
              {tx(isSavingName ? 'SAVING...' : 'SAVE')}
            </button>
            <button className="profile-name-editor__cancel" type="button" onClick={cancelEditName} disabled={isSavingName}>
              {tx('CANCEL')}
            </button>
          </div>
        ) : (
          <>
            <span className="profile-name-card__name">{displayName}</span>
            <button className="profile-edit-name-button" type="button" onClick={startEditName}>
              {tx('EDIT NAME')}
            </button>
          </>
        )}
        {nameError ? <span className="profile-name-editor__error" role="alert">{nameError}</span> : null}
        <img className="profile-name-card__crown" src={`${asset}ic16.png`} alt="" draggable="false" />
        <span className="profile-name-card__rank">{tx('High Roller')}</span>
        <span className="profile-name-card__bio">{tx('Long Player · Joined since')}<br />{tx('Aug 16, 2024')}</span>
      </div>

      <div className="profile-stats">
        {stats.map((item) => (
          <div className={`profile-stat profile-stat--${item.mod}`} key={item.mod}>
            <img className="profile-stat__icon" src={`${asset}${item.icon}`} alt="" draggable="false" />
            <span className="profile-stat__label">{tx(item.label)}</span>
            <span className="profile-stat__value">{tx(item.value)}</span>
          </div>
        ))}
      </div>

      <div className="profile-seasons">
        {seasons.map((item, index) => (
          <div className={`profile-season profile-season--${index + 1}`} key={item.name}>
            <span className="profile-season__name">{tx(item.name)}</span>
            <img className="profile-season__icon" src={`${asset}ic7.png`} alt="" draggable="false" />
            <span className="profile-season__rank">{tx(item.rank)}</span>
          </div>
        ))}
      </div>

      <div className="profile-bottom profile-bottom--achievements">
        <img className="profile-bottom__panel profile-bottom__panel--achievements" src={`${asset}panel3.png`} alt="" draggable="false" />
        <span className="profile-bottom__title">{tx('ACHIEVEMENTS')}</span>
        {achievements.map((item, index) => (
          <div className={`profile-achievement profile-achievement--${index + 1}`} key={item.label}>
            <img className="profile-achievement__icon" src={`${asset}${item.icon}`} alt="" draggable="false" />
            <span className="profile-achievement__label">{tx(item.label)}</span>
          </div>
        ))}
      </div>

      <div className="profile-bottom profile-bottom--recent">
        <img className="profile-bottom__panel profile-bottom__panel--recent" src={`${asset}panel 1.png`} alt="" draggable="false" />
        <span className="profile-bottom__title">{tx('RECENT MATCHES')}</span>
        {matches.map((item, index) => (
          <div className={`profile-match profile-match--${index + 1}`} key={`${item.state}-${item.room}`}>
            <span className={`profile-match__state profile-match__state--${item.state.toLowerCase()}`}>{tx(item.state)}</span>
            <img className="profile-match__roomIcon" src={`${asset}${item.icon}`} alt="" draggable="false" />
            <span className="profile-match__room">{tx(item.room)}</span>
            <img className="profile-match__coin" src={`${asset}ic1.png`} alt="" draggable="false" />
            <span className="profile-match__coins">{item.coins}</span>
          </div>
        ))}
      </div>

      <div className="profile-bottom profile-bottom--favorite">
        <img className="profile-bottom__panel profile-bottom__panel--favorite" src={`${asset}panel3.png`} alt="" draggable="false" />
        <span className="profile-bottom__title">{tx('MY FAVORITE')}</span>
        <span className="profile-favorite__label profile-favorite__label--cup">{tx('FAVORITE CUP')}</span>
        <span className="profile-favorite__label profile-favorite__label--dice">{tx('FAVORITE DICE')}</span>
        <img className="profile-favorite__cup" src={`${asset}ic9.png`} alt="" draggable="false" />
        <img className="profile-favorite__dice" src={`${asset}ic10.png`} alt="" draggable="false" />
        <span className="profile-favorite__name profile-favorite__name--cup">{tx('Royal Red')}</span>
        <span className="profile-favorite__name profile-favorite__name--dice">{tx('Classic Ivory')}</span>
      </div>

      <button className="profile-back" type="button" onClick={navigation.goMainMenu}>
        <img className="profile-back__skin" src={`${asset}B2.png`} alt="" draggable="false" />
        <span className="profile-back__text">{tx('BACK')}</span>
      </button>
    </section>
  );
}
