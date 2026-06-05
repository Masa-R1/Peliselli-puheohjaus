import ReactMarkdown from "react-markdown"
import { useTranslation } from "react-i18next"

function VoiceStatusDetails({
    wakePhrase,
    statusText,
    awaitingCommand,
    lastHeard,
    lastReply,
    errorText,
}) {
    const { t } = useTranslation()

    return (
        <>
            <p style={{ margin: 0, opacity: 0.85, textAlign: "center" }}>
                {t("voice.labels.wakePhrase")}: "{wakePhrase}"
            </p>
            <p style={{ margin: 0, opacity: 0.9, textAlign: "center" }}>{t(statusText)}</p>

            {awaitingCommand && (
                <p style={{ margin: 0, color: "#7ce7ff", textAlign: "center" }}>
                    {t("voice.labels.wakePhraseHeard")}
                </p>
            )}

            {lastHeard && (
                <p style={{ margin: 0, maxWidth: "720px", textAlign: "center" }}>
                    {t("voice.labels.heard")}: {lastHeard}
                </p>
            )}

            {lastReply && (
                <div style={{ margin: 0, maxWidth: "720px", textAlign: "center" }}>
                    {t("voice.labels.reply")}: <ReactMarkdown>{lastReply}</ReactMarkdown>
                </div>
            )}

            {errorText && (
                <p style={{ margin: 0, color: "#ff8b8b", textAlign: "center" }}>
                    {errorText}
                </p>
            )}
        </>
    )
}

export default VoiceStatusDetails