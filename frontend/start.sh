#!/usr/bin/env bash

set -euo pipefail

PORT="${PORT:-5173}"
HOST="${HOST:-localhost}"
URL="http://${HOST}:${PORT}"

find_chrome() {
	local candidates=(
		"/c/Program Files/Google/Chrome/Application/chrome.exe"
		"/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"
		"$(command -v google-chrome 2>/dev/null || true)"
		"$(command -v google-chrome-stable 2>/dev/null || true)"
		"$(command -v chrome 2>/dev/null || true)"
	)

	local candidate
	for candidate in "${candidates[@]}"; do
		if [ -n "$candidate" ] && [ -x "$candidate" ]; then
			printf '%s\n' "$candidate"
			return 0
		fi
	done

	return 1
}

chrome_bin="$(find_chrome)"

if [ -z "$chrome_bin" ]; then
	echo "Chrome not found. Install Google Chrome or add it to PATH." >&2
	exit 1
fi

# Launch Chrome in background
"$chrome_bin" --enable-speech-dispatcher "$URL" >/dev/null 2>&1 &

# Run dev server in foreground (output visible in current window)
npm run dev
