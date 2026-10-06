const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push("wasm");

// SQLite's web worker needs cross-origin isolation for SharedArrayBuffer.
const enhanceMiddleware = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const enhancedMiddleware = enhanceMiddleware
    ? enhanceMiddleware(middleware, server)
    : middleware;

  return (request, response, next) => {
    response.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    return enhancedMiddleware(request, response, next);
  };
};

module.exports = config;
