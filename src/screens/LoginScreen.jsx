const asset = '/assets/liars-dice/login/';

const sparkles = Array.from({ length: 18 }, (_, index) => index + 1);

export default function LoginScreen({ navigation }) {
  return (
    <section className="screen login-screen" aria-label="Login Screen">
      <div className="login-vfx login-vfx--vignette" aria-hidden="true" />
      <div className="login-vfx login-vfx--chandelierGlow" aria-hidden="true" />
      <div className="login-vfx login-vfx--logoShine" aria-hidden="true" />
      <div className="login-vfx login-vfx--panelGlow" aria-hidden="true" />
      <div className="login-vfx login-vfx--characterGlow" aria-hidden="true" />
      <div className="login-vfx login-vfx--cupSpark" aria-hidden="true" />
      <div className="login-sparkles" aria-hidden="true">
        {sparkles.map((sparkle) => (
          <span className={`login-sparkle login-sparkle--${sparkle}`} key={sparkle} />
        ))}
      </div>

      <img className="ld-logo login-logo" src={`${asset}LOGO.png`} alt="Liar's Dice" draggable="false" />
      <img className="login-panel" src={`${asset}PANAL.png`} alt="" draggable="false" />
      <img className="login-character" src={`${asset}CR1.png`} alt="Cat character" draggable="false" />

      <h1 className="login-subtitle">Bluff, Bid, and Win Big</h1>

      <label className="login-field login-field--email">
        <img className="login-field__skin" src={`${asset}1.png`} alt="" draggable="false" />
        <input className="login-field__input" type="text" placeholder="EMAIL / USERNAME" />
      </label>

      <label className="login-field login-field--password">
        <img className="login-field__skin" src={`${asset}2.png`} alt="" draggable="false" />
        <input className="login-field__input" type="password" placeholder="PASSWORD" />
      </label>

      <button className="login-forgot" type="button">Forgot Password?</button>

      <button className="image-button login-button login-button--login" type="button" onClick={navigation.goLoading}>
        <img className="image-button__skin" src={`${asset}B1.png`} alt="" draggable="false" />
        <span className="image-button__text">LOG IN</span>
      </button>

      <div className="login-or" aria-hidden="true"><span></span><b>OR</b><span></span></div>

      <button className="image-button login-button login-button--guest" type="button" onClick={navigation.goLoading}>
        <img className="image-button__skin" src={`${asset}B3.png`} alt="" draggable="false" />
        <span className="image-button__text">PLAY AS GUEST</span>
      </button>

      <button className="image-button login-button login-button--back" type="button" onClick={navigation.goStarter}>
        <img className="image-button__skin" src={`${asset}B2.png`} alt="" draggable="false" />
        <span className="image-button__text login-button__back-text">BACK</span>
      </button>
    </section>
  );
}
