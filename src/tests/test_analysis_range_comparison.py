import pandas as pd
from src.core.analysis_range_comparison import run_range_comparison

def test_run_range_comparison_success():
    """
    Test that run_range_comparison correctly segments continuous data into ranges
    and calculates the accurate mean of the value column for each range.
    """
    # Create mock data (Under 40 mean: 85.0, 40 and Over mean: 65.0)
    mock_data = {
        'age': [20, 30, 50, 60],
        'accuracy': [80, 90, 60, 70]
    }
    df = pd.DataFrame(mock_data)
    
    # Define bins and labels (0-40 is 'Under 40', 40-100 is '40 and Over')
    bins = [0, 40, 100]
    labels = ['Under 40', '40 and Over']
    
    # Run the range comparison module
    result_df = run_range_comparison(df, continuous_column='age', bins=bins, labels=labels, value_column='accuracy')
    
    # Assertions: Verify counts and range averages match expectations
    assert not result_df.empty
    assert result_df.loc['Under 40', 'accuracy_mean'] == 85.0
    assert result_df.loc['40 and Over', 'accuracy_mean'] == 65.0

def test_run_range_comparison_mismatched_labels():
    """
    Test that providing a mismatched number of labels and bins safely returns an empty DataFrame.
    """
    mock_data = {
        'age': [25, 55],
        'accuracy': [80, 60]
    }
    df = pd.DataFrame(mock_data)
    
    # Bins require 2 labels, but we only provide 1 (Invalid)
    bins = [0, 40, 100]
    invalid_labels = ['Only One Label']
    
    result_df = run_range_comparison(df, continuous_column='age', bins=bins, labels=invalid_labels, value_column='accuracy')
    
    assert result_df.empty