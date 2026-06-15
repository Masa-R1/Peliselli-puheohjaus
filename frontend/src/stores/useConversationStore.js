import { create } from "zustand"

const useConversationStore = create((set) => ({
    conversationMessages: [],
    addConversationMessages: (text, sender) => set((state) => ({ 
        conversationMessages: [...state.conversationMessages, { text, sender }] 
    })),
    startStreamingBotMessage: () => set((state) => ({
        conversationMessages: [...state.conversationMessages, { text: "", sender: "bot", streaming: true }],
    })),
    appendToStreamingBotMessage: (chunk) => set((state) => {
        if (!chunk) return state

        const messages = [...state.conversationMessages]
        const lastIndex = messages.length - 1

        if (lastIndex < 0 || messages[lastIndex].sender !== "bot" || !messages[lastIndex].streaming) {
            messages.push({ text: chunk, sender: "bot", streaming: true })
            return { conversationMessages: messages }
        }

        messages[lastIndex] = {
            ...messages[lastIndex],
            text: `${messages[lastIndex].text}${chunk}`,
        }

        return { conversationMessages: messages }
    }),
    finalizeStreamingBotMessage: (finalText = null) => set((state) => {
        const messages = [...state.conversationMessages]
        const lastIndex = messages.length - 1

        if (lastIndex < 0 || messages[lastIndex].sender !== "bot" || !messages[lastIndex].streaming) {
            if (finalText) {
                messages.push({ text: finalText, sender: "bot" })
                return { conversationMessages: messages }
            }

            return state
        }

        messages[lastIndex] = {
            ...messages[lastIndex],
            text: finalText ?? messages[lastIndex].text,
            streaming: false,
        }

        return { conversationMessages: messages }
    }),
}))

export { useConversationStore }