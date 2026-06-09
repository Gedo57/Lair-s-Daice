export default function PlaceholderScreen({ name, navigation }) {
  return (
    <section className="screen placeholder-screen">
      <div className="placeholder-card">
        <h1>{name.toUpperCase()}</h1>
        <p>This screen is reserved for the next phases.</p>
        <button type="button" onClick={navigation.goStarter}>Back to Starter</button>
      </div>
    </section>
  );
}
