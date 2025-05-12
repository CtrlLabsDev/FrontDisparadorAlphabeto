#!/bin/bash

echo "🔄 Reiniciando Frontend com PM2..."
cd "$(dirname "$0")"

# Reinicia o processo PM2 com o nome "frontend"
pm2 restart frontend
