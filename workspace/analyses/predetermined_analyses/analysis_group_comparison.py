import pandas as pd

def run_group_comparison(df: pd.DataFrame, group_column: str, value_column: str, agg_metric: str = "mean") -> pd.DataFrame:
    """
    Groups the DataFrame by a categorical column and calculates a specific 
    statistical metric (e.g., mean, median, std) for a numerical column.
    """
    if df is None or df.empty:
        print("Warning: Provided DataFrame is empty.")
        return pd.DataFrame()

    if group_column not in df.columns:
        print(f"Error: Group column '{group_column}' does not exist in the DataFrame.")
        return pd.DataFrame()

    if value_column not in df.columns:
        print(f"Error: Value column '{value_column}' does not exist in the DataFrame.")
        return pd.DataFrame()

    try:
        # Perform the groupby and aggregate using the specified metric
        grouped_df = df.groupby(group_column)[value_column].agg(agg_metric).to_frame()
        
        # Rename the result column to clearly show what metric was calculated
        grouped_df.columns = [f"{value_column}_{agg_metric}"]
        return grouped_df

    except Exception as e:
        print(f"Error during groupby calculation. Details: {e}")
        return pd.DataFrame()