"""Output Tracker — run history window (the button's target).

A Toplevel window that lists past runs on the left and shows the selected run's
details on the right: timing, dataset, analysis, status, and the output files in
its run folder. Reads through ``RegistryReader``, so it displays whatever the
teammate's ``registry_manager`` has written — no shared state, no write path.

Wiring into main.py (add on your own branch, mention in the PR)
--------------------------------------------------------------
    from pathlib import Path
    from src.core.registry_reader import RegistryReader
    from src.core.history_window import HistoryWindow

    def open_history_window(self):
        reader = RegistryReader(Path("run_registry.csv"))
        HistoryWindow(self.root, reader)

...and a button in create_widgets() wired to self.open_history_window.

Develop it standalone against seeded rows:
    python -m src.core.history_window
"""

from __future__ import annotations

import tkinter as tk
from pathlib import Path
from typing import TYPE_CHECKING

try:
    from .registry_reader import RegistryReader
except ImportError:  # running the file directly, not as part of the package
    from registry_reader import RegistryReader  # type: ignore

if TYPE_CHECKING:
    from .registry_reader import RunRecord


class HistoryWindow(object):
    def __init__(self, parent: "tk.Misc", reader: RegistryReader) -> None:
        """Parameters
        ----------
        parent : tk.Misc
            Parent window (usually the main app's root).
        reader : RegistryReader
            Reader pointed at run_registry.csv.
        """
        self.reader = reader
        self._records: list["RunRecord"] = []

        self.win = tk.Toplevel(parent)
        self.win.title("Output Tracker — Run History")
        self.win.geometry("900x560")

        self._build_widgets()
        self.refresh()

    def _build_widgets(self) -> None:
        top = tk.Frame(self.win)
        top.pack(side=tk.TOP, fill=tk.X, padx=15, pady=(14, 8))
        tk.Label(top, text="🕘 Run History", font=("Arial", 20, "bold")).pack(side=tk.LEFT)
        tk.Button(top, text="↻ Refresh", command=self.refresh, font=("Arial", 13)).pack(side=tk.RIGHT)

        body = tk.Frame(self.win)
        body.pack(fill=tk.BOTH, expand=True, padx=15, pady=(0, 15))

        # --- Left: run list ---
        left = tk.Frame(body)
        left.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 15))
        tk.Label(left, text="Runs (newest first):", font=("Arial", 14, "bold")).pack(anchor="w")

        list_frame = tk.Frame(left)
        list_frame.pack(fill=tk.Y, expand=True)
        scrollbar = tk.Scrollbar(list_frame, orient=tk.VERTICAL)
        self.listbox = tk.Listbox(
            list_frame,
            font=("Courier New", 14),
            width=38,
            activestyle="none",
            yscrollcommand=scrollbar.set,
        )
        scrollbar.config(command=self.listbox.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.listbox.pack(side=tk.LEFT, fill=tk.Y, expand=True)
        self.listbox.bind("<<ListboxSelect>>", self._on_select)

        # --- Right: detail pane ---
        right = tk.Frame(body)
        right.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        tk.Label(right, text="Details:", font=("Arial", 14, "bold")).pack(anchor="w")
        self.detail = tk.Text(right, wrap=tk.WORD, font=("Courier New", 14), state=tk.DISABLED)
        self.detail.pack(fill=tk.BOTH, expand=True)

    def refresh(self) -> None:
        """Reload runs from the registry and repopulate the list."""
        self._records = self.reader.list_runs()
        self.listbox.delete(0, tk.END)
        for record in self._records:
            self.listbox.insert(tk.END, record.summary_line())
        self._set_detail(
            "Select a run on the left to see its details."
            if self._records
            else "No runs recorded yet.\n\nRuns appear here once analyses are executed\nand written to run_registry.csv."
        )

    def _on_select(self, _event: "tk.Event") -> None:
        selection = self.listbox.curselection()
        if not selection:
            return
        self._show_detail(self._records[selection[0]])

    def _show_detail(self, record: "RunRecord") -> None:
        lines = [
            f"Run ID:      {record.run_id}",
            f"Status:      {record.status}",
            "",
            f"Dataset:     {record.dataset or '(none)'}",
            f"Analysis:    {record.analysis or '(none)'}",
            "",
            f"Started:     {record.start_time or '(unknown)'}",
            f"Ended:       {record.end_time or '(unknown)'}",
            "",
            f"Run folder:  {record.run_path or '(not set)'}",
            f"Hash:        {record.object_hash or '(not recorded yet)'}",
        ]
        lines += self._describe_run_files(record.run_path)
        self._set_detail("\n".join(lines))

    @staticmethod
    def _describe_run_files(run_path: str) -> list[str]:
        if not run_path:
            return []
        path = Path(run_path)
        if not path.exists():
            return ["", "Files:", "   (folder not found on disk yet)"]
        files = sorted(p.name for p in path.iterdir() if p.is_file())
        if not files:
            return ["", "Files:", "   (empty)"]
        return ["", "Files:"] + [f"   • {name}" for name in files]

    def _set_detail(self, text: str) -> None:
        self.detail.config(state=tk.NORMAL)
        self.detail.delete("1.0", tk.END)
        self.detail.insert("1.0", text)
        self.detail.config(state=tk.DISABLED)


if __name__ == "__main__":
    import csv
    import tempfile

    tmp = Path(tempfile.mkdtemp())
    registry = tmp / "run_registry.csv"
    run_folder = tmp / "runs" / "run_001"
    run_folder.mkdir(parents=True)
    (run_folder / "run_001_output.csv").write_text("result")
    (run_folder / "run_history.log").write_text("log")

    with open(registry, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["run_id", "start_time", "end_time", "dataset", "analysis", "status", "run_path"])
        writer.writerow(["001", "2026-07-05 10:00:00", "2026-07-05 10:00:04", "mri_exp_1", "data_cleaning", "Success", str(run_folder)])
        writer.writerow(["2", "2026-07-05 10:05:00", "2026-07-05 10:05:01", "mri_exp_1", "clustering", "Failure", "runs/run_2"])

    root = tk.Tk()
    root.withdraw()
    window = HistoryWindow(root, RegistryReader(registry))
    window.win.protocol("WM_DELETE_WINDOW", root.destroy)
    root.mainloop()
