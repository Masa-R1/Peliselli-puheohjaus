$start_backend = {
    Set-Location ./backend
    . ./.venv/Scripts/Activate.ps1
    fastapi dev
}

$start_frontend = {
    Set-Location ./frontend
    npm run dev
}

$fastapi_port = 8000
$vite_port = 5173

function Test-Port {
    param (
        $Port
    )

    netstat -ano | Select-String ":$Port"
}

if (-not (Test-Port -Port $fastapi_port)) {
    Start-Process -FilePath "powershell" -ArgumentList $start_backend
}

if (-not (Test-Port -Port $vite_port)) {
    Start-Process -FilePath "powershell" -ArgumentList $start_frontend
}