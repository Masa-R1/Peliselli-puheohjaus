import { create } from "zustand"

const useConversationStore = create((set) => ({
    conversationMessages: [],
    addConversationMessages: (text, sender) => set((state) => ({ 
        conversationMessages: [...state.conversationMessages, { text, sender }] 
    })),
}))

export { useConversationStore }