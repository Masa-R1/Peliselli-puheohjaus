import { useModelStore } from "../stores/useModelStore";

function ModelSelect() {
    const { models } = useModelStore()
    const { setSelectedModel } = useModelStore()
    const { selectedModel } = useModelStore()

    return (
        <div style={{paddingLeft:15}}>
            <label htmlFor="select-model"></label>
            <select 
                name="select-model"
                id="select-model"
                onChange={(e) => {
                    setSelectedModel(e.target.value)
                }}
                style={{
                    background:"transparent",
                    border:"none",
                    color:"#00a5cd"
                }}
            >
                {models.map((model, index) => (
                    <option key={index} value={model}>{model}</option>
                ))}
            </select>
        </div>
    )
}

export default ModelSelect