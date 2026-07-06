import pandas as pd
from src.storage.workspace.analyses.predetemined_analsis.analysis_group_box_plot import run_group_box_plot

def test_run_group_box_plot_success(tmp_path):
    """
    Test that run_group_box_plot successfully executes, returns True,
    and physically creates the boxplot image file in the designated path.
    """
    # Create mock categorical and numerical data
    mock_data = {
        'group': ['control', 'control', 'clinical', 'clinical'],
        'accuracy': [85, 90, 60, 65]
    }
    df = pd.DataFrame(mock_data)
    
    # Define a temporary image path using pytest's tmp_path fixture
    output_file = tmp_path / "boxplot.png"
    
    # Run the visualization boxplot module
    result = run_group_box_plot(df, group_column='group', value_column='accuracy', output_image_path=str(output_file))
    
    # Assertions: Verify function returned True and file was created
    assert result is True
    assert output_file.exists()
    assert output_file.stat().st_size > 0  # Verify the file is not empty

def test_run_group_box_plot_missing_column():
    """
    Test that providing a non-existent column name safely returns False.
    """
    mock_data = {
        'group': ['control', 'clinical'],
        'accuracy': [90, 60]
    }
    df = pd.DataFrame(mock_data)
    
    # Try running with a value column that doesn't exist
    result = run_group_box_plot(df, group_column='group', value_column='invalid_column')
    
    assert result is False