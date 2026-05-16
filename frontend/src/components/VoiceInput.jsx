import { useRef, useEffect } from "react"
import { useMessageStore } from "../stores/useMessageStore"
import { useStateStore } from "../stores/useStateStore"

function VoiceInput({ language }) {
    const { loading, listening, setListening } = useStateStore()

    const { setInputMessage } = useMessageStore()

    const recognitionRef = useRef(null)

    useEffect(() => {
        // If language changes, stop and clear existing recognition so
        // a new instance will be created with the updated `lang`.
        if (recognitionRef.current) {
            try {
                recognitionRef.current.onstart = null
                recognitionRef.current.onend = null
                recognitionRef.current.onerror = null
                recognitionRef.current.onresult = null
                recognitionRef.current.stop()
            } catch (e) {}
            recognitionRef.current = null
            setListening(false)
        }
    }, [language, setListening])

    function startListening() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognition) {
            alert("Speech recognition is not supported.")
            return
        }

        if (!recognitionRef.current) {
            recognitionRef.current = new SpeechRecognition()

            recognitionRef.current.lang = language || navigator.language
            recognitionRef.current.continuous = false
            recognitionRef.current.interimResults = false

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

        try {
            recognitionRef.current.start()
        } catch (e) {
            // ignore start errors (already started)
        }
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