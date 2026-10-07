#!/usr/bin/env python3
"""Promote the tested game to the main game; does not commit, push or deploy."""
from pathlib import Path
import shutil

root = Path(__file__).resolve().parents[1]
shutil.copyfile(root / 'test' / 'index.html', root / 'index.html')
print('Copied test/index.html to index.html. Review git diff before deploying.')
