import { useRef, useEffect } from "react";
import { useStateStore } from "../stores/useStateStore"
import { useConversationStore } from "../stores/useConversationStore"
import ReactMarkdown from "react-markdown";
import logo from "../assets/samk-bubble.png";
import "../styles/ellipsis-anim.css"

function Chat() {
    const { loading } = useStateStore()
    const { setLoading } = useStateStore()

    const { conversationMessages } = useConversationStore()
    const hasStreamingBotMessage = conversationMessages.some((msg) => msg.sender === "bot" && msg.streaming)

    const chatboxRef = useRef(null);

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
                    className={`message ${msg.sender}`}
                >
                    {msg.sender === "bot" && (
                        <img
                            src={logo}
                            className="bot-chat-logo"
                            alt="logo"
                        />
                    )}

                    <span className="text-bubble">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </span>
                </div>
            ))}

            {loading && !hasStreamingBotMessage && (
                <div className="message bot typing">
                    <img
                        src={logo}
                        className="bot-chat-logo"
                        alt="logo"
                    />

                    <span className="text-bubble typing-text">
                        Thinking
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                        <span className="dot">.</span>
                    </span>
                </div>
            )}
        </div>
    )
}

export default Chat