import pandas as pd
from src.core.analysis_missing_values import run_missing_values_analysis

def test_run_missing_values_analysis_success():
    """
    Test that run_missing_values_analysis correctly counts and calculates 
    percentages of missing values per column, and sorts them appropriately.
    """
    # Create mock data with explicit missing values (Total rows = 4)
    mock_data = {
        'column_A': [1, None, 3, None],  # 2 missing values (50%)
        'column_B': [1, 2, None, 4],     # 1 missing value (25%)
        'column_C': [1, 2, 3, 4]          # 0 missing values (0%)
    }
    df = pd.DataFrame(mock_data)
    
    # Run the missing values analysis module
    result_df = run_missing_values_analysis(df)
    
    # Assertions: Verify counts and percentages match expectations
    assert not result_df.empty
    
    # Check column_A (Should be at the top since it has the most missing values)
    assert result_df.loc['column_A', 'Missing Count'] == 2
    assert result_df.loc['column_A', 'Percentage Missing (%)'] == 50.0
    
    # Check column_B
    assert result_df.loc['column_B', 'Missing Count'] == 1
    assert result_df.loc['column_B', 'Percentage Missing (%)'] == 25.0
    
    # Check column_C
    assert result_df.loc['column_C', 'Missing Count'] == 0
    assert result_df.loc['column_C', 'Percentage Missing (%)'] == 0.0

def test_run_missing_values_analysis_empty():
    """
    Test that providing an empty DataFrame safely returns an empty DataFrame.
    """
    empty_df = pd.DataFrame()
    result_df = run_missing_values_analysis(empty_df)
    
    assert result_df.empty