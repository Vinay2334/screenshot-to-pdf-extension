import re

def extract_index(file_path):
    match = re.search(r'(\d+)', file_path)
    return int(match.group(1)) if match else -1