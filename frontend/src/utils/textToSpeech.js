import { getSpeechText } from "./speechText"

function pickVoice(voices, language) {
    if (!voices || !voices.length || !language) return null

    return (
        voices.find((voice) => voice.lang && voice.lang.startsWith(language)) ||
        voices.find((voice) => voice.lang && voice.lang.startsWith(language.split("-")[0])) ||
        null
    )
}

export function createWebSpeechTextToSpeech() {
    return {
        isSupported() {
            return typeof window !== "undefined" && !!(window.speechSynthesis && window.SpeechSynthesisUtterance)
        },
        cancel() {
            if (typeof window === "undefined") return
            window.speechSynthesis.cancel()
        },
        speak(text, options = {}) {
            if (typeof window === "undefined") return null

            const utterance = new SpeechSynthesisUtterance(getSpeechText(text))
            const language = options.language || navigator.language

            utterance.lang = language
            utterance.rate = options.rate ?? 1
            utterance.pitch = options.pitch ?? 1
            utterance.volume = options.volume ?? 1

            const voices = window.speechSynthesis.getVoices()
            const voice = pickVoice(voices, language)
            if (voice) {
                utterance.voice = voice
            }

            if (typeof options.onStart === "function") {
                utterance.onstart = options.onStart
            }

            if (typeof options.onEnd === "function") {
                utterance.onend = options.onEnd
            }

            if (typeof options.onError === "function") {
                utterance.onerror = options.onError
            }

            window.speechSynthesis.speak(utterance)
            return utterance
        },
    }
}

export const webSpeechTextToSpeech = createWebSpeechTextToSpeech()