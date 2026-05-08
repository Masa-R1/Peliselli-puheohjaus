import { useRef, useEffect } from "react";
import { useStateStore } from "../stores/useStateStore"
import { useConversationStore } from "../stores/useConversationStore"
import logo from "../assets/samk-bubble.png";
import "../ellipsis-anim.css"

function Chat() {
    const { loading } = useStateStore()
    const { setLoading } = useStateStore()

    const { conversationMessages } = useConversationStore()

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
                    {msg.text}
                </span>
                </div>
            ))}

            {loading && (
                <div className="message bot typing">
                    <img
                        src={logo}
                        className="bot-chat-logo"
                        alt="logo"
                    />

                    <span className="text-bubble typing-text">
                    Typing
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