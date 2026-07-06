import pandas as pd

def run_categorical_distribution(df: pd.DataFrame, column_name: str) -> pd.DataFrame:
    """
    Calculates the frequency and percentage distribution of a specific 
    categorical column in the DataFrame using value_counts().
    """
    if df is None or df.empty:
        print("Warning: Provided DataFrame is empty.")
        return pd.DataFrame()
        
    if column_name not in df.columns:
        print(f"Error: Column '{column_name}' does not exist in the DataFrame.")
        return pd.DataFrame()
        
    # Calculate absolute frequencies and relative percentages
    counts = df[column_name].value_counts()
    percentages = df[column_name].value_counts(normalize=True) * 100
    
    # Combine results into a single clean DataFrame
    distribution_df = pd.DataFrame({
        'Count': counts,
        'Percentage (%)': percentages
    })
    
    return distribution_df