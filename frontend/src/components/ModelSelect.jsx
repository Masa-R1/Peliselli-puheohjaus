import { useEffect, useRef } from "react";
import { useModelStore } from "../stores/useModelStore";
import { apiUrl } from "../utils/api";
import { useTranslation } from "react-i18next"

function ModelSelect() {
    const { 
        models, 
        setModels, 
        selectedModel,
        setSelectedModel,
        modelLoading,
        setModelLoading,
    } = useModelStore()
    const { t } = useTranslation()

    const intialFetchRef = useRef(true)

    useEffect(() => {
        let isActive = true
        setModelLoading(true)
		const interval = setInterval(() => {
			fetch(apiUrl("/chat"))
			.then((respose) => respose.json())
			.then(data => {
				if (!isActive) return
				if (intialFetchRef.current) {
                    setModels(data)
                    setSelectedModel(data[0] ?? "")
                    intialFetchRef.current = false
                }
                setModelLoading(false)
                clearInterval(interval)
			})
			.catch((error) => {
				console.log(error)
			})
		}, 2000)

        return () => {
            isActive = false
            setModelLoading(false)
            clearInterval(interval)
        }
    }, [setModelLoading, setModels, setSelectedModel])

    return (
        <div>
            <label htmlFor="select-model"></label>
            <select 
                name="select-model"
                id="select-model"
                value={selectedModel}
                disabled={modelLoading}
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
                {modelLoading ? (
                    <option value="">{t("chat.loadingModels")}</option>
                ) : models.length === 0 ? (
                    <option value="">{t("chat.noModelsLoaded")}</option>
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