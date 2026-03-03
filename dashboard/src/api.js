// Auto-detect the API base URL.
// Override via Settings (localStorage) or env.

;(function migrateLegacyKeys() {
  ["api_key","api_url","theme","user"].forEach(function(k) {
    if (localStorage.getItem("galui_"+k) && !localStorage.getItem("galuli_"+k))
      localStorage.setItem("galuli_"+k, localStorage.getItem("galui_"+k))
  })
})()

var _autoBase = window.location.hostname === "localhost"
  ? "http://localhost:8000"
  : window.location.origin

function getKey() { return localStorage.getItem("galuli_api_key") || "" }
function getBase() { return localStorage.getItem("galuli_api_url") || _autoBase }

async function req(path, options) {
  options = options || {}
  var res = await fetch(getBase() + path, Object.assign({}, options, {
    headers: Object.assign({ "Content-Type": "application/json", "X-API-Key": getKey() }, options.headers || {})
  }))
  if (!res.ok) {
    var err = await res.json().catch(function() { return { detail: res.statusText } })
    throw new Error(err.detail || err.error || "Request failed")
  }
  return res.json()
}
async function reqText(path) {
  var res = await fetch(getBase() + path, { headers: { "X-API-Key": getKey() } })
  if (!res.ok) throw new Error(res.statusText)
  return res.text()
}

export var api = {
  base: getBase,
  health: function() { return req("/health") },

  ingest:   function(url, force) { return req("/api/v1/ingest", { method: "POST", body: JSON.stringify({ url: url, force_refresh: !!force }) }) },
  pollJob:  function(id)  { return req("/api/v1/jobs/" + id) },
  listJobs: function()    { return req("/api/v1/jobs") },

  listRegistries: function()  { return req("/registry/") },
  getRegistry:    function(d) { return req("/registry/" + d) },
  getLlmsTxt:     function(d) { return reqText("/registry/" + d + "/llms.txt") },
  getLiveStatus:  function(d) { return req("/registry/" + d + "/status") },

  getScore:       function(d) { return req("/api/v1/score/" + d) },
  getSuggestions: function(d) { return req("/api/v1/score/" + d + "/suggestions") },
  getBadgeUrl:    function(d) { return getBase() + "/api/v1/score/" + d + "/badge" },
  getGeoScore:    function(d) { return req("/api/v1/geo/" + d) },

  // Analytics
  getAnalytics:      function(d, days) { return req("/api/v1/analytics/" + d + "?days=" + (days||30)) },
  getAgentBreakdown: function(d, days) { return req("/api/v1/analytics/" + d + "/agents?days=" + (days||30)) },
  getPageBreakdown:  function(d, days) { return req("/api/v1/analytics/" + d + "/pages?days=" + (days||30)) },
  // Sprint 1 - AI Attention ROI Engine
  getTopicMap:       function(d, days) { return req("/api/v1/analytics/" + d + "/topics?days=" + (days||30)) },
  getAttentionScore: function(d, days) { return req("/api/v1/analytics/" + d + "/attention?days=" + (days||30)) },
  getLlmDepth:       function(d, days) { return req("/api/v1/analytics/" + d + "/llm-depth?days=" + (days||30)) },

  // Content Doctor
  analyzeContent:     function(content, url) { return req("/api/v1/content-doctor/analyze", { method: "POST", body: JSON.stringify({ content: content, url: url||"" }) }) },
  analyzeUrl:         function(url, mode)    { return req("/api/v1/content-doctor/analyze-url", { method: "POST", body: JSON.stringify({ url: url, mode: mode||"full" }) }) },
  getDomainDiagnosis: function(d)            { return req("/api/v1/content-doctor/" + d) },

  // Admin
  deleteRegistry:  function(d) { return req("/api/v1/admin/registry/" + d, { method: "DELETE" }) },
  refreshRegistry: function(d) { return req("/api/v1/admin/refresh", { method: "POST", body: JSON.stringify({ domain: d }) }) },
  getStats:        function()  { return req("/api/v1/admin/stats") },
  wipeAll:         function()  { return req("/api/v1/admin/wipe-all", { method: "DELETE" }) },

  // Tenants
  createTenant:  function(name, email, plan) { return req("/api/v1/tenants", { method: "POST", body: JSON.stringify({ name: name, email: email, plan: plan }) }) },
  listTenants:   function() { return req("/api/v1/tenants") },
  getMe:         function() { return req("/api/v1/tenants/me") },
  getMyUsage:    function() { return req("/api/v1/tenants/me/usage") },
  getMyDomains:  function() { return req("/api/v1/tenants/domains") },

  // Citation Tracker (Pro)
  getCitationQueries:   function(d)             { return req("/api/v1/citations/" + d + "/queries") },
  addCitationQuery:     function(d, type, val)  { return req("/api/v1/citations/" + d + "/queries", { method: "POST", body: JSON.stringify({ type: type, value: val }) }) },
  removeCitationQuery:  function(d, id)         { return req("/api/v1/citations/" + d + "/queries/" + id, { method: "DELETE" }) },
  triggerCitationCheck: function(d)             { return req("/api/v1/citations/" + d + "/check", { method: "POST" }) },
  getCitationResults:   function(d)             { return req("/api/v1/citations/" + d + "/results") },
  getCitationTrend:     function(d)             { return req("/api/v1/citations/" + d + "/trend") },
  getCitationHistory:   function(d)             { return req("/api/v1/citations/" + d + "/history") },
}
