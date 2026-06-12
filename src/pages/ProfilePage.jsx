import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../router/routes.js';
import { getAchievements, getProfile, getProfileStats, updateProfile } from '../services/profileService.js';
import { getStoredAuthUser } from '../services/authService.js';
import { mockAchievements, mockPlayerProfile, mockProfileStats } from '../mocks/mockProfile.js';
import { useLanguage } from '../i18n/useLanguage.js';

const asset = (name) => `/assets/profile/${name}`;
const DEFAULT_PROFILE_AVATAR = 'ICO.png';
const XP_TRACK_ASSET = 'profile-xp-track.png';
const XP_FILL_ASSET = 'profile-xp-fill.png';



function parseNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const parsed = Number(value.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseProgressText(progressText) {
  if (typeof progressText !== 'string') {
    return null;
  }

  const match = progressText.match(/([\d,.]+)\s*\/\s*([\d,.]+)/);

  if (!match) {
    return null;
  }

  return {
    current: parseNumber(match[1]),
    target: parseNumber(match[2]),
  };
}

function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value));
}

function getProgressPercent(current, target) {
  if (!target || target <= 0) {
    return 0;
  }

  return clampPercent((current / target) * 100);
}

function getProfileXpData(profile) {
  const parsedRankProgress = parseProgressText(profile?.rank?.progressText);
  const current = parseNumber(
    profile?.currentXP ??
      profile?.currentXp ??
      profile?.xp ??
      profile?.rank?.currentXP ??
      profile?.rank?.currentXp ??
      parsedRankProgress?.current ??
      0,
  );
  const target = parseNumber(
    profile?.requiredXP ??
      profile?.requiredXp ??
      profile?.nextLevelXP ??
      profile?.nextLevelXp ??
      profile?.rank?.requiredXP ??
      profile?.rank?.requiredXp ??
      profile?.rank?.nextLevelXP ??
      profile?.rank?.nextLevelXp ??
      parsedRankProgress?.target ??
      1,
  );

  return {
    current,
    target,
    percent: getProgressPercent(current, target),
    text: profile?.rank?.progressText || `${current.toLocaleString()} / ${target.toLocaleString()}`,
  };
}

function getAchievementProgressData(item) {
  if (item?.complete) {
    return {
      current: 1,
      target: 1,
      percent: 100,
      text: item.progress || 'Completed',
    };
  }

  const parsedProgress = parseProgressText(item?.progress);
  const current = parseNumber(item?.currentXP ?? item?.currentXp ?? item?.xp ?? item?.current ?? parsedProgress?.current ?? 0);
  const target = parseNumber(item?.requiredXP ?? item?.requiredXp ?? item?.targetXP ?? item?.targetXp ?? item?.target ?? parsedProgress?.target ?? 1);

  return {
    current,
    target,
    percent: getProgressPercent(current, target),
    text: item?.progress || `${current}/${target}`,
  };
}

function XpProgressBar({ className = '', percent, label }) {
  return (
    <div
      aria-label={label}
      aria-valuemax="100"
      aria-valuemin="0"
      aria-valuenow={Math.round(clampPercent(percent))}
      className={`profile-xp-progress ${className}`.trim()}
      role="progressbar"
      style={{ '--xp-progress': `${clampPercent(percent)}%` }}
    >
      <img className="profile-xp-progress-track" src={asset(XP_TRACK_ASSET)} alt="" />
      <div className="profile-xp-progress-fill-clip">
        <img className="profile-xp-progress-fill" src={asset(XP_FILL_ASSET)} alt="" />
      </div>
    </div>
  );
}

function getDisplayName(profile) {
  return profile?.username || profile?.name || 'Player';
}

function getProfileWithDefaults(profile) {
  return {
    ...mockPlayerProfile,
    ...(profile && typeof profile === 'object' ? profile : {}),
    rank: {
      ...mockPlayerProfile.rank,
      ...(profile?.rank && typeof profile.rank === 'object' ? profile.rank : {}),
    },
    wallet: {
      ...mockPlayerProfile.wallet,
      ...(profile?.wallet && typeof profile.wallet === 'object' ? profile.wallet : {}),
    },
  };
}


