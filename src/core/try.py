import pathlib
import subprocess
import sys
import ast
import re

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
                        aliases[alias.name] = ""  # No alias, use the library name itself
    except Exception as e:
        print(f"Error parsing file {file_path}: {e}")
        
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
    name_file_path = "user_code.py"  # Reference file
    name_path = pathlib.Path(name_file_path)

    # 1. חילוץ המילונים משני הקבצים
    user_aliases = extract_import_aliases(user_path)
    if not user_aliases:
        return  # למשתמש אין קיצורים, אין מה לעדכן

    name_aliases = extract_import_aliases(name_path)

    # 2. מציאת הפערים: אילו ספריות קיימות בשני הקבצים אבל עם שם קיצור שונה?
    libraries_to_update = {}
    for lib_name, user_alias in user_aliases.items():
        if lib_name in name_aliases and name_aliases[lib_name] != user_alias:
            libraries_to_update[lib_name] = (user_alias,name_aliases[lib_name])

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
            pattern = rf'(\bimport\s+{re.escape(lib_name)}\s+as\s+){re.escape(old_alias)}\b'
            content = re.sub(pattern, rf'\g<1>{new_alias}', content)

        # 5. שמירת הקובץ המעודכן
        with open(user_path, 'w', encoding='utf-8') as file:
            file.write(content)
            
        print("Reference file updated successfully to match user aliases.")
        
    except Exception as e:
        raise ValueError(f"Failed to update reference file: {e}")



sync_import_aliases(pathlib.Path("jake.py"))  # Call the function to sync aliases

# jake1
import numpy as pop

def jake1(x,y):
	lon = pop.zeros(x)
	lat = pop.ones(y)