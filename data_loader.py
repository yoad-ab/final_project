
import os
import pandas as pd

def load_dataset_to_dataframe(file_path):
    # 1. Check if the file exists
    if not os.path.exists(file_path):
        print(f"Error: file not found at {file_path}")
        return None
    
    # 2. Extract and lowercase the file extension
    __, file_extension = os.path.splitext(file_path)
    file_extension = file_extension.lower()

    # 3. Match extension to the correct pandas read function
    if file_extension == ".csv":
        df = pd.read_csv(file_path)
        return df
    elif file_extension in [".xlsx", ".xls"]:
        df = pd.read_excel(file_path)
        return df
    elif file_extension == ".txt":
        df = pd.read_csv(file_path, sep = "\t")
        return df
    else:
        print(f"Error: Unsupported file extension {file_extension}")
        return None
