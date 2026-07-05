import ast

alias_mapping = {}

with open("user_code.py", 'r', encoding='utf-8') as file:
    tree = ast.parse(file.read())
# Walk through the AST to find 'import X as Y' statements
for node in ast.walk(tree):
    if isinstance(node, ast.Import):
        for alias in node.names:
            # If the library was imported with an alias (e.g., 'as pd')
            if alias.asname:
                alias_mapping[alias.name] = alias.asname

print(alias_mapping)