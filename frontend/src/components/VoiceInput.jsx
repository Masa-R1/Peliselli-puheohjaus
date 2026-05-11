import { useRef } from "react"
import { useMessageStore } from "../stores/useMessageStore"
import { useStateStore } from "../stores/useStateStore"

function VoiceInput() {
    const { loading } = useStateStore()
    const { listening } = useStateStore()
    const { setListening } = useStateStore()

    const { setInputMessage } = useMessageStore()

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
    
    return (
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
    )
}

export default VoiceInput