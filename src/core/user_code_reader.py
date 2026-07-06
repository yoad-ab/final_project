import ast
import importlib
import subprocess
import sys
import pathlib
import venv
import os
import re
from typing import Dict

user_made_code_dir = pathlib.Path(__file__).parent / 'user_made_code'  # Directory to store user code files

def get_code_path(function_name: str) -> pathlib.Path:
    """
    Returns the path to the user's code file based on the function name.

    Parameters
    ----------
    function_name : str
        The name of the function defined in the user's code.

    Returns
    -------
    code_path : pathlib.Path
        The path to the user's code file.
    """
    return user_made_code_dir / f"{function_name}.py"

def get_venv_paths(venv_path: pathlib.Path) -> tuple:
    """
    Resolves the paths to the Python executable and site-packages inside the venv.

    Parameters
    ----------
    venv_path : pathlib.Path
        The root directory of the virtual environment.

    Returns
    -------
    paths : tuple
        A tuple containing (python_executable_path, site_packages_path).
    """
    if os.name == 'nt':  # Windows environment
        python_exe = venv_path / "Scripts" / "python.exe"
        site_packages = venv_path / "Lib" / "site-packages"
    else:  # macOS / Linux environment
        python_exe = venv_path / "bin" / "python"
        # Find the dynamic python version folder (e.g., lib/python3.10/site-packages)
        lib_dir = venv_path / "lib"
        try:
            python_version_dir = next(lib_dir.glob("python*"))
            site_packages = python_version_dir / "site-packages"
        except StopIteration:
            site_packages = lib_dir  # Fallback if not found
            
    return python_exe, site_packages

def return_function_name(code_string: str) -> str:
    """
    Extracts the function name from the first line of a multi-line code string,
    which is expected to be a comment containing the function name.

    Parameters
    ----------
    code_string : str
        The multi-line string containing the user's Python code.

    Returns
    -------
    function_name : str
        The name of the function specified in the first line, or an empty string if not found.
    """
    # בדיקת תקינות בסיסית לקלט ריק
    if not code_string or not code_string.strip():
        return ""

    lines = code_string.splitlines()
    first_line = lines[0].strip()

    # מוודאים שהשורה הראשונה אכן מתחילה בסולמית ורווח
    if not (first_line.startswith("#")):
        return ""

    # חילוץ השם שהמשתמש כתב בהערה (כל מה שאחרי הסולמית והרווח)
    expected_name = first_line[1:].strip()

    tree = ast.parse(code_string)

    # יצירת רשימה של כל שמות הפונקציות שהוגדרו בקוד
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and expected_name == node.name:
            return node.name
    raise ValueError(f"Function name '{expected_name}' not found in the code.")

def create_user_code_file(code_text: str, file_path: pathlib.Path) -> str:
    """
    Creates a Python file with the provided code string.

    Parameters
    ----------
    code_text : str
        The multi-line string containing the user's Python code.
    file_path : pathlib.Path
        The path where the Python file should be created.
    """
    try:
        ast.parse(code_text)
    except SyntaxError as e:
        raise SyntaxError(f"Syntax error in the provided code: {e}")    
    try:
        f_name = return_function_name(code_text)
        path_name = get_code_path(f_name)
        if not f_name:
            raise ValueError("Function name not found")
    except ValueError as e:
        raise ValueError(f"cant find function name: {e}")
    
    # Step 3: Write code to file
    try:
        if(pathlib.Path(path_name).exists()):
            raise FileExistsError(f"File '{f_name}.py' already exists. Please choose a different function name.")
        with open(pathlib.Path(path_name), "w", encoding="utf-8") as f:
            f.write(code_text)
    except IOError as e:
        raise IOError(f"File Error: {e}")
    return f_name

def create_venv(venv_path: pathlib.Path) -> None:
    if not venv_path.exists():
        # TODO: Update GUI here -> "Creating virtual environment, please wait..."
        print("Creating virtual environment...") 
        venv.create(venv_path, with_pip=True)

