const profileAsset = '/assets/liars-dice/profile-hud/';

function numberValue(value, fallback = 0) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  const parsed = Number(String(value ?? '').replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : fallback;
}

function displayValue(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  return typeof value === 'number' ? value.toLocaleString('en-US') : value;
}

export default function ProfileHud({
  className = '',
  user = {},
  name,
  onClick,
  ariaLabel = 'Open Profile',
}) {
  const currentXp = numberValue(user.xp, 1450);
  const nextLevelXp = Math.max(numberValue(user.nextLevelXp, 2500), 1);
  const fillPercent = Math.max(0, Math.min(100, (currentXp / nextLevelXp) * 100));
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`${className} profile-hud`.trim()}
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={onClick ? ariaLabel : undefined}
      style={{ '--profile-xp-fill': `${fillPercent}%` }}
    >
      <img className="profile-hud__plate" src={`${profileAsset}452.png`} alt="" draggable="false" />
      <img className="profile-hud__avatar" src={`${profileAsset}2.png`} alt="" draggable="false" />

      <span className="profile-hud__name">{name || user.username || user.displayName || 'EMMA'}</span>

      <span className="profile-hud__levelBadge">
        <img className="profile-hud__levelSkin" src={`${profileAsset}563.png`} alt="" draggable="false" />
        <span className="profile-hud__levelText">{user.level || 23}</span>
      </span>

      <span className="profile-hud__progress">
        <img className="profile-hud__barEmpty" src={`${profileAsset}par1.png`} alt="" draggable="false" />
        <span className="profile-hud__barFillClip">
          <img className="profile-hud__barFill" src={`${profileAsset}par2.png`} alt="" draggable="false" />
        </span>
      </span>

      <span className="profile-hud__xpText">
        <span>{displayValue(user.xp, '1,450')}</span>
        <span>&nbsp;/&nbsp;{displayValue(user.nextLevelXp, '2,500')}</span>
      </span>
    </Component>
  );
}
