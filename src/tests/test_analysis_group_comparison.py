import pandas as pd
from src.storage.workspace.analyses.predetemined_analsis.analysis_group_comparison import run_group_comparison

def test_run_group_comparison_success():
    """
    Test that run_group_comparison correctly groups data and calculates 
    the requested metric (mean) for each group.
    """
    # Create mock data (Control mean: 80.0, Clinical mean: 55.0)
    mock_data = {
        'group': ['control', 'control', 'clinical', 'clinical'],
        'score': [70, 90, 50, 60]
    }
    df = pd.DataFrame(mock_data)
    
    # Run the group comparison module
    result_df = run_group_comparison(df, group_column='group', value_column='score', agg_metric='mean')
    
    # Assertions: Verify output is correct and structure is as expected
    assert not result_df.empty
    assert result_df.loc['control', 'score_mean'] == 80.0
    assert result_df.loc['clinical', 'score_mean'] == 55.0

def test_run_group_comparison_invalid_column():
    """
    Test that providing a non-existent column name safely returns an empty DataFrame.
    """
    mock_data = {
        'group': ['control', 'clinical'],
        'score': [80, 60]
    }
    df = pd.DataFrame(mock_data)
    
    # Try running with a missing value column
    result_df = run_group_comparison(df, group_column='group', value_column='invalid_column')
    
    assert result_df.empty