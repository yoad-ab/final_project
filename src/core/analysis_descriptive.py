import pandas as pd

def run_descriptive_summary(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generates a quick statistical summary (mean, std, min, max, quartiles)
    for all numerical columns in the DataFrame using df.describe().
    """
    if df is None or df.empty:
        print("Warning: Provided DataFrame is empty. Cannot generate summary.")
        return pd.DataFrame()
        
    # Execute describe and return the statistical summary table
    summary_df = df.describe()
    return summary_df