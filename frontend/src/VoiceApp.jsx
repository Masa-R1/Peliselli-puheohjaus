
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useStateStore } from "./stores/useStateStore"
import { useMessageStore } from "./stores/useMessageStore"
import { useConversationStore } from "./stores/useConversationStore"
import VoiceAvatar from "./components/VoiceAvatar"
import VoiceStatusDetails from "./components/VoiceStatusDetails"
import VoiceToggleListeningButton from "./components/VoiceToggleListeningButton"
import { getSpeechText } from "./utils/speechText"
import { apiUrl } from "./utils/api"

import useSound from 'use-sound'
import notifySound from "./assets/sound/278142__ricemaster__effect_notify.wav"
const WAITING = "Awaiting activation..."
const THINK_PHRASES = ["Thinking...", "Calculating...", "Pondering...", "Analyzing...", "Reflecting...", "Generating slop..."]
const FOLLOWUP_TIMEOUT_MS = 20000

function normalizeSpeechForWakePhrase(text) {
    return text
        .toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, "")
        .replace(/\s+/g, " ")
        .trim()
}

function findWakePhraseWordsInOrder(normalizedTranscript, normalizedWakePhrase) {
    const transcriptWords = normalizedTranscript.split(/\s+/)
    const phraseWords = normalizedWakePhrase.split(/\s+/)

    let transcriptIndex = 0
    let phraseIndex = 0

    while (transcriptIndex < transcriptWords.length && phraseIndex < phraseWords.length) {
        if (transcriptWords[transcriptIndex] === phraseWords[phraseIndex]) {
            phraseIndex++
        }
        transcriptIndex++
    }

    // If all phrase words were found in order
    if (phraseIndex === phraseWords.length) {
        // Return the command starting from where the last phrase word ended
        const commandWords = transcriptWords.slice(transcriptIndex)
        return commandWords.join(" ")
    }

    return null  // Wake phrase not found in order
}

