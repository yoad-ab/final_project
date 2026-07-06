import pandas as pd
from src.core.analysis_categorical import run_categorical_distribution

def test_run_categorical_distribution_success():
    """
    Test that run_categorical_distribution correctly calculates frequencies 
    and percentages for a valid categorical column.
    """
    # Create mock data: 3 clinical and 1 control (Total = 4)
    mock_data = {
        'group': ['clinical', 'clinical', 'clinical', 'control']
    }
    df = pd.DataFrame(mock_data)
    
    # Run the categorical analysis module
    result_df = run_categorical_distribution(df, 'group')
    
    # Assertions: Verify counts and percentages match expectations
    assert not result_df.empty
    assert result_df.loc['clinical', 'Count'] == 3
    assert result_df.loc['clinical', 'Percentage (%)'] == 75.0
    assert result_df.loc['control', 'Count'] == 1
    assert result_df.loc['control', 'Percentage (%)'] == 25.0

def test_run_categorical_distribution_missing_column():
    """
    Test that providing a column name that doesn't exist safely returns an empty DataFrame.
    """
    mock_data = {'group': ['clinical', 'control']}
    df = pd.DataFrame(mock_data)
    
    # Try running with a non-existent column name
    result_df = run_categorical_distribution(df, 'non_existent_column')
    
    assert result_df.empty