def init_venv(venv_path: pathlib.Path, file_path: pathlib.Path) -> None:
    # Resolve venv paths
    python_exe, site_packages = get_venv_paths(venv_path)

    # Inject the venv's site-packages into the current runtime environment
    if str(site_packages) not in sys.path:
        sys.path.insert(0, str(site_packages))
        
    # Inject the user's file directory so it can be imported
    if str(file_path.parent) not in sys.path:
        sys.path.insert(0, str(file_path.parent))

    module_name = file_path.stem

    # Step 4: Try loading the module and catch missing libraries
    try:
        if module_name in sys.modules:
            importlib.reload(sys.modules[module_name])
        else:
            importlib.import_module(module_name)
            
    except ModuleNotFoundError as e:
        missing_package = e.name
        # TODO: Update GUI here -> f"Installing missing package: {missing_package}..."
        print(f"Missing library '{missing_package}'. Installing via venv...")
        
        try:
            # Run installation using the venv's Python executable
            subprocess.check_call([str(python_exe), "-m", "pip", "install", missing_package])
            
            # Retry importing the module after installation
            if module_name in sys.modules:
                importlib.reload(sys.modules[module_name])
            else:
                importlib.import_module(module_name)
                
            # TODO: Update GUI here -> "Installation complete!"
            print(f"Successfully installed and loaded '{missing_package}'.")

        except ModuleNotFoundError as e:
            file_path.unlink()  # Remove the user code file if the import fails
            raise RuntimeError(f"Failed to import '{missing_package}' even after installation: {e}") 
        except subprocess.CalledProcessError:
            file_path.unlink()  # Remove the user code file if the installation fails
            raise RuntimeError(f"Failed to install '{missing_package}'.") # TODO: Show error in GUI
            
    except Exception as e:
        raise RuntimeError(f"Unexpected error: {e}")


def extract_import_aliases(file_path: pathlib.Path) -> dict[str, str]:
    """
    extracts 'import X as Y' statements from a Python file.

    Parameters
    ----------
    file_path : pathlib.Path
        The path to the Python file.

    Returns
    -------
    aliases : dict
        A dictionary mapping library names to their aliases (e.g., {'pandas': 'pd'}).
    """
    aliases = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            tree = ast.parse(file.read())
            
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    if alias.asname:
                        aliases[alias.name] = alias.asname
                    else:
                        aliases[alias.name] = alias.name  # No alias, use the library name itself
    except Exception as e:
        raise ValueError(f"Error parsing file {file_path}: {e}")
        
    return aliases

def sync_import_aliases(user_path: pathlib.Path) -> None:
    """
    Compares the aliases in the name_file (reference) with the user_file.
    If they differ, updates the name_file to match the user's aliases.

    Parameters
    ----------
    user_path : pathlib.Path
        The path to the user's file serving as the source of truth.
    """
    pep8_file_path = "pep8_aliases_file.py"  # Reference file
    pep_path = pathlib.Path(pep8_file_path)

    # 1. חילוץ המילונים משני הקבצים
    user_aliases = extract_import_aliases(user_path)
    if not user_aliases:
        return  # למשתמש אין קיצורים, אין מה לעדכן

    pep8_aliases = extract_import_aliases(pep_path)

    # 2. מציאת הפערים: אילו ספריות קיימות בשני הקבצים אבל עם שם קיצור שונה?
    libraries_to_update = {}
    for lib_name, user_alias in user_aliases.items():
        if lib_name in pep8_aliases and pep8_aliases[lib_name] != user_alias:
            libraries_to_update[lib_name] = (user_alias,pep8_aliases[lib_name])

    if not libraries_to_update:
        return  # הקבצים כבר זהים, חוסכים פעולות כתיבה (I/O) מיותרות!

    # 3. קריאת קובץ הייחוס לעדכון
    try:
        with open(user_path, 'r', encoding='utf-8') as file:
            content = file.read()

        # 4. ביצוע החלפה כירורגית ויעילה בעזרת Regex
        for lib_name, (old_alias, new_alias) in libraries_to_update.items():
            # מוצאים בדיוק את התבנית: "import pandas as pd"
            # \g<1> שומר על החלק הראשון של המשפט ("import pandas as ") ומחליף רק את הקיצור
            if lib_name == old_alias:
                content = content.replace(f"{lib_name}", f"{new_alias}")
                content = content.replace(f"import {new_alias}", f"import {lib_name} as {new_alias}")
            else:
                content = content.replace(f"{old_alias}", f"{new_alias}")

        # 5. שמירת הקובץ המעודכן
        with open(user_path, 'w', encoding='utf-8') as file:
            file.write(content)
                    
    except Exception as e:
        raise ValueError(f"Failed to update reference file: {e}")


def process_and_run_with_venv(code_text: str, file_path: pathlib.Path, venv_path: pathlib.Path) -> None:
    """
    Validates syntax, sets up a local venv, installs missing dependencies, 
    and dynamically loads the user code.

    Parameters
    ----------
    code_text : str
        The raw Python code string provided by the user via the GUI.
    file_path : pathlib.Path
        The destination path where the valid code should be saved.
    venv_path : pathlib.Path
        The path where the local virtual environment should be created.
    """
    # Step 1: Validate syntax before doing anything else
    f_name = create_user_code_file(code_text, file_path)


    # Step 2: Ensure virtual environment exists
    create_venv(venv_path)
    user_path = get_code_path(f_name)
    # Step 3: Get paths to the Python executable and site-packages in the venv
    init_venv(venv_path, user_path)

    sync_import_aliases(user_path)