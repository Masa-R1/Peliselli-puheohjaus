import { create } from "zustand"

const useMessageStore = create((set) => {
    async function loadSystemMessage() {
        try {
            const res = await fetch("/config.json")
            if (!res.ok) return
            const cfg = await res.json()
            const sys = cfg?.systemMessage ?? cfg?.system?.message ?? cfg?.system ?? ""
            const content = typeof sys === "string" ? sys : (sys?.message ?? "")
            if (content) {
                set(() => ({ messages: [{ role: "system", content }] }))
            }
        } catch (err) {
            // fail silently; app still works without system message
            console.error("useMessageStore: failed to load config.json", err)
        }
    }

    // start async load (non-blocking)
    loadSystemMessage()

    return {
        messages: [],
        inputMessage: "",
        addMessages: (new_message) => set((state) => (
            { messages: [...state.messages, new_message] }
        )),
        setInputMessage: (new_inputMessage) => set(() => ({ inputMessage: new_inputMessage })),
        loadSystemMessage,
    }
})

export { useMessageStore }