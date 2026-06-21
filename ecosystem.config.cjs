// PM2 config for the Next.js standalone server.
// Build first: npm run build  (produces .next/standalone/server.js)
module.exports = {
  apps: [
    {
      name: "dhruv-portfolio",
      script: ".next/standalone/server.js",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // ANTHROPIC_API_KEY is read from the shell env / .env — do NOT hardcode it here.
      },
      max_memory_restart: "500M",
    },
  ],
};
