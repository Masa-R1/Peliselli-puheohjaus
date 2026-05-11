import { create } from "zustand"

const useStateStore = create((set) => ({
    loading: false,
    listening: false,
    voiceEnabled: true,

    setLoading: (new_loading) => set(() => ({ loading: new_loading })),
    setListening: (new_listening) => set(() => ({ listening: new_listening })),
    setVoiceEnabled: (new_voiceEnabled) => set(() => ({ voiceEnabled: new_voiceEnabled })),
}))

export { useStateStore }