function getAchievementsWithDefaults(items) {
  const sourceItems = Array.isArray(items) && items.length ? items : mockAchievements;
  const maxLength = Math.max(mockAchievements.length, sourceItems.length);

  return Array.from({ length: maxLength }, (_, index) => {
    const fallback = mockAchievements[index % mockAchievements.length];
    const item = sourceItems[index] || {};

    return {
      ...fallback,
      ...(item && typeof item === 'object' ? item : {}),
      title: item?.title || fallback.title,
      description: item?.description || fallback.description,
      progress: item?.progress || fallback.progress,
      card: item?.card || fallback.card,
      complete: Boolean(item?.complete ?? item?.completed ?? fallback.complete),
    };
  });
}

function getAvatarSrc(profile) {
  const avatarValue = profile?.avatarUrl || profile?.imageUrl || profile?.avatar || profile?.avatarId;

  if (typeof avatarValue !== 'string') {
    return asset(DEFAULT_PROFILE_AVATAR);
  }

  const avatar = avatarValue.trim();

  if (!avatar) {
    return asset(DEFAULT_PROFILE_AVATAR);
  }

  if (/^(https?:)?\/\//i.test(avatar) || avatar.startsWith('/')) {
    return avatar;
  }

  if (/\.(png|jpe?g|webp|gif|svg)$/i.test(avatar)) {
    return asset(avatar);
  }

  return asset(DEFAULT_PROFILE_AVATAR);
}

