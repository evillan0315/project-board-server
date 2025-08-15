#!/bin/bash

# Title: Markdown Code Block Extractor with Title-based Folder
# Description: Extracts code blocks from Markdown, saves under output/<sanitized-title>/<language>/...

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

awk '
  BEGIN { in_block = 0; lang = "plain"; title = "untitled" }
  /^```/ {
    if (in_block) {
      print "__END_BLOCK__"
      in_block = 0
    } else {
      lang = substr($0, 4)
      if (lang == "") lang = "plain"
      print "__START_BLOCK__ " lang
      title = "untitled"
      in_block = 1
    }
    next
  }
  {
    if (in_block) {
      if ($0 ~ /^#* *Title:/) {
        sub(/^#* *Title:[[:space:]]*/, "", $0)
        title = $0
      }
      print $0
    }
  }
' "$INPUT_FILE" > "$TMP_FILE"

declare -A INDEX_MAP
LANG=""
TITLE=""
DIR=""

sanitize() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g'
}

while IFS= read -r line; do
  if [[ "$line" == __START_BLOCK__* ]]; then
    LANG="${line#__START_BLOCK__ }"
    INDEX_MAP["$LANG,${TITLE:-untitled}"]=0
    CODE_BLOCK=""
  elif [[ "$line" == __END_BLOCK__ ]]; then
    SAN_TITLE=$(sanitize "${TITLE:-untitled}")
    EXT="txt"
    case "$LANG" in
      typescript) EXT="ts" ;;
      javascript) EXT="js" ;;
      bash|shell) EXT="sh" ;;
      python) EXT="py" ;;
      html) EXT="html" ;;
      css) EXT="css" ;;
      json) EXT="json" ;;
      markdown|md) EXT="md" ;;
    esac

    INDEX_MAP["$LANG,$SAN_TITLE"]=$((INDEX_MAP["$LANG,$SAN_TITLE"]+1))
    IDX=${INDEX_MAP["$LANG,$SAN_TITLE"]}
    DIR="$OUTPUT_ROOT/$SAN_TITLE/$LANG"
    mkdir -p "$DIR"
    FILE="$DIR/${LANG}-${IDX}.${EXT}"

    echo -n "$CODE_BLOCK" > "$FILE"
    echo "Saved: $FILE"

  else
    if [[ "$line" =~ ^[[:space:]]*Title:[[:space:]]*(.*) ]]; then
      TITLE="${BASH_REMATCH[1]}"
    fi
    CODE_BLOCK="${CODE_BLOCK}${line}"$'\n'
  fi
done < "$TMP_FILE"

rm "$TMP_FILE"

