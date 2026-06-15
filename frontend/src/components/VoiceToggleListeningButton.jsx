import { useTranslation } from "react-i18next"

function VoiceToggleListeningButton({ enabled, onClick }) {
    const { t } = useTranslation()

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
            {enabled ? t("voice.buttons.disableListening") : t("voice.buttons.enableListening")}
        </button>
    )
}

export default VoiceToggleListeningButton