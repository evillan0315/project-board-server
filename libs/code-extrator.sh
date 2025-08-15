#!/bin/bash

# Title: Code Extractor by Target Directory
# Description: This script reads a code file, finds all `// src/target directory` declarations,
#              and saves the code content into the specified directories. 
#              It supports multiple `src target directory` declarations in one code file.

INPUT_FILE="$1"

if [[ -z "$INPUT_FILE" ]]; then
  echo "Usage: $0 <input-code-file>"
  exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "Error: File '$INPUT_FILE' not found."
  exit 1
fi

# Process each target directory found
grep '^// src/' "$INPUT_FILE" | while read -r line; do
  TARGET_DIR=$(echo "$line" | sed -E 's|// (src/[^ ]*)|\1|')
  FILE_NAME=$(basename "$TARGET_DIR")
  DIR_PATH=$(dirname "$TARGET_DIR")

  # Ensure directory exists
  mkdir -p "$DIR_PATH"

  # Extract code starting from this src target to the next src target or end of file
  awk -v target="$line" '
    BEGIN { in_block=0; }
    $0 == target { in_block=1; next }
    /^\/\/ src\// && in_block { exit }
    in_block { print }
  ' "$INPUT_FILE" > "$TARGET_DIR"

  echo "Saved code block to $TARGET_DIR"
done

