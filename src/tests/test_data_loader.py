import pathlib
import pytest
import pandas as pd
import shutil
from src.core.data_loader import load_and_register_dataset

def test_missing_file_returns_none():
    """Test that providing a non-existent file path safely returns None."""
    result = load_and_register_dataset("this_file_does_not_exist.csv")
    assert result is None

def test_unsupported_extension_returns_none(tmp_path):
    """Test that uploading an unsupported file format (.png) is blocked and returns None."""
    # tmp_path is a built-in pytest feature that creates a temporary folder automatically
    invalid_file = tmp_path / "test_image.png"
    invalid_file.write_text("fake image contents")
    
    result = load_and_register_dataset(invalid_file, storage_dir=tmp_path / "storage")
    assert result is None

def test_corrupted_file_returns_none(tmp_path):
    """Test that a corrupted or unreadable CSV file is blocked and returns None."""
    corrupted_file = tmp_path / "broken_data.csv"
    with open(corrupted_file, "wb") as f:
        f.write(b'\x80\x81\x82\xff') # Invalid binary bytes
        
    result = load_and_register_dataset(corrupted_file, storage_dir=tmp_path / "storage")
    assert result is None

def test_valid_file_registration(tmp_path):
    """Test that a valid CSV file is successfully registered and returns a DataFrame."""
    valid_file = tmp_path / "good_data.csv"
    valid_file.write_text("id,score\n1,100\n2,90")
    
    storage_dir = tmp_path / "storage"
    df = load_and_register_dataset(valid_file, storage_dir=storage_dir)
    
    # Assertions to verify it worked perfectly
    assert df is not None
    assert isinstance(df, pd.DataFrame)
    assert "score" in df.columns