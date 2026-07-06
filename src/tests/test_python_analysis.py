import pytest
from unittest.mock import MagicMock
from src.core.analysis import AnalysisInput, AnalysisCompletionStatus
from src.core.analysis_python import PythonAnalysis

@pytest.fixture
def mock_analysis_input():
    """
    Fixture to provide a mocked AnalysisInput with sample directory paths.
    """
    inp = MagicMock(spec=AnalysisInput)
    inp.input_dir = "/mock/input/dir"
    inp.output_dir = "/mock/output/dir"
    inp.parent_output = None
    return inp


# --- Core Functionality Tests ---

def test_python_analysis_metadata_and_string_representation():
    code = "def my_func():\n    return 'hello'"
    analysis = PythonAnalysis(analysis_id="anal_001", python_code=code)
    
    # Test type and serialization
    assert analysis.get_type_id() == "python"
    assert analysis.serialize() == {"python_code": code}
    
    # Verify that string representation contains PythonAnalysis name
    assert "PythonAnalysis" in str(analysis)
    assert "PythonAnalysis" in repr(analysis)


def test_python_analysis_deserialize():
    params = {"python_code": "print('hello')"}
    analysis = PythonAnalysis.deserialize(analysis_id="anal_003", params=params)
    
    assert isinstance(analysis, PythonAnalysis)
    assert analysis.analysis_id == "anal_003"
    assert analysis.python_code == "print('hello')"


# --- Run Execution Tests (Success & Arguments) ---

def test_run_success_with_result(mock_analysis_input):
    user_code = "result = f'Processed data from {input_dir}'"
    
    analysis = PythonAnalysis(analysis_id="test_run", python_code=user_code)
    output = analysis.run(mock_analysis_input)
    
    assert output.status == AnalysisCompletionStatus.SUCCESS
    assert output.returned_object == "Processed data from /mock/input/dir"
    assert output.analysis == analysis


def test_run_success_default_result(mock_analysis_input):
    user_code = "x = 10 + 20"
    
    analysis = PythonAnalysis(analysis_id="test_default", python_code=user_code)
    output = analysis.run(mock_analysis_input)
    
    assert output.status == AnalysisCompletionStatus.SUCCESS
    assert output.returned_object is True


def test_run_with_user_arguments(mock_analysis_input):
    user_code = "result = custom_multiplier * 10"
    gui_args = {"custom_multiplier": 5}
    
    analysis = PythonAnalysis(analysis_id="test_args", python_code=user_code, user_arguments=gui_args)
    output = analysis.run(mock_analysis_input)
    
    assert output.status == AnalysisCompletionStatus.SUCCESS
    assert output.returned_object == 50


# --- Edge Cases & Error Handling Tests ---

def test_run_runtime_error_in_user_code(mock_analysis_input):
    invalid_code = "result = 10 / 0"
    
    analysis = PythonAnalysis(analysis_id="test_div_zero", python_code=invalid_code)
    output = analysis.run(mock_analysis_input)
    
    assert output.status == AnalysisCompletionStatus.FAILURE
    assert output.returned_object is None


def test_run_syntax_error_in_user_code(mock_analysis_input):
    bad_syntax_code = "if x = 5"
    
    analysis = PythonAnalysis(analysis_id="test_syntax_err", python_code=bad_syntax_code)
    output = analysis.run(mock_analysis_input)
    
    assert output.status == AnalysisCompletionStatus.FAILURE
    assert output.returned_object is None