export function getSpeechText(text) {
    // Return an empty string if the input is not a string.
    if (typeof text !== "string") return "";

    return text
        // Replace fenced code blocks (```...```) with their contents,
        // removing the fence markers themselves.
        .replace(/```[\s\S]*?```/g, (match) => match.replace(/```/g, " "))

        // Remove inline code backticks while keeping the code text.
        // Example: `hello` -> hello
        .replace(/`([^`]+)`/g, "$1")

        // Convert markdown images to their alt text.
        // Example: ![Logo](url) -> Logo
        .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "$1")

        // Convert markdown links to their visible text.
        // Example: [OpenAI](url) -> OpenAI
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")

        // Remove markdown heading markers (#, ##, ###, etc.).
        .replace(/^\s{0,3}#{1,6}\s+/gm, "")

        // Remove blockquote markers (>).
        .replace(/^\s{0,3}>\s?/gm, "")

        // Remove unordered list markers (-, *, +).
        .replace(/^\s{0,3}[-*+]\s+/gm, "")

        // Remove ordered list markers (1., 2., etc.).
        .replace(/^\s{0,3}\d+\.\s+/gm, "")

        // Remove remaining markdown formatting characters such as:
        // bold/italic (*, _), strikethrough (~), blockquote (>).
        .replace(/[>*_~]+/g, "")

        // Replace table column separators with spaces.
        .replace(/\|/g, " ")

        // Replace line breaks with spaces.
        .replace(/\n+/g, " ")

        // Collapse multiple spaces into a single space.
        .replace(/\s+/g, " ");
}