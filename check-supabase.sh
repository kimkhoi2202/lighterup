#!/bin/bash

echo "=== Checking Docker ==="
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker Desktop."
    exit 1
fi

echo "✅ Docker is running"
echo ""

echo "=== Checking Supabase CLI ==="
if ! command -v npx &> /dev/null; then
    echo "❌ npx is not available"
    exit 1
fi

echo "✅ Supabase CLI available via npx"
echo ""

echo "=== Checking Supabase Status ==="
cd "$(dirname "$0")"
npx supabase status 2>&1

echo ""
echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -i supabase || echo "No Supabase containers found"

