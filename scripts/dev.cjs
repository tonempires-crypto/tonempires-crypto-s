const { spawn } = require('child_process');

// Filter out arguments that might be passed by the environment but are not supported by 'next dev'
// For example, if it passes --host 0.0.0.0 or --port 3000
const args = process.argv.slice(2).filter(arg => {
  // We handle port and hostname explicitly in our command or let Next use defaults
  return arg !== '--host' && arg !== '--port' && !arg.startsWith('--host=') && !arg.startsWith('--port=');
});

// We want to ensure it runs on port 3000 as required by the platform
const nextArgs = ['dev', '-p', '3000', ...args];

console.log('Starting Next.js with args:', nextArgs);

const child = spawn('npx', ['next', ...nextArgs], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code || 0);
});
