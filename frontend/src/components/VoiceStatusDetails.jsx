import ReactMarkdown from "react-markdown"

function VoiceStatusDetails({
    wakePhrase,
    statusText,
    awaitingCommand,
    lastHeard,
    lastReply,
    errorText,
}) {
    return (
        <>
            <p style={{ margin: 0, opacity: 0.85, textAlign: "center" }}>
                Wake phrase: "{wakePhrase}"
            </p>
            <p style={{ margin: 0, opacity: 0.9, textAlign: "center" }}>{statusText}</p>

            {awaitingCommand && (
                <p style={{ margin: 0, color: "#7ce7ff", textAlign: "center" }}>
                    Wake phrase heard. Speak your command now.
                </p>
            )}

            {lastHeard && (
                <p style={{ margin: 0, maxWidth: "720px", textAlign: "center" }}>
                    Heard: {lastHeard}
                </p>
            )}

            {lastReply && (
                <div style={{ margin: 0, maxWidth: "720px", textAlign: "center" }}>
                    Reply: <ReactMarkdown>{lastReply}</ReactMarkdown>
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