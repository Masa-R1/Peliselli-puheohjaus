import Persona from "./Persona.jsx";

function VoiceAvatar({ loading, isActive, isSpeaking }) {
  const state = loading
    ? "thinking"
    : isSpeaking
      ? "speaking"
      : isActive
        ? "listening"
        : "idle";

  return (
    <div style={{ width: "300px", height: "300px" }}>
      <Persona state={state} />
    </div>
  );
}

export default VoiceAvatar;
