#!/usr/bin/env node
// Makes a contract built with plain `cargo build` loadable by the NEAR VM when cargo-near is
// not available (it needs a C toolchain; this script needs only Node).
//
//   npm i --no-save binaryen
//   node lower-wasm.mjs <in.wasm> <out.wasm>
//
// Recent Rust emits bulk-memory, sign-extension and saturating float-to-int instructions for
// wasm32-unknown-unknown. This rewrites them into baseline WebAssembly 1.0 instructions,
// optimizes for size, and refuses to write the file unless the result validates as
// WebAssembly 1.0 (+ mutable globals) and still exports the same functions.
import binaryen from 'binaryen';
import {readFileSync, writeFileSync} from 'node:fs';

const [input, output] = process.argv.slice(2);
if (!input || !output) { console.error('usage: node lower-wasm.mjs <in.wasm> <out.wasm>'); process.exit(2); }

const before = readFileSync(input);
const exportsOf = bytes => WebAssembly.Module.exports(new WebAssembly.Module(bytes)).map(e => e.name).sort().join(',');

// binaryen prints validation details to stdout; keep our own output readable
const quiet = fn => { const w = process.stdout.write; process.stdout.write = () => true; try { return fn(); } finally { process.stdout.write = w; } };

const module = binaryen.readBinary(before);
// Only what current Rust emits. (The copy/fill lowering refuses memory64 / multi-memory modules.)
const F = binaryen.Features;
module.setFeatures(F.MutableGlobals | F.SignExt | F.NontrappingFPToInt | F.BulkMemory | (F.BulkMemoryOpt || 0));
binaryen.setOptimizeLevel(2);
binaryen.setShrinkLevel(2);
module.runPasses(['llvm-memory-copy-fill-lowering', 'signext-lowering', 'llvm-nontrapping-fptoint-lowering']);
const BASELINE = binaryen.Features.MVP | binaryen.Features.MutableGlobals;
module.setFeatures(BASELINE);
module.optimize();
if (!quiet(() => module.validate())) { console.error('Result is not valid baseline WebAssembly; nothing written.'); process.exit(1); }
const after = module.emitBinary();
module.dispose();

// independent re-check of the bytes that will be deployed
const check = binaryen.readBinary(after);
check.setFeatures(BASELINE);
const ok = quiet(() => check.validate());
check.dispose();
if (!ok || exportsOf(after) !== exportsOf(before)) { console.error('Post-check failed; nothing written.'); process.exit(1); }

writeFileSync(output, after);
console.log(`${input}: ${before.length} bytes -> ${output}: ${after.length} bytes, baseline WebAssembly, exports unchanged`);
console.log('exports: ' + exportsOf(after));