export default function VoiceApp() {
    const { t, i18n } = useTranslation()
    const [playNotify] = useSound(notifySound, { volume: 0.5 })

    const { loading, voiceEnabled, setLoading, setListening, haListening, setHaListening } = useStateStore()
    const { messages, addMessages } = useMessageStore()
    const { addConversationMessages } = useConversationStore()

    const [wakeListeningEnabled, setWakeListeningEnabled] = useState(true)
    const [awaitingCommand, setAwaitingCommand] = useState(false)
    const [statusText, setStatusText] = useState(WAITING)
    const [lastHeard, setLastHeard] = useState("")
    const [lastReply, setLastReply] = useState("")
    const [errorText, setErrorText] = useState("")
    const [thinkText, setThinkText] = useState("Assistant")
    const normalizedWakePhrase = useMemo(
        () => normalizeSpeechForWakePhrase(t("wakePhrase")),
        [t]
    )

    const recognitionRef = useRef(null)
    const restartTimeoutRef = useRef(null)
    const thinkIntervalRef = useRef(null)
    const thinkPauseRef = useRef(null)
    const listeningEnabledRef = useRef(true)
    const loadingRef = useRef(false)
    const speakingRef = useRef(false)
    const messagesRef = useRef(messages)
    const awaitingCommandRef = useRef(false)
    const followUpModeRef = useRef(false)
    const followUpTimeoutRef = useRef(null)
    const thinkPhraseRef = useRef("")
    const thinkIndexRef = useRef(0)

    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    useEffect(() => {
        listeningEnabledRef.current = haListening
        if (!(haListening && wakeListeningEnabled)) {
            setStatusText("Wake listener disabled")
            setAwaitingCommand(false)
            awaitingCommandRef.current = false
            stopRecognition()
            return
        }

        if (loadingRef.current || speakingRef.current) return
        setStatusText(WAITING)
        startRecognition()
    }, [haListening, wakeListeningEnabled])

    useEffect(() => {
        loadingRef.current = loading
    }, [loading])

    useEffect(() => {
        if (!loading) {
            clearInterval(thinkIntervalRef.current)
            clearTimeout(thinkPauseRef.current)
            thinkPhraseRef.current = ""
            thinkIndexRef.current = 0
            setThinkText("Assistant")
            return
        }

        function pickNextThinkPhrase() {
            const options = THINK_PHRASES.filter((phrase) => phrase !== thinkPhraseRef.current)
            const pool = options.length > 0 ? options : THINK_PHRASES
            return pool[Math.floor(Math.random() * pool.length)]
        }

        function buildThinkPhrase() {
            clearInterval(thinkIntervalRef.current)
            clearTimeout(thinkPauseRef.current)

            const phrase = pickNextThinkPhrase()
            thinkPhraseRef.current = phrase
            thinkIndexRef.current = 0
            setThinkText("")

            thinkIntervalRef.current = setInterval(() => {
                thinkIndexRef.current += 1
                setThinkText(phrase.slice(0, thinkIndexRef.current))

                if (thinkIndexRef.current >= phrase.length) {
                    clearInterval(thinkIntervalRef.current)
                    thinkPauseRef.current = setTimeout(() => {
                        if (loadingRef.current) {
                            buildThinkPhrase()
                        }
                    }, Math.floor(5 + (Math.random() * 10)) * 1000) /*5-15 seconds*/
                }
            }, 100)
        }

        buildThinkPhrase()

        return () => {
            clearInterval(thinkIntervalRef.current)
            clearTimeout(thinkPauseRef.current)
        }
    }, [loading])

    const clearErrorTimeoutRef = useRef(null);
    
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognition) {
            setErrorText("Speech recognition is not supported in this browser.")
            setWakeListeningEnabled(false)
            setListening(false)
            return
        }

        const recognition = new SpeechRecognition()
        recognition.lang = i18n.language
        recognition.continuous = true
        recognition.interimResults = false

        recognition.onstart = () => {
            setListening(true)
            if (listeningEnabledRef.current) {
                setStatusText("Awaiting activation...")
            }
        }

        recognition.onend = () => {
            setListening(false)
            if (!listeningEnabledRef.current || loadingRef.current || speakingRef.current) return

            clearTimeout(restartTimeoutRef.current)
            restartTimeoutRef.current = setTimeout(() => {
                startRecognition()
            }, 250)
        }

        recognition.onerror = (event) => {
            setListening(false)
            setErrorText(`Recognition error: ${event.error}`)

            if (clearErrorTimeoutRef.current != null) {
                clearTimeout(clearErrorTimeoutRef.current);
            }

            clearErrorTimeoutRef.current = setTimeout(() => {
                setErrorText("");
                setListening(true);
            }, 3000);

            if (event.error === "not-allowed" || event.error === "service-not-allowed") {
                setWakeListeningEnabled(false)
            }
        }
        
        recognition.onresult = async (event) => {
            if (speakingRef.current) return

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const result = event.results[i]
                if (!result.isFinal) continue

                const transcript = result[0].transcript.trim()
                if (!transcript) continue

                setLastHeard(transcript)
                const normalized = normalizeSpeechForWakePhrase(transcript)

                // Follow-up mode: treat any speech as immediate command
                if (followUpModeRef.current) {
                    setStatusText("Sending follow-up command...")
                    stopRecognition()
                    await sendToBackend(transcript)
                    continue
                }

                if (awaitingCommandRef.current) {
                    awaitingCommandRef.current = false
                    setAwaitingCommand(false)
                    setStatusText("Awaiting response...")
                    stopRecognition()
                    await sendToBackend(transcript)
                    continue
                }

                const command = findWakePhraseWordsInOrder(normalized, normalizedWakePhrase)
                if (command === null) continue

                playNotify();

                if (command) {
                    setStatusText("Activation detected, sending command")
                    stopRecognition()
                    await sendToBackend(command)
                    continue
                }

                awaitingCommandRef.current = true
                setAwaitingCommand(true)
                setStatusText("Activation detected, say your command")
            }
        }

        recognitionRef.current = recognition
        startRecognition()

        return () => {
            clearTimeout(restartTimeoutRef.current)
            stopRecognition()
            recognitionRef.current = null
            window.speechSynthesis.cancel()
        }
    }, [])

    // Hakee kuuntelun tilan
    useEffect(() => {
        const interval = setInterval(async () => {
            try {
                const res = await fetch(apiUrl("/voice"))
                const data = await res.json()
                setHaListening(data.enabled)
                if (!data.enabled) {
                    followUpModeRef.current = false
                    if (followUpTimeoutRef.current) {
                        clearTimeout(followUpTimeoutRef.current)
                        followUpTimeoutRef.current = null
                    }
                }
            } catch (error) {
                console.log(error)
            }
        }, 2000)

        return () => {
            clearInterval(interval)
            if (followUpTimeoutRef.current) {
                clearTimeout(followUpTimeoutRef.current)
                followUpTimeoutRef.current = null
            }
        }
	})

    function stopRecognition() {
        try {
            recognitionRef.current?.stop()
        } catch {
            // Stop can throw if recognition has not started yet.
        }
    }

    function startRecognition() {
        if (!listeningEnabledRef.current || loadingRef.current || speakingRef.current) return

        try {
            recognitionRef.current?.start()
        } catch {
            // Start can throw if recognition is already running.
        }
    }

    async function sendToBackend(commandText) {
        const message = commandText.trim()
        if (!message || loadingRef.current) return

        const userMessage = { role: "user", content: message }
        addMessages(userMessage)
        addConversationMessages(message, "user")
        // stop recognition now; speak.onend will restart and enable follow-up window
        stopRecognition()
        setLoading(true)
        setStatusText("Waiting for response...")

        try {
            const promptInfo = {
                model: "gemma3:latest",
                prompt: message,
                history: messagesRef.current,
            }

            const response = await fetch(apiUrl("/chat"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(promptInfo),
            })

            const data = await response.json()
            addMessages(data)
            addConversationMessages(data.content, "bot")
            setLastReply(data.content)
            speak(data.content)
            setStatusText(WAITING)
        } catch (error) {
            console.error(error)
            setErrorText("Failed to contact backend.")
            setStatusText(WAITING)
        } finally {
            setLoading(false)
            // do not restart recognition here; `speak` will restart and manage follow-up mode
        }
    }

    function speak(text) {
        if (!voiceEnabled) return

        speakingRef.current = true
        window.speechSynthesis.cancel()

        const utterance = new SpeechSynthesisUtterance(getSpeechText(text))
        utterance.lang = i18n.language
        utterance.rate = 1
        utterance.pitch = 1
        utterance.volume = 1

        utterance.onend = () => {
            speakingRef.current = false
            if (listeningEnabledRef.current && !loadingRef.current) {
                // restart recognition and open follow-up window
                startRecognition()
                followUpModeRef.current = true
                if (followUpTimeoutRef.current) clearTimeout(followUpTimeoutRef.current)
                followUpTimeoutRef.current = setTimeout(() => {
                    followUpModeRef.current = false
                    setStatusText(WAITING)
                }, FOLLOWUP_TIMEOUT_MS)
            }
        }

        window.speechSynthesis.speak(utterance)
    }

    const circleStyle = useMemo(() => {
        const isActive = wakeListeningEnabled &&  haListening && !loading

        return {
            width: "220px",
            height: "220px",
            borderRadius: "50%",
            border: isActive ? "2px solid #7ce7ff" : "2px solid #3f3f3f",
            background: isActive
                ? "radial-gradient(circle at 25% 25%, #8bf0ff, #2496b3 52%, #155267)"
                : "radial-gradient(circle at 30% 30%, #414141, #1f1f1f)",
            boxShadow: isActive
                ? "0 0 0 8px rgba(124, 231, 255, 0.09), 0 0 42px rgba(124, 231, 255, 0.42)"
                : "none",
            animation: isActive ? "pulse 1.7s infinite" : "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#081114",
            textShadow: "0 0 0.5rem white",
            fontWeight: 700,
            fontSize: "1rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
        }
    }, [loading, haListening, wakeListeningEnabled]);

    return (
        <div
            style={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "1.25rem",
                padding: "1rem",
            }}
        >
            <h1 style={{ margin: 0, fontSize: "1.15rem" }}>Voice Assistant</h1>

            <VoiceAvatar style={circleStyle} loading={loading} thinkText={thinkText} />

            <VoiceStatusDetails
                wakePhrase={t("wakePhrase")}
                statusText={statusText}
                awaitingCommand={awaitingCommand}
                lastHeard={lastHeard}
                lastReply={lastReply}
                errorText={errorText}
            />
        </div>
    )
}