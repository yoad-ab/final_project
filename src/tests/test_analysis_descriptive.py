import pandas as pd
from src.storage.workspace.analyses.predetemined_analsis.analysis_descriptive import run_descriptive_summary

def test_run_descriptive_summary_success():
    """
    Test that run_descriptive_summary correctly calculates statistical metrics
    (like mean, min, max) for a valid numerical DataFrame.
    """
    # Create a small mock DataFrame with known statistics
    mock_data = {
        'score': [70, 80, 90]  # Mean should be 80.0, Min: 70.0, Max: 90.0
    }
    df = pd.DataFrame(mock_data)
    
    # Run the descriptive analysis module
    result_df = run_descriptive_summary(df)
    
    # Assertions: Verify the output matches expectations
    assert not result_df.empty
    assert result_df.loc['mean', 'score'] == 80.0
    assert result_df.loc['min', 'score'] == 70.0
    assert result_df.loc['max', 'score'] == 90.0

def test_run_descriptive_summary_empty():
    """
    Test that providing an empty DataFrame safely returns an empty DataFrame.
    """
    empty_df = pd.DataFrame()
    result_df = run_descriptive_summary(empty_df)
    
    assert result_df.empty