#!/bin/bash

set -e

if [ $# -eq 0 ]; then
  echo "❌ Usage:"
  echo "  $0 '<json-string>'"
  echo "  $0 path/to/file.json"
  exit 1
fi

INPUT="$1"

# Check if input is a file
if [ -f "$INPUT" ]; then
  echo "📂 Validating JSON file: $INPUT"
  if jq empty "$INPUT" > /dev/null 2>&1; then
    echo "✅ Valid JSON file: $INPUT"
    echo "🎨 Auto-formatting..."
    jq . "$INPUT"
  else
    echo "❌ Invalid JSON in file: $INPUT"
    jq empty "$INPUT"
    exit 1
  fi
else
  echo "📂 Validating JSON string..."
  if echo "$INPUT" | jq empty > /dev/null 2>&1; then
    echo "✅ Valid JSON string"
    echo "🎨 Auto-formatting..."
    echo "$INPUT" | jq .
  else
    echo "❌ Invalid JSON string"
    echo "$INPUT" | jq empty
    exit 1
  fi
fi