function normalizeUpdatedProfile(response, currentProfile, username) {
  const nextProfile = response?.profile || response?.user || response;

  return {
    ...currentProfile,
    ...(nextProfile && typeof nextProfile === 'object' ? nextProfile : {}),
    username,
    name: username,
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t, tx } = useLanguage();
  const [profile, setProfile] = useState(() => getProfileWithDefaults(getStoredAuthUser()));
  const [stats, setStats] = useState(mockProfileStats);
  const [achievements, setAchievements] = useState(mockAchievements);
  const [loadError, setLoadError] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(() => getDisplayName(getProfileWithDefaults(getStoredAuthUser())));
  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let isMounted = true;

    Promise.all([getProfile(), getProfileStats(), getAchievements()])
      .then(([playerProfile, playerStats, playerAchievements]) => {
        if (!isMounted) {
          return;
        }

        const nextProfile = getProfileWithDefaults(playerProfile);
        setProfile(nextProfile);
        setDraftName(getDisplayName(nextProfile));
        setStats(playerStats?.length ? playerStats : nextProfile.stats?.length ? nextProfile.stats : mockProfileStats);
        setAchievements(getAchievementsWithDefaults(playerAchievements));
      })
      .catch((error) => {
        console.error('Failed to load profile:', error);
        if (isMounted) {
          setLoadError(error.message || t('profileLoadFailed'));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  function startEditingName() {
    setDraftName(getDisplayName(profile));
    setSaveError('');
    setSaveStatus('idle');
    setIsEditingName(true);
  }

  function cancelEditingName() {
    setDraftName(getDisplayName(profile));
    setSaveError('');
    setSaveStatus('idle');
    setIsEditingName(false);
  }

  async function saveProfileName(event) {
    event.preventDefault();

    const nextName = draftName.trim();

    if (!nextName) {
      setSaveError(t('nameRequired'));
      return;
    }

    if (nextName === getDisplayName(profile)) {
      setIsEditingName(false);
      setSaveError('');
      return;
    }

    try {
      setSaveStatus('saving');
      setSaveError('');
      const response = await updateProfile({ username: nextName });
      setProfile((currentProfile) => normalizeUpdatedProfile(response, currentProfile, nextName));
      setDraftName(nextName);
      setSaveStatus('saved');
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update profile name:', error);
      setSaveStatus('error');
      setSaveError(error.message || t('profileUpdateFailed'));
    }
  }

  const profileXp = getProfileXpData(profile);

  return (
    <section className="profile-screen-ui" aria-label={t('profileTitle')}>
      <aside className="profile-sidebar profile-sidebar--compact">
        <button className="profile-back-line" type="button" onClick={() => navigate(ROUTES.mainMenu)}>
          <img src={asset('Back.png')} alt="" />
          <span>{t('profileTitle')}</span>
        </button>
      </aside>

      <main className='profile-content lui-55e35a30'>
        <header className="profile-header">
          <div className="profile-identity">
            <img className="profile-avatar" src={getAvatarSrc(profile)} alt={`${getDisplayName(profile)} avatar`} />
            <div className="profile-name-block">
              {!isEditingName ? (
                <div className="profile-name-display-row">
                  <h1>{getDisplayName(profile)}</h1>
                  <button className="profile-edit-name-button" type="button" onClick={startEditingName}>
                    {t('editName')}
                  </button>
                </div>
              ) : (
                <form className="profile-name-edit-form" onSubmit={saveProfileName}>
                  <input
                    aria-label={t('avatarName')}
                    maxLength={24}
                    name="profileName"
                    onChange={(event) => setDraftName(event.target.value)}
                    type="text"
                    value={draftName}
                  />
                  <button className="profile-name-save-button" disabled={saveStatus === 'saving'} type="submit">
                    {saveStatus === 'saving' ? t('saving') : t('save')}
                  </button>
                  <button className="profile-name-cancel-button" disabled={saveStatus === 'saving'} type="button" onClick={cancelEditingName}>
                    {t('cancel')}
                  </button>
                </form>
              )}
              {saveError ? <p className="profile-save-error" role="alert">{saveError}</p> : null}
              {saveStatus === 'saved' ? <p className="profile-save-success">{t('profileNameUpdated')}</p> : null}
              <p className="profile-api-meta">{t('level')} {profile.level || 1} · {profile.trophies ?? 0} {t('trophies')}</p>
              <div className="profile-rank-row">
                <img src={asset('PAD.png')} alt="" />
                <div>
                  <strong>{tx(profile.rank?.title || profile.title || 'Sakura Master')}</strong>
                  <span>{profileXp.text}</span>
                </div>
              </div>
              <XpProgressBar className="profile-rank-xp-bar" percent={profileXp.percent} label={t('xpProgress')} />
            </div>
          </div>

          {loadError ? <p className="profile-load-error" role="alert">{loadError}</p> : null}

          <div className="profile-stat-panel">
            {stats.map((stat) => (
              <div key={stat.label}>
                <span className='lui-68cf83ec'>{tx(stat.label)}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </header>

        <section className='profile-section achievements-section lui-44c3f0d0'>
          <h2>{t('recentAchievements')}</h2>
          <div className="profile-achievement-grid">
            {achievements.map((item) => {
              const achievementProgress = getAchievementProgressData(item);

              return (
                <article
                  className='profile-achievement-card lui-4e595040'
                  key={item.title}
                  style={{ backgroundImage: `url(${asset(item.card)})` }}
                >
                  <div className="profile-achievement-copy">
                    <h3 className='lui-9ac37510'>{tx(item.title)}</h3>
                    <p className='lui-7bc2a8ec'>{tx(item.description)}</p>
                  </div>

                  <div className="profile-achievement-footer">
                    <XpProgressBar
                      className="profile-achievement-xp-bar"
                      percent={achievementProgress.percent}
                      label={`${tx(item.title)} ${t('xpProgress')}`}
                    />
                    <span className="profile-achievement-progress-text">{tx(achievementProgress.text)}</span>
                    {item.complete ? (
                      <button className="profile-achievement-complete-button" type="button">
                        COMPLETE
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className='profile-section tile-section lui-1f1553ac'>
          <h2>{t('favoriteTileSet')}</h2>
          <div className="favorite-tile-row">
            <img className='favorite-tiles lui-ddf2612c' src={asset('Card.png')} alt={t('favoriteTileSet')} />
          </div>
        </section>
      </main>
    </section>
  );
}
