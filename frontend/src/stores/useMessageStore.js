import { create } from "zustand"

const useMessageStore = create((set) => ({
    messages: [],
    addMessages: (new_message) => set((state) => ({ messages: [...state.messages, new_message] })),
}))

export { useMessageStore }