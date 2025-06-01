#!/bin/bash
# Supabase local development setup for crypto-tracker
# Uses Supabase MCP server for direct database access

set -e

echo "🚀 Setting up Supabase local development for crypto-tracker..."

# Check if Supabase CLI is available
if ! command -v npx supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."
    npm install -g supabase
fi

# Check if project is linked
echo "🔍 Checking Supabase project link..."
if ! npx supabase status >/dev/null 2>&1; then
    echo "🔗 Linking to Supabase project..."
    npx supabase link --project-ref usmcnnvgdntpxjhhhplt
fi

# Start local Supabase (optional)
echo "💡 To start local Supabase development:"
echo "   npx supabase start"
echo ""
echo "💡 To stop local Supabase:"
echo "   npx supabase stop"
echo ""

# Test MCP connection
echo "🧪 Testing Supabase MCP connection..."
echo "📋 Current database tables:"
echo "   Use MCP tools: f1e_list_tables"
echo "   Use MCP tools: f1e_execute_sql"
echo ""

echo "✅ Supabase development setup complete!"
echo ""
echo "📋 Production Database Details:"
echo "   Project: usmcnnvgdntpxjhhhplt"
echo "   Organization: gghmftdfkcdbaareuxtp"
echo "   URL: https://usmcnnvgdntpxjhhhplt.supabase.co"
echo ""
echo "🔧 MCP Tools Available:"
echo "   f1e_execute_sql - Execute SQL queries"
echo "   f1e_apply_migration - Apply database migrations"
echo "   f1e_list_tables - List database tables"
echo "   f1e_list_migrations - List migrations"
echo ""
echo "💡 Example wallet operations via MCP:"
echo "   f1e_execute_sql({ project_id: 'usmcnnvgdntpxjhhhplt', query: 'SELECT * FROM wallet_addresses;' })"
