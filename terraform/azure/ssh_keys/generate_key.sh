#!/usr/bin/env bash
set -euo pipefail

OUT_DIR="$(pwd)"
KEY_NAME="cherry_pick_key"

if [ -f "${OUT_DIR}/${KEY_NAME}" ]; then
  echo "Key already exists: ${OUT_DIR}/${KEY_NAME}"
  exit 0
fi

ssh-keygen -t rsa -b 4096 -f "${OUT_DIR}/${KEY_NAME}" -N ""
echo "Generated ${OUT_DIR}/${KEY_NAME} and ${OUT_DIR}/${KEY_NAME}.pub"
