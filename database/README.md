
# Database Development Workflow

## 1. Export Schema (Run these MCP commands)

// Get all table schemas
f1e_list_tables({ project_id: "usmcnnvgdntpxjhhhplt" })

// Export key wallet data
f1e_execute_sql({ 
  project_id: "usmcnnvgdntpxjhhhplt", 
  query: "SELECT * FROM wallet_addresses;" 
})

f1e_execute_sql({ 
  project_id: "usmcnnvgdntpxjhhhplt", 
  query: "SELECT * FROM wallet_settings;" 
})

f1e_execute_sql({ 
  project_id: "usmcnnvgdntpxjhhhplt", 
  query: "SELECT * FROM token_overrides;" 
})

## 2. Schema Changes

Edit files in /database/ directory, then apply with:

f1e_apply_migration({
  project_id: "usmcnnvgdntpxjhhhplt",
  name: "fix_wallet_persistence", 
  query: "-- Your SQL here"
})

## 3. Test Changes

f1e_execute_sql({ 
  project_id: "usmcnnvgdntpxjhhhplt", 
  query: "-- Test queries here" 
})
