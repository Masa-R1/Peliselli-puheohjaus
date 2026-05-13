import { useState, useId, useRef } from "react"
import { useStateStore } from "../stores/useStateStore"
import { useMessageStore } from "../stores/useMessageStore"
import { useConversationStore } from "../stores/useConversationStore"
import { useModelStore } from "../stores/useModelStore"
import VoiceInput from "./VoiceInput"
import ReactMarkdown from "react-markdown"
import { getSpeechText } from "../utils/speechText"
import "../app.css"
import { useTranslation } from "react-i18next";

function Input() {
    const { loading, setLoading, voiceEnabled, setVoiceEnabled, setIsSpeaking } = useStateStore()

    const { inputMessage, setInputMessage, messages, addMessages } = useMessageStore()

    const { conversationMessages, addConversationMessages } = useConversationStore()

    const { selectedModel } = useModelStore()

    const { i18n } = useTranslation();

    const chatboxId = useId()

    function handleKeyDown(e) {
        if (e.key === "Enter") {
            sendMessage()
        }
    }

    function toggleVoice() {
        setVoiceEnabled((prev) => {
            if (prev) {
                window.speechSynthesis.cancel()
            }
            return !prev
        })
    }

    async function sendMessage() {
        const message = inputMessage.trim()

        const new_message = {role:"user", content:message}
        
        addMessages(new_message)

        if (!message || loading) return

        addConversationMessages(message, "user")

        setInputMessage("")

        setLoading(true)

        const promptInfo = {
            model: selectedModel,
            prompt: message,
            history: messages
        }

        console.log(promptInfo)

        let reply = ""

        fetch("http://localhost:8000/chat", {
            method: "POST",
            headers: {
                "Content-Type": "Application/JSON",
            },
            body: JSON.stringify(promptInfo),
        })
        .then((respose) => respose.json())
        .then(data => {
            reply = data.content
            addMessages(data)
        })
        .then((newPrompt) => {
            addConversationMessages(reply, "bot")
            speak(reply)
            setLoading(false)
        })
        .catch((error) => {
            console.log(error)
    
        })
    }

    function speak(text) {
        if (!voiceEnabled) return

        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(getSpeechText(text))

        utterance.lang = i18n.language;
        utterance.rate = 1
        utterance.pitch = 1
        utterance.volume = 1

        utterance.onstart = () => {
            setIsSpeaking(true)
        }

        utterance.onend = () => {
            setIsSpeaking(false)
        }

        utterance.onerror = () => {
            setIsSpeaking(false)
        }

        window.speechSynthesis.speak(utterance)
    }

    return (
        <div className="input-area">
            {/* Voice Input */}
            <VoiceInput />
            
            {/* Text input */}

            <input
                type="text"
                id={chatboxId}
                value={inputMessage}
                placeholder="Message SAMK Bot..."
                onChange={(e) =>
                    setInputMessage(e.target.value)
                }
                onKeyDown={handleKeyDown}
                disabled={loading}
            />
            
            {/* Voice Toggle */}
            <button onClick={toggleVoice}>
            <i
                className={
                    voiceEnabled
                        ? "fa-solid fa-volume-high"
                        : "fa-solid fa-volume-xmark"
                }
            />
            </button>
            
            {/* Send */}
            <button
                onClick={sendMessage}
                disabled={loading}
                >
                <i className="fa-solid fa-arrow-up"></i>
            </button>
        </div>
    )
}

export default Input
