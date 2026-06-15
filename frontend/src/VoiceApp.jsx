import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useStateStore } from "./stores/useStateStore"
import { useMessageStore } from "./stores/useMessageStore"
import { useConversationStore } from "./stores/useConversationStore"
import { useModelStore } from "./stores/useModelStore"
import VoiceAvatar from "./components/VoiceAvatar"
import VoiceStatusDetails from "./components/VoiceStatusDetails"
import ModelSelect from "./components/ModelSelect"
import UISelector from "./components/UISelector"
import { webSpeechTextToSpeech } from "./utils/textToSpeech"
import { streamChat, HA_ACCESS_TOKEN, HA_WS_API_URL, HA_URL, LISTENING_ENTITY_ID, LANGUAGE_ENTITY_ID } from "./utils/api"
import { normalizeFrontendLanguage } from "./utils/frontendLanguage"

import useSound from 'use-sound'
import notifySound from "./assets/sound/278142__ricemaster__effect_notify.wav"
import LanguageSelect from "./components/LanguageSelector"

const WAITING_STATUS_KEY = "voice.status.waiting"
const WAITING_2_STATUS_KEY = 'voice.status.waitingForWakePhrase'
const FOLLOWUP_TIMEOUT_MS = 20000

function normalizeSpeechForWakePhrase(text) {
    return text
        .toLowerCase()
        .replace(/[\p{P}\p{S}]/gu, "")
        .replace(/\s+/g, " ")
        .trim()
}

