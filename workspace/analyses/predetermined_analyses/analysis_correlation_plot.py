import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

def run_correlation_plot(df: pd.DataFrame, x_column: str, y_column: str, output_image_path: str = None) -> bool:
    """
    Generates a scatter plot to analyze the relationship and correlation 
    between two continuous numerical columns, and saves it as an image if requested.
    Returns True if successful, False otherwise.
    """
    if df is None or df.empty:
        print("Warning: Provided DataFrame is empty. Cannot generate plot.")
        return False

    if x_column not in df.columns:
        print(f"Error: Column '{x_column}' does not exist in the DataFrame.")
        return False

    if y_column not in df.columns:
        print(f"Error: Column '{y_column}' does not exist in the DataFrame.")
        return False

    try:
        # Clear any existing plots to avoid overlapping data
        plt.figure()
        
        # Create the scatter plot using seaborn
        sns.scatterplot(data=df, x=x_column, y=y_column, color="purple", alpha=0.7, s=50)
        
        # Style the plot with titles and labels
        plt.title(f"Correlation between '{x_column}' and '{y_column}'", fontsize=14, pad=15)
        plt.xlabel(x_column, fontsize=12)
        plt.ylabel(y_column, fontsize=12)
        plt.grid(True, linestyle='--', alpha=0.5)
        
        # Save the plot as an image file if requested
        if output_image_path:
            image_path = Path(output_image_path)
            # Create target directories if they don't exist
            image_path.parent.mkdir(parents=True, exist_ok=True)
            plt.savefig(image_path, bbox_inches='tight', dpi=300)
            print(f"Success: Correlation plot saved to '{image_path}'.")
        
        # Close the plot window to free up memory
        plt.close()
        return True

    except Exception as e:
        print(f"Error during correlation plot generation. Details: {e}")
        plt.close()
        return False