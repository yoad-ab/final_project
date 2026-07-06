# Research Analysis Tracking Environment
## Project Purpose
The main goal of this project is to provide researchers with a comfortable and enabling environment to perform analyses, track information, and monitor their analyses. Furthermore, it aims to facilitate the recovery of data and allow the re-execution of runs to verify the accuracy of the analysis and ensure its future reproducibility.

## Directory Structure & Data Flow
To maintain a lightweight and highly organized tracking system without the need for a complex external database, the project relies on a strict file-level versioning system.

Here is the directory tree and the designated purpose for each folder and file:

### Plaintext
project_root/
│
├── data/
│   ├── raw_data/
│   ├── processed_data/
│   └── output_data/
│
├── src/
│   ├── main.py
│   ├── user_functions.py
│   └── gui.py
│
├── run_registry.csv
└── run_history.log
### Data Directories
data/raw_data/: This directory contains the source data. These files are strictly read-only and will never be modified, ensuring you can always return to the starting point of any run.


data/processed_data/: If an analysis involves cleaning or altering the source data, the resulting dataset is saved here with an appended version number (e.g., dataset_cleaned_v1.csv).

data/output_data/: This folder stores the final analytical results. Each output file includes its unique run identifier in the filename (e.g., run_001_output.csv) to completely prevent overwriting previous results.

### Tracking & Logging

run_history.log: The central tracking file acting as the project's database and version log. It records the run_id, timestamps, durations, analysis types, input/output files, and parameters.


run_registry.csv: A text-based log file that documents the program's execution and real-time operations, making it easy to trace errors in case of a crash.

## Codebase Structure (Python Modules)
All Python code is organized inside the src/ directory, adhering to PEP 8 standards with snake_case naming conventions to separate UI logic, execution logic, and user-defined operations.

src/main.py: The core execution script. It handles the dynamic calling of analysis functions using a Registry pattern and writes the execution results directly to the run_registry.csv tracking file.


src/user_functions.py: A dedicated, centralized module for all custom user analyses. Researchers can seamlessly add their Python functions here without cluttering the main execution logic.

src/gui.py: Contains the Tkinter-based Graphical User Interface. It manages the responsive window layout, user inputs, and dynamically connects the user's selections to the underlying execution engine.
