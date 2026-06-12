const asset = '/assets/liars-dice/help/';

export default function HelpScreen({ navigation, i18n }) {
  const tx = i18n?.tx || ((value) => value);
  return (
    <section className="screen help-screen" aria-label={tx('Learn the rules')}>
      <button className="help-back-button" type="button" onClick={navigation.goMainMenu}>
        <img className="help-back-button__skin" src={`${asset}B2.png`} alt="" draggable="false" />
        <span className="help-back-button__text">{tx('BACK')}</span>
      </button>
    </section>
  );
}
