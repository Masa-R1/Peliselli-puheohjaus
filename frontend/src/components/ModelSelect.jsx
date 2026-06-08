import { useEffect, useRef } from "react";
import { useModelStore } from "../stores/useModelStore";
import { apiUrl } from "../utils/api";
import { useTranslation } from "react-i18next"

function ModelSelect() {
    const { 
        models, 
        setModels, 
        selectedModel,
        setSelectedModel 
    } = useModelStore()
    const { t } = useTranslation()

    const intialFetchRef = useRef(true)

    useEffect(() => {
		const interval = setInterval(() => {
			fetch(apiUrl("/chat"))
			.then((respose) => respose.json())
			.then(data => {
                // purkka
				if (intialFetchRef.current) {
                    setModels(data)
                    setSelectedModel(data[0])
                    intialFetchRef.current = false
                }
                clearInterval(interval)
			})
			.catch((error) => {
				console.log(error)
			})
		}, 2000)

		return () => clearInterval(interval)
	}, [])

    return (
        <div>
            <label htmlFor="select-model"></label>
            <select 
                name="select-model"
                id="select-model"
                value={selectedModel}
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