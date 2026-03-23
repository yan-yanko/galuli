/**
 * galuli.js — AI Readability Engine
 * Version: 3.4.0
 *
 * Drop this on any website to make it instantly readable by LLMs and AI agents.
 *
 * What it does:
 *   1. Detects AI crawlers and agents visiting the page
 *   2. Injects discovery links: llms.txt, robots hints
 *   3. Auto-injects JSON-LD Organization schema if none exists
 *   4. Registers WebMCP tools (navigator.modelContext) for browser AI agents
 *   5. Extracts page data (headings, CTAs, forms, schema.org, text) and pushes to Galuli
 *   6. Captures full rendered DOM snapshot — makes SPA content visible to AI crawlers
 *   7. Detects SPA invisibility (JS-only rendering) and warns site owners
 *   8. Logs AI agent traffic for analytics
 *
 * Usage:
 *   <script src="https://galuli.io/galuli.js?key=YOUR_KEY" async></script>
 *
 * Params (via query string on the script src):
 *   key=YOUR_KEY       API key (required)
 *   api=https://...    Override API base URL
 *   debug=1            Enable verbose console logs
 *   schema=0           Disable auto JSON-LD injection
 *   push=0             Disable backend push (analytics-only mode)
 */
(function (window, document) {
  'use strict';

  // ── Config from script tag ─────────────────────────────────────────────────
  var script = document.currentScript || (function () {
    // document.currentScript is null in async mode — find galuli.js by hostname match
    var scripts = document.getElementsByTagName('script');
    for (var i = scripts.length - 1; i >= 0; i--) {
      if (scripts[i].src && scripts[i].src.indexOf('galuli') !== -1) return scripts[i];
    }
    return scripts[scripts.length - 1];
  })();

  var src = script ? (script.src || '') : '';
  var params = {};
  var qIdx = src.indexOf('?');
  if (qIdx !== -1) {
    src.slice(qIdx + 1).split('&').forEach(function (p) {
      var kv = p.split('=');
      if (kv.length === 2) params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
    });
  }

  // Support both data-key attribute and ?key= query string
  var TENANT_KEY    = (script && script.getAttribute('data-key')) || params.key || '';
  var API_BASE      = params.api  || 'https://galuli.io';
  var DEBUG         = params.debug  === '1';
  var AUTO_SCHEMA   = params.schema !== '0';   // default: on
  var AUTO_PUSH     = params.push   !== '0';   // default: on

  if (!TENANT_KEY) {
    console.warn('[galuli] No API key provided. Add ?key=YOUR_KEY to script src.');
    return;
  }

  function log() {
    if (DEBUG) console.log.apply(console, ['[galuli]'].concat(Array.prototype.slice.call(arguments)));
  }

  // ── Domain ─────────────────────────────────────────────────────────────────
  var domain = window.location.hostname.replace(/^www\./, '');

  // ── 1. AI Agent Detection ──────────────────────────────────────────────────
  // Comprehensive list of AI crawlers and agents as of 2026.
  // Sources: Cloudflare radar, Anthropic, OpenAI, Google docs, Bing webmaster.
  var AI_PATTERNS = [
    // OpenAI
    { pattern: /gptbot/i,                name: 'GPTBot',             type: 'crawler' },
    { pattern: /chatgpt-user/i,          name: 'ChatGPT',            type: 'llm'     },
    { pattern: /oai-searchbot/i,         name: 'OpenAI Search',      type: 'crawler' },
    // Anthropic
    { pattern: /claudebot/i,             name: 'ClaudeBot',          type: 'crawler' },
    { pattern: /claude-web/i,            name: 'Claude Web',         type: 'llm'     },
    { pattern: /anthropic-ai/i,          name: 'Anthropic',          type: 'crawler' },
    // Google
    { pattern: /google-extended/i,       name: 'Google Extended',    type: 'crawler' },
    { pattern: /googleother/i,           name: 'GoogleOther',        type: 'crawler' },
    { pattern: /gemini/i,                name: 'Gemini',             type: 'llm'     },
    // Perplexity
    { pattern: /perplexitybot/i,         name: 'PerplexityBot',      type: 'crawler' },
    { pattern: /perplexity/i,            name: 'Perplexity',         type: 'llm'     },
    // Microsoft / Bing
    { pattern: /bingbot/i,               name: 'BingBot',            type: 'crawler' },
    { pattern: /msnbot/i,                name: 'MSNBot',             type: 'crawler' },
    // Apple
    { pattern: /applebot-extended/i,     name: 'Applebot Extended',  type: 'crawler' },
    { pattern: /applebot/i,              name: 'AppleBot',           type: 'crawler' },
    // DuckDuckGo
    { pattern: /duckassistbot/i,         name: 'DuckAssistBot',      type: 'crawler' },
    // You.com
    { pattern: /youbot/i,                name: 'YouBot',             type: 'crawler' },
    // Cohere
    { pattern: /cohere-ai/i,             name: 'Cohere',             type: 'crawler' },
    // Common Crawl (used for training by many models)
    { pattern: /ccbot/i,                 name: 'CommonCrawl',        type: 'crawler' },
    // Meta AI
    { pattern: /meta-externalagent/i,    name: 'MetaAI',             type: 'crawler' },
    { pattern: /facebookbot/i,           name: 'FacebookBot',        type: 'crawler' },
    // Amazon
    { pattern: /amazonbot/i,             name: 'AmazonBot',          type: 'crawler' },
    // Bytedance
    { pattern: /bytespider/i,            name: 'ByteSpider',         type: 'crawler' },
    // Diffbot
    { pattern: /diffbot/i,               name: 'Diffbot',            type: 'agent'   },
    // WebMCP browser agents (W3C spec, Chrome early preview 2026)
    { pattern: /webmcp/i,                name: 'WebMCP Agent',       type: 'agent'   },
    // Generic AI signals
    { pattern: /ai-agent/i,              name: 'AI Agent',           type: 'agent'   },
    { pattern: /llmspider/i,             name: 'LLM Spider',         type: 'crawler' },
    { pattern: /brightbot/i,             name: 'BrightBot',          type: 'crawler' },
    { pattern: /timpibot/i,              name: 'TimpiBot',           type: 'crawler' },
  ];

  function _detectAgent(ua) {
    for (var i = 0; i < AI_PATTERNS.length; i++) {
      if (AI_PATTERNS[i].pattern.test(ua)) {
        return { name: AI_PATTERNS[i].name, type: AI_PATTERNS[i].type };
      }
    }
    return null;
  }

  var userAgent = navigator.userAgent || '';
  var detectedAgent = _detectAgent(userAgent);

  if (detectedAgent) {
    log('AI agent detected:', detectedAgent.name, '(' + detectedAgent.type + ')');
    _sendAnalyticsEvent(detectedAgent.name, detectedAgent.type);
  }

  function _sendAnalyticsEvent(agentName, agentType) {
    var payload = {
      domain:     domain,
      page_url:   window.location.href,
      agent_name: agentName,
      agent_type: agentType,
      user_agent: userAgent,
      referrer:   document.referrer || null,
      ts:         new Date().toISOString(),
    };
    _beacon(API_BASE + '/api/v1/analytics/event', payload);
  }

  // ── 2. Discovery Link Injection ────────────────────────────────────────────
  // Injects <link> tags into <head> so AI crawlers can find:
  //   - llms.txt (Galuli-hosted, always available)
  //   - ai-plugin.json (Galuli-hosted, always available)
  //   - The site's own llms.txt if it exists at /llms.txt
  //   - /.well-known/ai-plugin.json on the current domain
  // Also injects a robots meta tag hinting to AI crawlers that all content is indexable.
  function _injectDiscoveryLinks() {
    var head = document.head;
    if (!head) return;

    // ── llms.txt (Galuli hosted) ──────────────────────────────────────────────
    // rel="llms-txt" per llmstxt.org emerging spec
    if (!document.querySelector('link[rel="llms-txt"]')) {
      var llmsLink = document.createElement('link');
      llmsLink.rel  = 'llms-txt';
      llmsLink.href = API_BASE + '/registry/' + domain + '/llms.txt';
      llmsLink.type = 'text/plain';
      head.appendChild(llmsLink);
    }

    // ── <meta name="llms-txt"> — fallback for crawlers that read meta but skip <link> ──
    if (!document.querySelector('meta[name="llms-txt"]')) {
      var llmsMeta = document.createElement('meta');
      llmsMeta.name    = 'llms-txt';
      llmsMeta.content = API_BASE + '/registry/' + domain + '/llms.txt';
      head.appendChild(llmsMeta);
    }

    // ── llms.txt (site-native, at /llms.txt) — alternate discovery ──────────
    // Per llmstxt.org spec: the canonical location is /llms.txt on the origin domain.
    // We inject a standard <link rel="alternate"> so crawlers parsing <head> find it.
    if (!document.querySelector('link[href="/llms.txt"]')) {
      var llmsNative = document.createElement('link');
      llmsNative.rel  = 'alternate';
      llmsNative.href = '/llms.txt';
      llmsNative.type = 'text/plain';
      llmsNative.setAttribute('data-galuli', 'llms');
      head.appendChild(llmsNative);
    }

    // ── llms-full.txt (Galuli hosted — full AI-readable content) ──────────
    // This is the key discovery link: AI engines that follow llms.txt links
    // will find the complete rendered content of this site, even if the site
    // is a JavaScript SPA that crawlers can't normally read.
    if (!document.querySelector('link[rel="llms-full-txt"]')) {
      var llmsFullLink = document.createElement('link');
      llmsFullLink.rel  = 'llms-full-txt';
      llmsFullLink.href = API_BASE + '/registry/' + domain + '/llms-full.txt';
      llmsFullLink.type = 'text/plain';
      head.appendChild(llmsFullLink);
    }

    // ── robots meta — tell AI crawlers they may index and use this page ───────
    // Checks for an existing meta robots tag first; only injects if absent.
    if (!document.querySelector('meta[name="robots"]')) {
      var robotsMeta = document.createElement('meta');
      robotsMeta.name    = 'robots';
      robotsMeta.content = 'index, follow';
      head.appendChild(robotsMeta);
    }

    // ── Galuli verification tag (proof of install, read by /registry/:domain) ─
    if (!document.querySelector('meta[name="galuli-verified"]')) {
      var verMeta = document.createElement('meta');
      verMeta.name    = 'galuli-verified';
      verMeta.content = domain;
      head.appendChild(verMeta);
    }

    // ── Canonical link — inject if absent (prevents duplicate AI indexing) ────
    if (!document.querySelector('link[rel="canonical"]')) {
      var canon = document.createElement('link');
      canon.rel  = 'canonical';
      canon.href = window.location.origin + window.location.pathname;
      head.appendChild(canon);
      log('Injected canonical link:', canon.href);
    }

    log('Injected discovery links');
  }

  // ── 3. Auto JSON-LD Injection ──────────────────────────────────────────────
  // If the page has no JSON-LD structured data at all, inject a minimal
  // WebPage + Organization schema. This significantly improves AI entity
  // recognition, RAG retrieval accuracy, and AI Overview eligibility.
  // Can be disabled with ?schema=0 on the script tag.
  function _injectSchemaIfMissing() {
    if (!AUTO_SCHEMA) return;

    // Only inject on the homepage or if no schema exists anywhere on the page
    var existing = document.querySelectorAll('script[type="application/ld+json"]');
    var pageType = _analyzePageType();

    // On non-homepage pages with existing schema, skip
    if (existing.length > 0 && pageType !== 'homepage') return;

    var siteName = document.querySelector('meta[property="og:site_name"]');
    siteName = siteName ? siteName.getAttribute('content') : domain;

    var description = _extractMetaDescription() || 'Website powered by Galuli AI Readability.';
    var ogImage = document.querySelector('meta[property="og:image"]');
    ogImage = ogImage ? ogImage.getAttribute('content') : null;

    // Build schema based on page type
    var schema;

    if (pageType === 'homepage' && existing.length === 0) {
      // Full Organization + WebSite schema on homepage
      schema = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': window.location.origin + '/#organization',
            'name': siteName,
            'url': window.location.origin,
            'description': description,
          },
          {
            '@type': 'WebSite',
            '@id': window.location.origin + '/#website',
            'url': window.location.origin,
            'name': siteName,
            'publisher': { '@id': window.location.origin + '/#organization' },
            'potentialAction': {
              '@type': 'SearchAction',
              'target': {
                '@type': 'EntryPoint',
                'urlTemplate': window.location.origin + '/?s={search_term_string}',
              },
              'query-input': 'required name=search_term_string',
            },
          },
          {
            '@type': 'WebPage',
            '@id': window.location.href + '#webpage',
            'url': window.location.href,
            'name': document.title || siteName,
            'description': description,
            'isPartOf': { '@id': window.location.origin + '/#website' },
          },
        ],
      };
    } else if (existing.length === 0) {
      // Minimal WebPage schema on inner pages with no schema
      schema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        'url': window.location.href,
        'name': document.title || '',
        'description': description,
        'isPartOf': { '@id': window.location.origin + '/#website' },
      };
      if (ogImage) schema.image = ogImage;
    }

    if (schema) {
      var scriptEl = document.createElement('script');
      scriptEl.type = 'application/ld+json';
      scriptEl.setAttribute('data-galuli', 'schema');
      scriptEl.text = JSON.stringify(schema, null, 0);
      document.head && document.head.appendChild(scriptEl);
      log('Injected JSON-LD schema:', schema['@type'] || '@graph');
    }
  }

  // ── 4. Page Analysis ───────────────────────────────────────────────────────
  function _analyzePageType() {
    var path  = window.location.pathname.toLowerCase();
    var title = (document.title || '').toLowerCase();

    if (path === '/' || path === '' || path === '/index' || path === '/home') return 'homepage';
    if (/\/(pricing|plans|price)/.test(path))                  return 'pricing';
    if (/\/(docs|documentation|api|reference|guide|manual)/.test(path)) return 'docs';
    if (/\/(blog|news|articles?|post|insights?)/.test(path))   return 'blog';
    if (/\/(about|team|company|story|mission)/.test(path))     return 'about';
    if (/\/(contact|support|help|faq)/.test(path))             return 'contact';
    if (/\/(features?|product|solutions?|overview)/.test(path))return 'product';
    if (/\/(signup|register|trial|start|join)/.test(path))     return 'signup';
    if (/\/(login|signin|auth)/.test(path))                    return 'login';
    if (/\/(legal|privacy|terms|tos)/.test(path))              return 'legal';

    // Fallback to title
    if (/pricing|plans/.test(title))      return 'pricing';
    if (/docs|documentation/.test(title)) return 'docs';
    if (/blog|article/.test(title))       return 'blog';

    return 'other';
  }

  function _extractHeadings() {
    var headings = [];
    var els = document.querySelectorAll('h1, h2, h3');
    for (var i = 0; i < Math.min(els.length, 30); i++) {
      var text = (els[i].innerText || els[i].textContent || '').trim();
      if (text && text.length > 2 && text.length < 200) {
        headings.push({ level: parseInt(els[i].tagName[1], 10), text: text });
      }
    }
    return headings;
  }

  function _extractCTAs() {
    var ctas = [];
    var seen = {};
    var els = document.querySelectorAll(
      'a[class*="btn"], a[class*="button"], button, [role="button"], a[class*="cta"]'
    );
    var CTA_RE = /get started|sign up|try|start free|start trial|buy|subscribe|contact|book|schedule|demo|free trial|learn more|explore|get access|download|install/i;
    for (var i = 0; i < els.length; i++) {
      var text = (els[i].innerText || els[i].textContent || '').trim().replace(/\s+/g, ' ');
      var href = els[i].getAttribute('href') || '';
      if (text && text.length > 2 && text.length < 80 && CTA_RE.test(text) && !seen[text]) {
        ctas.push({ text: text, href: href });
        seen[text] = true;
        if (ctas.length >= 12) break;
      }
    }
    return ctas;
  }

  function _extractForms() {
    var forms = [];
    var formEls = document.querySelectorAll('form');
    for (var i = 0; i < formEls.length; i++) {
      var form = formEls[i];
      var name   = form.getAttribute('name') || form.getAttribute('id') || form.getAttribute('aria-label') || '';
      var action = form.getAttribute('action') || window.location.pathname;
      var method = (form.getAttribute('method') || 'GET').toUpperCase();

      var fields = [];
      var inputs = form.querySelectorAll('input:not([type=hidden]), select, textarea');
      for (var j = 0; j < inputs.length; j++) {
        var inp = inputs[j];
        var fieldName = inp.getAttribute('name') || inp.getAttribute('id') ||
                        inp.getAttribute('placeholder') || inp.getAttribute('aria-label') || '';
        var fieldType = inp.tagName === 'SELECT'   ? 'select' :
                        inp.tagName === 'TEXTAREA'  ? 'textarea' :
                        (inp.getAttribute('type')  || 'text');
        var required = inp.hasAttribute('required') || inp.getAttribute('aria-required') === 'true';
        if (fieldName) fields.push({ name: fieldName, type: fieldType, required: required });
      }

      if (fields.length > 0) {
        forms.push({ name: name, action: action, method: method, fields: fields });
      }
    }
    return forms;
  }

  function _extractSchemaOrg() {
    var schemas = [];
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      // Skip our own injected schema
      if (scripts[i].getAttribute('data-galuli') === 'schema') continue;
      try {
        var data = JSON.parse(scripts[i].textContent || scripts[i].innerText);
        schemas.push(data);
      } catch (e) { /* ignore malformed */ }
    }
    return schemas;
  }

  function _extractMetaDescription() {
    var meta = document.querySelector('meta[name="description"]') ||
               document.querySelector('meta[property="og:description"]');
    return meta ? meta.getAttribute('content') : null;
  }

  function _extractOpenGraph() {
    var og = {};
    var metas = document.querySelectorAll('meta[property^="og:"]');
    for (var i = 0; i < metas.length; i++) {
      var prop = metas[i].getAttribute('property').replace('og:', '');
      og[prop] = metas[i].getAttribute('content');
    }
    return og;
  }

  function _extractTextPreview() {
    // Try landmark elements in priority order — avoids nav/footer noise
    var main = document.querySelector('main') ||
               document.querySelector('[role="main"]') ||
               document.querySelector('#main-content') ||
               document.querySelector('#content') ||
               document.querySelector('article') ||
               document.querySelector('.content') ||
               document.querySelector('.main') ||
               document.body;

    if (!main) return '';

    var clone = main.cloneNode(true);

    // Remove non-content elements
    var noisy = clone.querySelectorAll([
      'nav', 'footer', 'header', 'script', 'style', 'noscript', 'iframe',
      '[class*="cookie"]', '[class*="banner"]', '[class*="popup"]', '[class*="modal"]',
      '[id*="chat"]', '[class*="chat"]', '[aria-hidden="true"]',
      '[class*="sidebar"]', '[class*="ad"]', '[id*="ad"]',
    ].join(', '));
    for (var i = 0; i < noisy.length; i++) {
      noisy[i].parentNode && noisy[i].parentNode.removeChild(noisy[i]);
    }

    var text = (clone.innerText || clone.textContent || '').replace(/\s+/g, ' ').trim();
    return text.slice(0, 4000); // Increased from 3000 to 4000
  }

  function _extractImages() {
    // Extract meaningful images (not icons/avatars) for AI context
    var images = [];
    var imgEls = document.querySelectorAll('img[alt]');
    for (var i = 0; i < imgEls.length; i++) {
      var alt = (imgEls[i].getAttribute('alt') || '').trim();
      var src2 = imgEls[i].getAttribute('src') || imgEls[i].getAttribute('data-src') || '';
      if (alt && alt.length > 3 && src2 && !src2.startsWith('data:')) {
        images.push({ alt: alt, src: src2 });
        if (images.length >= 8) break;
      }
    }
    return images;
  }

  // ── SPA Invisibility Detection ─────────────────────────────────────────
  // Detects if the page is a JavaScript-only SPA where AI crawlers would see
  // an empty shell. Checks the initial HTML before React/Vue hydrates.
  var _isSpaDetected = false;
  (function () {
    // Check if the body had minimal content before JS rendered
    // Common SPA patterns: single <div id="root"></div>, <div id="app"></div>
    var body = document.body;
    if (!body) return;
    var childElements = body.querySelectorAll(':scope > *:not(script):not(style):not(noscript):not(link)');
    // SPA signal: body has 1-2 non-script children and very little text
    var noscriptContent = body.querySelector('noscript');
    var hasNoscriptFallback = noscriptContent && noscriptContent.textContent.trim().length > 50;

    // Check for common SPA root patterns
    var spaRoot = body.querySelector('#root, #app, #__next, #__nuxt, [data-reactroot]');
    if (spaRoot && childElements.length <= 3 && !hasNoscriptFallback) {
      _isSpaDetected = true;
    }
  })();

  // ── DOM Snapshot Capture ─────────────────────────────────────────────────
  // Captures a clean, content-focused HTML snapshot of the rendered page.
  // This is the core of Galuli's SPA visibility solution: the snapshot is
  // sent to Galuli's backend, which serves it as static HTML at
  // /registry/{domain}/pages/{path} — readable by AI crawlers.
  function _captureSnapshot() {
    var main = document.querySelector('main') ||
               document.querySelector('[role="main"]') ||
               document.querySelector('#main-content') ||
               document.querySelector('#content') ||
               document.querySelector('article') ||
               document.querySelector('.content') ||
               document.querySelector('.main');

    // If no landmark found, use body but be more aggressive with cleanup
    var source = main || document.body;
    if (!source) return '';

    var clone = source.cloneNode(true);

    // Remove noise: scripts, styles, iframes, hidden elements, tracking pixels
    var remove = clone.querySelectorAll([
      'script', 'style', 'noscript', 'iframe', 'svg',
      'link[rel="stylesheet"]', 'link[rel="preload"]',
      '[class*="cookie"]', '[class*="banner"]', '[class*="popup"]', '[class*="modal"]',
      '[id*="chat"]', '[class*="chat"]', '[aria-hidden="true"]',
      '[class*="sidebar"]', '[class*="ad-"]', '[id*="ad-"]',
      '[class*="tracking"]', '[class*="pixel"]',
      'img[width="1"]', 'img[height="1"]',
      '[data-galuli]',  // our own injected elements
    ].join(', '));
    for (var i = 0; i < remove.length; i++) {
      remove[i].parentNode && remove[i].parentNode.removeChild(remove[i]);
    }

    // Remove all inline styles and event handlers (reduce size, improve readability)
    var allEls = clone.querySelectorAll('*');
    for (var j = 0; j < allEls.length; j++) {
      allEls[j].removeAttribute('style');
      allEls[j].removeAttribute('onclick');
      allEls[j].removeAttribute('onload');
      allEls[j].removeAttribute('onerror');
      // Remove data attributes except meaningful ones
      var attrs = allEls[j].attributes;
      for (var k = attrs.length - 1; k >= 0; k--) {
        var name = attrs[k].name;
        if (name.startsWith('data-') && name !== 'data-testid' && name !== 'data-id') {
          allEls[j].removeAttribute(name);
        }
      }
      // Remove class attribute to reduce size (classes are meaningless without CSS)
      allEls[j].removeAttribute('class');
    }

    var html = clone.innerHTML;

    // Truncate to 500KB to prevent abuse
    if (html.length > 512000) {
      html = html.slice(0, 512000);
    }

    return html;
  }

  function _hashString(str) {
    // FNV-1a 32-bit hash
    var hash = 2166136261;
    for (var i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
    return hash.toString(16);
  }

  // ── 5. WebMCP Integration ──────────────────────────────────────────────────
  // W3C WebMCP spec (2025-03-26, Chrome early preview Feb 2026).
  // Registers tools on navigator.modelContext so browser-based AI agents
  // can understand and interact with the page's capabilities.
  var registeredTools = [];
  var webmcpSupported = false;

  function _registerWebMCPTools(forms, pageType) {
    if (!navigator.modelContext) {
      log('WebMCP not available in this browser');
      return;
    }

    // Support both registerTool (individual) and provideContext (batch)
    var hasRegister = typeof navigator.modelContext.registerTool === 'function';
    var hasProvide  = typeof navigator.modelContext.provideContext === 'function';
    if (!hasRegister && !hasProvide) {
      log('WebMCP API not fully supported');
      return;
    }

    webmcpSupported = true;
    log('WebMCP supported — registering tools');

    var tools = [];

    // ── get_page_info — always register ──────────────────────────────────────
    tools.push({
      name: 'get_page_info',
      description: 'Get structured information about this page: type, title, URL, description, headings, and available actions.',
      inputSchema: { type: 'object', properties: {}, required: [] },
      annotations: { readOnlyHint: true },
      execute: function () {
        return {
          page_type:   pageType,
          title:       document.title,
          url:         window.location.href,
          description: _extractMetaDescription(),
          headings:    _extractHeadings(),
          ctas:        _extractCTAs(),
        };
      },
    });

    // ── get_full_content — read-only text extraction ───────────────────────
    tools.push({
      name: 'get_page_content',
      description: 'Get the full readable text content of this page, cleaned of navigation and footer noise.',
      inputSchema: { type: 'object', properties: {}, required: [] },
      annotations: { readOnlyHint: true },
      execute: function () {
        return {
          text:    _extractTextPreview(),
          url:     window.location.href,
          title:   document.title,
        };
      },
    });

    // ── Pricing page tool ─────────────────────────────────────────────────
    if (pageType === 'pricing') {
      tools.push({
        name: 'get_pricing',
        description: 'Get all pricing plans, tiers, features included, and costs for this service.',
        inputSchema: { type: 'object', properties: {}, required: [] },
        annotations: { readOnlyHint: true },
        execute: function () {
          return {
            pricing_url: window.location.href,
            content:     _extractTextPreview(),
            schema_data: _extractSchemaOrg(),
          };
        },
      });
    }

    // ── Form-based tools ───────────────────────────────────────────────────
    forms.forEach(function (form) {
      if (!form.fields || form.fields.length === 0) return;

      var toolName    = _formToToolName(form.name || form.action, pageType);
      var description = _formToDescription(form, pageType);
      var schema      = _formToInputSchema(form);

      tools.push({
        name:        toolName,
        description: description,
        inputSchema: schema,
        // Note: not readOnlyHint — form tools are write operations
        execute: function (params) {
          // Return structured form info; the agent decides whether to fill/submit
          return {
            form_action:     form.action,
            form_method:     form.method,
            fields:          form.fields,
            provided_params: params,
            page_url:        window.location.href,
          };
        },
      });
    });

    // Register all tools
    if (hasProvide) {
      try {
        navigator.modelContext.provideContext({ tools: tools });
        tools.forEach(function (t) {
          registeredTools.push({ name: t.name, description: t.description, source: 'auto' });
        });
        log('Registered', tools.length, 'WebMCP tools via provideContext');
      } catch (e) { log('provideContext failed:', e); }
    } else {
      // Fallback: register individually
      tools.forEach(function (tool) {
        try {
          navigator.modelContext.registerTool(tool);
          registeredTools.push({ name: tool.name, description: tool.description, source: 'auto' });
          log('Registered WebMCP tool:', tool.name);
        } catch (e) { log('registerTool failed:', tool.name, e); }
      });
    }
  }

  function _formToToolName(nameOrAction, pageType) {
    return (nameOrAction || pageType || 'submit')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40)
      .toLowerCase() || 'form_submit';
  }

  function _formToDescription(form, pageType) {
    var fieldNames = (form.fields || []).map(function (f) { return f.name; }).join(', ');
    var matchers = [
      { key: 'signup',    desc: 'Sign up for an account or start a free trial' },
      { key: 'contact',   desc: 'Send a contact or support request message' },
      { key: 'login',     desc: 'Log in to an existing account' },
      { key: 'search',    desc: 'Search the site for relevant content' },
      { key: 'subscribe', desc: 'Subscribe to newsletter or email updates' },
      { key: 'booking',   desc: 'Book an appointment or schedule a demo' },
      { key: 'checkout',  desc: 'Complete a purchase or checkout' },
      { key: 'demo',      desc: 'Request a product demonstration' },
    ];
    var src2 = ((form.name || '') + ' ' + (form.action || '')).toLowerCase();
    for (var i = 0; i < matchers.length; i++) {
      if (src2.indexOf(matchers[i].key) !== -1) {
        return matchers[i].desc + '. Required fields: ' + fieldNames;
      }
    }
    return 'Submit the ' + (pageType || 'page') + ' form. Fields: ' + fieldNames;
  }

  function _formToInputSchema(form) {
    var properties = {};
    var required   = [];
    var COMMON_REQUIRED = ['email', 'name', 'message', 'query', 'phone', 'company'];

    (form.fields || []).forEach(function (field) {
      var jsType = field.type === 'number' ? 'number' :
                   field.type === 'checkbox' ? 'boolean' : 'string';

      properties[field.name] = {
        type:        jsType,
        description: field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/_/g, ' '),
      };

      if (field.required || COMMON_REQUIRED.indexOf(field.name.toLowerCase()) !== -1) {
        required.push(field.name);
      }
    });

    return { type: 'object', properties: properties, required: required };
  }

  // ── 6. Push to backend ─────────────────────────────────────────────────────
  function _pushToBackend(pageData) {
    if (!AUTO_PUSH) return;

    var textForHash  = (pageData.text_preview || '') + (pageData.title || '') + JSON.stringify(pageData.headings);
    var contentHash  = _hashString(textForHash);

    var payload = {
      domain:          domain,
      tenant_key:      TENANT_KEY,
      page:            pageData,
      content_hash:    contentHash,
      snippet_version: '3.4.0',
    };

    log('Pushing page data to backend:', pageData.url);

    _fetch(API_BASE + '/api/v1/push', 'POST', payload, function (res) {
      if (res) {
        if (res.score) log('AI Readiness Score:', res.score.total + '/100 (' + res.score.grade + ')');
        if (res.status === 'accepted') log('Registry update queued');
        else if (res.status === 'skipped') log('Content unchanged — skipped');
      }
    });
  }

  // ── 7. HTTP helpers ────────────────────────────────────────────────────────
  function _beacon(url, data) {
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        if (navigator.sendBeacon(url, blob)) return;
      } catch (e) {}
    }
    _fetch(url, 'POST', data);
  }

  function _fetch(url, method, data, callback) {
    try {
      var xhr = new XMLHttpRequest();
      xhr.open(method || 'POST', url, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('X-Galuli-Key', TENANT_KEY);
      // Signal to the server we accept Markdown responses (reduces token cost)
      xhr.setRequestHeader('Accept', 'application/json, text/markdown;q=0.9');
      xhr.timeout = 10000;
      if (callback) {
        xhr.onreadystatechange = function () {
          if (xhr.readyState === 4 && xhr.status >= 200 && xhr.status < 300) {
            try { callback(JSON.parse(xhr.responseText)); } catch (e) {}
          }
        };
      }
      xhr.send(data ? JSON.stringify(data) : null);
    } catch (e) {
      log('Request failed:', e.message);
    }
  }

  // ── 8. Main init ───────────────────────────────────────────────────────────
  function _init() {
    log('Initializing galuli v3.4.0 for domain:', domain);

    // ── Inject all <head> signals first (fast, sync) ──────────────────────
    _injectDiscoveryLinks();
    _injectSchemaIfMissing();

    // ── Analyze page ─────────────────────────────────────────────────────
    var pageType    = _analyzePageType();
    var headings    = _extractHeadings();
    var ctas        = _extractCTAs();
    var forms       = _extractForms();
    var schemaOrg   = _extractSchemaOrg();
    var description = _extractMetaDescription();
    var textPreview = _extractTextPreview();
    var openGraph   = _extractOpenGraph();
    var images      = _extractImages();

    log('Page type:', pageType, '| Forms:', forms.length, '| Headings:', headings.length, '| Schema blocks:', schemaOrg.length);

    // ── Register WebMCP tools ─────────────────────────────────────────────
    _registerWebMCPTools(forms, pageType);

    // ── Capture DOM snapshot (for SPA visibility) ─────────────────────────
    var htmlSnapshot = _captureSnapshot();

    // ── SPA invisibility warning ────────────────────────────────────────
    if (_isSpaDetected) {
      log('SPA detected — your page content is invisible to AI crawlers (ChatGPT, Claude, Perplexity).');
      log('Galuli is capturing a snapshot to make it readable. View cached pages at:');
      log('  https://galuli.io/registry/' + domain + '/pages');
      if (!DEBUG) {
        console.info(
          '[galuli] This site uses client-side rendering. AI crawlers (ChatGPT, Claude, Perplexity) cannot read JavaScript-rendered content. ' +
          'Galuli is capturing page snapshots to make your content AI-visible. ' +
          'Dashboard: https://galuli.io/dashboard/'
        );
      }
    }

    // ── Build and push page data ──────────────────────────────────────────
    var pageData = {
      url:              window.location.href,
      title:            document.title || '',
      description:      description,
      page_type:        pageType,
      headings:         headings,
      ctas:             ctas,
      forms:            forms,
      schema_org:       schemaOrg,
      open_graph:       openGraph,
      images:           images,
      text_preview:     textPreview,
      html_snapshot:    htmlSnapshot,
      is_spa:           _isSpaDetected,
      webmcp_tools:     registeredTools,
      webmcp_supported: webmcpSupported,
      lang:             document.documentElement.getAttribute('lang') || null,
      canonical:        (document.querySelector('link[rel="canonical"]') || {}).href || null,
    };

    _pushToBackend(pageData);
  }

  // ── Wait for DOM ready ─────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    // Script loaded async after DOM is ready; 250ms gives React/Vue time to render
    setTimeout(_init, 250);
  }

  // ── 9. SPA Navigation Support ─────────────────────────────────────────────
  // Lovable / Base44 / Replit / Next.js apps navigate via history.pushState
  // without a page reload. Re-run _init on every route change so every page
  // gets indexed, not just the first one loaded.
  (function () {
    var _lastUrl = window.location.href;

    function _onNav() {
      // Ignore hash-only changes on the same path
      var newUrl = window.location.href;
      if (newUrl === _lastUrl) return;
      _lastUrl = newUrl;
      // Wait for React/Vue to re-render the new page content
      setTimeout(function () {
        log('SPA navigation detected — re-indexing:', window.location.pathname);
        _init();
      }, 300);
    }

    // Monkey-patch pushState (React Router, Next.js, etc.)
    var _origPush = history.pushState;
    history.pushState = function () {
      _origPush.apply(this, arguments);
      _onNav();
    };

    // Also handle browser back/forward
    window.addEventListener('popstate', _onNav);
  })();

  // ── Public API (window.galui) ──────────────────────────────────────────────
  window.galuli = {
    version: '3.4.0',
    domain:  domain,
    getTools: function () { return registeredTools.slice(); },
    getScore: function (callback) {
      _fetch(API_BASE + '/api/v1/score/' + domain, 'GET', null, callback);
    },
    logAgentEvent: function (agentName, agentType) {
      _sendAnalyticsEvent(agentName, agentType);
    },
    refreshPage: function () {
      _init();
    },
  };
  window.galui = window.galuli; // backward-compat alias — existing installs using window.galui still work

  log('galuli.js loaded — v3.4.0');

}(window, document));
