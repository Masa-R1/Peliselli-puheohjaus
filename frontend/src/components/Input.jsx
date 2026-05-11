import { useState, useId, useRef } from "react"
import { useStateStore } from "../stores/useStateStore"
import { useMessageStore } from "../stores/useMessageStore"
import { useConversationStore } from "../stores/useConversationStore"
import { useModelStore } from "../stores/useModelStore"
import VoiceInput from "./VoiceInput"

function Input({ language }) {
    const { loading } = useStateStore()
    const { setLoading } = useStateStore()

    const { voiceEnabled } = useStateStore()
    const { setVoiceEnabled } = useStateStore()

    const { inputMessage } = useMessageStore()
    const { setInputMessage } = useMessageStore()
    const { setIsSpeaking } = useStateStore()

    const { messages } = useMessageStore()
    const { addMessages } = useMessageStore()

    const { conversationMessages } = useConversationStore()
    const { addConversationMessages } = useConversationStore()

    const { selectedModel } = useModelStore()

    const chatboxId = useId()

    const recognitionRef = useRef(null)

    function startListening() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported.")
            return
        }

        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition()

            recognitionRef.current.lang = language
            recognitionRef.current.continuous = false
            recognitionRef.current.interimResults =false

            recognitionRef.current.onstart = () => {
                setListening(true)
            }

            recognitionRef.current.onend = () => {
                setListening(false)
            }

            recognitionRef.current.onerror = () => {
                setListening(false)
            }

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript

                setInputMessage(transcript)
            }
        }

        recognitionRef.current.start()
    }

    function handleKeyDown(e) {
        if (e.key === "Enter") {
            sendMessage()
        }

        console.log(language)
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

        console.log(selectedModel)

        const promptInfo = {
            model: selectedModel,
            prompt: message,
            history: messages
        }

        let fullReply = ""

        try {
            const response = await fetch("http://localhost:8000/chat/stream", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(promptInfo),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder()

            // Add initial empty bot message to the conversation
            addConversationMessages("", "bot")

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value, { stream: true })
                
                // Parse SSE format: "data: content\n\n"
                const lines = chunk.split('\n')
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const text = line.slice(6) // Remove "data: " prefix
                        if (text) {
                            fullReply += text
                            // Update the last message with streaming content
                            addConversationMessages(fullReply, "bot_update")
                        }
                    }
                }
            }

            // Save the complete message to history
            const botMessage = { role: "assistant", content: fullReply }
            addMessages(botMessage)
            
            speak(fullReply)
            setLoading(false)
        } catch (error) {
            console.error("Error:", error)
            addConversationMessages("Error: Could not get response from server", "bot")
            setLoading(false)
        }
    }

    function speak(text) {
        if (!voiceEnabled) return

        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(text)

        utterance.lang = language
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