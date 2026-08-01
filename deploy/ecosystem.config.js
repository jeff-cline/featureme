// pm2 process definition for FeatureMe.
// Usage: pm2 start deploy/ecosystem.config.js && pm2 save
module.exports = {
  apps: [
    {
      name: "featureme",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname + "/..",
      env: { NODE_ENV: "production" },
      max_memory_restart: "500M",
    },
  ],
};
