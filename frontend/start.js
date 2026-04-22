const { spawn } = require('child_process');
const path = require('path');

// Start Vite dev server
const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

vite.on('close', (code) => {
  console.log(`Vite exited with code ${code}`);
});
