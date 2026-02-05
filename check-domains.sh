#!/bin/bash
# Quick domain availability checker
# Uses whois to check if domain is registered

echo "🔍 Checking domain availability for top name candidates..."
echo "================================================"
echo ""

domains=(
  "projo.com"
  "agentpm.com"
  "relaypm.com"
  "buildr.com"
  "nexflow.com"
  "flowly.com"
  "pulseflow.com"
  "vello.com"
  "zenko.com"
  "hubly.com"
)

for domain in "${domains[@]}"; do
  echo "Checking: $domain"
  
  # Try whois lookup
  result=$(whois "$domain" 2>&1 | grep -i "No match\|NOT FOUND\|Available\|No entries" | head -1)
  
  if [ -n "$result" ]; then
    echo "  ✅ AVAILABLE (might be available)"
  else
    registered=$(whois "$domain" 2>&1 | grep -i "Registrar:\|Creation Date:" | head -1)
    if [ -n "$registered" ]; then
      echo "  ❌ TAKEN (registered)"
    else
      echo "  ❓ UNKNOWN (check manually)"
    fi
  fi
  
  echo ""
  sleep 1  # Be nice to whois servers
done

echo "================================================"
echo "✅ Check complete! Verify results manually at:"
echo "   - https://www.namecheap.com"
echo "   - https://domains.google.com"
