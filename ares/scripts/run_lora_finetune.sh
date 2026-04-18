#!/bin/bash

# Script: run_lora_finetune.sh
# Purpose: Executes MLX LoRA training on JSONL data with resource validation

set -euo pipefail

if [ ! -s corrections/training_data.jsonl ]; then
  echo "ERROR: training_data.jsonl is empty or missing" >&2
  exit 2
fi

required_bytes=$((16 * 1024 * 1024 * 1024))
total_memory_bytes=$(sysctl -n hw.memsize 2>/dev/null || echo 0)

if [ "$total_memory_bytes" -lt "$required_bytes" ]; then
  echo "ERROR: Available memory ($((total_memory_bytes / 1024 / 1024 / 1024)) GB) < 16GB" >&2
  exit 1
fi

mkdir -p models
mkdir -p logs

TIMESTAMP=$(date +%Y%m%d%H%M%S)
LOG_FILE="logs/finetune-${TIMESTAMP}.log"
OUTPUT_MODEL="models/adapter-${TIMESTAMP}.safetensors"

echo "Starting training with model: ${MLX_MODEL:-qwen3:30b-a3b}"
echo "Data: corrections/training_data.jsonl"
echo "Output: $OUTPUT_MODEL"
echo "Log: $LOG_FILE"

mlx_lora_train \
  --model "${MLX_MODEL:-qwen3:30b-a3b}" \
  --data "corrections/training_data.jsonl" \
  --output "$OUTPUT_MODEL" \
  2>&1 | tee -a "$LOG_FILE"

if [ $? -ne 0 ]; then
  echo "ERROR: Training failed (check $LOG_FILE)" >&2
  exit 3
fi

echo "SUCCESS: Model saved to $OUTPUT_MODEL"
exit 0
