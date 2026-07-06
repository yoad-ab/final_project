import pandas as pd

def run_missing_values_analysis(df: pd.DataFrame) -> pd.DataFrame:
    """
    Scans the DataFrame to detect and report the count and percentage 
    of missing values (NaN) for each column.
    """
    if df is None or df.empty:
        print("Warning: Provided DataFrame is empty.")
        return pd.DataFrame()
        
    # Count the number of missing values per column
    missing_count = df.isna().sum()
    
    # Calculate the percentage of missing values based on total rows
    missing_percentage = (missing_count / len(df)) * 100
    
    # Combine the results into a single reporting DataFrame
    missing_df = pd.DataFrame({
        'Missing Count': missing_count,
        'Percentage Missing (%)': missing_percentage
    })
    
    # Sort the table from the most missing column to the least missing column
    missing_df = missing_df.sort_values(by='Missing Count', ascending=False)
    
    return missing_df