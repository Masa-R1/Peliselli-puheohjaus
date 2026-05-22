import { useRef, useEffect } from "react";
import { useStateStore } from "../stores/useStateStore"
import { useConversationStore } from "../stores/useConversationStore"
import ReactMarkdown from "react-markdown";
import logo from "../assets/samk-bubble.png";
import "../ellipsis-anim.css"

function Chat() {
    const { loading } = useStateStore()
    const { setLoading } = useStateStore()

    const { conversationMessages } = useConversationStore()
    const hasStreamingBotMessage = conversationMessages.some((msg) => msg.sender === "bot" && msg.streaming)

    const chatboxRef = useRef(null);

    // Mitä!?
    // const checkMessage = (aiAnswer) => {
    //     const settingKeywords = ["changing", "switching", "making"]

    //     const colorKeywords = ["red", "green", "blue", "yellow", "purple"]

    //     aiAnswer = aiAnswer.toLowerCase().split(" ")

    //     const overlap = settingKeywords.some(item => aiAnswer.includes(item))

    //     if (overlap) {
    //         const findColor = colorKeywords.find(value => aiAnswer.includes(value))

    //         if (colorMatch !== undefined) {
    //             switch (colorMatch) {
    //                 case "red":
    //                     console.log(colorMatch)
    //                     break;
    //                 case "green":
    //                     console.log(colorMatch)
    //                     break;
    //                 default:
    //                     break;
    //             }
    //         }
    //     }
    // }

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