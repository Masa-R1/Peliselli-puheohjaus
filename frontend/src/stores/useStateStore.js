import { create } from "zustand"

const useStateStore = create((set) => ({
    loading: false,
    listening: false,
    voiceEnabled: true,
    isSpeaking: false,
    // Home Assistant kuuntelun tila
    haListening: false,

    setLoading: (new_loading) => set(() => ({ loading: new_loading })),
    setListening: (new_listening) => set(() => ({ listening: new_listening })),
    setVoiceEnabled: (new_voiceEnabled) => set(() => ({ voiceEnabled: new_voiceEnabled })),
    setIsSpeaking: (new_isSpeaking) => set(() => ({ isSpeaking: new_isSpeaking })),
    setHaListening: (new_haListening) => set(() => ({ haListening: new_haListening }))
}))

export { useStateStore }