/**
 * compile.cjs — Compile KineticToken + KineticMining using solc-js
 *
 * Bypasses Hardhat entirely (avoids ESM / telemetry issues on Node 20).
 * Writes artifacts in Hardhat format so deploy-all.mjs works unchanged.
 *
 * Usage: node scripts/compile.cjs
 */

'use strict';

const path  = require('path');
const fs    = require('fs');

// ── Paths ──────────────────────────────────────────────────────────────────
const ROOT        = path.join(__dirname, '..');
const CONTRACTS   = path.join(ROOT, 'contracts');
const OZ          = path.join(CONTRACTS, 'node_modules', '@openzeppelin', 'contracts');
const ARTIFACTS   = path.join(ROOT, 'artifacts', 'contracts');

// Find the solc binary installed by hardhat-toolbox
const SOLC_PATH   = path.join(
  CONTRACTS, 'node_modules', '.pnpm',
  // find the right version dynamically
  fs.readdirSync(path.join(CONTRACTS, 'node_modules', '.pnpm'))
    .find(d => d.startsWith('solc@'))  || 'solc@0.8.26',
  'node_modules', 'solc'
);

console.log('Loading solc from:', SOLC_PATH);
const solc = require(SOLC_PATH);
console.log('solc version:', solc.version());

// ── Source loader ───────────────────────────────────────────────────────────
function loadSource(file) {
  return fs.readFileSync(path.join(CONTRACTS, file), 'utf8');
}

function findImport(importPath) {
  // @openzeppelin/contracts/...
  if (importPath.startsWith('@openzeppelin/contracts/')) {
    const rel  = importPath.replace('@openzeppelin/contracts/', '');
    const full = path.join(OZ, rel);
    if (fs.existsSync(full)) return { contents: fs.readFileSync(full, 'utf8') };
  }
  return { error: 'File not found: ' + importPath };
}

// ── Compile ─────────────────────────────────────────────────────────────────
const input = {
  language: 'Solidity',
  sources: {
    'contracts/KineticToken.sol':  { content: loadSource('KineticToken.sol')  },
    'contracts/KineticMining.sol': { content: loadSource('KineticMining.sol') },
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      '*': {
        '*': ['abi', 'evm.bytecode.object', 'evm.deployedBytecode.object'],
      },
    },
  },
};

console.log('\nCompiling contracts...');
const output = JSON.parse(
  solc.compile(JSON.stringify(input), { import: findImport })
);

// ── Check errors ────────────────────────────────────────────────────────────
let hasError = false;
for (const err of (output.errors || [])) {
  if (err.severity === 'error') {
    console.error('ERROR:', err.formattedMessage);
    hasError = true;
  } else {
    console.warn('WARN :', err.formattedMessage.split('\n')[0]);
  }
}
if (hasError) process.exit(1);

// ── Write artifacts ─────────────────────────────────────────────────────────
const contractNames = ['KineticToken', 'KineticMining'];

for (const name of contractNames) {
  const srcKey      = `contracts/${name}.sol`;
  const compiled    = output.contracts[srcKey][name];
  const bytecode    = '0x' + compiled.evm.bytecode.object;
  const abi         = compiled.abi;

  const outDir = path.join(ARTIFACTS, `${name}.sol`);
  fs.mkdirSync(outDir, { recursive: true });

  const artifact = {
    _format:           'hh-sol-artifact-1',
    contractName:      name,
    sourceName:        srcKey,
    abi,
    bytecode,
    deployedBytecode:  '0x' + compiled.evm.deployedBytecode.object,
    linkReferences:    {},
    deployedLinkReferences: {},
  };

  const outFile = path.join(outDir, `${name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(artifact, null, 2));
  console.log(`Written: ${path.relative(ROOT, outFile)}  (abi: ${abi.length} items, bytecode: ${bytecode.length} chars)`);
}

console.log('\nCompilation complete.');