function findWordsInOrder(normalizedTranscript, normalizedWakePhrase) {
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

    const { 
        loading, 
        voiceEnabled, 
        setLoading, 
        setListening, 
        haListening, 
        setHaListening 
    } = useStateStore()
    const { 
        messages, 
        addMessages, 
        loadSystemMessage 
    } = useMessageStore()
    const { 
        addConversationMessages, 
        startStreamingBotMessage, 
        appendToStreamingBotMessage, 
        finalizeStreamingBotMessage 
    } = useConversationStore()
    const { selectedModel, modelLoading } = useModelStore()

    const [wakeListeningEnabled, setWakeListeningEnabled] = useState(true)
    const [awaitingCommand, setAwaitingCommand] = useState(false)
    const [statusKey, setStatusKey] = useState(WAITING_2_STATUS_KEY)
    const [lastHeard, setLastHeard] = useState("")
    const [lastReply, setLastReply] = useState("")
    const [errorText, setErrorText] = useState("")
    const [thinkText, setThinkText] = useState(t("common.assistant"))
    const normalizedWakePhrase = useMemo(
        () => normalizeSpeechForWakePhrase(t("wakePhrase")),
        [t]
    )
    const thinkPhrases = useMemo(() => {
        const phrases = t("voice.thinkPhrases", { returnObjects: true })
        return Array.isArray(phrases) && phrases.length > 0 ? phrases : [t("chat.thinking")]
    }, [t])

    //#region Refs
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
    const speechSessionRef = useRef(null)
    const wsRef = useRef(null)
    const currentLanguageRef = useRef(i18n.resolvedLanguage || i18n.language)
    //#endregion

    useEffect(() => {
        messagesRef.current = messages
    }, [messages])

    useEffect(() => {
        currentLanguageRef.current = i18n.resolvedLanguage || i18n.language
    }, [i18n.language, i18n.resolvedLanguage])

    useEffect(() => {
        const active = !modelLoading && haListening && wakeListeningEnabled

        listeningEnabledRef.current = active

        if (!active) {
            setStatusKey("voice.status.wakeListenerDisabled")
            setAwaitingCommand(false)
            awaitingCommandRef.current = false
            stopRecognition()
            return
        }

        if (loadingRef.current || speakingRef.current) return

        setStatusKey(WAITING_STATUS_KEY)
        startRecognition()
    }, [haListening, wakeListeningEnabled, modelLoading])

    const checkAOTL = (text) => {
        if (typeof(text) === 'string' && text === 'all of the lights' && Math.floor(Math.random() * 100) < 1) {
            //window.open("https://www.youtube.com/watch?v=yqUgHHlVtZI", "_blank")
            return "Kanye West - All of the Lights"
        }
        return null
    }

    useEffect(() => {
        loadingRef.current = loading || modelLoading
    }, [loading, modelLoading])

    useEffect(() => {
        if (!loading) {
            clearInterval(thinkIntervalRef.current)
            clearTimeout(thinkPauseRef.current)
            thinkPhraseRef.current = ""
            thinkIndexRef.current = 0
            setThinkText(t("common.assistant"))
            return
        }

        function pickNextThinkPhrase() {
            const options = thinkPhrases.filter((phrase) => phrase !== thinkPhraseRef.current)
            const pool = options.length > 0 ? options : thinkPhrases
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
    }, [loading, thinkPhrases, t])

    const clearErrorTimeoutRef = useRef(null);
    
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

        if (!SpeechRecognition) {
            setErrorText(t("common.speechRecognitionUnsupported"))
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
                setStatusKey(WAITING_STATUS_KEY)
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
            setErrorText(t("voice.errors.recognitionError", { error: event.error }))

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
                    setStatusKey("voice.status.sendingFollowUp")
                    stopRecognition()
                    await sendToBackend(checkAOTL(normalized) ?? transcript)

                    continue
                }

                if (awaitingCommandRef.current) {
                    awaitingCommandRef.current = false
                    setAwaitingCommand(false)
                    setStatusKey("voice.status.waitingForResponse")
                    stopRecognition()
                    await sendToBackend(checkAOTL(normalized) ?? transcript)
                    continue
                }

                const command = findWordsInOrder(normalized, normalizedWakePhrase)
                if (command === null) continue

                playNotify();

                if (command) {
                    setStatusKey("voice.status.activationDetectedSending")
                    stopRecognition()
                    await sendToBackend(checkAOTL(command) ?? command)
                    continue
                }

                awaitingCommandRef.current = true
                setAwaitingCommand(true)
                setStatusKey("voice.status.activationDetectedSpeak")
            }
        }

        recognitionRef.current = recognition
        startRecognition()

        return () => {
            clearTimeout(restartTimeoutRef.current)
            stopRecognition()
            speechSessionRef.current?.cancel()
            recognitionRef.current = null
            window.speechSynthesis.cancel()
        }
    }, [selectedModel, i18n.language])

    // #region Kuuntelun tila
    function checkENVvariables() {
        if (HA_WS_API_URL === undefined || HA_ACCESS_TOKEN === undefined || HA_URL === undefined) {
            console.log("Home Assistant address not found, check .env")
            
            // devaamista varten true, että toimii ilman home assistanttia
            setHaListening(true)
            return false
        }
        return true
    }
    
    useEffect(() => {
        if (!checkENVvariables()) return

        function checkEntityState(state) {
            if (state == "on") return true
            return false
        }
        
        const wsConnectTimeout = 10000

        let ws
        let isMounted = true

        function applyFrontendLanguage(language) {
            const nextLanguage = normalizeFrontendLanguage(language)

            if (nextLanguage && nextLanguage !== currentLanguageRef.current) {
                currentLanguageRef.current = nextLanguage
                void i18n.changeLanguage(nextLanguage)
            }
        }

        function wsConnect() {
            ws = new WebSocket(HA_WS_API_URL)

            wsRef.current = ws

            const llatoken = HA_ACCESS_TOKEN

            ws.onmessage = (event) => {
                const msg = JSON.parse(event.data)

                if (msg.type === "auth_required") {
                    ws.send(JSON.stringify({
                        type: "auth",
                        access_token: llatoken,
                    }))
                }

                if (msg.type === "auth_ok") {
                    ws.send(JSON.stringify({
                        id: 1,
                        type: "subscribe_trigger",
                        trigger: {
                            platform: "state",
                            entity_id: LISTENING_ENTITY_ID,
                        },
                    }))

                    ws.send(JSON.stringify({
                        id: 2,
                        type: "get_states",
                    }))

                    if (LANGUAGE_ENTITY_ID) {
                        ws.send(JSON.stringify({
                            id: 3,
                            type: "subscribe_trigger",
                            trigger: {
                                platform: "state",
                                entity_id: LANGUAGE_ENTITY_ID,
                            },
                        }))
                    }
                }

                if (msg.id === 2) {
                    const entity = msg.result.find(
                        (e) => e.entity_id === LISTENING_ENTITY_ID
                    )

                    const initialState = entity?.state

                    setHaListening(checkEntityState(initialState))

                    if (LANGUAGE_ENTITY_ID) {
                        const languageEntity = msg.result.find(
                            (e) => e.entity_id === LANGUAGE_ENTITY_ID
                        )

                        applyFrontendLanguage(languageEntity?.state)
                    }
                }

                if (msg.type === "event" && msg.id === 1) {
                    const trigger = msg.event.variables.trigger
                    const newState = trigger.to_state?.state

                    setHaListening(checkEntityState(newState))
                }

                if (msg.type === "event" && msg.id === 3) {
                    const trigger = msg.event.variables.trigger
                    const newState = trigger.to_state?.state

                    applyFrontendLanguage(newState)
                }
            }

            ws.onclose = () => {
                if (!isMounted) return
                console.log("Connection lost, retrying...")
                setTimeout(wsConnect, wsConnectTimeout)
            }

            ws.onerror = (err) => {
                console.error("WS error:", err)
                setHaListening(false)
            }
        }

        wsConnect()

        return () => {
            isMounted = false
            ws?.close()
        }
    }, [])
    // #endregion

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

    function clearFollowUpTimeout() {
        if (followUpTimeoutRef.current) {
            clearTimeout(followUpTimeoutRef.current)
            followUpTimeoutRef.current = null
        }
    }

    async function sendToBackend(commandText) {
        const message = commandText.trim()
        if (!message || loadingRef.current) return

        const userMessage = { role: "user", content: message }
        addMessages(userMessage)
        addConversationMessages(message, "user")
        followUpModeRef.current = false
        clearFollowUpTimeout()
        // stop recognition now; speak.onend will restart and enable follow-up window
        stopRecognition()
        setLoading(true)
        setStatusKey("voice.status.waitingForResponse")

        try {
            speechSessionRef.current?.cancel()
            speechSessionRef.current = voiceEnabled
                ? webSpeechTextToSpeech.createSentenceStream({
                    language: i18n.language,
                    onStart: () => {
                        speakingRef.current = true
                    },
                    onEnd: () => {
                        speakingRef.current = false
                        if (listeningEnabledRef.current && !loadingRef.current) {
                            // restart recognition and open follow-up window
                            startRecognition()
                            followUpModeRef.current = true
                            clearFollowUpTimeout()
                            followUpTimeoutRef.current = setTimeout(() => {
                                followUpModeRef.current = false
                                setStatusKey(WAITING_2_STATUS_KEY)
                                if (listeningEnabledRef.current && !loadingRef.current && !speakingRef.current) {
                                    startRecognition()
                                }
                                loadSystemMessage() // re-load system message to reset context after follow-up window closes
                            }, FOLLOWUP_TIMEOUT_MS)
                        }
                    },
                    onError: () => {},
                })
                : null

            if (voiceEnabled) {
                // Keep recognition paused until full streamed TTS lifecycle completes.
                speakingRef.current = true
            }

            console.log(selectedModel)

            const promptInfo = {
                model: selectedModel,
                prompt: message,
                history: messagesRef.current,
            }

            let streamedReply = ""
            setLastReply("")
            startStreamingBotMessage()
            const data = await streamChat(promptInfo, {
                onToken: (token) => {
                    streamedReply += token
                    appendToStreamingBotMessage(token)
                    setLastReply((prev) => `${prev}${token}`)
                    speechSessionRef.current?.pushText(token)
                },
            })

            speechSessionRef.current?.complete()

            const finalReply = data?.content || streamedReply
            const assistantMessage = { role: "assistant", content: finalReply }
            addMessages(assistantMessage)
            finalizeStreamingBotMessage(finalReply)
            setLastReply(finalReply)
            setStatusKey(WAITING_STATUS_KEY)
        } catch (error) {
            console.error(error)
            finalizeStreamingBotMessage()
            setErrorText(t("voice.errors.backendFailed"))
            setStatusKey(WAITING_STATUS_KEY)
        } finally {
            setLoading(false)
            // If backend fails, `speak` is never called, so restore recognition here.
            if (listeningEnabledRef.current && !speakingRef.current) {
                followUpModeRef.current = false
                clearFollowUpTimeout()
                startRecognition()
            }
        }
    }

    const circleStyle = useMemo(() => {
        const isActive = !modelLoading && wakeListeningEnabled && haListening && !loading

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
    }, [modelLoading, loading, haListening, wakeListeningEnabled]);
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
            <h1 style={{ margin: 0, fontSize: "1.15rem" }}>{t("voice.title")}</h1>

            <LanguageSelect />

            <ModelSelect />

            <UISelector />

            <VoiceAvatar style={circleStyle} loading={loading} thinkText={thinkText} />

            <VoiceStatusDetails
                wakePhrase={t("wakePhrase")}
                statusText={statusKey}
                awaitingCommand={awaitingCommand}
                lastHeard={lastHeard}
                lastReply={lastReply}
                errorText={errorText}
            />
        </div>
    )
}