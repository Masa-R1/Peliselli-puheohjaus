function VoiceToggleListeningButton({ enabled, onClick }) {
    return (
        <button
            onClick={onClick}
            style={{
                width: "auto",
                minWidth: "140px",
                padding: "0.65rem 1rem",
                borderRadius: "999px",
                border: "1px solid #4b4b4b",
                color: "#ececec",
                background: enabled ? "#2a2a2a" : "#3a1414",
            }}
        >
            {enabled ? "Disable listening" : "Enable listening"}
        </button>
    )
}

export default VoiceToggleListeningButton