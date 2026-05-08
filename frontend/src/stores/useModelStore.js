import { create } from "zustand"

const useModelStore = create((set) => ({
    models: [],
    selectedModel: "",
    setModels: (models_list) => set(() => ({ models: models_list })),
    setSelectedModel: (new_selection) => set(() => ({ selectedModel: new_selection })),
}))

export { useModelStore }