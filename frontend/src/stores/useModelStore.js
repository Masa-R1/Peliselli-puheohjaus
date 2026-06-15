import { create } from "zustand"

const useModelStore = create((set) => ({
    models: [],
    selectedModel: "",
    modelLoading: false,
    setModels: (models_list) => set(() => ({ models: models_list })),
    setSelectedModel: (new_selection) => set(() => ({ selectedModel: new_selection })),
    setModelLoading: (new_modelLoading) => set(() => ({ modelLoading: new_modelLoading })),
}))

export { useModelStore }