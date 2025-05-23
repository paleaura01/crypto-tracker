// test-morpho-all.mjs
import fetch from 'node-fetch';
import { getIntrospectionQuery, buildClientSchema } from 'graphql';

// ——— CONFIG ———
const MORPHO_API = 'https://api.morpho.org/graphql';

// Paste in all the opaque IDs you extracted from Coinbase’s DeFi-V2 viewer response:
const KNOWN_IDS = [
  'RGVmaUFtb3VudDo1MTEyMC42OTo6UkdWbWFVNWxkSGR2Y21zNk9qZzBOVE09',
  'QXNzZXQ6MmI5MjMxNWQtZWFiNy01YmVmLTg0ZmEtMDg5YTEzMTMzM2Y1',
  'Vmlld2VyQXNzZXQ6MmI5MjMxNWQtZWFiNy01YmVmLTg0ZmEtMDg5YTEzMTMzM2Y1',
  'RGVmaU9uY2hhaW5Bc3NldDo4NDUzOjB4ODMzNTg5ZkNENmVEYjZFMDhmNGM3QzMyRDRmNzFiNTRiZEEwMjkxMw==',
  'RGVmaUFtb3VudDozNDIxMjUzNDc1OjB4ODMzNTg5ZmNkNmVkYjZlMDhmNGM3YzMyZDRmNzFiNTRiZGEwMjkxMzpSR1ZtYVU1bGRIZHZjbXM2T2pnME5UTT0=',
  'QXNzZXQ6NWI3MWZjNDgtM2RkMy01NDBjLTgwOWItZjhjOTRkMGU2OGI1',
  'RGVmaU9uY2hhaW5Bc3NldDo4NDUzOjB4Y2JCN0MwMDAwYUI4OEI0NzNiMWY1YUZkOWVmODA4NDQwZWVkMzNCZg==',
  'RGVmaUFtb3VudDo3NzgxOTgwOjB4Y2JCN0MwMDAwYUI4OEI0NzNiMWY1YUZkOWVmODA4NDQwZWVkMzNCZjpSR1ZtYVU1bGRIZHZjbXM2T2pnME5UTT0=',
  '0x40148B535dFAB9B78aEc3b14A9d924169198ee2e',
  'Vmlld2VyOjA='
];

// ——— helper: send GraphQL request ———
async function gqlRequest(query, variables = {}) {
  const res = await fetch(MORPHO_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });
  return res.json();
}

// ——— 1) Introspect schema, grab all Query fields ———
async function introspectFields() {
  const introspection = await gqlRequest(getIntrospectionQuery());
  const schema         = buildClientSchema(introspection.data);
  const queryType      = schema.getQueryType();
  if (!queryType) throw new Error('No Query type in schema');
  return queryType.getFields();
}

// ——— 2) Attempt every field × every ID ———
async function bruteForce() {
  const fields = await introspectFields();
  const hits   = {};

  console.log(`ℹ️  Testing ${Object.keys(fields).length} Query fields…\n`);

  for (const [name, field] of Object.entries(fields)) {
    // find the first argument that’s a String, ID, or Int
    const usable = field.args.find(arg => {
      const base = arg.type.toString().replace(/[\[\]!]/g, '');
      return ['String','ID','Int'].includes(base);
    });
    if (!usable) continue;

    const varName = usable.name;
    const varType = usable.type.toString();

    for (const id of KNOWN_IDS) {
      const variables = {};
      // cast to int if needed
      variables[varName] = varType.includes('Int') ? parseInt(id, 10) : id;

      const query = `
        query Test${name}($${varName}: ${varType}) {
          ${name}(${varName}: $${varName}) {
            __typename
          }
        }
      `;

      try {
        const { data, errors } = await gqlRequest(query, variables);
        if (!errors && data && data[name]) {
          hits[name] = hits[name] || [];
          hits[name].push({ id, type: data[name].__typename });
          console.log(`✅ [${name}](${varName}="${id}") → ${data[name].__typename}`);
        }
      } catch {
        // ignore invalid combos
      }
    }
  }

  console.log('\n🎯 Summary of positive hits:\n', JSON.stringify(hits, null, 2));
}

bruteForce().catch(console.error);
