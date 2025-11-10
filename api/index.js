// Vercel serverless function entry. It reuses the compiled handler from /dist.
// This keeps bundling simple and ensures we use the same compiled output as the main build.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const mod = require('../dist/vercel-handler.js');

module.exports = mod.default || mod;
