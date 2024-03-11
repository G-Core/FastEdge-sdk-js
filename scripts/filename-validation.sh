#!/bin/bash

# Paths to ignore
ignore_paths=(
  "./fastedge-runtime/spidermonkey"
  "./node_modules"
  "./fastedge-runtime/cbindings/build"
)
# Need to figure out single file exclusions e.g.
# "../fastedge-runtime/cbindings/wit-interface/http_reactor.h"

# File extensions to include
file_extensions=("*.yaml" "*.yml" "*.cpp" )
# file_extensions=("*.yaml" "*.yml" "*.cpp" "*.h")

# # Start of the find command
find_cmd="find ./ \( "

# Add file extensions to find command
for ext in "${file_extensions[@]}"; do
  find_cmd+="-name '$ext' -o "
done

# Remove the trailing -o and add the closing parenthesis
find_cmd="${find_cmd::-3}\)"

# # Find command
# find_cmd="find ../ \( -name '*.yaml' -o -name '*.yml' -o -name '*.cpp' \)"

# Add ignore paths to find command
for path in "${ignore_paths[@]}"; do
  find_cmd+=" -not -path '$path/*'"
done

# Find all yaml files in the repo, excluding ignore paths
files=$(eval $find_cmd)

# Regex to match kebab-case
regex="^[a-z0-9]+(-[a-z0-9]+)*$"

error=false

# Check each file
for file in $files; do
  # Extract the filename without the extension
  filename=$(basename -- "$file")
  filename="${filename%.*}"

  # Check if the filename matches the regex
  if [[ ! $filename =~ $regex ]]; then
    echo "Error: $file is not in kebab-case"
    error=true
  fi
done

# If there was an error, exit with a non-zero status code
if $error; then
  exit 1
fi
