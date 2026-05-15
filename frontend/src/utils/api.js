const backendUrl = import.meta.env.VITE_BACKEND_URL || "localhost:8000"

export function apiUrl(path) {
    if (!backendUrl) {
        return path
    }

    return new URL(path, backendUrl).toString()
}