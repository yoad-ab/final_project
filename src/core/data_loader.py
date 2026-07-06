ד
import hashlib
from pathlib import Path
import shutil
import pandas as pd


def calculate_sha256(file_path):
    """
    Calculate the SHA-256 hash of a file to uniquely identify its content.
    Reads the file in binary chunks to handle large files efficiently.
    """
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)

    return sha256_hash.hexdigest()


def load_file_to_dataframe(file_path):
    """
    Load a dataset into a pandas DataFrame based on its file extension.

    Supported formats:
    - CSV (.csv)
    - Excel (.xlsx, .xls)
    - Tab-separated text (.txt)

    Raises:
        ValueError: If the file extension is not supported.
    """
    file_extension = file_path.suffix.lower()

    if file_extension == ".csv":
        return pd.read_csv(file_path)

    elif file_extension in [".xlsx", ".xls"]:
        return pd.read_excel(file_path)

    elif file_extension == ".txt":
        return pd.read_csv(file_path, sep="\t")

    else:
        raise ValueError(f"Unsupported file extension: {file_extension}")


def load_and_register_dataset(file_path, storage_dir="data/raw_data"):
    """
    Load a dataset into the system.

    Workflow:
    1. Verify that the file exists.
    2. Validate that the file can be successfully loaded.
    3. Calculate the file hash.
    4. Check whether the dataset already exists.
    5. If it exists, load the latest saved version.
    6. Otherwise, create a new dataset directory, back up the original file,
       and save the initial dataset version.
    """
    file_path = Path(file_path)

    # Step 1: Verify that the input file exists
    if not file_path.exists():
        print(f"Error: File not found: {file_path}")
        return None

    # Step 2: Validate the file by attempting to load it
    try:
        df = load_file_to_dataframe(file_path)

    except ValueError as ve:
        print(f"Validation error: {ve}")
        return None

    except Exception as e:
        print(f"Validation error: Unable to read the file. The file may be corrupted.\nDetails: {e}")
        return None

    # Step 3: Create the storage directory if it does not already exist
    storage_path = Path(storage_dir)
    storage_path.mkdir(parents=True, exist_ok=True)

    # Step 4: Calculate the unique hash of the file
    file_hash = calculate_sha256(file_path)
    dataset_folder = storage_path / file_hash

    # Step 5: If the dataset already exists, load the latest saved version
    if dataset_folder.exists():
        print("Dataset already exists in the system.")

        saved_versions = sorted(dataset_folder.glob("version_*.csv"))

        if saved_versions:
            latest_version = saved_versions[-1]
            print(f"Loading latest saved version: {latest_version.name}")
            return pd.read_csv(latest_version)

        # Fallback: load the original file if no processed versions exist
        raw_files = list(dataset_folder.glob("raw_*"))

        if raw_files:
            print("No processed versions found. Loading the original dataset.")
            return load_file_to_dataframe(raw_files[0])

    # Step 6: Register a new dataset
    dataset_folder.mkdir()

    # Back up the original uploaded file
    original_file_path = dataset_folder / f"raw_{file_path.name}"
    shutil.copy2(file_path, original_file_path)

    # Save the initial dataset version
    version_1_path = dataset_folder / "version_001.csv"
    df.to_csv(version_1_path, index=False)

    print(f"New dataset successfully registered: {dataset_folder}")

    return df
