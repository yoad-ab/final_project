import pandas as pd
from typing import List

def run_range_comparison(
    df: pd.DataFrame, 
    continuous_column: str, 
    bins: List[float], 
    labels: List[str], 
    value_column: str
) -> pd.DataFrame:
    """
    Bins a continuous numerical column into specified ranges using pd.cut(),
    and compares the mean performance of a target value column across those ranges.
    """
    if df is None or df.empty:
        print("Warning: Provided DataFrame is empty.")
        return pd.DataFrame()

    if continuous_column not in df.columns:
        print(f"Error: Continuous column '{continuous_column}' does not exist.")
        return pd.DataFrame()

    if value_column not in df.columns:
        print(f"Error: Value column '{value_column}' does not exist.")
        return pd.DataFrame()

    if len(bins) - 1 != len(labels):
        print("Error: The number of labels must be exactly equal to the number of bins minus 1.")
        return pd.DataFrame()

    try:
        # Create a temporary copy to avoid modifying the original dataframe
        df_temp = df.copy()
        
        # Segment the continuous data into the specified bins
        df_temp['range_group'] = pd.cut(df_temp[continuous_column], bins=bins, labels=labels)
        
        # Calculate the mean of the value column for each range group
        comparison_df = df_temp.groupby('range_group', observed=False)[value_column].mean().to_frame()
        
        # Rename column to reflect the calculated metric
        comparison_df.columns = [f"{value_column}_mean"]
        return comparison_df

    except Exception as e:
        print(f"Error during range comparison calculation. Details: {e}")
        return pd.DataFrame()