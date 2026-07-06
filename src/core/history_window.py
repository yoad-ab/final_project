"""Output Tracker — run history window (the button's target).
 
A Toplevel window that shows past runs grouped by the pipeline they belong to,
with a detail pane on the right showing the selected run's timing, dataset, analysis, status, hash, and output files.
 
Grouping
--------
Runs are grouped under ``GROUP_FIELD`` — currently "analysis", since each
registry row records one analysis. When the registry gains a real pipeline id
(e.g. "recipe_id"), change GROUP_FIELD to that one name and the tree regroups
with no other edits.
 
 
 --------------------------------------------------------------
    from pathlib import Path
    from src.core.registry_reader import RegistryReader
    from src.core.history_window import HistoryWindow
 
    def open_history_window(self):
        HistoryWindow(self.root, RegistryReader(Path("run_registry.csv")))
 
Develop it standalone against seeded rows:
    python -m src.core.history_window
"""
 
from __future__ import annotations
 
import tkinter as tk
from pathlib import Path
from tkinter import ttk
from typing import TYPE_CHECKING
 
try:
    from .registry_reader import RegistryReader
except ImportError:  # running the file directly, not as part of the package
    from registry_reader import RegistryReader  # type: ignore
 
if TYPE_CHECKING:
    from .registry_reader import RunRecord
 
# Which record field runs are grouped under in the tree. Change this single
# value to "recipe_id" (or whatever the registry ends up calling the pipeline
# identity) once that column exists, and the grouping follows automatically.
GROUP_FIELD = "analysis"
 
 
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
        self._item_to_record: dict[str, "RunRecord"] = {}
 
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
 
        # --- Left: grouped run tree ---
        left = tk.Frame(body)
        left.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 15))
        tk.Label(left, text="Runs by pipeline:", font=("Arial", 14, "bold")).pack(anchor="w")
 
        tree_frame = tk.Frame(left)
        tree_frame.pack(fill=tk.Y, expand=True)
 
        # Enlarge the tree's font and row height to match the rest of the window.
        style = ttk.Style(self.win)
        style.configure("Tracker.Treeview", font=("Courier New", 13), rowheight=30)
 
        scrollbar = tk.Scrollbar(tree_frame, orient=tk.VERTICAL)
        self.tree = ttk.Treeview(
            tree_frame,
            show="tree",
            style="Tracker.Treeview",
            height=14,
            yscrollcommand=scrollbar.set,
        )
        self.tree.column("#0", width=340, stretch=False)
        scrollbar.config(command=self.tree.yview)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        self.tree.pack(side=tk.LEFT, fill=tk.Y, expand=True)
        self.tree.bind("<<TreeviewSelect>>", self._on_select)
 
        # --- Right: detail pane ---
        right = tk.Frame(body)
        right.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        tk.Label(right, text="Details:", font=("Arial", 14, "bold")).pack(anchor="w")
        self.detail = tk.Text(right, wrap=tk.WORD, font=("Courier New", 14), state=tk.DISABLED)
        self.detail.pack(fill=tk.BOTH, expand=True)
 
    def refresh(self) -> None:
        """Reload runs and rebuild the grouped tree."""
        self._records = self.reader.list_runs()
        self.tree.delete(*self.tree.get_children())
        self._item_to_record.clear()
 
        groups = self._group_records(self._records)
        for group_name in sorted(groups):
            runs = groups[group_name]
            noun = "run" if len(runs) == 1 else "runs"
            parent_id = self.tree.insert("", tk.END, text=f"{group_name}  ({len(runs)} {noun})", open=True)
            for record in runs:  # already newest-first from the reader
                child_id = self.tree.insert(parent_id, tk.END, text=self._run_line(record))
                self._item_to_record[child_id] = record
 
        self._set_detail(
            "Select a run to see its details."
            if self._records
            else "No runs recorded yet.\n\nRuns appear here once analyses are executed\nand written to run_registry.csv."
        )
 
    def _on_select(self, _event: "tk.Event") -> None:
        selection = self.tree.selection()
        if not selection:
            return
        record = self._item_to_record.get(selection[0])
        if record is None:
            # A group header was clicked, not a run.
            self._set_detail("Select a run under this pipeline to see its details.")
        else:
            self._show_detail(record)
 
    @staticmethod
    def _group_records(records: list["RunRecord"]) -> dict[str, list["RunRecord"]]:
        groups: dict[str, list["RunRecord"]] = {}
        for record in records:
            key = getattr(record, GROUP_FIELD, "") or "(ungrouped)"
            groups.setdefault(key, []).append(record)
        return groups
 
    @staticmethod
    def _run_line(record: "RunRecord") -> str:
        run_id = record.run_id or "?"
        status = record.status or "?"
        when = record.start_time or ""
        return f"run {run_id:<5} · {status:<8} · {when}"
 
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
    # Dev harness: seed a throwaway registry in the teammate's format (two runs
    # of one pipeline plus one of another, and a real run folder) and open the
    # window standalone so the grouped tree can be built without the executor.
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
        writer.writerow(["002", "2026-07-05 10:05:00", "2026-07-05 10:05:01", "mri_exp_1", "pca", "Success", "runs/run_002"])
        writer.writerow(["004", "2026-07-05 14:30:00", "2026-07-05 14:30:03", "mri_exp_1", "data_cleaning", "Failure", "runs/run_004"])
 
    root = tk.Tk()
    root.withdraw()
    window = HistoryWindow(root, RegistryReader(registry))
    window.win.protocol("WM_DELETE_WINDOW", root.destroy)
    root.mainloop()