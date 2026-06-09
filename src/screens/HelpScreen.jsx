const asset = '/assets/liars-dice/help/';

export default function HelpScreen({ navigation }) {
  return (
    <section className="screen help-screen" aria-label="Learn to Play">
      <button className="help-back-button" type="button" onClick={navigation.goMainMenu}>
        <img className="help-back-button__skin" src={`${asset}B2.png`} alt="" draggable="false" />
        <span className="help-back-button__text">BACK</span>
      </button>
    </section>
  );
}
