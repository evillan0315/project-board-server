#!/bin/bash

set -e

INPUT_SCHEMA="$1"
OUTPUT_JSON="${2:-prisma_models.json}"

if [ -z "$INPUT_SCHEMA" ]; then
  echo "❌ Usage: $0 <schema.prisma> [output.json]"
  exit 1
fi

if [ ! -f "$INPUT_SCHEMA" ]; then
  echo "❌ File not found: $INPUT_SCHEMA"
  exit 1
fi

TMP_FILE=$(mktemp)

echo "📂 Converting $INPUT_SCHEMA to $OUTPUT_JSON..."

awk '
BEGIN {
  print "{"
  print "  \"models\": {"
  first_model = 1
}

/^model / {
  if (!first_model) {
    print model_json
    print "    }," 
  }
  model_name = $2
  model_json = "    \"" model_name "\": {\n"
  field_list = ""
  index_list = ""
  field_count = 0
  index_count = 0
  in_model = 1
  next
}

/^}/ {
  if (in_model) {
    model_json = model_json "      \"fields\": {\n" field_list "\n      }"
    if (index_count > 0) {
      model_json = model_json ",\n      \"indexes\": [\n" index_list "\n      ]"
    }
    first_model = 0
    in_model = 0
  } else if (in_enum) {
    enum_json = enum_json "\n    ]"
    enum_list[enum_index] = enum_json
    in_enum = 0
  }
  next
}

/^enum / {
  if (first_enum == 0) {
    enum_index++
  }
  if (enum_index == 0) {
    print model_json
    print "    }"
    print "  },"
    print "  \"enums\": {"
  } else {
    print ","
  }

  enum_name = $2
  enum_json = "    \"" enum_name "\": ["
  first_enum = 0
  in_enum = 1
  first_enum_value = 1
  next
}

in_model && /^@@/ {
  gsub(/"/, "\\\"")
  if (index_count > 0) {
    index_list = index_list ",\n        \"" $0 "\""
  } else {
    index_list = "        \"" $0 "\""
  }
  index_count++
  next
}

in_model && NF > 0 {
  field = $1
  type = $2
  annotation = ""
  relation = ""

  for (i = 3; i <= NF; i++) {
    annotation = annotation " " $i
    if ($i ~ /@relation/) {
      relation = $i
    }
  }
  gsub(/^[ \t]+/, "", annotation)
  gsub(/[ \t]+$/, "", annotation)
  gsub(/"/, "\\\"", annotation)

  field_json = "        \"" field "\": {\"type\": \"" type "\", \"annotation\": \"" annotation "\""
  if (relation != "") {
    field_json = field_json ", \"relation\": \"" relation "\""
  }
  field_json = field_json "}"

  if (field_count > 0) {
    field_list = field_list ",\n" field_json
  } else {
    field_list = field_json
  }
  field_count++
  next
}

in_enum && NF > 0 {
  if (first_enum_value == 0) {
    enum_json = enum_json ",\n      \"" $1 "\""
  } else {
    enum_json = enum_json "\n      \"" $1 "\""
    first_enum_value = 0
  }
}

END {
  if (in_model) {
    model_json = model_json "      \"fields\": {\n" field_list "\n      }"
    if (index_count > 0) {
      model_json = model_json ",\n      \"indexes\": [\n" index_list "\n      ]"
    }
    print model_json
    print "    }"
  } else if (!first_model) {
    print model_json
    print "    }"
  }

  if (enum_index >= 0) {
    for (i = 0; i <= enum_index; i++) {
      if (i > 0) {
        print ","
      }
      print enum_list[i]
    }
    print ""
    print "  }"
  } else {
    print "  }"
  }

  print "}"
}
' "$INPUT_SCHEMA" > "$TMP_FILE"

echo "📂 Validating JSON..."
jq . "$TMP_FILE" > "$OUTPUT_JSON" || {
  echo "❌ jq failed to parse generated JSON. See raw file below:"
  cat "$TMP_FILE"
  exit 1
}

rm "$TMP_FILE"

echo "✅ Successfully generated pretty-printed JSON at $OUTPUT_JSON"

