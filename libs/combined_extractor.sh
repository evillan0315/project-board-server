#!/bin/bash

# Title: Combined Markdown Code Extractor with Enhanced Title Detection
# Description: Extracts code blocks, detects Title inside code, saves files, processes src targets.

INPUT_FILE="$1"
OUTPUT_ROOT="output"

if [[ -z "$INPUT_FILE" ]]; then
  echo "Usage: $0 <input-markdown-file>"
  exit 1
fi

if [[ ! -f "$INPUT_FILE" ]]; then
  echo "Error: File '$INPUT_FILE' not found."
  exit 1
fi

mkdir -p "$OUTPUT_ROOT"
TMP_FILE=$(mktemp)

sanitize() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g'
}

# Mark block starts/ends
awk '
  BEGIN { in_block=0; lang="plain" }
  /^```/ {
    if (in_block) {
      print "__END_BLOCK__"
      in_block=0
    } else {
      lang=substr($0,4)
      gsub(/^[[:space:]]+|[[:space:]]+$/, "", lang)
      if (lang == "") lang="plain"
      print "__START_BLOCK__ " lang
      in_block=1
    }
    next
  }
  {
    if (in_block) print $0
  }
' "$INPUT_FILE" > "$TMP_FILE"

declare -A INDEX_MAP
CODE_FILES=()
LANG=""
TITLE=""
CODE_BLOCK=""

while IFS= read -r line; do
  if [[ "$line" == __START_BLOCK__* ]]; then
    LANG="${line#__START_BLOCK__ }"
    TITLE="untitled"
    CODE_BLOCK=""
  elif [[ "$line" == __END_BLOCK__ ]]; then
    # If title is still untitled, try to find in code block
    if [[ "$TITLE" == "untitled" ]]; then
      while IFS= read -r code_line; do
        if [[ "$code_line" =~ ^[[:space:]]*(#|//|\*|/\*\*?)[[:space:]]*Title:[[:space:]]*(.*) ]]; then
          TITLE="${BASH_REMATCH[2]}"
          break
        fi
      done <<< "$CODE_BLOCK"
    fi

    SAN_TITLE=$(sanitize "$TITLE")
    SAN_LANG=$(sanitize "$LANG")
    [[ -z "$SAN_TITLE" ]] && SAN_TITLE="untitled"
    [[ -z "$SAN_LANG" ]] && SAN_LANG="plain"

    EXT="txt"
    case "$SAN_LANG" in
      typescript) EXT="ts" ;;
      javascript) EXT="js" ;;
      bash|shell) EXT="sh" ;;
      python) EXT="py" ;;
      html) EXT="html" ;;
      css) EXT="css" ;;
      json) EXT="json" ;;
      markdown|md) EXT="md" ;;
    esac

    key="$SAN_LANG,$SAN_TITLE"
    INDEX_MAP["$key"]=$((INDEX_MAP["$key"] + 1))
    IDX=${INDEX_MAP["$key"]}

    DIR="$OUTPUT_ROOT/$SAN_TITLE/$SAN_LANG"
    mkdir -p "$DIR"
    FILE="$DIR/${SAN_LANG}-${IDX}.${EXT}"
    echo -n "$CODE_BLOCK" > "$FILE"
    echo "Saved: $FILE"
    CODE_FILES+=("$FILE")

  else
    # Check for title while reading
    if [[ "$line" =~ ^[[:space:]]*(#|//|\*|/\*\*?)[[:space:]]*Title:[[:space:]]*(.*) ]]; then
      TITLE="${BASH_REMATCH[2]}"
    fi
    CODE_BLOCK="${CODE_BLOCK}${line}"$'\n'
  fi
done < "$TMP_FILE"

rm "$TMP_FILE"

# Process each saved code file for // src/ targets
for CODE_FILE in "${CODE_FILES[@]}"; do
  echo "Processing $CODE_FILE for src target directories..."
  grep '^// src/' "$CODE_FILE" | while read -r src_line; do
    TARGET_DIR=$(echo "$src_line" | sed -E 's|// (src/[^ ]*)|\1|')
    mkdir -p "$(dirname "$TARGET_DIR")"

    awk -v target="$src_line" '
      BEGIN { in_block=0; }
      $0 == target { in_block=1; next }
      /^\/\/ src\// && in_block { exit }
      in_block { print }
    ' "$CODE_FILE" > "$TARGET_DIR"

    echo "Saved code block to $TARGET_DIR"
  done
done

