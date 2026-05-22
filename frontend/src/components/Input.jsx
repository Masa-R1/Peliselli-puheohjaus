import { useState, useId, useRef } from "react"
import { useStateStore } from "../stores/useStateStore"
import { useMessageStore } from "../stores/useMessageStore"
import { useConversationStore } from "../stores/useConversationStore"
import { useModelStore } from "../stores/useModelStore"
import VoiceInput from "./VoiceInput"
import ReactMarkdown from "react-markdown"
import { webSpeechTextToSpeech } from "../utils/textToSpeech"
import { streamChat } from "../utils/api"
import "../app.css"
import { useTranslation } from "react-i18next";

function Input() {
    const { loading, setLoading, voiceEnabled, setVoiceEnabled, setIsSpeaking } = useStateStore()

    const { inputMessage, setInputMessage, messages, addMessages } = useMessageStore()

    const { addConversationMessages, startStreamingBotMessage, appendToStreamingBotMessage, finalizeStreamingBotMessage } = useConversationStore()

    const { selectedModel } = useModelStore()

    const { i18n } = useTranslation();

    const chatboxId = useId()
    const speechSessionRef = useRef(null)

    function handleKeyDown(e) {
        if (e.key === "Enter") {
            sendMessage()
        }
    }

    function toggleVoice() {
        setVoiceEnabled((prev) => {
            if (prev) {
                speechSessionRef.current?.cancel()
                webSpeechTextToSpeech.cancel()
            }
            return !prev
        })
    }

    async function sendMessage() {
        const message = inputMessage.trim()

        if (!message || loading) return

        const new_message = {role:"user", content:message}
        
        addMessages(new_message)

        addConversationMessages(message, "user")

        setInputMessage("")

        setLoading(true)

        const promptInfo = {
            model: selectedModel,
            prompt: message,
            history: messages
        }

        let streamedReply = ""

        try {
            speechSessionRef.current?.cancel()
            speechSessionRef.current = voiceEnabled
                ? webSpeechTextToSpeech.createSentenceStream({
                    language: i18n.language,
                    onStart: () => {
                        setIsSpeaking(true)
                    },
                    onEnd: () => {
                        setIsSpeaking(false)
                    },
                    onError: () => {},
                })
                : null

            startStreamingBotMessage()

            const data = await streamChat(promptInfo, {
                onToken: (token) => {
                    streamedReply += token
                    appendToStreamingBotMessage(token)
                    speechSessionRef.current?.pushText(token)
                },
            })

            speechSessionRef.current?.complete()

            const reply = data?.content || streamedReply
            const assistantMessage = { role: "assistant", content: reply }
            addMessages(assistantMessage)
            finalizeStreamingBotMessage(reply)
        } catch (error) {
                console.error("Chat request failed:", error)
            finalizeStreamingBotMessage()
                setLoading(false)
        } finally {
            setLoading(false)
        }
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
