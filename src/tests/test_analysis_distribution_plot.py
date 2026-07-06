import pandas as pd
from src.core.analysis_distribution_plot import run_distribution_plot

def test_run_distribution_plot_success(tmp_path):
    """
    Test that run_distribution_plot successfully runs, returns True,
    and physically creates the output image file in the designated path.
    """
    # Create mock numerical data
    mock_data = {
        'age': [23, 25, 31, 35, 40, 42, 50]
    }
    df = pd.DataFrame(mock_data)
    
    # Define a temporary image path using pytest's tmp_path fixture
    output_file = tmp_path / "distribution.png"
    
    # Run the visualization module
    result = run_distribution_plot(df, column_name='age', output_image_path=str(output_file))
    
    # Assertions: Verify function returned True and file was created
    assert result is True
    assert output_file.exists()
    assert output_file.stat().st_size > 0  # Verify the file is not empty

def test_run_distribution_plot_missing_column():
    """
    Test that providing a non-existent column name safely returns False.
    """
    mock_data = {'age': [20, 30, 40]}
    df = pd.DataFrame(mock_data)
    
    # Try running with a column that doesn't exist
    result = run_distribution_plot(df, column_name='invalid_column')
    
    assert result is False
    