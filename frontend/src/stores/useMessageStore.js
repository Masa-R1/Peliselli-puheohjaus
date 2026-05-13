import { create } from "zustand"
import i18n from "../i18n"

const useMessageStore = create((set) => {
    function loadSystemMessage() {
        const systemMessage = i18n.t("systemMessage")
        if (systemMessage) {
            set(() => ({ messages: [{ role: "system", content: systemMessage }] }))
        }
    }

    // load initial system message
    loadSystemMessage()

    // reload on language change
    i18n.on("languageChanged", loadSystemMessage)

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