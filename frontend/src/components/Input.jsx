import { useState, useId, useRef } from "react"
import { useStateStore } from "../stores/useStateStore"
import { useMessageStore } from "../stores/useMessageStore"
import { useConversationStore } from "../stores/useConversationStore"
import { useModelStore } from "../stores/useModelStore"
import VoiceInput from "./VoiceInput"
import ReactMarkdown from "react-markdown"
import { webSpeechTextToSpeech } from "../utils/textToSpeech"
import { apiUrl } from "../utils/api"
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
                webSpeechTextToSpeech.cancel()
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

        fetch(apiUrl("/chat"), {
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

        webSpeechTextToSpeech.cancel()
        webSpeechTextToSpeech.speak(text, {
            language: i18n.language,
            onStart: () => {
                setIsSpeaking(true)
            },
            onEnd: () => {
                setIsSpeaking(false)
            },
            onError: () => {
                setIsSpeaking(false)
            },
        })
    }

    return (
        <div className="input-area">
            {/* Voice Input */}
            <VoiceInput language={i18n.language} />
            
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
