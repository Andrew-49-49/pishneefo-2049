// Cross-platform equivalent of NODE_ENV=production node server/index.js.
process.env.NODE_ENV = 'production';
await import('./index.js');
