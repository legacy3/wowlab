#!/bin/sh
set -e

# Generate a short unique identifier from machine ID
short_id() {
  echo "${FLY_MACHINE_ID:-dev}" | cut -c1-6
}

# Convert region to uppercase
region() {
  echo "${FLY_REGION:-local}" | tr '[:lower:]' '[:upper:]'
}

# Build node name: REGION-shortid (e.g., LHR-185023)
node_name() {
  echo "$(region)-$(short_id)"
}

export CENTRIFUGO_NODE_NAME="$(node_name)"

exec centrifugo -c /centrifugo/config.json "$@"
