import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

def run_distribution_plot(df: pd.DataFrame, column_name: str, output_image_path: str = None) -> bool:
    """
    Generates a histogram with a kernel density estimate (KDE) line for a continuous 
    numerical column, and saves the plot as an image if a path is provided.
    Returns True if successful, False otherwise.
    """
    if df is None or df.empty:
        print("Warning: Provided DataFrame is empty. Cannot generate plot.")
        return False

    if column_name not in df.columns:
        print(f"Error: Column '{column_name}' does not exist in the DataFrame.")
        return False

    try:
        # Clear any existing plots to avoid overlapping data
        plt.figure()
        
        # Create the histogram plot using seaborn
        sns.histplot(data=df, x=column_name, kde=True, color="skyblue", edgecolor="black")
        
        # Style the plot with titles and labels
        plt.title(f"Distribution Plot for '{column_name}'", fontsize=14, pad=15)
        plt.xlabel(column_name, fontsize=12)
        plt.ylabel("Count", fontsize=12)
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        
        # Save the plot as an image file if requested
        if output_image_path:
            image_path = Path(output_image_path)
            # Create target directories if they don't exist
            image_path.parent.mkdir(parents=True, exist_ok=True)
            plt.savefig(image_path, bbox_inches='tight', dpi=300)
            print(f"Success: Distribution plot saved to '{image_path}'.")
        
        # Close the plot window to free up memory
        plt.close()
        return True

    except Exception as e:
        print(f"Error during distribution plot generation. Details: {e}")
        plt.close()
        return False