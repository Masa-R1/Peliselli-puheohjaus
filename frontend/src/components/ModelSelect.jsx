import { useEffect, useRef } from "react";
import { useModelStore } from "../stores/useModelStore";
import { apiUrl } from "../utils/api";

function ModelSelect() {
    const { 
        models, 
        setModels, 
        setSelectedModel, 
        selectedModel 
    } = useModelStore()

    useEffect(() => {
		const interval = setInterval(() => {
			fetch(apiUrl("/chat"))
			.then((respose) => respose.json())
			.then(data => {
				setModels(data)
                setSelectedModel(data[0])
                clearInterval(interval)
			})
			.catch((error) => {
				console.log(error)
			})
		}, 2000)

		return () => clearInterval(interval)
	}, [])

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
                    color:"#00a5cd",
                    textShadow: '0 0 4px #818bff' 
                }}
            >
                {models.length === 0 ? (
                    <option value="">No models loaded</option>
                ) : (
                    models.map((model, index) => (
                       <option key={index} value={model}>{model}</option>
                    ))
                )}
            </select>
        </div>
    )
}

export default ModelSelect