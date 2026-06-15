import { apiUrl } from "./api"
import i18n from "../i18n"

function getSupportedFrontendLanguages() {
    return (i18n.options.supportedLngs || []).filter((lng) => lng !== "cimode")
}

export function normalizeFrontendLanguage(language) {
    if (!language) {
        return null
    }

    const normalized = String(language).trim().toLowerCase().replaceAll("_", "-")
    if (!normalized) {
        return null
    }

    const supported = getSupportedFrontendLanguages()
    const baseLanguage = normalized.split("-")[0]
    if (supported.includes(baseLanguage)) {
        return baseLanguage
    }

    if (supported.includes(normalized)) {
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