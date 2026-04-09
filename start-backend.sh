#!/bin/bash
cd "$(dirname "$0")/backend"
echo "Starting Mission Data Grid Backend..."
echo "Note: This requires sudo for packet sniffing"
sudo python3 main.py
