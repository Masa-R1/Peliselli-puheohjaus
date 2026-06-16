import { useEffect, useMemo, useRef, useState } from "react";
import { useModelStore } from "../stores/useModelStore";
import { apiUrl } from "../utils/api";
import { useTranslation } from "react-i18next";

const DEFAULT_MODEL_KEY = "default-model";

function ModelSelect() {
    const {
        models,
        setModels,
        selectedModel,
        setSelectedModel,
        modelLoading,
        setModelLoading,
    } = useModelStore();

    const { t } = useTranslation();

    const initialFetchRef = useRef(true);

    const [defaultModel, setDefaultModel] = useState(
        () => localStorage.getItem(DEFAULT_MODEL_KEY) ?? ""
    );

    useEffect(() => {
        let isActive = true;

        setModelLoading(true);

        const interval = setInterval(() => {
            fetch(apiUrl("/chat"))
                .then((response) => response.json())
                .then((data) => {
                    if (!isActive) return;

                    if (initialFetchRef.current) {
                        setModels(data);

                        const savedDefault =
                            localStorage.getItem(DEFAULT_MODEL_KEY);

                        if (savedDefault && data.includes(savedDefault)) {
                            setSelectedModel(savedDefault);
                        } else {
                            setSelectedModel(data[0] ?? "");
                        }

                        initialFetchRef.current = false;
                    }

                    setModelLoading(false);
                    clearInterval(interval);
                })
                .catch((error) => {
                    console.log(error);
                });
        }, 2000);

        return () => {
            isActive = false;
            setModelLoading(false);
            clearInterval(interval);
        };
    }, [setModelLoading, setModels, setSelectedModel]);

    const isDefaultSelected = useMemo(
        () => selectedModel && selectedModel === defaultModel,
        [selectedModel, defaultModel]
    );

    const saveDefaultModel = () => {
        if (!selectedModel) return;

        localStorage.setItem(DEFAULT_MODEL_KEY, selectedModel);
        setDefaultModel(selectedModel);
    };

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
            }}
        >
            <label htmlFor="select-model"></label>

            <select
                name="select-model"
                id="select-model"
                value={selectedModel}
                disabled={modelLoading}
                onChange={(e) => {
                    setSelectedModel(e.target.value);
                }}
                style={{
                    background: "transparent",
                    border: "none",
                    color: "#00a5cd",
                    textShadow: "0 0 4px #818bff",
                }}
            >
                {modelLoading ? (
                    <option value="">{t("chat.loadingModels")}</option>
                ) : models.length === 0 ? (
                    <option value="">{t("chat.noModelsLoaded")}</option>
                ) : (
                    models.map((model, index) => (
                        <option key={index} value={model}>
                            {model}
                        </option>
                    ))
                )}
            </select>

            <button
                type="button"
                onClick={saveDefaultModel}
                disabled={!selectedModel}
                title={t("chat.setDefaultModel")}
                aria-label={t("chat.setDefaultModel")}
                style={{
                    background: "none",
                    border: "none",
                    cursor: selectedModel ? "pointer" : "default",
                    padding: 0,
                    fontSize: "0.9rem",
                    lineHeight: 1,
                    color: isDefaultSelected ? "#ffd700" : "#808080",
                    transition: "color 200ms ease",
                }}
            >
                ★
            </button>
        </div>
    );
}

export default ModelSelect;