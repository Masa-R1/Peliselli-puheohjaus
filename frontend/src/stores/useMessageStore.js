import { create } from "zustand"

const useMessageStore = create((set) => ({
    messages: [],
    inputMessage: "",
    addMessages: (new_message) => set((state) => (
        { messages: [...state.messages, new_message] }
    )),
    setInputMessage: (new_inputMessage) => set(() => ({ inputMessage: new_inputMessage })),
}))

export { useMessageStore }