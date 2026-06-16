import { getSpeechText } from "./speechText"

function pickVoice(voices, language) {
    if (!voices || !voices.length || !language) return null

    return (
        voices.find((voice) => voice.lang && voice.lang.startsWith(language)) ||
        voices.find((voice) => voice.lang && voice.lang.startsWith(language.split("-")[0])) ||
        null
    )
}

function splitCompletedSpeechParts(textBuffer) {
    const completed = [];
    let lastBoundaryIndex = 0;

    for (let i = 0; i < textBuffer.length; i += 1) {
        const char = textBuffer[i];
        const nextChar = textBuffer[i + 1];

        // Sentence-ending punctuation that may indicate a speech boundary.
        const isSentenceEnd = ".!?。！？".includes(char);

        // Newlines are always treated as boundaries.
        const isLineBreak = char === "\n";

        // A sentence boundary only exists when the punctuation is followed
        // by whitespace/newline or is the final character in the buffer.
        //
        // This prevents splitting on decimal numbers (18.9), version numbers
        // (v1.2.3), domains (example.com), etc., where a non-whitespace
        // character immediately follows the period.
        const isSentenceBoundary =
            isSentenceEnd && (!nextChar || /\s/.test(nextChar));

        const isBoundary = isLineBreak || isSentenceBoundary;

        if (!isBoundary) continue;

        // Extract the completed chunk and discard surrounding whitespace.
        const piece = textBuffer.slice(lastBoundaryIndex, i + 1).trim();

        if (piece) {
            completed.push(piece);
        }

        // Start the next chunk after the boundary character.
        lastBoundaryIndex = i + 1;
    }

    return {
        // Fully completed speech segments.
        completed,

        // Any trailing text that has not yet reached a boundary.
        remainder: textBuffer.slice(lastBoundaryIndex),
    };
}

function createUtterance(text, options) {
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

    return utterance
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
        createSentenceStream(options = {}) {
            if (typeof window === "undefined") {
                return {
                    pushText() {},
                    complete() {},
                    cancel() {},
                    finished: Promise.resolve(),
                }
            }

            let cancelled = false
            let closed = false
            let speaking = false
            let started = false
            let finalized = false
            let textBuffer = ""
            const queue = []

            let resolveFinished
            const finished = new Promise((resolve) => {
                resolveFinished = resolve
            })

            function finalizeOnce() {
                if (finalized) return
                finalized = true
                resolveFinished()
                if (!cancelled && typeof options.onEnd === "function") {
                    options.onEnd()
                }
            }

            function maybeFinalize() {
                if (cancelled) {
                    finalizeOnce()
                    return
                }

                if (closed && !speaking && queue.length === 0) {
                    finalizeOnce()
                }
            }

            function speakNext() {
                if (cancelled || speaking || queue.length === 0) {
                    maybeFinalize()
                    return
                }

                const nextText = queue.shift()
                const utterance = createUtterance(nextText, options)

                utterance.onstart = () => {
                    if (!started && typeof options.onStart === "function") {
                        started = true
                        options.onStart()
                    }
                }

                utterance.onend = () => {
                    speaking = false
                    speakNext()
                }

                utterance.onerror = (event) => {
                    speaking = false
                    if (typeof options.onError === "function") {
                        options.onError(event)
                    }
                    speakNext()
                }

                speaking = true
                window.speechSynthesis.speak(utterance)
            }

            function enqueue(text) {
                const safeText = getSpeechText(text).trim()
                if (!safeText) return
                queue.push(safeText)
            }

            return {
                pushText(text) {
                    if (cancelled || closed) return
                    //console.log("Pushing text: " + text)
                    const modifiedText = getSpeechText(text || "")
                    //console.log("Pushed text after modification: " + modifiedText)
                    textBuffer += modifiedText

                    const { completed, remainder } = splitCompletedSpeechParts(textBuffer)
                    textBuffer = remainder

                    for (const part of completed) {
                        //console.log(part)
                        enqueue(part)
                    }

                    speakNext()
                },
                complete() {
                    if (cancelled || closed) return
                    closed = true
                    enqueue(textBuffer)
                    textBuffer = ""
                    speakNext()
                    maybeFinalize()
                },
                cancel() {
                    if (cancelled) return
                    cancelled = true
                    closed = true
                    queue.length = 0
                    textBuffer = ""
                    window.speechSynthesis.cancel()
                    maybeFinalize()
                },
                finished,
            }
        },
        speak(text, options = {}) {
            if (typeof window === "undefined") return null

            const session = this.createSentenceStream(options)
            session.pushText(text)
            session.complete()
            return session
        },
    }
}

export const webSpeechTextToSpeech = createWebSpeechTextToSpeech()