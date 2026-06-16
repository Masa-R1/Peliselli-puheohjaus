import subprocess
import time
import pathlib
import os
import psutil

backend_process = None
frontend_process = None
path = pathlib.Path(__file__).parent.resolve()

os.environ["ENABLE_TERMINATE_ENDPOINT"] = "true"

def kill_tree(proc):
    try:
        parent = psutil.Process(proc.pid)

        for child in parent.children(recursive=True):
            child.kill()

        parent.kill()
        parent.wait()
    except psutil.NoSuchProcess:
        pass

def start_apps():
    global backend_process, frontend_process, path

    on_windows = os.name == "nt"

    backend_process = subprocess.Popen(
        ["fastapi", "run"],
        cwd=os.path.join(path, "backend"),
        shell=on_windows
    )
    frontend_process = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=os.path.join(path, "frontend"),
        shell=on_windows
    )

    time.sleep(2)

def terminate_apps():
    global backend_process, frontend_process

    if frontend_process is not None:
        kill_tree(frontend_process)

    if backend_process is not None:
        kill_tree(backend_process)

def restart_apps():
    terminate_apps()
    start_apps()

start_apps()

while True:
    try:
        time.sleep(5)
        if frontend_process.poll() is not None or backend_process.poll() is not None:
            print("Restarting...")
            restart_apps()
    except KeyboardInterrupt:
        print("Terminating...")
        terminate_apps()
        break

