// client/scripts/config.js
// Determine API base URL depending on environment
(function () {
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "::1";

  const localBase = "http://localhost:3000/api";
  const hostedBase = "https://monobjective-6x.onrender.com/api";

  window.API_BASE_URL = isLocalhost ? localBase : hostedBase;
})();
