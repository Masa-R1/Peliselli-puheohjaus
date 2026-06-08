import { apiUrl } from "./api"

const SUPPORTED_FRONTEND_LANGUAGES = ["en", "fi"]

export function normalizeFrontendLanguage(language) {
    if (!language) {
        return null
    }

    const normalized = String(language).trim().toLowerCase().replaceAll("_", "-")
    if (!normalized) {
        return null
    }

    const baseLanguage = normalized.split("-")[0]
    if (SUPPORTED_FRONTEND_LANGUAGES.includes(baseLanguage)) {
        return baseLanguage
    }

    if (SUPPORTED_FRONTEND_LANGUAGES.includes(normalized)) {
        return normalized
    }

    return null
}

export async function syncFrontendLanguage(language) {
    const normalized = normalizeFrontendLanguage(language)
    if (!normalized) {
        return null
    }

    const response = await fetch(apiUrl("/ui/language"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ language: normalized }),
    })

    if (!response.ok) {
        throw new Error("Failed to sync frontend language.")
    }

    return normalized
}