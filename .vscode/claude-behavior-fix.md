# Claude Repetitive Behavior Fix

## Issue
Claude was exhibiting repetitive behavior where it would repeatedly state intentions to perform actions (like "I'll boost your prompt" or "I'll investigate") without actually executing the tools.

## Root Causes Identified & Fixed

### 1. Sequential-Thinking MCP Server - RESTORED WITH PROPER USAGE
- **Problem**: Was causing looping thought patterns when used incorrectly
- **Fix**: Re-enabled but with clear usage guidelines - use for planning ONCE, then execute
- **Status**: ✅ FIXED - Now using sequential thinking to PREVENT repetition, not cause it

### 2. Tool Execution Guidelines
To prevent this behavior in the future:

- **Always execute tools immediately** when stating an intention
- **Don't repeat the same intention** without taking action
- **Use the `think` tool** for complex reasoning, then act
- **Be direct and action-oriented** in responses

### 3. MCP Server Monitoring
Current active servers (all enabled):
- `sequential-thinking` - **For structured planning to AVOID repetition**
- `playwright` - Browser automation
- `windows-cli` - Windows command execution  
- `basic-memory` - Note-taking and memory
- `supabase` - Database operations
- `fetch` - Web requests
- `solver` - Z3 constraint solving
- `debug-shell` - Shell debugging
- `filesystem` - File operations
- `time` - Time utilities

### 4. Sequential Thinking Usage Rules
1. **Use f1e_sequentialthinking to plan complex responses ONCE**
2. **After planning, execute actions immediately without re-planning**
3. **Never repeat the same thought - each thought should progress forward**
4. **Use it to break down complex tasks into clear action steps**
5. **Think → Act → Done (no loops)**

### 5. Prevention Rules
1. If you catch yourself saying "I'll do X" - immediately do X or use sequential thinking to plan ONCE
2. If you find yourself repeating the same statement, STOP and use f1e_sequentialthinking to break the loop
3. Always prefer action over explanation
4. Use tools decisively rather than explaining what you're going to use them for
5. **Sequential thinking is for PLANNING, not endless analysis**
6. If you need to look at anything related to supabase use the MCP server for supabase and make sure you use the .env variables to access the database.
7. Remember to use tailwind in the project.

## Test
This fix should eliminate the repetitive "I'll boost your prompt" loops by using structured thinking to plan responses and then executing them without repetition.
