import pandas as pd
from src.core.analysis_correlation_plot import run_correlation_plot

def test_run_correlation_plot_success(tmp_path):
    """
    Test that run_correlation_plot successfully executes, returns True,
    and physically creates the scatter/correlation plot image file.
    """
    # Create mock continuous data
    mock_data = {
        'age': [22, 28, 35, 45, 50, 65],
        'accuracy': [95, 90, 88, 82, 80, 72]
    }
    df = pd.DataFrame(mock_data)
    
    # Define a temporary image path using pytest's tmp_path fixture
    output_file = tmp_path / "correlation.png"
    
    # Run the visualization correlation module
    result = run_correlation_plot(df, x_column='age', y_column='accuracy', output_image_path=str(output_file))
    
    # Assertions: Verify function returned True and file was created
    assert result is True
    assert output_file.exists()
    assert output_file.stat().st_size > 0  # Verify the file is not empty

def test_run_correlation_plot_missing_column():
    """
    Test that providing a non-existent column name safely returns False.
    """
    mock_data = {
        'age': [20, 30, 40],
        'accuracy': [90, 80, 70]
    }
    df = pd.DataFrame(mock_data)
    
    # Try running with an invalid X column
    result = run_correlation_plot(df, x_column='invalid_column', y_column='accuracy')
    
    assert result is False