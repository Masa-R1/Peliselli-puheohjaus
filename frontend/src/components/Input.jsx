import { useState, useId, useRef } from "react"
import { useStateStore } from "../stores/useStateStore"
import { useMessageStore } from "../stores/useMessageStore"
import { useConversationStore } from "../stores/useConversationStore"
import { useModelStore } from "../stores/useModelStore"

function Input() {
    const { loading } = useStateStore()
    const { setLoading } = useStateStore()

    const { listening } = useStateStore()
    const { setListening } = useStateStore()

    const { voiceEnabled } = useStateStore()
    const { setVoiceEnabled } = useStateStore()

    const [inputMessage, setInputMessage] = useState("")

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

            recognitionRef.current.lang = "fi-FI"
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

        const utterance = new SpeechSynthesisUtterance(text)

        utterance.lang = "en-US"
        utterance.rate = 1
        utterance.pitch = 1
        utterance.volume = 1

        window.speechSynthesis.speak(utterance)
    }

    return (
        <div className="input-area">
            {/* Input */}
            <button
                id="micBtn"
                className={
                    listening ? "listening" : ""
                }
                onClick={startListening}
                disabled={loading}
            >
                <i className="fa-solid fa-microphone"></i>
            </button>
            
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
            
            {/* Voice */}
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