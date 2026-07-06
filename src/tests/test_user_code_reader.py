import pytest
import pathlib
import sys
import ast
from unittest.mock import MagicMock, patch
import pandas as pd  # Used as a standard installed library example

# Import the functions from your code module
# Replace 'src.core.user_code_reader' with the actual path if different
from src.core.user_code_reader import (
    get_code_path,
    return_function_name,
    check_imports,
    create_user_code_file,
    extract_import_aliases
)

# --- Tests for return_function_name ---

def test_return_function_name_success():
    code = (
        "# my_research_analysis\n"
        "def my_research_analysis(df):\n"
        "    return df.describe()\n"
    )
    assert return_function_name(code) == "my_research_analysis"

def test_return_function_name_empty_or_invalid():
    assert return_function_name("") == ""
    assert return_function_name("def no_comment(): pass") == ""

def test_return_function_name_mismatch():
    code = (
        "# wrong_name_comment\n"
        "def actual_function_name():\n"
        "    pass\n"
    )
    with pytest.raises(ValueError, match="not found in the code"):
        return_function_name(code)


# --- Tests for check_imports ---

def test_check_imports_all_installed():
    # 'pandas' and 'sys' are guaranteed to be in the testing environment
    code = "import pandas as pd\nimport sys"
    is_valid, msg = check_imports(code)
    assert is_valid is True
    assert msg is None

def test_check_imports_missing_module():
    code = "import non_existent_bizarre_library_xyz"
    is_valid, msg = check_imports(code)
    assert is_valid is False
    assert "not installed" in msg


# --- Tests for create_user_code_file ---

@patch("src.core.user_code_reader.get_code_path")
def test_create_user_code_file_success(mock_get_code_path, tmp_path):
    code = (
        "# process_data\n"
        "def process_data():\n"
        "    print('hello')\n"
    )
    # Redirect the file creation to pytest's temporary directory
    target_file = tmp_path / "process_data.py"
    mock_get_code_path.return_value = target_file

    func_name = create_user_code_file(code)
    
    assert func_name == "process_data"
    assert target_file.exists()
    assert target_file.read_text(encoding="utf-8") == code

def test_create_user_code_file_syntax_error():
    invalid_code = "def invalid_syntax_here("
    with pytest.raises(SyntaxError):
        create_user_code_file(invalid_code)


# --- Tests for extract_import_aliases ---

def test_extract_import_aliases(tmp_path):
    code_content = (
        "import pandas as pd\n"
        "import numpy as np\n"
        "import os\n"
    )
    test_file = tmp_path / "mock_analysis.py"
    test_file.write_text(code_content, encoding="utf-8")
    
    aliases = extract_import_aliases(test_file)
    
    assert aliases["pandas"] == "pd"
    assert aliases["numpy"] == "np"
    assert aliases["os"] == "os"  # No alias fallback


# --- Mocking Subprocess and Venv Execution Flow ---

@patch("src.core.user_code_reader.subprocess.check_call")
@patch("src.core.user_code_reader.venv.create")
def test_create_venv_flow(mock_venv_create, mock_subprocess, tmp_path):
    from src.core.user_code_reader import create_venv
    
    venv_dir = tmp_path / "test_env"
    create_venv(venv_dir)
    
    # Verify that venv.create was invoked with the right directory
    mock_venv_create.assert_called_once_with(venv_dir, with_pip=True)