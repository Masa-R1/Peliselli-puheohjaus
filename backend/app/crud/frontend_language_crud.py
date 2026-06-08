SUPPORTED_FRONTEND_LANGUAGES = {"en", "fi"}

__frontend_language = None


def normalize_frontend_language(language: str | None) -> str | None:
    if not language:
        return None

    normalized = str(language).strip().lower().replace("_", "-")
    if not normalized:
        return None

    base_language = normalized.split("-", 1)[0]
    if base_language in SUPPORTED_FRONTEND_LANGUAGES:
        return base_language

    if normalized in SUPPORTED_FRONTEND_LANGUAGES:
        return normalized

    return None


def get_frontend_language() -> str | None:
    return __frontend_language


def set_frontend_language(language: str | None) -> str | None:
    global __frontend_language

    __frontend_language = normalize_frontend_language(language)
    return __frontend_language