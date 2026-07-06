import os
from pathlib import Path
from threading import Thread

import uvicorn
import webview

from ..api.main import app


def run_server():
    config = uvicorn.Config(app=app, host="127.0.0.1", port=8000)
    server = uvicorn.Server(config=config)
    server.run()


def run_ui():
    current_dir = Path(os.path.dirname(os.path.abspath(__file__)))
    html_path = current_dir / ".." / ".." / "frontend" / "dist" / "index.html"

    print("html path", html_path)

    webview.create_window("Analysis App", str(html_path))
    webview.start()


def main():
    Thread(target=run_server, daemon=True).start()
    run_ui()


if __name__ == "__main__":
    main()
