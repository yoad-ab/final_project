import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path

def run_group_box_plot(df: pd.DataFrame, group_column: str, value_column: str, output_image_path: str = None) -> bool:
    """
    Generates a boxplot to compare the distribution of a numerical value column 
    across different categorical groups, and saves it as an image if requested.
    Returns True if successful, False otherwise.
    """
    if df is None or df.empty:
        print("Warning: Provided DataFrame is empty. Cannot generate plot.")
        return False

    if group_column not in df.columns:
        print(f"Error: Group column '{group_column}' does not exist in the DataFrame.")
        return False

    if value_column not in df.columns:
        print(f"Error: Value column '{value_column}' does not exist in the DataFrame.")
        return False

    try:
        # Clear any existing plots to avoid overlapping data
        plt.figure()
        
        # Create the boxplot using seaborn
        sns.boxplot(data=df, x=group_column, y=value_column, palette="Set2")
        
        # Style the plot with titles and labels
        plt.title(f"Comparison of '{value_column}' by '{group_column}'", fontsize=14, pad=15)
        plt.xlabel(group_column, fontsize=12)
        plt.ylabel(value_column, fontsize=12)
        
        # Save the plot as an image file if requested
        if output_image_path:
            image_path = Path(output_image_path)
            # Create target directories if they don't exist
            image_path.parent.mkdir(parents=True, exist_ok=True)
            plt.savefig(image_path, bbox_inches='tight', dpi=300)
            print(f"Success: Boxplot saved to '{image_path}'.")
        
        # Close the plot window to free up memory
        plt.close()
        return True

    except Exception as e:
        print(f"Error during boxplot generation. Details: {e}")
        plt.close()
        return False