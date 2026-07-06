"""Registry reader — the READ side of the output tracker.

The write side already exists (a teammate's ``registry_manager.py`` appends rows
to ``run_registry.csv``). This module is the counterpart: it reads those rows
back into ``RunRecord`` objects for the history window to display. It writes
nothing — reading and display are entirely ours and depend on no one.

It targets the teammate's existing seven-column schema:

    run_id, start_time, end_time, dataset, analysis, status, run_path

Header tolerance
----------------
There's a known naming inconsistency on the write side (``run_id`` written as
the header vs. ``Run ID`` read elsewhere). Rather than depend on which name wins
when that's reconciled, this reader normalises header keys — lower-cased, spaces
and underscores folded — so it parses the file correctly either way. That keeps
the button working across the rename instead of breaking on it.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from pathlib import Path

# Maps every header spelling we might encounter to one canonical field name.
# Add spellings here if the schema gains aliases; the rest of the code only ever
# sees the canonical keys.
_HEADER_ALIASES: dict[str, str] = {
    "run_id": "run_id",
    "runid": "run_id",
    "start_time": "start_time",
    "starttime": "start_time",
    "end_time": "end_time",
    "endtime": "end_time",
    "dataset": "dataset",
    "analysis": "analysis",
    "analyses": "analysis",
    "status": "status",
    "run_path": "run_path",
    "runpath": "run_path",
    "path": "run_path",
    # Optional, once the writer emits it (from feature/analysis-hashing).
    # The counter (run_id) stays the human-readable id; this is the
    # reproducibility fingerprint. Reader shows it if present, ignores if not.
    "object_hash": "object_hash",
    "objecthash": "object_hash",
    "hash": "object_hash",
    "analysishash": "object_hash",
}


def _canonical_key(raw: str) -> str:
    # "Run ID" -> "runid" -> "run_id"; "start time" -> "starttime" -> "start_time"
    folded = (raw or "").strip().lower().replace(" ", "").replace("_", "")
    return _HEADER_ALIASES.get(folded, raw.strip())


@dataclass
class RunRecord:
    """One run, mirroring a single row of run_registry.csv."""

    run_id: str = ""
    start_time: str = ""
    end_time: str = ""
    dataset: str = ""
    analysis: str = ""
    status: str = ""
    run_path: str = ""
    object_hash: str = ""  # optional reproducibility fingerprint; empty until the writer emits it

    def summary_line(self) -> str:
        """One-line label for the history list."""
        status = self.status or "?"
        analysis = self.analysis or "(no analysis)"
        return f"#{self.run_id or '?':<4}  ·  {status:<8}  ·  {analysis}"


class RegistryReader(object):
    def __init__(self, registry_path: "str | Path") -> None:
        """Parameters
        ----------
        registry_path : str | Path
            Path to run_registry.csv. It doesn't need to exist yet — a missing
            file simply reads as "no runs".
        """
        self.registry_path = Path(registry_path)

    def list_runs(self) -> list[RunRecord]:
        """Return all recorded runs, newest first.

        Ordering is by append position in the CSV reversed: the file is written
        one row per run in execution order, so the last row is the newest. This
        is robust regardless of how run_ids happen to be formatted.
        """
        rows = self._read_rows()
        rows.reverse()  # last-appended (newest) first
        return rows

    def get_run(self, run_id: str) -> "RunRecord | None":
        """Return a single run by id, or None if not found."""
        for record in self._read_rows():
            if record.run_id == run_id:
                return record
        return None

    def _read_rows(self) -> list[RunRecord]:
        if not self.registry_path.exists():
            return []
        records: list[RunRecord] = []
        with open(self.registry_path, "r", newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for raw_row in reader:
                records.append(self._row_to_record(raw_row))
        return records

    @staticmethod
    def _row_to_record(raw_row: dict) -> RunRecord:
        # Normalise every key so we don't depend on exact header spelling.
        normalised = {_canonical_key(k): (v or "").strip() for k, v in raw_row.items() if k is not None}
        return RunRecord(
            run_id=normalised.get("run_id", ""),
            start_time=normalised.get("start_time", ""),
            end_time=normalised.get("end_time", ""),
            dataset=normalised.get("dataset", ""),
            analysis=normalised.get("analysis", ""),
            status=normalised.get("status", ""),
            run_path=normalised.get("run_path", ""),
            object_hash=normalised.get("object_hash", ""),
        )


if __name__ == "__main__":
    # Self-test: write a CSV in the teammate's exact format (including the
    # header-naming quirk on purpose) and confirm we read it back correctly.
    import tempfile

    tmp = Path(tempfile.mkdtemp()) / "run_registry.csv"
    with open(tmp, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["run_id", "start_time", "end_time", "dataset", "analysis", "status", "run_path"])
        writer.writerow(["001", "2026-07-05 10:00:00", "2026-07-05 10:00:04", "mri_exp_1", "data_cleaning", "Success", "runs/run_001"])
        writer.writerow(["2", "2026-07-05 10:05:00", "2026-07-05 10:05:01", "mri_exp_1", "clustering", "Failure", "runs/run_2"])

    reader = RegistryReader(tmp)
    print("[+] list_runs() (newest first):")
    for r in reader.list_runs():
        print("   ", r.summary_line())
    print("\n[+] get_run('001'):", reader.get_run("001"))
