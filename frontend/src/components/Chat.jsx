import { useRef, useEffect } from "react";
import { useStateStore } from "../stores/useStateStore"
import { useConversationStore } from "../stores/useConversationStore"
import ReactMarkdown from "react-markdown";
import logo from "../assets/samk-bubble.png";
import "../styles/ellipsis-anim.css"
import { useTranslation } from "react-i18next"

function Chat() {
    const { loading, setLoading } = useStateStore()

    const { conversationMessages } = useConversationStore()

    const chatboxRef = useRef(null);
    const { t } = useTranslation()

    // Auto-scroll
    useEffect(() => {
        if (chatboxRef.current) {
            chatboxRef.current.scrollTop = chatboxRef.current.scrollHeight;
        }
    }, [conversationMessages, loading]);

    return (
        <div
            className="chatbox"
            ref={chatboxRef}
        >
            {conversationMessages.map((msg, index) => (
                <div
                    key={index}
                    className={`message ${msg.sender === "bot_update" ? "bot" : msg.sender}`}
                >
                    {msg.sender === "bot" && (
                        <img
                            src={logo}
                            className="bot-chat-logo"
                            alt={t("chat.logoAlt")}
                        />
                    )}

                    <span className={`text-bubble${loading ? " typing-text" : ""}`}>
                        {(!msg.text || msg.text.length === 0) && loading ? 
                        <>
                            {t("chat.thinking")}
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                            <span className="dot">.</span>
                        </> : <ReactMarkdown>{msg.text && msg.text.length > 0 ? msg.text : t("chat.error")}</ReactMarkdown>
                        }
                    </span>
                </div>
            ))}
        </div>
    )
}

export default Chat