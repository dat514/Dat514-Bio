const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

app.use('/lanyard', createProxyMiddleware({
    target: 'https://api.lanyard.rest',
    changeOrigin: true,
    pathRewrite: { '^/lanyard': '' }
}));

app.listen(3000, () => console.log('Proxy server running on port 3000'));