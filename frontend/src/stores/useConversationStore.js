import { create } from "zustand"

const useConversationStore = create((set) => ({
    conversationMessages: [],
    addConversationMessages: (text, sender) => set((state) => {
        // If it's a streaming update and the last message is a bot message, update it
        if (sender === "bot_update" && state.conversationMessages.length > 0) {
            const lastMsg = state.conversationMessages[state.conversationMessages.length - 1]
            if (lastMsg.sender === "bot" || lastMsg.sender === "bot_update") {
                const updatedMessages = [...state.conversationMessages]
                updatedMessages[updatedMessages.length - 1] = { text, sender: "bot_update" }
                return { conversationMessages: updatedMessages }
            }
        }
        // Otherwise, add as a new message
        return { conversationMessages: [...state.conversationMessages, { text, sender }] }
    }),
}))

export { useConversationStore }