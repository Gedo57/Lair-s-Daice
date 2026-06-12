import { useState } from 'react';

const asset = '/assets/liars-dice/gameplay/';

const diceMap = [4, 2, 5, 5, 1, 1];
const sophieDice = [1, 2, 3, 5, 6];
const youDice = [4, 2, 2, 1];
const dragonDice = [4, 1, 1, 3];
const faceOptions = [1, 2, 3, 4, 5, 6];
const quantityOptions = [1, 2, 3, 4, 5, 6, 7];

function Die({ value, className = '' }) {
  return <img className={className} src={`${asset}n${value}.png`} alt="" draggable="false" />;
}

function PlayerPanel({ className, skin, avatar, name, count, dice }) {
  return (
    <div className={`gameplay-player ${className}`}>
      <img className="gameplay-player__skin" src={`${asset}${skin}`} alt="" draggable="false" />
      <img className="gameplay-player__avatar" src={`${asset}${avatar}`} alt="" draggable="false" />
      <span className="gameplay-player__name">{name}</span>
      <div className="gameplay-player__countRow">
        <Die value={4} className="gameplay-player__countDie" />
        <span className="gameplay-player__countValue">{count}</span>
      </div>
      <div className="gameplay-player__diceRow">
        {dice.map((value, index) => <Die key={`${name}-${index}-${value}`} value={value} className="gameplay-player__miniDie" />)}
      </div>
    </div>
  );
}

function ActionButton({ className, skin, title, subtitle, onAction, tx }) {
  const actionType = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const click = () => onAction?.({ type: actionType || 'gameplay_action' });

  return (
    <button className={`gameplay-action ${className}`} type="button" onClick={click}>
      <img className="gameplay-action__skin" src={`${asset}${skin}`} alt="" draggable="false" />
      <span className="gameplay-action__title">{tx(title)}</span>
      <span className="gameplay-action__subtitle">{tx(subtitle)}</span>
    </button>
  );
}

export default function Gameplay({ navigation, backendActions, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  const isChinese = i18n?.language === 'zh';
  const bidSelectorSkin = isChinese ? '/assets/liars-dice/localized/zh/gameplay-bid-panel.png' : `${asset}234.png`;
  const [selectedQuantity, setSelectedQuantity] = useState(4);

  return (
    <section className="screen gameplay-screen" aria-label={tx('Gameplay')}>
      <PlayerPanel className="gameplay-player--sophie" skin="bb3.png" avatar="c3.png" name="Sophie" count="4" dice={sophieDice} />
      <PlayerPanel className="gameplay-player--you" skin="bb2.png" avatar="c1.png" name="You" count="5" dice={youDice} />
      <PlayerPanel className="gameplay-player--dragon" skin="bb1.png" avatar="Dragon.png" name="Dragon" count="4" dice={dragonDice} />

      <div className="gameplay-turnbar">
        <img className="gameplay-turnbar__skin" src={`${asset}11.png`} alt="" draggable="false" />
        <img className="gameplay-turnbar__avatarBg" src={`${asset}BGBB.png`} alt="" draggable="false" />
        <img className="gameplay-turnbar__avatar" src={`${asset}22.png`} alt="" draggable="false" />
        <span className="gameplay-turnbar__title">{tx('LUCA’S TURN')}</span>
        <div className="gameplay-turnbar__countRow">
          <Die value={4} className="gameplay-turnbar__countDie" />
          <span className="gameplay-turnbar__countValue">4</span>
        </div>
        <div className="gameplay-turnbar__diceRow">
          {diceMap.slice(1).map((value, index) => <Die key={`turn-${index}`} value={value} className="gameplay-turnbar__die" />)}
        </div>
      </div>

      <div className="gameplay-timer">
        <img className="gameplay-timer__skin" src={`${asset}4.png`} alt="" draggable="false" />
        <img className="gameplay-timer__icon" src={`${asset}tt.png`} alt="" draggable="false" />
        <span className="gameplay-timer__value">13S</span>
      </div>

      <div className="gameplay-current-bid">
        <img className="gameplay-current-bid__skin" src={`${asset}4.png`} alt="" draggable="false" />
        <div className="gameplay-current-bid__header">{tx('CURRENT BID')}</div>
        <div className="gameplay-current-bid__main">
          <span>5 x</span>
          <Die value={1} className="gameplay-current-bid__die" />
        </div>
        <span className="gameplay-current-bid__total">{tx('TOTAL DICE IN PLAY: 17')}</span>
        <span className="gameplay-current-bid__label">{tx('LAST ACTION')}</span>
        <span className="gameplay-current-bid__copy">{tx('Luca raised the bid')}</span>
        <div className="gameplay-current-bid__last">
          <span>4 x</span>
          <Die value={1} className="gameplay-current-bid__lastDie" />
        </div>
      </div>

      <div className="gameplay-cups">
        <img className="gameplay-cups__image" src={`${asset}gameplay-cups.png`} alt="" draggable="false" />
      </div>

      <div className="gameplay-bid-selector">
        <img className="gameplay-bid-selector__skin" src={bidSelectorSkin} alt="" draggable="false" />
        <div className="gameplay-bid-selector__quantityRow">
          {quantityOptions.map((value) => (
            <button
              key={`qty-${value}`}
              type="button"
              className={`gameplay-bid-selector__quantity gameplay-bid-selector__quantity--${value} ${value === selectedQuantity ? 'is-active' : ''}`}
              onClick={() => setSelectedQuantity(value)}
              aria-pressed={value === selectedQuantity}
            >
              {value === selectedQuantity ? (
                <img className="gameplay-bid-selector__selectedSkin" src={`${asset}quantity-selected.png`} alt="" draggable="false" />
              ) : null}
              <span className="gameplay-bid-selector__quantityText">{value}</span>
            </button>
          ))}
        </div>
        <div className="gameplay-bid-selector__faceRow">
          {faceOptions.map((value) => (
            <button key={`face-${value}`} type="button" className="gameplay-bid-selector__faceBtn">
              <Die value={value} className="gameplay-bid-selector__die" />
            </button>
          ))}
        </div>
      </div>

      <button className="gameplay-reroll" type="button">
        <img className="gameplay-reroll__skin" src={`${asset}1234.png`} alt="" draggable="false" />
        <span className="gameplay-reroll__title">{tx('RE-ROLL')}</span>
        <span className="gameplay-reroll__count">3</span>
      </button>

      <div className="gameplay-action-tray">
        <img className="gameplay-action-tray__skin" src={`${asset}Panal.png`} alt="" draggable="false" />
      </div>

      <ActionButton className="gameplay-action--raise" skin="B!.png" title="RAISE BID" subtitle="Increase the bid" onAction={backendActions?.finishMockWin || navigation.goWin} tx={tx} />
      <ActionButton className="gameplay-action--call" skin="B2.png" title="CALL LIRA" subtitle="Challenge the bet" onAction={backendActions?.finishMockWin || navigation.goWin} tx={tx} />
      <ActionButton className="gameplay-action--slam" skin="B3.png" title="SLAM" subtitle="Call liar for double penalty" onAction={backendActions?.finishMockWin || navigation.goWin} tx={tx} />
      <ActionButton className="gameplay-action--confirm" skin="B4.png" title="CONFIRM" subtitle="Submit your bid" onAction={backendActions?.finishMockWin || navigation.goWin} tx={tx} />
    </section>
  );
}
