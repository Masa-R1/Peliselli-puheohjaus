const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"
export const HA_WS_API_URL = import.meta.env.VITE_HA_WS_API_URL
export const HA_ACCESS_TOKEN = import.meta.env.VITE_HA_ACCESS_TOKEN
export const HA_URL = import.meta.env.VITE_HA_URL
export const LISTENING_ENTITY_ID = import.meta.env.VITE_LISTENING_ENTITY_ID
export const LANGUAGE_ENTITY_ID = import.meta.env.VITE_LANGUAGE_ENTITY_ID
export const RESTART_ENTITY_ID = import.meta.env.VITE_RESTART_ENTITY_ID

export function apiUrl(path) {
    if (!backendUrl) {
        return path
    }

    return new URL(path, backendUrl).toString()
}

export async function streamChat(promptInfo, options = {}) {
    const response = await fetch(apiUrl("/chat/stream"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(promptInfo),
    })

    if (!response.ok || !response.body) {
        throw new Error("Failed to start chat stream.")
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder("utf-8")
    let buffer = ""
    let finalMessage = null
    let streamError = null

    function processLine(rawLine) {
        const line = rawLine.trim()
        if (!line) return

        const data = JSON.parse(line)
        if (data.type === "token" && typeof options.onToken === "function") {
            options.onToken(data.text || "")
        }

        if (data.type === "done") {
            finalMessage = data.message
            streamError = data.streamError || null
        }

        if (data.type === "error") {
            throw new Error(data.error || "Stream failed.")
        }
    }

    while (true) {
        const { done, value } = await reader.read()
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done })

        let newlineIndex = buffer.indexOf("\n")
        while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex)
            buffer = buffer.slice(newlineIndex + 1)
            processLine(line)
            newlineIndex = buffer.indexOf("\n")
        }

        if (done) {
            break
        }
    }

    if (buffer.trim()) {
        processLine(buffer)
    }

    if (!finalMessage) {
        throw new Error("Stream ended without final message.")
    }

    if (streamError) {
        console.error("Chat stream backend error:", streamError)
    }

    return finalMessage
}