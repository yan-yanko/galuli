import { useState } from 'react'

// ── Blog post data ─────────────────────────────────────────────────────────────
export const POSTS = [
  {
    slug: 'webmcp-explained',
    title: 'WebMCP: The Protocol That Makes Your Website Callable by AI Agents',
    subtitle: 'A technical introduction to WebMCP — the emerging standard that lets AI agents discover, understand, and interact with your web services without human help.',
    date: 'March 3, 2026',
    readTime: '9 min read',
    category: 'Technical',
    coverEmoji: '🤖',
    intro: `The web has always been designed for humans. URLs, HTML, and HTTP were built so browsers could fetch pages and humans could read them. But AI agents don't browse — they call. They need to know: what can this website do, what parameters does it accept, and what will it return? WebMCP is the protocol being built to answer those questions.`,
    sections: [
      {
        heading: 'What WebMCP is',
        body: `WebMCP — Web Model Context Protocol — is an extension of Anthropic's Model Context Protocol (MCP) for the open web. Where MCP defines how AI agents communicate with local tools (file systems, databases, custom scripts), WebMCP extends that model to publicly accessible web services.

The core idea: a website registers itself as a set of callable "tools" with structured inputs and outputs. An AI agent, encountering your domain in a conversation, can look up your WebMCP registration, discover what you can do, and call your tools directly — no human in the loop, no scraping HTML, no guessing at API behavior.

WebMCP registrations are hosted at /.well-known/ai-plugin.json (an OpenAI-originated standard that WebMCP extends) or served via a dedicated WebMCP discovery endpoint. A registration includes tool definitions (what actions the site can perform), input schemas (what parameters each tool accepts, in JSON Schema format), output schemas (what structure to expect in return), auth requirements, and rate limits.

This is the difference between your website being a "readable document" and being a "callable service." For AI agents that are increasingly taking autonomous actions on behalf of users — booking, purchasing, summarizing, creating — this distinction is enormous.`
      },
      {
        heading: 'Why WebMCP matters for GEO',
        body: `GEO has historically focused on passive optimization: write better content, add schema markup, publish a llms.txt file. These strategies make your site easier for AI to read. WebMCP is different — it makes your site something AI can actively use.

Consider the difference. Without WebMCP: a user asks ChatGPT to "find the best project management tool." ChatGPT synthesizes an answer from training data and retrieved content. Your site might be mentioned if it appears in that content. With WebMCP: a user asks Claude to "set up a project for my new website and invite my team." Claude discovers your tool's WebMCP registration, calls your project creation endpoint, and returns a confirmation — all without the user ever visiting your website.

This isn't hypothetical. AI agent frameworks like LangChain, AutoGPT, and Claude's own agent mode are actively building WebMCP discovery into their infrastructure. The sites that register early will have a compounding head start in the agentic web.

Princeton's GEO-bench research showed that structured signals — clear citations, statistics, and machine-readable declarations — increase AI citation probability by 30–40%. WebMCP is the most machine-readable declaration you can publish, and currently the least crowded.`
      },
      {
        heading: 'The anatomy of a WebMCP registration',
        body: `A WebMCP registration (hosted at /.well-known/ai-plugin.json) is a JSON document with a handful of critical fields.

The **name_for_model** field tells the AI how to refer to your service internally — keep it short, lowercase, and underscore-separated. The **description_for_model** is the most important field and consistently the most under-invested: this is what the AI agent reads to decide whether to call your tool. Be specific — name the inputs, name the outputs, name the constraints. Vague descriptions lead to wrong usage or no usage at all.

The **api** field points to your OpenAPI specification, which defines the actual callable endpoints with their parameters and response schemas. If you already have a Swagger/OpenAPI spec, you're most of the way there. The WebMCP registration is just the discovery layer on top of your existing API documentation.

The **auth** field specifies whether and how authentication works — options include no auth (for public tools), API key auth, or OAuth. If your service is public and read-only, starting with no auth dramatically lowers the friction for AI agents to call you.

Galuli auto-generates your /ai-plugin.json from your crawled site data and registers it with the WebMCP discovery network — saving you hours of manual spec writing and keeping the file in sync as your product evolves.`
      },
      {
        heading: 'How to check if your site is WebMCP-ready',
        body: `A quick manual check: navigate to https://yourdomain.com/.well-known/ai-plugin.json in your browser. If you get a valid JSON response, you have a basic registration. If you get a 404, you don't — and you're invisible to AI agents that use WebMCP discovery.

A more thorough audit with Galuli's AI Readiness Score will tell you whether your registration is schema-conformant, whether your description_for_model is specific enough to be useful, whether your OpenAPI spec is accessible and well-structured, and how your WebMCP implementation compares to competitors in your category.

The Machine Signals dimension of Galuli's score specifically measures WebMCP readiness, alongside llms.txt, robots.txt hygiene, and schema.org markup — the four pillars of machine-readable web presence.

The agentic web is being built right now. The sites registering their tools today are the ones that will be called by AI agents tomorrow. The barrier to entry is lower than most people expect: if you have an API and 30 minutes, you have everything you need to publish a valid WebMCP registration.`
      },
    ],
    cta: 'Check your WebMCP status →'
  },
  {
    slug: 'how-to-get-ai-citations',
    title: 'How to Get Your Website Cited by ChatGPT, Perplexity, and Claude',
    subtitle: 'A practical, research-backed playbook for getting AI systems to recommend your product, service, or content — based on what each LLM actually values.',
    date: 'March 4, 2026',
    readTime: '12 min read',
    category: 'Strategy',
    coverEmoji: '🔗',
    intro: `Getting cited by an AI system isn't luck. It's a function of specific, measurable signals that each AI weighs when deciding whether to include your site in a synthesized answer. The frustrating truth: most websites are not cited because of problems they could fix in a weekend. This guide covers what those problems are and how to fix them — with different advice for ChatGPT, Perplexity, and Claude, because they're genuinely different systems with different priorities.`,
    sections: [
      {
        heading: 'Why different AI systems cite differently',
        body: `ChatGPT, Perplexity, and Claude don't work the same way, and optimizing for all three requires understanding their differences.

**ChatGPT** (with Browse/retrieval) uses a hybrid model: static training data plus real-time retrieval. For static training, being referenced in the kinds of sources that make it into large crawls — Wikipedia, major blogs, review sites, documentation — matters most. For retrieval, what matters is that your content is accessible, structured, and clearly answers the kind of question a user might be asking.

**Perplexity** is retrieval-first. It's essentially a real-time search engine with synthesis. Perplexity indexes the web continuously, weights freshness heavily, and prefers sources with clear author attributions, published dates, and outbound citations. It's the AI most similar to Google in how it evaluates content — but it synthesizes rather than lists.

**Claude** (in retrieval-augmented mode) excels at nuanced synthesis. Claude responds especially well to content that is specific, internally consistent, and well-organized. It's particularly good at extracting structured data — pricing tables, feature comparisons, use case descriptions — and is skeptical of vague claims without supporting detail.

The universal truth: all three systems prefer content that is factually dense, well-organized, and easy to extract information from. The differences are in emphasis, not fundamentals.`
      },
      {
        heading: 'The five signals that drive citation probability',
        body: `Princeton's GEO-bench study (2023) tested hundreds of content variations against AI retrieval systems and identified the interventions that most reliably increase citation probability. Here's the ranked list:

**1. Add statistics and cited data (+29% avg. citation probability)**
Statements like "our tool saves teams 4 hours per week" are 29% more likely to be cited than "our tool saves time." The number makes the claim concrete and extractable. Add data wherever you make a claim. Cite your source — even if it's your own research — because cited data gets more weight than bare assertions.

**2. Add authoritative citations (+27%)**
Content that references external authoritative sources — studies, published reports, industry data — is treated as more credible by AI retrieval systems. This applies even when the claims are obviously true. Add "according to [source]" to your factual claims wherever possible.

**3. Use structured quotations (+26%)**
Direct quotes from identifiable sources (customers, researchers, experts) dramatically increase citation probability. An AI synthesizing an answer is much more likely to include a named, attributed quote than a paraphrase.

**4. Add fluency and precision (+18%)**
AI systems filter out hedging language. "Might," "could," "potentially," "we believe" all reduce citation probability. Replace hedges with specifics: "reduces latency by 40 milliseconds" rather than "might reduce latency significantly."

**5. Include keyword-rich entity descriptions (+15%)**
Describe your product's category, use case, and differentiation explicitly in your text. AI models use named entities to understand what something is. "Galuli is an AI visibility analytics platform that tracks which AI systems are crawling your website" gives the model clear entity data to work with.`
      },
      {
        heading: 'What Perplexity specifically rewards',
        body: `Perplexity's retrieval algorithm has some quirks that make it distinctly optimizable.

**Freshness beats almost everything.** Content published or updated within the last 7 days has a significant advantage for time-sensitive queries. This doesn't mean churning out low-quality content — it means updating your existing pages regularly. Adding a "Last updated: [date]" tag and genuinely refreshing the content is enough to benefit from freshness signals.

**Author attribution matters.** Perplexity displays author names in its citations. Pages with clear author bylines, especially from people with established web presence, are cited more often than anonymous pages. If your company blog posts don't have author names attached, add them.

**Outbound links signal credibility.** Perplexity's algorithm treats outbound links as a credibility signal, similar to academic citations. Pages that cite their sources — linking to the studies, reports, and tools they reference — are cited more than pages that make claims without linking to evidence.

**Page speed matters.** Perplexity's crawler has a timeout. Pages that take more than 5 seconds to fully render risk being partially or not indexed. Check your Core Web Vitals — Perplexity is one of the few AI systems where page performance directly affects citation probability.`
      },
      {
        heading: 'What ChatGPT specifically rewards',
        body: `ChatGPT's retrieval (via Browse and GPT Actions) behaves differently from Perplexity.

**Structured formats outperform prose.** ChatGPT's retrieval system extracts information more effectively from bullet points, numbered lists, headers, and tables than from continuous prose. If your homepage is one long paragraph of marketing copy, ChatGPT is probably not extracting much useful information from it. Restructure key information into scannable formats.

**Use-case specificity is critical.** ChatGPT is often responding to specific, high-intent queries: "best tool for [specific use case]." Pages that explicitly describe specific use cases — "ideal for engineering teams of 5–20 people that need weekly sprint reporting" — are more likely to match specific queries than generic benefit descriptions.

**ai-plugin.json / GPT Actions enable direct integration.** ChatGPT's GPT Action ecosystem can directly call your API if you have a valid OpenAPI spec and plugin manifest. This isn't just a citation — it's your service being used directly inside ChatGPT. For services with clear, callable functionality, it's the highest-value GEO investment you can make.`
      },
      {
        heading: 'What Claude specifically rewards',
        body: `Claude (in tool-calling and retrieval-augmented mode) has some distinct preferences that are worth understanding.

**Organizational clarity.** Claude excels at structured extraction. Clear H2 and H3 headings, logical section organization, and consistent formatting help Claude parse your content accurately. Poorly organized pages — where related information is scattered without clear navigation cues — tend to be synthesized inaccurately.

**Explicit constraint documentation.** Claude is good at nuanced reasoning and tends to include nuance in its outputs. Pages that document what your product does NOT do (constraints, limitations, who it's not for) are cited more accurately than pages that only describe benefits. Saying "this is not suitable for [use case]" actually increases overall citation accuracy and credibility.

**Technical depth rewards technical queries.** Claude's user base skews technical and analytical. For queries with technical depth — "how does [product] handle [technical scenario]" — Claude rewards pages with genuine technical depth over marketing summaries. Your documentation, API references, and technical blog posts may outperform your landing page for Claude citations.`
      },
      {
        heading: 'Tracking whether it is working',
        body: `The challenge with GEO is that you can't just check a rank tracker — there's no position 1. You need a different measurement approach.

**Run actual queries.** Ask ChatGPT, Perplexity, and Claude the queries your customers would ask. Check if you're mentioned. Note the context. Track this over time, manually or with a tool.

**Monitor AI crawler traffic.** AI systems like GPTBot, ClaudeBot, PerplexityBot, and others show up in your server logs with their own User-Agent strings. Standard analytics tools (GA4, Plausible) filter these out. Galuli's snippet captures them. Are your important pages being crawled? How often?

**Watch your GEO Score.** Galuli's GEO Score across six AI systems shows trends over time — not just where you are now, but whether the changes you're making are moving the needle. A rising GEO Score correlates with rising citation probability.

**Set up Citation Tracker queries.** Define the 3–5 queries where you want to appear in AI outputs. Run them weekly. Track whether you appear, what the context is, and whether your competitors appear more or less often. Galuli's Citation Tracker (available on Pro+) automates this with weekly scheduled checks.

The sites winning AI citations in 2026 are the ones that started treating GEO as seriously as SEO 12 months ago. The good news: the bar is still low enough that a focused weekend of improvements can meaningfully shift your standing.`
      },
    ],
    cta: 'Track your AI citations →'
  },
  {
    slug: 'ai-readiness-tech-stack-2026',
    title: 'The Complete AI Readiness Tech Stack for 2026',
    subtitle: 'Every tool, file, and configuration your website needs to be fully visible to — and usable by — the AI systems that are reshaping how people discover products online.',
    date: 'February 20, 2025',
    readTime: '13 min read',
    category: 'Technical',
    coverEmoji: '🛠️',
    intro: `AI readiness isn't one thing you add to your website — it's a stack of interconnected signals that AI systems use to understand, trust, and cite you. This guide breaks down every layer of that stack, explains what each does, and tells you exactly what "good" looks like for each layer. Think of it as a systematic checklist you can work through layer by layer.`,
    sections: [
      {
        heading: 'Layer 1 — Crawl access (can AI find you?)',
        body: `Before any AI system can read your content, it needs to be allowed to. This sounds obvious — of course my site is public — but a surprising number of sites unknowingly block AI crawlers.

**robots.txt hygiene** is the most common problem. A robots.txt file that uses a wildcard block for all user agents, then only explicitly allows Googlebot, will exclude every AI crawler by default. GPTBot (OpenAI), ClaudeBot (Anthropic), PerplexityBot, FacebookBot (for Llama training), and others are not Googlebot. If your robots.txt has Disallow rules for unknown bots, AI crawlers may be blocked without you knowing.

The ideal state: explicitly list the major AI crawlers and Allow them access to your key pages. If you want all AI crawlers to have full access, a blanket Allow under the catch-all user-agent is fine as long as you're not using Disallow rules that sweep too broadly.

**JavaScript rendering** is the second most common problem. Most AI crawlers (GPTBot, ClaudeBot, PerplexityBot) do not execute JavaScript. If your content is rendered client-side in a React/Next.js/Svelte SPA with no server-side rendering or static export, AI crawlers may see a nearly empty page. Audit your key pages with JavaScript disabled — what you see is what AI crawlers see. Galuli flags this automatically if key content elements (headings, descriptions, pricing) are absent in the non-JS version of your page.

**Crawl speed and reliability** matters too. AI crawlers are often less patient than Googlebot. Pages that consistently time out or return server errors get deprioritized or skipped entirely. Check your server logs for 5xx errors from known AI crawler User-Agent strings.`
      },
      {
        heading: 'Layer 2 — Machine-readable declarations',
        body: `Once an AI crawler can access your site, the next layer is machine-readable files that tell AI systems who you are and what you do — without requiring them to infer it from marketing copy.

**llms.txt** is a Markdown file at your domain root (/llms.txt), written specifically for language models. It should include a concise description of what your product does, a bulleted list of key capabilities, pricing information, and key URLs (homepage, docs, pricing, API reference). The format is intentionally human-readable Markdown, because that's what LLMs handle best. Write it as you would a README.

**ai-plugin.json** hosted at /.well-known/ai-plugin.json is the WebMCP discovery endpoint. Originally the OpenAI ChatGPT Plugin manifest, now extended as the standard for AI agent discovery. The most critical field is description_for_model — a specific, technical description of what your service does and when to use it. This is what AI agents read to decide whether to call your tool.

**sitemap.xml** remains critically important for AI crawlers. A well-structured sitemap tells crawlers which URLs exist, when they were last updated, and their relative priority. Many sites have sitemaps that are outdated or missing key pages. Regenerate yours whenever you add significant content.

**OpenAPI/Swagger spec** is the highest-value investment for API-first products. If you have an API, a valid OpenAPI 3.x spec at a discoverable URL is a machine-readable declaration of everything your service can do. ChatGPT's GPT Actions can ingest OpenAPI specs directly. Claude's tool-calling mode can use them.`
      },
      {
        heading: 'Layer 3 — Structured data (schema.org)',
        body: `Schema.org markup is the language that lets you tell AI systems what your content means — not just what it says. It's been around for over a decade, but most sites implement it incompletely or incorrectly.

**Organization** schema is the baseline: who you are, your logo, your social profiles, your contact information. Every website should have this. AI systems use it to build a confident picture of your company's identity and distinguish you from similarly-named entities.

**Product or SoftwareApplication** schema documents your product's name, description, pricing, platform availability, and ratings. This is what AI systems use when synthesizing answers to "what does this product cost" or "what does this product do." Without it, the AI is guessing from your marketing copy.

**FAQPage** schema marks up question-and-answer pairs as structured data. Princeton's GEO-bench research found that FAQ-format content significantly increases AI citation probability. Adding schema.org FAQPage markup on top of well-written FAQ content gives you a structured-data bonus.

**HowTo** schema marks up step-by-step processes. If you have tutorial content — how to install, how to set up, how to use — marking it up as HowTo schema makes it dramatically more usable by AI systems generating instructional content.

**Article and BlogPosting** schemas add author, publication date, and section markup to your content pages. Particularly important for Perplexity, which weights author attribution heavily in its citation decisions.

Implementation: add JSON-LD script blocks with type "application/ld+json" to the head of relevant pages. Galuli audits your schema.org implementation as part of the Machine Signals score dimension.`
      },
      {
        heading: 'Layer 4 — Content quality signals',
        body: `The structural and technical layers create the container. This layer is about what you put inside it — and specifically, the content quality signals that AI systems use to decide whether to trust and cite your content.

**Citation density** is the highest-impact improvement most sites can make. Content that cites sources — linking to the studies, reports, and data that support your claims — is treated as dramatically more credible by AI retrieval systems. This mimics academic publishing norms. Statements with cited sources are 27–29% more likely to be extracted and used in AI answers than identical statements without citations.

**Factual specificity** matters enormously. AI systems filter out vague claims. Sentences with specific numbers, dates, named entities, and technical details are extracted and cited far more than sentences with hedging language. Audit your key pages for vague claims and replace them with specific, measurable ones wherever possible.

**Information gain** is the concept that AI systems de-prioritize content that is semantically identical to content they've already encountered. "Our tool is easy to use" adds zero information — every competitor says the same thing. "Our tool has a 15-minute average time-to-first-workflow, measured across 2,400 new user onboarding sessions" adds unique, extractable information that AI systems can actually work with.

**Authority gap analysis** identifies every claim in your content that lacks a supporting citation — places where an AI system might reasonably doubt your assertion. Galuli's Content Doctor includes both an Authority Gap Scanner (finds unsupported claims) and an Information Gain Checker (flags generic content) to help you close these gaps systematically.`
      },
      {
        heading: 'Layer 5 — Monitoring and measurement',
        body: `The final layer is the measurement infrastructure that tells you whether the other four layers are working — and alerts you when something breaks.

**AI crawler traffic monitoring** is the most overlooked piece. Standard analytics tools don't capture AI crawler traffic. GPTBot, ClaudeBot, PerplexityBot, and others are filtered out by most analytics platforms because they're not human users. But they matter: if GPTBot stops crawling your site, your citation probability in ChatGPT drops within weeks. You need to know when this happens. Galuli's snippet captures all bot traffic, identifies the agent, records which pages are visited, and tracks visit frequency over time.

**GEO Score tracking** gives you an aggregate view of your AI readiness across six AI systems (ChatGPT, Perplexity, Claude, Gemini, Grok, Llama). Track it over time — rising scores correlate with rising citation probability, and drops alert you to new problems before they affect your actual citations.

**Citation monitoring** means actively querying the AI systems that matter for your category and checking whether you're being cited. This can be done manually (ask ChatGPT and Perplexity your top 5 category queries once a week) or automated with Galuli's Citation Tracker, which runs scheduled weekly checks and surfaces changes in how AI systems are describing you and your competitors.

**Automatic re-scanning** keeps your AI registry current as your content evolves. Galuli's Starter and Pro plans include weekly re-scans that update your score, regenerate your llms.txt and ai-plugin.json, and refresh your structured data audit — so your AI readiness stays current without manual effort.

The goal of the full five-layer stack is to move from "AI systems might find you" to "AI systems will find you, understand you, trust you, and cite you." That's the difference between hoping for AI citations and systematically earning them.`
      },
    ],
    cta: 'Run your AI readiness audit →'
  },
  {
    slug: 'what-is-geo',
    title: 'What Is GEO (Generative Engine Optimization)?',
    subtitle: "The complete guide to optimizing your website for ChatGPT, Claude, Perplexity, and every other AI that's replacing Google.",
    date: 'February 18, 2025',
    readTime: '14 min read',
    category: 'Fundamentals',
    coverEmoji: '🧠',
    intro: `Something big happened while most SEO practitioners were still arguing about E-E-A-T and Core Web Vitals. A new kind of search engine arrived — one that doesn't show ten blue links. It reads your website, understands it, synthesizes it, and either mentions you or doesn't. There's no page two. There's no position five. You're either in the answer or you're invisible.

This is the world of Generative Engine Optimization — GEO — and it's already reshaping how billions of people discover products, services, and information online.`,
    sections: [
      {
        heading: 'The shift from search to synthesis',
        body: `Traditional SEO was built on a simple mental model: Google crawls pages, indexes them, and ranks them by relevance and authority. Users type queries, scroll results, click links, and visit websites. Every website owner's job was to be as high on that list as possible.

Generative AI changes every step of that loop. When someone asks ChatGPT "what's the best project management tool for a 10-person engineering team," ChatGPT doesn't show ten links. It synthesizes an answer from everything it knows, possibly enriched by real-time web retrieval, and delivers a recommendation in plain language. If your product is recommended, you win. If it isn't, you might as well not exist — at least for that user, in that moment.

The numbers confirm the shift is real:
- ChatGPT processes over 1 billion queries per day (as of early 2025)
- Perplexity AI crossed 100 million queries per day less than 18 months after launch
- Google's AI Overviews (built on Gemini) now appear in roughly 30% of search results
- Claude, Grok, Llama-powered products, and dozens of specialized AI assistants collectively field hundreds of millions of queries daily

The category of "AI-driven discovery" is no longer a niche. It's where a meaningful and rapidly growing fraction of product discovery, service research, and purchase decisions happen.`
      },
      {
        heading: 'What GEO actually means',
        body: `GEO — Generative Engine Optimization — is the discipline of making your website, product, and brand intelligible to, and recommended by, AI language models.

The term was coined in academic research published in 2023 (Aggarwal et al., "GEO: Generative Engine Optimization") and has since been adopted broadly by practitioners. It encompasses:

**Content comprehensibility** — Is your content written in a way that an AI reading it at inference time can extract accurate, structured facts? Long, rambling paragraphs that humans skim are not the same as content an LLM can synthesize clearly.

**Structural legibility** — Does your site's architecture — navigation, headers, schema markup, internal links — help AI understand what you do, for whom, and why it matters?

**Factual completeness** — Does your site answer the questions an AI is likely to ask? Pricing, integrations, use cases, limitations, comparisons — the details that help a model make a confident recommendation.

**Citation authority** — Are you mentioned in the kinds of third-party sources (documentation, reviews, news, technical blogs) that AI training datasets and real-time retrieval systems trust?

**Machine-readable signals** — Have you published a llms.txt file, AI Plugin manifest, or WebMCP tool registration that directly tells AI agents who you are and how to interact with you?

GEO is not "SEO for robots." It's a fundamentally different discipline because the consumer of your content is not a crawler assigning PageRank — it's a language model that will either synthesize your product into an answer or it won't.`
      },
      {
        heading: 'How AI systems actually read your website',
        body: `To optimize for AI, you need to understand how AI actually processes your content. There are three main pathways:

**1. Training data** — This is the baseline. Every major language model was trained on a large corpus of web text. If your website existed and was crawlable before the training cutoff, some version of your content is baked into the model's weights. The model has a "memory" of you. But this memory degrades: it's static, it can be superseded by more recent mentions, and it reflects how well-represented your site was in the training corpus. Being a Wikipedia article is very different from being a minor SaaS landing page.

**2. Retrieval-augmented generation (RAG)** — Systems like Perplexity, ChatGPT with Browse, and Bing AI don't just use static training data. They actively crawl the web at query time and inject retrieved content into the model's context window. This means your current content matters enormously, right now, not just at some past training date. Fast-loading pages, clean HTML, accessible text, and structured headers dramatically affect whether a retrieval system can extract your content accurately.

**3. Tool-calling and structured data** — The most powerful pathway, and the most underused. AI agents — whether ChatGPT's plugins, Claude's tools, or custom enterprise assistants — can call APIs, read structured data files, and interact with services in real time. If you've published a llms.txt file, an ai-plugin.json manifest, or registered your service via WebMCP, AI agents can directly understand your capabilities without having to infer them from marketing copy.

Most websites are optimized for exactly none of these. They're designed for human eyes, and when an AI reads them, it gets a blurry, incomplete, uncertain picture of what the site actually does.`
      },
      {
        heading: "GEO vs. SEO: what's the same, what's different",
        body: `GEO and SEO are siblings, not twins. They share some DNA — quality content, clear structure, earned authority — but they diverge sharply on specifics.

**What carries over from SEO:**
- High-quality, well-researched content still matters
- Site authority (as proxied by backlinks) still influences whether AI systems trust your claims
- Technical site health (crawlability, load speed, clean HTML) still affects whether your content gets indexed and retrieved
- Brand mentions in authoritative publications still build the kind of reputation that influences AI outputs

**What's fundamentally different in GEO:**

*Ranking vs. inclusion* — In SEO, you optimize for position 1, 2, 3. In GEO, you optimize for binary inclusion: are you in the answer or not? Position doesn't exist. Being the "second recommendation" is nearly as good as being the first, and being the "third mention" is nearly as good as being the second. But being excluded entirely is catastrophic.

*Keywords vs. concepts* — SEO optimizes for specific keyword strings. GEO optimizes for semantic completeness — does the AI understand the full picture of what you do? A page stuffed with keywords that doesn't clearly articulate your core value proposition, use cases, pricing logic, and differentiators will fail GEO even if it ranks well for SEO.

*Metadata vs. machine-readable declarations* — Title tags and meta descriptions tell Google's crawler what a page is about. llms.txt, AI Plugin manifests, and WebMCP registrations tell AI agents how to interact with your service. These are entirely different systems, built for entirely different consumers.

*Link authority vs. citation patterns* — In SEO, backlinks convey PageRank. In GEO, what matters is whether your brand appears in the kinds of sources that AI systems treat as authoritative: documentation, review sites, technical blogs, Wikipedia, academic papers, and news. A single mention in a highly-trusted source can outweigh hundreds of link-farm backlinks.`
      },
      {
        heading: 'The six AI systems that matter most right now',
        body: `GEO isn't one optimization target — it's six (and counting). Each major AI system has different architecture, different training data emphasis, different retrieval strategies, and different recommendation behaviors.

**ChatGPT (OpenAI)** — The dominant consumer AI. Billions of monthly active users. ChatGPT with Browse uses real-time retrieval. The plugin ecosystem (now called GPT Actions) allows direct API integration. ChatGPT tends to favor content that is dense, factual, and use-case specific. Vague marketing language is filtered out. Specific pricing numbers, concrete capabilities, and documented integrations perform well.

**Perplexity** — The most aggressive retrieval-first AI. Perplexity is essentially a search engine where the results are synthesized rather than listed. It heavily weights freshness (content less than 7 days old has a significant advantage for time-sensitive queries), domain authority, and the presence of authoritative sources like official pricing pages and documentation URLs.

**Claude (Anthropic)** — Claude is often used for analytical, research-heavy queries. It excels at nuanced reasoning. For GEO purposes, Claude responds well to content that clearly articulates problems solved, constraints documented (what you don't do is as important as what you do), and category clarity. Claude is particularly good at synthesizing structured data.

**Gemini (Google)** — Google's AI is uniquely positioned because it has access to Google's index and can leverage schema.org markup at scale. Schema.org structured data — Product, Organization, HowTo, FAQPage — that would have been a GEO bonus for other systems is a stronger signal for Gemini. API documentation and OpenAPI specs are also weighted signals.

**Grok (xAI/X)** — Grok is trained heavily on real-time information from X (formerly Twitter) and the broader web. It weights recency aggressively — content less than 3 days old, trending topics, and breadth of coverage matter significantly. For emerging products or new features, Grok may be the first AI to pick up new information.

**Llama (Meta, open-source ecosystem)** — Llama models are deployed across a vast ecosystem of enterprise applications, custom assistants, and open-source tools. Unlike proprietary systems, Llama-based applications vary widely in how they access information. Optimizing for Llama is effectively optimizing for the open ecosystem: registry completeness, confidence signals, output format documentation.

A comprehensive GEO strategy optimizes for all six simultaneously — and that's exactly what Galuli's GEO Score measures.`
      },
      {
        heading: 'Your first steps in GEO',
        body: `If you're starting from zero, here's a prioritized checklist:

**Week 1: Foundation**
1. Run an AI Readiness audit (Galuli does this automatically) — understand where you're failing before you start fixing
2. Write or revise your homepage to answer, clearly and factually: What do you do? Who is it for? What problems does it solve? What does it cost? What integrations exist?
3. Create a dedicated "Use Cases" page with specific, detailed scenarios
4. Create a dedicated "Pricing" page with actual numbers (not "contact us for pricing")

**Week 2: Structure**
5. Add schema.org markup: at minimum, Organization and Product schemas
6. Create a llms.txt file at your domain root (see llms.txt.site for the spec)
7. Add an ai-plugin.json manifest if you have an API
8. Ensure your docs are crawlable and well-structured

**Week 3: Authority**
9. Seek mentions in product review platforms (G2, Capterra, ProductHunt)
10. Publish technical content that other developers and writers will cite
11. Get your Wikipedia page (or at least a Wikidata entry) if you're large enough
12. Submit to relevant directories and aggregators in your category

**Week 4: Measurement**
13. Implement AI agent traffic tracking (Galuli does this via snippet)
14. Check your GEO Score across all six AI systems
15. Identify your lowest-scoring LLM and focus your next sprint there

GEO is not a one-time project. It's an ongoing discipline, much like SEO — the systems keep evolving, the competitive landscape shifts, and the standards for what "good" looks like keep rising.`
      },
    ],
    cta: 'Check your GEO Score free →'
  },
  {
    slug: 'llms-txt-guide',
    title: 'The llms.txt File: What It Is, Why It Matters, and How to Write One',
    subtitle: 'A comprehensive guide to the emerging standard that lets you speak directly to AI systems in their native language.',
    date: 'February 12, 2025',
    readTime: '11 min read',
    category: 'Technical',
    coverEmoji: '📄',
    intro: `On September 3, 2024, Jeremy Howard published a simple proposal on llmstxt.org: websites should add a /llms.txt file to their root directory — a Markdown file written specifically for language models, summarizing what the site contains and providing structured access to key content.

The proposal was deceptively simple. It sparked immediate interest among AI developers and has since been adopted by hundreds of companies, from individual developers to large enterprises. Anthropic added llms.txt support to Claude. Perplexity reads them. Developer tools built llms.txt generation into their pipelines.

This guide explains what llms.txt is, why it emerged, how to write one that actually works, and what happens after you publish it.`,
    sections: [
      {
        heading: 'Why llms.txt was needed',
        body: `Before llms.txt, AI systems trying to understand your website faced the same problem: your website was designed for humans.

Humans navigate websites through visual hierarchy, color, layout, and interaction patterns. They skim hero sections, click features tabs, and read pricing cards. None of this translates cleanly to a language model that processes plain text sequentially.

When an AI reads a typical corporate website, it encounters:
- Navigation menus that list "Solutions," "Pricing," "Company" — meaningful to a human who knows how websites work, but without context to an AI
- Hero sections with short, punchy taglines that are great marketing but terrible information
- Feature grids full of marketing language ("Supercharge your workflow!") rather than factual capabilities
- Pricing pages that say "Contact sales" rather than actual numbers
- Interstitial calls-to-action that interrupt the informational flow
- JavaScript-heavy components that may not render in a retrieval system at all

The result is that a language model reading your website comes away with an incomplete, sometimes distorted picture of what you actually do. llms.txt is the solution: a clean, structured, human-readable (and AI-readable) document at a canonical location that tells AI systems exactly what they need to know.`
      },
      {
        heading: 'The llms.txt format: anatomy of a good file',
        body: `llms.txt is a Markdown file. That's it. No special encoding, no proprietary format, just clean Markdown at /llms.txt on your domain.

The spec recommends a specific structure:

\`\`\`markdown
# Your Product Name

> One-sentence description of what you do.

Optional additional context paragraph.

## Section Name

- [Page Title](URL): Brief description of what's at this URL
- [Page Title](URL): Brief description

## Another Section

- [Page Title](URL): Brief description
\`\`\`

The key elements:

**H1 — Your product name** The first heading should be your product or company name. This anchors the entire document.

**Blockquote summary** — A single sentence after the H1 in a blockquote format. This is the summary an AI will use when it needs to describe you briefly. Make it count. Be specific about who you are and what you do. "A SaaS platform for teams" is worthless. "A generative engine optimization (GEO) platform that measures and improves how websites appear in ChatGPT, Claude, Perplexity, and other AI search results" is useful.

**Optional paragraphs** — Use this space for context that doesn't fit in a bulleted list: your founding story, key differentiators, technical architecture, pricing model overview, target customer. This is your chance to shape the narrative an AI will use to describe you.

**Sections with links** — Organize your key pages into logical sections. For a SaaS product, typical sections might include: Documentation, API Reference, Integrations, Use Cases, Pricing & Plans, Blog Posts, About. Each link should include a meaningful description of what's at that URL.

**llms-full.txt** — A companion file, /llms-full.txt, is recommended for comprehensive coverage. If /llms.txt is the executive summary, /llms-full.txt is the full document. Include your complete documentation, full API reference, detailed tutorials.`
      },
      {
        heading: 'A real example: what a good llms.txt looks like',
        body: `Here's a representative example for a fictional project management SaaS:

\`\`\`markdown
# Taskflow

> Taskflow is a project management platform for software engineering teams of 5-100 people, featuring AI-powered sprint planning, GitHub/Jira integration, and real-time burndown analytics.

Taskflow is used by 12,000+ engineering teams worldwide. We are SOC 2 Type II certified and GDPR compliant. Our API is fully REST-based with OpenAPI 3.0 documentation.

## Getting Started

- [Quick Start Guide](https://taskflow.io/docs/quickstart): Complete setup guide from signup to first project in 15 minutes
- [Concepts Overview](https://taskflow.io/docs/concepts): Core mental models: workspaces, projects, sprints, tasks
- [Integration Setup](https://taskflow.io/docs/integrations): Connect GitHub, Jira, Slack, and 40+ other tools

## API Reference

- [REST API Overview](https://taskflow.io/api): Base URL, authentication, rate limits, error codes
- [OpenAPI Spec](https://taskflow.io/api/openapi.json): Machine-readable full API specification
- [Webhooks](https://taskflow.io/docs/webhooks): Real-time event notifications for task changes, sprint completions

## Pricing & Plans

- [Pricing Page](https://taskflow.io/pricing): Starter $0/mo (5 users), Growth $12/user/mo, Enterprise custom
- [Plan Comparison](https://taskflow.io/pricing#compare): Full feature matrix across all plans
- [Enterprise](https://taskflow.io/enterprise): SSO, advanced analytics, dedicated support, SLA

## Use Cases

- [Engineering Teams](https://taskflow.io/use-cases/engineering): Agile sprint planning, GitHub sync, PR tracking
- [Remote Teams](https://taskflow.io/use-cases/remote): Async workflows, timezone-aware scheduling, Slack integration
- [Agencies](https://taskflow.io/use-cases/agencies): Multi-client workspaces, client reporting, time tracking

## Resources

- [Blog](https://taskflow.io/blog): Engineering management insights, product updates, best practices
- [Status Page](https://status.taskflow.io): Real-time uptime and incident reports
- [Changelog](https://taskflow.io/changelog): Release notes updated weekly
- [Security](https://taskflow.io/security): SOC 2, GDPR, penetration testing, disclosure policy
\`\`\`

Notice what this file accomplishes: in under two minutes of AI reading time, the model now knows exactly what Taskflow is, who it's for, how it's priced, what integrations it has, and where to find more information. That's the goal.`
      },
      {
        heading: 'How AI systems use llms.txt',
        body: `Different AI systems use llms.txt in different ways:

**Retrieval systems (Perplexity, ChatGPT Browse)** — When these systems crawl your domain in response to a query, /llms.txt is typically one of the first files they check (alongside robots.txt, sitemap.xml). A clean llms.txt dramatically reduces ambiguity about what your site is and what pages are most important. This can improve the quality of answers these systems generate about you.

**Context-window injection** — When an AI agent (like a Claude-powered assistant or a custom enterprise chatbot) needs to "know about" your service, it may fetch your llms.txt and inject the contents into its context window. This is a direct data path from you to the model — one of the most reliable GEO mechanisms that currently exists.

**Training data for future models** — llms.txt files are being indexed and incorporated into training datasets by some labs. A well-written llms.txt today may shape how future models represent your product.

**Tool discovery** — AI agents that support plugins or tool-calling may use your llms.txt to discover that an AI Plugin manifest or OpenAPI spec is available, then load those for structured interaction.

**Confidence calibration** — Language models are inherently uncertain. When a model is unsure about a product's details, it either hedges ("I'm not sure about their pricing") or hallucinates ("they offer a free tier with 5 users"). A llms.txt that clearly states facts reduces the hallucination surface and increases the confidence with which a model makes claims about your product.`
      },
      {
        heading: 'Common mistakes to avoid',
        body: `After analyzing hundreds of llms.txt files across the web, these are the most common mistakes:

**Too short and vague** — A llms.txt that's five lines long and says "We help businesses grow with AI" is nearly useless. The file should be comprehensive enough that an AI could write an accurate paragraph about you using only the llms.txt content.

**Marketing language instead of facts** — Phrases like "industry-leading," "best-in-class," and "game-changing" are content deserts for AI systems. Use specific, verifiable facts: user counts, pricing numbers, integration names, certification names, specific capabilities.

**Missing pricing information** — Pricing is one of the highest-value pieces of information for AI recommendation systems. "Contact us for pricing" trains AI systems to either avoid mentioning you when cost matters or to say "pricing unavailable." Both outcomes are bad.

**Outdated content** — A llms.txt that lists deprecated features or old pricing is potentially worse than no llms.txt at all. Treat it like a live document: update it when your product changes.

**Missing links** — The linked structure of llms.txt (with URLs to specific pages) is important. AI retrieval systems can follow those links to get more detail. A llms.txt with no links is just a paragraph — useful, but not as useful as one that points to your full documentation.

**Wrong location** — /llms.txt must be at the root of your domain. /llms/index.txt or /docs/llms.txt won't be found by automated discovery systems.`
      },
      {
        heading: 'Beyond llms.txt: the full AI-readability stack',
        body: `llms.txt is a great start, but it's one layer of a larger AI-readability stack:

**1. llms.txt** — Your human-and-AI-readable summary (you're implementing this now)

**2. ai-plugin.json / GPT Actions manifest** — A structured JSON file at /.well-known/ai-plugin.json that describes your API for AI plugin systems. This is how ChatGPT plugins (GPT Actions) discover and understand APIs.

**3. OpenAPI spec** — A machine-readable specification of your API. AI systems can read this and programmatically understand how to call your endpoints. Linked from llms.txt and ai-plugin.json.

**4. Schema.org structured data** — JSON-LD markup on your pages that tells AI systems (and search engines) factual information about your product: Organization type, Product schema, HowTo steps, FAQ structured data.

**5. WebMCP registration** — An emerging standard for registering your service's capabilities with AI agent frameworks. Analogous to robots.txt but for AI tools rather than crawlers.

**6. robots.txt AI directives** — You can use robots.txt to specify which AI crawlers can access your content, and direct AI-specific crawlers to specific areas of your site.

Together, these form the "AI-readable" layer of your website — a parallel web architecture built for machine consumers rather than human users. Building this stack is exactly what Galuli helps you do.`
      },
    ],
    cta: 'Generate your llms.txt automatically →'
  },
  {
    slug: 'ai-readiness-score',
    title: 'AI Readiness Score: The 5 Dimensions That Determine If AI Systems Recommend You',
    subtitle: 'Why standard SEO metrics miss the point entirely — and how to measure what actually affects AI visibility.',
    date: 'February 5, 2025',
    readTime: '12 min read',
    category: 'Product',
    coverEmoji: '📊',
    intro: `Traditional web analytics tells you how humans interact with your website. Page views, bounce rate, time on site, conversion rate. These metrics are rich and mature, shaped by two decades of optimization research.

Now there's a new kind of visitor that doesn't show up in Google Analytics: AI systems. They don't bounce. They don't convert. They read your content, extract facts, form an understanding, and either recommend you or don't — often to millions of people, automatically, at scale.

Measuring AI readiness requires entirely different metrics. The AI Readiness Score is our attempt to quantify what actually matters.`,
    sections: [
      {
        heading: 'Why existing metrics miss the point',
        body: `When companies first think about AI optimization, they reach for familiar tools: domain authority, page speed scores, Core Web Vitals. These are real quality signals, but they're proxies — designed to measure qualities that human-facing search engines value, not qualities that AI systems value.

Consider an example: a company might have a DA 65, excellent Core Web Vitals, and hundreds of high-quality backlinks — and still have terrible AI readiness. Why? Because their homepage is a JavaScript-heavy single-page application that doesn't render in retrieval systems, their pricing is hidden behind "contact sales," their documentation is gated behind a login, and they've never heard of llms.txt.

Conversely, a company with DA 25 and basic web presence can have excellent AI readiness if their content is structured clearly, their pricing is transparent, their capabilities are documented factually, and they've built the machine-readable signals that AI systems actually use.

The AI Readiness Score cuts through the noise and measures what actually matters.`
      },
      {
        heading: 'Dimension 1: Content Clarity (0-20 points)',
        body: `Content Clarity measures whether your website content is structured in a way that an AI can extract accurate, specific information.

**What we measure:**
- Does your homepage clearly answer "what do you do" in one or two sentences? (Not taglines — actual explanations)
- Are your capabilities listed as specific features with concrete descriptions, not vague marketing language?
- Do you document use cases with enough specificity that an AI could recommend you for a specific task?
- Are your limitations and exclusions documented? (What you don't do is as important as what you do)
- Is content written in factual language that can be verified, rather than superlative marketing claims?

**Why it matters:**
When Perplexity fields a query like "what's a good tool for X," it reads the web and synthesizes an answer. If your content is vague, the model either excludes you (low confidence) or misrepresents you (hallucination). Specific, factual, well-structured content gives models the raw material for accurate, confident recommendations.

**Scoring example:**
- Score 18/20: Homepage clearly states product name, core functionality, primary use cases, tech stack, and target user in accessible language. Feature pages have specific, testable capability claims.
- Score 7/20: Homepage has a hero tagline ("The future of work, today"), a feature grid full of icons with one-line descriptions, and a "Get started" CTA. No factual detail about what the product actually does.`
      },
      {
        heading: 'Dimension 2: Structural Legibility (0-20 points)',
        body: `Structural Legibility measures how well your site's architecture helps AI systems navigate and understand your content.

**What we measure:**
- Header hierarchy (H1, H2, H3 used correctly and consistently)
- Schema.org markup presence and accuracy (Organization, Product, FAQPage, HowTo)
- sitemap.xml availability and quality
- Internal linking structure — can an AI traverse your site's key pages?
- Navigation structure — does your nav make topical relationships clear?
- URL structure — are URLs human-readable and descriptive?

**Why it matters:**
AI retrieval systems aren't just reading your homepage. They're crawling your site structure to understand what's important. A site with a logical H1→H2→H3 hierarchy, clean URLs, a comprehensive sitemap, and Schema.org markup gives AI systems a roadmap. A site with a flat header structure, dynamic JavaScript content, and no structured data is a maze.

**The Schema.org factor:**
Schema.org markup is particularly powerful because it's a shared vocabulary that AI systems are trained to recognize. A Product schema with name, description, offers, and aggregateRating is essentially a structured data card about your product that AI systems can read directly, without having to infer meaning from marketing prose.`
      },
      {
        heading: 'Dimension 3: Machine-Readable Signals (0-20 points)',
        body: `Machine-Readable Signals measures whether you've published the specific files and formats that AI systems are built to consume.

**What we measure:**
- /llms.txt — present and comprehensive?
- /.well-known/ai-plugin.json — present and accurate?
- OpenAPI specification — available and linked?
- WebMCP tool registration — configured?
- robots.txt AI directives — properly configured?
- /llms-full.txt — available for deep-dive AI research?

**Why it matters:**
This is the "machine-readable web" layer that exists in parallel to your human-readable website. When an AI agent needs to understand your service, the fastest path is not reading your marketing pages — it's reading a structured file that you wrote specifically for AI consumption.

Think of it like this: for humans, you have a website. For search engines, you have structured data and sitemaps. For AI systems, you have llms.txt, ai-plugin.json, and OpenAPI specs. Building this layer is one of the highest-leverage actions you can take for AI readiness.

**The effort/impact ratio:**
Most of the files in this dimension take 1-4 hours to create for the first time. But their impact is compounding — every AI system that reads your /llms.txt gets a direct, accurate, authoritative summary of your product. No inference required.`
      },
      {
        heading: 'Dimension 4: Authority & Citation (0-20 points)',
        body: `Authority & Citation measures how well-represented your brand is across the sources that AI systems treat as trustworthy.

**What we measure:**
- Third-party mentions in high-authority publications (TechCrunch, ProductHunt, industry blogs)
- Review site presence (G2, Capterra, Trustpilot, App Store)
- Technical community mentions (GitHub, Stack Overflow, Hacker News)
- Wikipedia / Wikidata presence
- Academic or technical paper citations
- Structured mentions in comparison articles and roundups

**Why it matters:**
Language models are trained on the web, and the web is not evenly distributed. A mention in a Wikipedia article or a G2 review carries far more weight in training data and RAG retrieval than a mention on an obscure blog. If your brand only exists in your own marketing materials, a model has very little external evidence to triangulate your claims.

AI systems also use authority signals for confidence calibration. If Perplexity can find your product mentioned in three independent authoritative sources saying similar things, it's far more likely to recommend you with confidence than if the only evidence is your own website.

**The flywheel:**
Authority is self-reinforcing. Getting listed on ProductHunt gets you G2 reviews gets you comparison articles gets you tech blog mentions gets you Wikipedia mentions. Each step makes the next step easier and increases your AI citation rate.`
      },
      {
        heading: 'Dimension 5: Freshness & Activity (0-20 points)',
        body: `Freshness & Activity measures how current and actively maintained your presence is — a signal AI systems use to determine trustworthiness.

**What we measure:**
- Last crawl date of your key pages
- Frequency of content updates (sitemap lastmod dates)
- Age of most recent public activity (blog posts, changelogs, release notes)
- Social/community activity (GitHub commits, public releases)
- Whether your pricing and feature information appears current vs. outdated

**Why it matters:**
AI retrieval systems strongly prefer fresh content. Perplexity weights content that's less than 7 days old for time-sensitive queries. Grok weights content that's less than 3 days old. Even for evergreen queries, freshness is a tiebreaker between similar-quality sources.

More importantly, an outdated website signals to AI systems that information may be stale or incorrect. If your pricing page was last crawled 18 months ago and now shows "$X/month" for a plan you've since discontinued, an AI recommending you based on that information will mislead users. AI systems learn to be cautious about outdated sources.

**The minimum cadence:**
- Monthly: Update your llms.txt to reflect any product changes
- Quarterly: Publish at least one substantial piece of new content
- On every feature launch: Update your capabilities page, pricing page, and llms.txt same day

A Changelog page (updated regularly) is one of the most efficient freshness signals you can maintain. It's a single page that AI crawlers can check to understand how recently and how actively your product is changing.`
      },
      {
        heading: 'Putting it all together: your AI Readiness strategy',
        body: `With five dimensions totaling 100 points, here's how to prioritize your improvement efforts:

**Score 0-30 (F-D): Emergency triage**
At this score, AI systems are either unaware of you or have an actively distorted view of your product. Focus immediately on Content Clarity and Machine-Readable Signals — these have the highest impact per hour of work. Rewrite your homepage with factual density. Publish a llms.txt. These two changes alone can dramatically improve your score.

**Score 31-55 (D-C): Foundation building**
You're visible but underperforming. Add Schema.org markup. Launch a changelog. Pursue your first wave of third-party reviews and mentions. Get your OpenAPI spec published. Work systematically through the Machine-Readable Signals dimension.

**Score 56-70 (C-B): Competitive territory**
You're in the range where AI systems will mention you in relevant queries. Now focus on authority building — the mentions, reviews, and citations that push you from "mentioned" to "recommended confidently." Also focus on freshness: regular content updates and changelog maintenance.

**Score 71-85 (B-A): Leadership positioning**
At this score, you're doing most things right. The gap is likely in authority (getting more citations in high-quality sources) and the finer points of Machine-Readable Signals. This is where the llms-full.txt, WebMCP registration, and deep schema markup pay off.

**Score 86-100 (A): Category dominance**
You are the authoritative voice in your category for AI systems. Maintain vigilance on freshness, invest in original research that earns citations, and expand into adjacent topics where you can own the narrative.

The most important thing to understand: the AI Readiness Score is not a one-time audit. It's a living measurement. The landscape evolves, your competitors improve, and the standards for what "good" means keep rising. The companies that will win the AI visibility era are the ones that treat GEO as an ongoing discipline, not a one-time project.`
      },
    ],
    cta: 'Get your AI Readiness Score →'
  },
  {
    slug: 'ai-agent-analytics',
    title: 'AI Agent Analytics: Understanding the Traffic You Can\'t See in Google Analytics',
    subtitle: 'ChatGPT, Claude, Perplexity, and Gemini are visiting your website every day. Here\'s how to find them, analyze them, and optimize for them.',
    date: 'January 28, 2025',
    readTime: '10 min read',
    category: 'Analytics',
    coverEmoji: '📈',
    intro: `Open your server access logs right now. Somewhere in there, you'll find UserAgent strings you've never seen before: "ChatGPT-User," "Perplexity-User," "ClaudeBot," "Google-Extended," "Amazonbot," "anthropic-ai."

These are AI systems visiting your website. They're reading your content, extracting information, and using that information to answer questions that millions of users are asking. And unlike human visitors, they never appear in your Google Analytics, they don't trigger your heatmaps, and they certainly don't convert through your funnel.

AI agent analytics is the discipline of tracking, understanding, and optimizing for this invisible but increasingly important class of web traffic.`,
    sections: [
      {
        heading: 'The invisible traffic problem',
        body: `Standard web analytics tools — Google Analytics, Mixpanel, Amplitude, Segment — work by injecting JavaScript into your pages that fires when a human browser loads and executes your page. AI crawlers and retrieval systems don't execute JavaScript. They typically send direct HTTP requests to your server and read the raw HTML response.

This means:
- Google Analytics sees zero AI agent traffic
- Your conversion rate calculations are artificially diluted (AI agents count as visits in some raw logs but never convert)
- You have no way to know which AI systems are visiting, how often, or which pages they're reading
- You can't correlate AI crawl activity with changes in your AI recommendation rates

The irony is deep: at the exact moment when AI systems are becoming major discovery channels for your business, you're flying completely blind on their behavior.`
      },
      {
        heading: 'How AI agents identify themselves',
        body: `Most major AI systems identify themselves in HTTP request headers, specifically in the User-Agent string. Here's the current taxonomy:

**OpenAI / ChatGPT:**
- \`ChatGPT-User\` — ChatGPT Browse, used when a user asks ChatGPT to read a URL
- \`GPTBot\` — OpenAI's web crawler for training data collection
- \`OAI-SearchBot\` — OpenAI's search-specific crawler

**Anthropic / Claude:**
- \`ClaudeBot\` — Anthropic's web crawler
- \`anthropic-ai\` — Used in some Claude retrieval contexts
- \`Claude-Web\` — Claude.ai web browsing feature

**Google / Gemini:**
- \`Google-Extended\` — Google's opt-out crawler for AI training
- \`Googlebot\` variants for AI-specific indexing
- \`Bard\` (legacy, being phased out)

**Perplexity:**
- \`PerplexityBot\` — Perplexity's main crawler
- \`Perplexity-User\` — Used during real-time query resolution

**Other notable agents:**
- \`Amazonbot\` — Amazon's AI crawler
- \`meta-externalagent\` — Meta's crawler for Llama data
- \`Grok\` / \`xAI\` — xAI crawlers
- \`Applebot-Extended\` — Apple's AI-specific crawler

**What you should know about spoofing:**
Not all AI traffic identifies itself honestly. Some systems use Googlebot as their UA, some use generic Chrome UAs, and some use custom UAs for enterprise applications. The agents listed above are the ones that self-identify — the real volume of AI traffic is likely larger, with a "dark matter" component that's much harder to attribute.`
      },
      {
        heading: 'What AI agents are actually doing when they visit',
        body: `AI agent visits are not like human visits. Understanding the difference changes how you interpret the data.

**Training crawlers (GPTBot, ClaudeBot, Google-Extended):**
These visit your site periodically (typically every few weeks to months) to collect content for model training. They usually follow your robots.txt directives. They read many pages per visit. They don't care about your site's visual design, JavaScript interactions, or conversion funnel. They want clean, accessible HTML content.

**Retrieval agents (ChatGPT-User, PerplexityBot, Claude-Web):**
These visit your site in near-real-time, triggered by user queries. If someone asks Perplexity about your product category, PerplexityBot may visit your site within seconds. These agents are more selective — they often target specific pages (pricing, features, about) rather than crawling broadly. They may visit the same page many times in a day during high-query periods.

**Tool-calling agents (custom AI applications):**
These are the hardest to track because they often use custom User-Agents. They may be calling your API, reading your llms.txt, or fetching specific data endpoints as part of an AI workflow. If you have a public API, a meaningful fraction of your API traffic may be AI agents.

**The implications for analytics:**
- High GPTBot traffic = you're being considered for training data
- High ChatGPT-User traffic on your pricing page = ChatGPT users are asking about your pricing
- High PerplexityBot traffic after a competitor launches = users are comparing you
- Unusual spikes in agent traffic = something in the news or AI discourse is triggering queries about your category`
      },
      {
        heading: 'Building AI agent analytics: what to track',
        body: `A minimal AI agent analytics setup should track:

**Visit-level data:**
- Which AI agent (by UserAgent classification)
- Timestamp
- Pages visited (URLs)
- HTTP status codes returned
- Response time
- Crawl depth (did they follow links?)

**Derived metrics:**
- Total AI visits per day / week / month (by agent)
- Most-visited pages by AI agents (which pages are AI systems most interested in?)
- Agent crawl frequency (how often does each system visit?)
- AI traffic trend over time (are AI visits increasing? decreasing?)

**Correlation metrics (advanced):**
- AI crawl events vs. changes in brand mention rate in AI outputs
- Which pages AI agents visit most vs. which pages are cited in AI recommendations
- Pre/post llms.txt publication: did AI crawl patterns change?

**Alert conditions:**
- GPTBot blocked by misconfigured robots.txt
- 404/500 errors returned to AI agents (they're reading pages that don't exist or are broken)
- Sudden AI traffic spike (may indicate trending mention or product comparison)
- AI crawl gap (major agent hasn't visited in 30+ days — you may have been blocked)`
      },
      {
        heading: 'AI traffic and the conversion question',
        body: `Here's the question every marketer asks when they first see AI agent analytics: "So what? These agents don't convert. Why should I care about their traffic?"

It's a fair question with a non-obvious answer.

AI agents don't convert directly. But they influence the humans who do convert, at scale.

When ChatGPT-User visits your pricing page 40 times in a week, it's because 40 different ChatGPT users asked ChatGPT about your product or your product category. ChatGPT read your pricing page and used that information to answer their questions. Some fraction of those users then visited your website directly (showing up in GA as organic or direct traffic) and converted.

The attribution chain looks like:
**User asks AI → AI reads your site → AI recommends you → User visits your site → Conversion**

Standard analytics only sees the last two steps. AI agent analytics sees the first two.

As AI-mediated discovery becomes a larger fraction of overall web traffic, the gap between "what AI analytics shows" and "what GA shows" will grow. Companies that understand this chain early will make better product decisions, better content investments, and better optimization choices.

In the future — and it's not a distant future — AI agent analytics will be as fundamental as organic search analytics is today. The companies building this measurement capability now are the ones who will be able to demonstrate AI-to-revenue attribution when it becomes a board-level metric.`
      },
      {
        heading: 'Implementing AI agent analytics on your site',
        body: `There are three approaches to implementing AI agent analytics, from simplest to most sophisticated:

**Option 1: Log analysis (no code)**
Server access logs contain all the raw data you need. Tools like GoAccess, AWStats, or custom log parsing scripts can extract AI agent traffic. The limitation: it's retroactive, requires server access, and doesn't give you real-time alerting.

**Option 2: Middleware / edge analytics**
Add request inspection at your server layer (Nginx, Apache, Cloudflare Workers, Vercel Edge) that classifies UserAgents and logs AI traffic to a separate data store. More real-time but requires engineering effort.

**Option 3: Purpose-built AI analytics (Galuli's approach)**
Add a single script tag pointing to galuli.js — and our JavaScript layer captures AI-specific signals: UserAgent fingerprinting, llms.txt fetch events, ai-plugin.json requests, and WebMCP interactions. This runs on the client side for human visitor signals and correlates with server-side log data for full coverage.

The Galuli approach adds two layers that log-parsing alone misses:
1. **Snippet-level AI signals** — When galuli.js loads, it detects AI-related referrer headers, special request patterns, and AI-friendly meta tags
2. **Structured event tracking** — Every time your llms.txt, ai-plugin.json, or OpenAPI spec is fetched, it's logged as an AI agent event with full attribution

The result is an analytics layer that makes AI traffic visible alongside your human traffic, with the correlations needed to turn visibility data into business decisions.`
      },
    ],
    cta: 'Add AI agent analytics to your site →'
  },
  {
    slug: 'future-of-search',
    title: 'The Future of Search Is Not Search: How AI is Rewriting the Rules of Online Discovery',
    subtitle: 'What happens to the $200B search advertising industry when the interface shifts from links to language?',
    date: 'January 20, 2025',
    readTime: '13 min read',
    category: 'Industry',
    coverEmoji: '🔮',
    intro: `In June 2023, Google processed approximately 8.5 billion searches per day. In that same month, ChatGPT processed roughly 1.5 billion queries. A year later, the numbers were meaningfully different: Google's search volume was roughly flat, while AI query volume across all platforms had grown to an estimated 4-5 billion per day.

This isn't a forecast. It's already happening.

The question isn't whether AI will change how people find things online. It already has. The question is what that means for businesses, content creators, marketers, and the entire digital economy built on top of search.`,
    sections: [
      {
        heading: 'The interface revolution',
        body: `Every major technological shift in information access has come with a shift in interface — the way humans interact with the information system.

- **Directory era (1994-1998):** Yahoo, DMOZ. Humans categorized the web by hand. Finding things meant browsing hierarchies.
- **Keyword search era (1998-2023):** Google, Bing. Humans typed keyword queries. Finding things meant picking the best result from a ranked list.
- **Conversational AI era (2023-present):** ChatGPT, Claude, Perplexity, Gemini. Humans ask questions in natural language. Finding things means getting synthesized answers.

Each shift made the previous paradigm's optimization techniques partially obsolete. Directory listing meant nothing in the keyword era. Keyword stuffing meant nothing after Google's Panda update. Both mean nothing in the conversational AI era.

The keyword search paradigm lasted 25 years. We're approximately 18 months into the conversational AI paradigm, and it's already affecting how billions of people discover products and information.`
      },
      {
        heading: 'What this means for the search advertising economy',
        body: `The $200B+ annual search advertising market is built on a specific mechanic: user enters query, sees ads adjacent to organic results, clicks ad, advertiser pays per click. The entire value chain depends on discrete click events.

Conversational AI breaks this mechanic in multiple ways:

**No click, no attribution** — When a user asks ChatGPT "what project management tool should I use" and ChatGPT recommends Notion, no click occurred. Notion paid no CPC. The conversion, when it happens, looks like direct or dark social in standard attribution models. The advertiser gets credit for nothing; the AI system gets credit for nothing; the discovery event is invisible to all current measurement systems.

**Answer, not results** — A search for "best CRM for small business" historically generated 10 blue links. A user might click on #1, #3, and #7 before choosing. Three separate CPC events for three separate advertisers. An AI answer to the same question generates one synthesized recommendation. There may be one click — or none.

**Zero-click is now the default** — Search researchers have tracked the rise of zero-click searches (queries answered directly in the SERP) for years. AI takes zero-click to its logical extreme: the answer is the product. There's no next step that requires a click.

**What this means for advertisers:**
The CPC model, while not dead, is going to shrink as a share of total discovery. The replacement is not yet clear — it may be AI-sponsored answers, it may be freemium AI recommendations, it may be entirely new models. But the businesses that are building AI visibility now — before the monetization models settle — are the ones who will have organic AI presence that doesn't require ad spend.`
      },
      {
        heading: 'The winner-take-more dynamics of AI recommendation',
        body: `Search results had a long tail. Position 10 on Google still got traffic — not much, but some. Position 20 still got occasional clicks. The distribution of search traffic was steep but not vertical.

AI recommendations are more concentrated. When a user asks an AI for "the best tool for X," they typically get 1-3 recommendations, not 10. Being recommendation #4 means you're not recommended. There is no "page two" of an AI answer.

This creates winner-take-more dynamics that make early AI optimization significantly more valuable than late optimization.

Consider two scenarios:

**Scenario A (Early adopter):** A company invests in GEO in 2024-2025. They build a strong llms.txt, comprehensive documentation, high AI Readiness Score, authority citations. AI systems develop a strong, consistent representation of this company. As AI query volume grows, this company captures an increasing share of AI-mediated discovery.

**Scenario B (Late adopter):** A company ignores GEO through 2025. A competitor builds strong AI presence. When the late adopter finally invests in 2026, they're competing against established AI recommendations, the model's existing representation of both companies, and accumulated citation authority that takes time to build.

The GEO advantage compounds. The earlier you build AI visibility, the harder it becomes for competitors to displace you from AI recommendations in your category. This is analogous to building domain authority for SEO — it's cumulative, and starting earlier is dramatically better.`
      },
      {
        heading: 'The content creation implications',
        body: `The shift to AI-mediated discovery is changing what content is worth creating — not just in format, but in purpose.

**What AI discovery rewards:**

*Authoritative reference content* — Comprehensive guides, technical documentation, and factual reference material that AI systems are likely to cite as sources. This content pays dividends in AI training data, RAG retrieval, and citation authority.

*Original research and data* — AI systems, when asked data questions, will cite primary sources. If you publish original survey data, usage statistics, or benchmark results, AI systems will cite you as the source of that data — sometimes in answers that have nothing directly to do with your product.

*Problem-specific how-to content* — AI systems are frequently queried with problem framing ("how do I X?"). Content that directly answers specific problems, with concrete steps and specific solutions, performs well in AI retrieval.

**What AI discovery punishes:**

*Content-farming tactics* — Large volumes of thin, low-information content. AI systems learn to discount sources with low information density per page.

*Marketing-speak over facts* — Vague superlatives and brand positioning language. AI systems can't extract claims like "the most powerful platform" — they extract facts.

*Paywalled or gated content* — AI systems can't read content behind authentication walls. If your best content is gated, AI systems don't know about it.

The implication for content strategy: create fewer, more authoritative, more fact-dense pieces rather than high-volume publishing strategies. Quality of content (as measured by factual density and specificity) is more important to AI visibility than quantity.`
      },
      {
        heading: 'The emerging standards landscape',
        body: `The early 2000s saw a rapid standardization of the SEO ecosystem: robots.txt, sitemap.xml, rel=canonical, structured data. These standards emerged from competition between sites wanting to be found and search engines wanting to index accurately.

We're at an analogous moment in AI. A set of standards is emerging:

**Already established:**
- robots.txt extensions (AI crawlers respect User-Agent directives)
- llms.txt (growing adoption, Jeremy Howard spec)
- OpenAPI specifications (already widely used for APIs)
- Schema.org (used for search, being extended for AI)

**Emerging and gaining traction:**
- ai-plugin.json (OpenAI's plugin manifest, being adopted beyond ChatGPT)
- WebMCP (Multi-agent Communication Protocol — in development)
- AI sitemaps (proposals emerging for AI-specific sitemap formats)
- llms-full.txt (extended companion to llms.txt for comprehensive content)

**Contested or nascent:**
- AI-specific robots.txt semantics (multiple competing proposals)
- Authenticated AI agent access (how AI agents should handle login-protected content)
- Attribution standards for AI-mediated traffic (not yet standardized)

The companies that implement these standards early will be in the position of having "native" AI presence — their presence was built for the medium from the start. Late adopters will be retrofitting, which is always more expensive and less effective than building right the first time.`
      },
      {
        heading: 'The parallel web: two internets, one content',
        body: `The clearest mental model for what's happening: there are now two internets overlaid on the same content layer.

**The human web** — The internet as experienced by human users: browsers, clicks, visual design, conversion funnels. Measured by Google Analytics. Optimized by traditional SEO, CRO, and UX.

**The AI web** — The internet as processed by AI systems: HTTP requests, text extraction, training data, retrieval, synthesis. Measured by AI agent analytics. Optimized by GEO, llms.txt, Schema.org, and documentation quality.

The same content powers both, but the experience is completely different. A human sees your beautiful hero image and compelling CTA. An AI sees a text extraction of your page that may or may not accurately represent what you offer.

Right now, most companies have heavily optimized for the human web and done nothing for the AI web. This gap is simultaneously a risk (your AI representation may be poor) and an opportunity (your competitors' AI representation is probably equally poor).

The companies that will dominate the next decade of digital presence are the ones building both layers simultaneously — creating content that works for human conversion while also building the machine-readable, AI-friendly layer that makes that content visible in AI-mediated discovery.

That's the world Galuli is built for.`
      },
    ],
    cta: 'Start building AI visibility now →'
  },
  {
    slug: 'ai-attention-score',
    title: 'The AI Attention Score: A Better Way to Measure AI Visibility',
    subtitle: "Page views from Google are easy to count. But how do you measure whether AI systems are actually reading your content — and trusting it enough to cite you?",
    date: 'February 25, 2025',
    readTime: '10 min read',
    category: 'Analytics',
    coverEmoji: '🧲',
    intro: `There's a measurement problem at the heart of GEO.

Traditional SEO has clean, observable metrics. Impressions. Clicks. Position. Organic traffic. You can open Google Search Console right now and see exactly how your content performs in search.

AI visibility doesn't work that way. When ChatGPT cites you in an answer, there's no referral in your analytics. When PerplexityBot crawls your docs section at 3am, it doesn't show up in your Google Analytics. When ClaudeBot decides your pricing page isn't worth reading and skips it, you have no idea.

This invisibility is the problem Galuli's AI Attention Score was built to solve.`,
    sections: [
      {
        heading: 'What AI Attention Score measures',
        body: `The AI Attention Score (0–100) is a composite metric that answers a single question: how much attention are AI systems collectively paying to this website right now?

It's built from four components that together paint a picture of AI engagement that no single number could capture:

**Frequency (40% of score)**
How often do AI crawlers visit? A site visited 500+ times per month by AI agents in the last 30 days scores full marks here. A site that's been visited twice gets almost nothing. Frequency signals that AI systems have found your content worth returning to.

**Depth (35% of score)**
How many unique pages do AI agents actually read per visit? This is where most sites underperform. An AI crawler might hit your homepage 50 times but never touch your /docs or /pricing pages. Depth ratio — unique pages divided by total visits — tells you whether AI systems are exploring your content or just pinging the front door.

A site with 200 visits across 4 unique pages has a depth ratio of 2%. A site with 200 visits across 40 unique pages has a depth ratio of 20%. The second site is telling AI systems a much richer story about what it offers.

**Recency (25% of score)**
When did an AI agent last visit? AI crawlers prioritize fresh content. A site that was last crawled 24 hours ago scores 25/25 here. A site last crawled 10 days ago scores about 6/25. At 14 days, the recency component decays to zero.

This component captures an important dynamic: AI crawlers aren't random. They return to sites that change, publish new content, and signal activity. Recency is a proxy for whether you're still relevant in the eyes of AI systems.

**Diversity bonus (+10 max)**
Are multiple distinct AI systems crawling your site? Getting 1,000 visits from GPTBot alone is different from getting 500 visits split across GPTBot, ClaudeBot, PerplexityBot, and Google-Extended. Diversity signals that your content is broadly relevant — not just accidentally indexed by one system.

Each unique AI agent adds 2 points to the diversity bonus, capped at 10. Five or more distinct systems gives you the full bonus.`
      },
      {
        heading: 'Why four components instead of one number',
        body: `You could imagine a simpler version: just count total AI visits and call it a score. But this would miss the most important dynamics.

Consider two sites, both with 100 AI visits in 30 days:

**Site A:** 100 visits, all from GPTBot, all to the homepage, last visit 12 days ago.
**Site B:** 100 visits, from 4 different AI agents, across 30 unique pages, last visit yesterday.

By raw visit count they're identical. By AI Attention Score, Site B is dramatically outperforming — because AI systems are actually reading its content, exploring its depth, and returning recently. Site A just got pinged by one crawler that has since moved on.

The four-component structure was designed to surface exactly this difference. Frequency tells you volume. Depth tells you engagement. Recency tells you relevance. Diversity tells you breadth.

Together they answer the question that raw visit counts can't: are AI systems paying attention, or just touching the front door?`
      },
      {
        heading: 'What the grades actually mean',
        body: `The AI Attention Score maps to grades the same way the AI Readiness Score does:

- **A+ (90–100):** Multiple AI systems are actively and deeply crawling your content. You're likely being cited regularly. This is where you want to be.
- **A (80–89):** Excellent coverage with minor gaps. Usually means great frequency and depth but slightly stale recency.
- **B (70–79):** Good AI attention, but room to improve. Often means good frequency but shallow depth — AI crawlers keep coming back but aren't reading beyond the surface.
- **C (60–69):** Moderate AI attention. You're on the radar, but not a priority. Content improvement usually moves the needle fastest here.
- **D (40–59):** Low AI attention. Either crawlers aren't finding you, or they're not finding your content worth reading deeply.
- **F (below 40):** Effectively invisible to AI systems. No snippet means no tracking; no tracking means you're flying blind.

Most sites without active GEO optimization score in the D range — visited occasionally by one or two crawlers, at shallow depth, and infrequently.`
      },
      {
        heading: 'What moves the score',
        body: `Once you understand the four components, the levers become obvious.

**To improve frequency:**
AI crawlers return to sites that are active. Publishing new content, updating existing pages, and adding new product features all signal activity. The fastest way to increase crawl frequency is to give AI systems a reason to come back — and a consistent publishing cadence does this better than any technical optimization.

**To improve depth:**
If AI crawlers are hitting your homepage but not your /docs, /pricing, or /blog, there's usually an architectural reason. Either those pages aren't linked clearly from crawl-friendly paths, or they're blocked in your robots.txt, or they're JavaScript-rendered and invisible to crawlers.

Check your llms.txt. If it doesn't explicitly list your most important pages with clean descriptions, crawlers have no map. A good llms.txt directly boosts depth by telling AI systems where to look.

**To improve recency:**
Recency rewards freshness. The most effective lever here is regular content publication — even minor updates to existing pages signal activity. Adding a "Last updated" date to your most important pages also helps: it tells AI systems explicitly that content is current.

**To improve diversity:**
This is the hardest component to directly optimize, but it follows naturally from doing everything else well. If your robots.txt correctly allows all major AI crawlers, your llms.txt is comprehensive, and your content is high quality, diversity comes on its own.

The one thing that actively hurts diversity: blocking crawlers. Surprising number of sites accidentally block PerplexityBot or Google-Extended via overly aggressive robots.txt rules. Check yours.`
      },
      {
        heading: 'AI Attention Score vs. AI Readiness Score',
        body: `Galuli offers two distinct metrics, and it's worth being clear on the difference:

**AI Readiness Score** measures potential — how well your site is structured to be understood by AI. It's a static measure of quality: content clarity, schema markup, llms.txt quality, structural legibility. A site with perfect AI Readiness can have low AI Attention if AI systems haven't discovered it yet.

**AI Attention Score** measures actual behavior — what AI systems are actually doing. It's a dynamic measure of reality: are they visiting, how deeply, how recently, and how many of them?

Both matter, and they're diagnostic in different ways:

A high Readiness score with a low Attention score usually means: good content, poor distribution. AI systems haven't discovered you yet, or your robots.txt is blocking them.

A high Attention score with a low Readiness score means: AI systems are visiting, but what they find isn't well-structured. They may cite you inconsistently or incompletely.

The goal is to be high on both — which is why they're both in the Galuli dashboard.`
      },
      {
        heading: 'The topic-level breakdown',
        body: `One dimension of AI attention that the top-line score doesn't capture: which content areas are AI systems actually reading?

Galuli's Topic Attention Map maps your crawled pages to content categories — Blog, Product, Pricing, Docs, About, Case Studies, and so on — and shows which topics attract the most AI visits.

This matters more than it might seem. Most sites assume AI crawlers are reading their product pages and pricing. The reality is often different: AI systems frequently over-index on blog content (easier to read, higher information density) and under-read product and pricing pages (more marketing language, less structured information).

If your topic map shows 80% of AI attention going to blog posts and only 5% to pricing, you have a structural problem: AI systems won't be able to accurately answer questions about what your product costs because they've barely read that page.

The fix is usually a combination of:
1. Improving llms.txt to explicitly highlight pricing and product pages
2. Making those pages more structured and factual (less marketing copy, more specific information)
3. Internal linking from blog content to product/pricing pages

AI attention follows quality. Redirect it by improving the pages you want AI to read.`
      },
    ],
    cta: 'Check your AI Attention Score now →'
  },
  {
    slug: 'content-doctor',
    title: 'Content Doctor: How to Fix What AI Systems Won\'t Trust',
    subtitle: "You can have a technically perfect site — correct schema, clean llms.txt, good crawl access — and still get ignored by AI. The reason is almost always content quality.",
    date: 'February 27, 2025',
    readTime: '12 min read',
    category: 'Product',
    coverEmoji: '🩺',
    intro: `A common mistake in GEO strategy: treating it as purely a technical problem.

Add llms.txt. Check. Register WebMCP. Check. Fix robots.txt. Check. Now AI systems will cite you.

Not necessarily.

Technical accessibility is table stakes — it gets AI systems to your door. What happens once they read your content is a different problem entirely. And the single biggest reason AI systems don't cite content they've crawled is trust: they found the content, but they didn't trust it enough to surface it in an answer.

Content Doctor is Galuli's answer to this. It's an AI-powered audit tool with two modules that analyze what you've written — not how it's structured technically, but whether the words on the page are the kind of words AI systems will trust and repeat.`,
    sections: [
      {
        heading: 'Why AI systems don\'t trust your content',
        body: `Language models have absorbed an enormous amount of text during training — research papers, Wikipedia, books, journalism, academic databases. In that corpus, certain patterns are associated with reliable, factual content:

- Claims backed by named sources ("According to a 2023 Gartner report...")
- Statistics with methodology context ("In a survey of 500 B2B buyers...")
- Comparisons with specific criteria ("Compared to the industry average of 4.2 days, our average is 1.8")
- Named, defined entities with clear descriptions

And certain patterns are associated with unreliable, marketing-inflated content:
- Bare superlatives ("the best," "the fastest," "the most powerful")
- Vague quantities ("many companies," "significant savings," "substantial ROI")
- Unattributed statistics ("studies show that...," "research suggests...")
- Claims without context ("X% of customers see results")

When an AI system reads your content and encounters the second set of patterns, it doesn't necessarily reject the content — but it weights it less heavily when deciding what to cite. AI systems are probabilistic; they cite the sources that most clearly resemble the reliable content in their training data.

The Authority Gap Scanner finds exactly this mismatch.`
      },
      {
        heading: 'The Authority Gap Scanner',
        body: `The first module in Content Doctor analyzes your content for claims that AI systems will downweight or ignore because they lack empirical backing.

For each gap it finds, it returns:

**The claim** — the exact sentence or phrase that's problematic, quoted verbatim so you know exactly what to fix.

**Type** — one of five categories:
- *Statistic* — a number without a source
- *Comparison* — a "better than" or "faster than" claim without referenced benchmark
- *Benefit claim* — a promised outcome without evidence
- *Historical fact* — an assertion about the past without attribution
- *Technical claim* — a capability assertion that isn't verifiable from the content

**Severity** — high, medium, or low. High-severity gaps are claims so bare that AI systems are unlikely to trust anything around them. Low-severity gaps are worth fixing but won't dramatically change your score.

**Suggestion** — specific guidance on what data or citation would fix this gap. Not "add a source" but "reference the Forrester Wave report on B2B automation platforms" or "cite your own internal data with methodology — e.g., 'based on analysis of 10,000 customer sessions in Q4 2024.'"

**Example rewrite** — a concrete version of the sentence with the fix applied. You don't have to guess what the improved version looks like.

**AI risk** — why this specific claim is likely to be downweighted: "unverifiable statistic," "contradicts known benchmarks," "too vague to be factual," "circular citation risk."`
      },
      {
        heading: 'The Structural Optimizer',
        body: `The second module analyzes not what you say, but how you say it.

AI systems have strong preferences for certain content structures — preferences that are baked into their training data. Well-cited technical documentation is almost always in bullet lists, numbered steps, and tables. Academic writing has clear section headers, abstracts, and methodology sections. Wikipedia articles have structured definitions and fact-rich introductions.

When your content doesn't match these structural patterns, AI systems can read it and still miss the key points — because those points are buried in marketing paragraphs instead of surfaced in scannable structure.

The Structural Optimizer finds:

**Dense paragraphs that should be tables or bullets.** If you have a paragraph comparing three pricing tiers across five dimensions, that's a table. Writing it as prose means AI systems have to reconstruct the comparison mentally — and they often don't.

**Missing Key Takeaways sections.** This is the single highest-ROI structural fix for most content. AI systems frequently pull from summary sections because they're already synthesized. A 3–5 bullet "Key Takeaways" box at the top of any long-form piece dramatically increases citation probability.

**Undefined key entities.** If your content references product names, proprietary methodologies, company names, or technical terms without defining them, AI systems may struggle to accurately represent what those things are. The Structural Optimizer identifies every named entity in your content and flags the ones that aren't explicitly defined.

**Headers that don't match natural language questions.** "Our Approach" is an opaque header. "How does X work?" is a question people ask, and AI systems know how to match it. The optimizer suggests conversational rewrites for headers that don't map to real user queries.

**Missing FAQ sections.** FAQ structures are highly citable. AI systems that read a FAQ section have immediate access to synthesized answers in the exact format they'll reproduce. The optimizer identifies content where a FAQ section would naturally fit.`
      },
      {
        heading: 'How to use Content Doctor in practice',
        body: `Content Doctor works in three modes:

**URL analysis** — paste any live URL. Galuli fetches the page, strips navigation and boilerplate, and analyzes the core content. Best for auditing specific pages before publishing or after noticing a visibility gap.

**Paste analysis** — paste raw text or markdown directly. Useful for content still in draft, or for analyzing copy that isn't yet live. This is the fastest way to run Content Doctor during the writing process rather than after.

**Domain analysis** — runs across all pages indexed in your Galuli registry. Surfaces the highest-impact issues across your entire site, ranked by severity. Best for understanding where to focus improvement effort first.

The workflow we recommend: run a domain analysis first to find the worst-performing pages (by combined authority + structure score), then run URL analysis on those specific pages to get actionable rewrites.

For new content, paste analysis during the writing process — before you publish — is the highest-leverage moment. It costs zero rework to fix a claim before it's live. It costs real effort to rewrite a published post.`
      },
      {
        heading: 'The content health score',
        body: `Content Doctor returns a Content Health Score (0–100) for every analysis. It's the average of two sub-scores:

- **Authority Score (0–100):** How well-cited and empirically backed is your content?
- **Structure Score (0–100):** How well-formatted for AI readability is your content?

Both are graded A through F. A piece with a 90 Authority Score but a 40 Structure Score is well-cited but poorly organized — the information is trustworthy but hard to surface. A piece with a 90 Structure Score but 40 Authority Score has excellent formatting around weak content — it looks right to AI systems but the claims won't hold up.

The goal is to be high on both. Most content lands between 40–65 on each metric without specific optimization — there's a meaningful gap between average web content and what AI systems most readily cite.`
      },
      {
        heading: 'What Content Doctor is not',
        body: `A few things worth being direct about:

**It is not a plagiarism checker.** It doesn't compare your content to other sources. It analyzes your content in isolation for patterns associated with trustworthiness.

**It is not an SEO tool.** It doesn't evaluate keywords, meta descriptions, or search ranking signals. It's focused exclusively on whether AI systems will trust and cite your content.

**It is not prescriptive about topics.** Content Doctor doesn't tell you what to write about. It analyzes what you've written and tells you how to make it more trustworthy to AI systems.

**It is not infallible.** It's an AI analyzing content for patterns — it will occasionally flag things that are fine and miss things that are problematic. Treat its output as a high-quality first pass, not a definitive audit.

The goal is to surface the most impactful fixes — the high-severity authority gaps and structural issues that are most likely to improve AI citation probability. Start with those. The quick wins section in every report is a good place to begin.`
      },
      {
        heading: 'The deeper principle',
        body: `Content Doctor is built on a simple observation: AI systems cite content that resembles what they were trained on as reliable.

That's not a bug in AI systems. It's a reasonable heuristic. Peer-reviewed research has citations. Good journalism names sources. Technical documentation is structured and specific. These are the patterns AI systems learned to associate with trustworthiness during training.

The implication for GEO is that the best content strategy isn't "write for AI" — it's "write like a trustworthy source writes." Specific, attributed, structured, defined. This is also, not coincidentally, what human readers find more credible.

Content that's good for AI credibility is usually just... good content.

The difference is that Content Doctor makes the standard explicit and measurable — so you know whether you're meeting it, and exactly what to fix when you're not.`
      },
    ],
    cta: 'Run Content Doctor on your site →'
  },
  {
    slug: 'robots-txt-ai-crawlers',
    title: 'Is Your robots.txt Blocking ChatGPT, Claude, and Perplexity?',
    subtitle: "Thousands of websites are accidentally invisible to AI search engines because of a single misconfigured robots.txt file. Here's how to find out if yours is one of them — and how to fix it.",
    date: 'March 1, 2026',
    readTime: '9 min read',
    category: 'Technical',
    coverEmoji: '🚫',
    intro: `There's a version of AI invisibility that has nothing to do with content quality, schema markup, or llms.txt files.

It's simpler and more brutal: your robots.txt file is telling AI crawlers to go away, and they're listening.

This happens more often than you'd think. A developer adds a broad disallow rule during a site migration, or copies a robots.txt template from the internet, or an overzealous security recommendation blocks all non-Google bots. The site looks fine in Google Search Console. It has no idea it's invisible to Perplexity, ChatGPT Browse, and Claude.

Galuli now audits robots.txt as part of every site scan. Here's everything you need to know.`,
    sections: [
      {
        heading: 'How AI crawlers work — and why robots.txt matters',
        body: `Every major AI search system sends its own crawler to read the web. These crawlers operate similarly to Googlebot: they request pages, read content, and feed that information back to the AI's retrieval and training systems.

The crawlers you need to know:

**GPTBot** (OpenAI) — Used by ChatGPT Browse and OpenAI training. User-agent: \`GPTBot\`. Introduced August 2023.

**ChatGPT-User** (OpenAI) — A separate user agent for real-time ChatGPT browsing. Some blocks target one but not the other.

**ClaudeBot** (Anthropic) — Anthropic's crawler for Claude's retrieval. Also sometimes listed as \`anthropic-ai\`.

**PerplexityBot** (Perplexity) — Powers Perplexity's real-time web retrieval, which is the core of its product.

**Google-Extended** — Google's crawler for AI training and Gemini retrieval.

Each checks your robots.txt before fetching any page. If your robots.txt says go away, they don't visit. No visit = no content = no chance of being cited.`
      },
      {
        heading: 'The three ways robots.txt blocks AI access',
        body: `**1. Explicit user-agent block**

\`\`\`
User-agent: GPTBot
Disallow: /
\`\`\`

Deliberate. In 2023–2024, there was widespread advice to block AI crawlers to "protect your content." Many sites followed it. Those sites are now invisible to ChatGPT Browse.

**2. Wildcard block with no exceptions**

\`\`\`
User-agent: *
Disallow: /
\`\`\`

This "block everything" rule appears in dev environments and sometimes gets accidentally pushed to production. It blocks all crawlers — Google, AI, everything.

**3. Wildcard block with Google exceptions but no AI exceptions**

\`\`\`
User-agent: *
Disallow: /

User-agent: Googlebot
Disallow:
\`\`\`

The most insidious pattern. The site appears normally in Google Analytics (Googlebot is whitelisted), but every AI crawler hits the wildcard block. Invisible to Perplexity, ChatGPT, and Claude — while Google traffic continues as normal.

This is surprisingly common in enterprise sites carefully optimized for Google years ago.`
      },
      {
        heading: 'What you\'re losing — the business case',
        body: `Perplexity answers over 100 million queries per day. Its product is retrieval-first: it crawls the web in real time and synthesizes answers from what it finds. A blocked PerplexityBot means your product doesn't appear in Perplexity answers — regardless of content quality.

ChatGPT Browse uses GPTBot. Blocking it means ChatGPT falls back to training data, which may be months or years out of date.

The stakes: AI traffic converts at **14.2% vs. 2.8%** for traditional search — a 5x difference driven by the high intent of users who've already received an AI recommendation. A blocked robots.txt means none of that traffic reaches you. Not because your content isn't good enough. Because a configuration file is turning crawlers away at the door.`
      },
      {
        heading: 'The correct robots.txt for AI accessibility',
        body: `If you want all AI crawlers to have full access:

\`\`\`
User-agent: *
Disallow:

# AI crawlers — explicitly welcome
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Google-Extended
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
\`\`\`

If you have content to protect, be surgical — only Disallow what you genuinely need to restrict:

\`\`\`
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /private/
\`\`\`

The fix takes about 90 seconds once you know the problem. Galuli's AI Readability Score audit shows exactly which crawlers are blocked.`
      },
      {
        heading: 'Beyond robots.txt: the full crawl access checklist',
        body: `Robots.txt is one layer. Also check:

**Meta robots tags** — Pages can have \`<meta name="robots" content="noindex, nofollow">\` in their HTML, overriding robots.txt for some crawlers.

**X-Robots-Tag headers** — HTTP headers can also block indexing. Check with:
\`\`\`
curl -I https://yourdomain.com/your-key-page
\`\`\`

**Cloudflare / WAF rules** — Firewalls blocking "bot traffic" broadly may catch AI crawlers.

**JavaScript-only rendering** — AI crawlers typically don't execute JavaScript. If your content is client-side rendered (SPA without SSR), crawlers see an empty page. Galuli's JS rendering mode (Pro plan) handles this.

**Crawl rate and timeouts** — Some AI crawlers have higher crawl rates than Googlebot. If your server rate-limits bot traffic aggressively, AI crawlers may get throttled.

Run a free Galuli scan to get a complete robots.txt + crawl access report in 60 seconds.`
      },
    ],
    cta: 'Audit your robots.txt — free →'
  },
  {
    slug: 'information-gain-geo',
    title: 'Information Gain: Why Generic Content Gets Ignored by AI',
    subtitle: "AI systems don't just evaluate whether your content is credible — they evaluate whether it adds anything new. If AI already knows what you're saying, it won't cite you for saying it again.",
    date: 'March 1, 2026',
    readTime: '11 min read',
    category: 'Research',
    coverEmoji: '📊',
    intro: `Princeton researchers studying AI citation patterns made a finding that should change how anyone thinks about content strategy.

They tested what happens when you make targeted additions to the same piece of content: adding statistics with sources, quotations from authoritative sources, unique data points not found elsewhere. The result: AI citation probability increased by 30–40%.

The researchers called this "information gain" — the degree to which content adds unique, new information to what the AI already knows. Content with low information gain gets skipped. Content with high information gain gets cited.

Most web content has very low information gain. It restates things the model already knows from the billions of documents in its training data. General advice, common knowledge, boilerplate best practices with no data, no primary research, no unique perspective.

Galuli's Content Doctor now measures this directly.`,
    sections: [
      {
        heading: 'What information gain actually means',
        body: `The concept comes from information theory, but the practical meaning is simple: does this content tell me something I don't already know?

For an AI language model, "already know" has a specific meaning. During training, the model absorbed billions of documents — facts, patterns, relationships, heuristics. When it reads new content at retrieval time, it's comparing that content to everything it already has.

**Low information gain:**
- "Email marketing has a high ROI" — the model has read this in thousands of marketing articles
- "You should test different subject lines" — ubiquitous advice
- "Customer retention is important for SaaS businesses" — common knowledge

**High information gain:**
- "Our analysis of 12,000 email campaigns found subject lines under 7 words had 23% higher open rates in B2B contexts" — new data, specific methodology, quantified result
- "Contrary to common advice, longer emails (400+ words) had a 12% higher click-through in our product demo sequences" — unexpected finding, falsifiable claim
- "In Q4 2025, we A/B tested 4 subject line formats across enterprise audiences. Emoji reduced open rates by 8.4%." — proprietary finding, defined scope

The second category is what AI systems want to cite. It's specific, it's unique, and it's the kind of information a user asking a real question would actually find valuable.`
      },
      {
        heading: 'The Princeton GEO-bench research',
        body: `The foundational research: "GEO: Generative Engine Optimization" (Aggarwal et al., Princeton, 2023, updated 2024). The researchers built a benchmark of 10,000 queries across multiple AI systems and measured citation rates under controlled conditions.

Key findings:

**Adding statistics improves citation probability by 30–40%.** The most reliable signal. A claim backed by a number with a source is dramatically more likely to be cited than the same claim without one.

**Quotation from authoritative sources adds 15–20%.** Named experts, official reports, and primary sources are heavily weighted. "According to Gartner's 2024 Magic Quadrant..." outperforms "according to analysts..."

**Fluency improvements add 10–15%.** Clear, scannable structure makes content easier to process at retrieval time.

**Traditional SEO tactics (keyword optimization) had minimal positive impact** and can slightly reduce citation probability. GEO and SEO are different disciplines.

The practical implication: the biggest lever for AI citation probability is adding genuine primary research and data — not more keywords, not more pages, not more backlinks.`
      },
      {
        heading: 'Five types of information gain deficits',
        body: `Galuli's Content Doctor identifies five patterns of low information gain:

**1. Common knowledge statements**
"AI is transforming industries." The model has read this approximately ten thousand times.
Fix: Which industries? By what metric? From what evidence?

**2. Boilerplate best practices**
"Use headers to structure your content." Every blog post about readability says this.
Fix: Add your own data. "Pages with 3–5 H2 headers per 1,000 words in our database had 2.3x higher citation rates."

**3. Vague benefit claims**
"Our solution saves time and reduces costs." No information gain.
Fix: "Customers report saving an average of 4.2 hours per week on data entry — based on a survey of 87 customers in Q3 2025."

**4. Uncited statistics**
"73% of companies are investing in AI." Numbers without sources are nearly as bad as no numbers.
Fix: Name the source, date, and methodology every time.

**5. Derivative content**
Summarizing what other content says, without adding a new perspective or data point.
Fix: What do you specifically know from your experience? What's your interpretation that isn't elsewhere?`
      },
      {
        heading: 'How to increase information gain in existing content',
        body: `The good news: information gain improvements are surgical. You don't need to rewrite everything.

**Step 1: Audit with Content Doctor.**
The Information Gain Score tells you how much unique value your content adds. Below 60 is a meaningful problem. Below 40 means AI systems are very unlikely to cite this content.

**Step 2: Prioritize high-traffic, low-gain pages.**
Focus on pages where you most want AI citation — pricing, product pages, key landing pages.

**Step 3: Add primary data.**
The highest-leverage change: add one or two statistics from your own data with clear methodology. Not "customers report..." but "in a survey of 143 customers conducted in January 2026, 68% reported..."

**Step 4: Add named expert quotes.**
A direct quote with name and title is citable in a way third-person paraphrase is not.

**Step 5: Add counterintuitive findings.**
What does your experience suggest that contradicts common wisdom? These are high-information-gain opportunities because they differ from what the model already knows.

**Step 6: Update regularly.**
76.4% of pages cited by AI systems were updated within 30 days. Fresh data — quarterly reports, updated surveys, new case studies — is intrinsically higher information gain than stale content.`
      },
      {
        heading: 'Information gain vs. authority gaps',
        body: `Content Doctor measures two related but distinct problems:

**Authority gaps** are claims that lack citation backing. Adding a source fixes them.

**Information gain deficits** are content sections that say things the AI already knows — regardless of how well-cited they are. Content can be perfectly cited and still have low information gain if it's restating cited common knowledge.

Example: "Email marketing has an average ROI of 36:1 (Source: Litmus, 2023)" — well-cited (no authority gap), but the Litmus statistic is in thousands of articles. It doesn't give AI a reason to cite you specifically.

Higher-information-gain version: "In our analysis of 230 e-commerce email campaigns in Q4 2025, abandoned cart sequences had a median ROI of 47:1 — compared to Litmus's industry average of 36:1. Multi-email sequences with progressive urgency outperformed single-email sequences by 2.4x."

That version has no authority gap AND high information gain — the primary finding about multi-email sequences is not already in the model's training data.

Content Doctor returns both scores separately so you know which problem you're solving and how to fix each.`
      },
      {
        heading: 'The three-score system',
        body: `Content Doctor returns three scores for every analysis:

**Authority Score (0–100):** Are your claims backed by citations and evidence?

**Information Gain Score (0–100):** Does your content add unique information beyond common knowledge?

**Structure Score (0–100):** Is your content organized for AI readability?

The Content Health Score is a weighted average: authority and information gain each count 35%, structure 30%. This reflects the research: content with high information gain and strong authority is the most citable — structure is important but less decisive.

**Target for any page you want AI to cite:** 70+ on all three dimensions.

The most common starting point: 55 Authority, 40 Information Gain, 60 Structure. Moving the information gain score from 40 to 70 is typically the highest-impact work. Galuli's Content Doctor identifies exactly what to change to make that jump.`
      },
    ],
    cta: 'Check your Information Gain Score →'
  },
]

// ── Blog List Page ──────────────────────────────────────────────────────────────
export function BlogListPage({ onNavigate }) {
  return (
    <div className="blog-page">
      {/* Nav */}
      <nav className="blog-nav glass-panel">
        <a href="/" className="blog-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 22 }}>⬡</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--fg)' }}>galuli</span>
        </a>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <a href="/about" onClick={e => { e.preventDefault(); onNavigate('about') }} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>About</a>
          <a href="/roadmap" onClick={e => { e.preventDefault(); onNavigate('roadmap') }} style={{ color: 'var(--muted)', textDecoration: 'none', fontSize: 14 }}>Roadmap</a>
          <a href="/dashboard/" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>Dashboard →</button>
          </a>
        </div>
      </nav>

      {/* Header */}
      <div className="blog-hero">
        <div className="badge badge-purple" style={{ marginBottom: 16 }}>📚 Resources</div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, marginBottom: 16, lineHeight: 1.15 }}>
          The AI Visibility Blog
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 560, margin: '0 auto' }}>
          Deep dives into GEO, AI readiness, llms.txt, and everything else that determines whether AI systems recommend your website.
        </p>
      </div>

      {/* Post grid */}
      <div className="blog-grid">
        {POSTS.map(post => (
          <article
            key={post.slug}
            className="blog-card glass-panel hover-glow"
            onClick={() => onNavigate('post', post.slug)}
            style={{ cursor: 'pointer' }}
          >
            <div className="blog-card-emoji">{post.coverEmoji}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-blue" style={{ fontSize: 11 }}>{post.category}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>{post.date}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>· {post.readTime}</span>
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, lineHeight: 1.3, color: 'var(--fg)' }}>{post.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>{post.subtitle}</p>
            <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }}>Read article →</button>
          </article>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{ textAlign: 'center', padding: '80px 24px', borderTop: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Ready to check your AI visibility?</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 24 }}>Free AI Readiness Score. No credit card required.</p>
        <a href="/" style={{ textDecoration: 'none' }}>
          <button className="btn btn-primary btn-lg">Scan your site free →</button>
        </a>
      </div>
    </div>
  )
}

// ── Individual Blog Post Page ───────────────────────────────────────────────────
export function BlogPostPage({ slug, onNavigate }) {
  const post = POSTS.find(p => p.slug === slug)

  if (!post) return (
    <div style={{ textAlign: 'center', padding: 80 }}>
      <h2>Post not found</h2>
      <button className="btn btn-primary" onClick={() => onNavigate('blog')}>← Back to Blog</button>
    </div>
  )

  return (
    <div className="blog-page">
      {/* Nav */}
      <nav className="blog-nav glass-panel">
        <a href="/" className="blog-logo" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <span style={{ fontSize: 22 }}>⬡</span>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--fg)' }}>galuli</span>
        </a>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <button className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: 13 }} onClick={() => onNavigate('blog')}>← Blog</button>
          <a href="/dashboard/" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 14 }}>Dashboard →</button>
          </a>
        </div>
      </nav>

      {/* Article */}
      <article className="blog-article">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 64, marginBottom: 24 }}>{post.coverEmoji}</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
            <span className="badge badge-blue">{post.category}</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{post.date}</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>· {post.readTime}</span>
          </div>
          <h1 className="blog-post-title">{post.title}</h1>
          <p className="blog-post-subtitle">{post.subtitle}</p>
        </div>

        {/* Intro */}
        <div className="blog-intro">
          {post.intro.split('\n\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Sections */}
        {post.sections.map((section, i) => (
          <div key={i} className="blog-section">
            <h2>{section.heading}</h2>
            <div className="blog-body">
              {renderBody(section.body)}
            </div>
          </div>
        ))}

        {/* CTA */}
        <div className="blog-cta glass-panel">
          <h3>Ready to get started?</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>See how your site scores across all 5 AI Readiness dimensions — free.</p>
          <a href="/" style={{ textDecoration: 'none' }}>
            <button className="btn btn-primary btn-lg">{post.cta}</button>
          </a>
        </div>

        {/* Related posts */}
        <div style={{ marginTop: 80 }}>
          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, color: 'var(--fg)' }}>More from the blog</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {POSTS.filter(p => p.slug !== slug).slice(0, 2).map(p => (
              <div
                key={p.slug}
                className="glass-panel hover-glow"
                style={{ padding: 24, cursor: 'pointer', borderRadius: 16 }}
                onClick={() => { onNavigate('post', p.slug); window.scrollTo(0,0) }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{p.coverEmoji}</div>
                <div className="badge badge-blue" style={{ fontSize: 11, marginBottom: 10 }}>{p.category}</div>
                <h4 style={{ fontSize: 16, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.4 }}>{p.title}</h4>
              </div>
            ))}
          </div>
        </div>
      </article>
    </div>
  )
}

// Helper: render body with **bold**, \`code\`, and paragraphs
function renderBody(text) {
  return text.split('\n\n').map((block, bi) => {
    // Code block
    if (block.startsWith('```')) {
      const code = block.replace(/^```\w*\n?/, '').replace(/```$/, '')
      return (
        <pre key={bi} style={{
          background: '#0f0f23',
          color: '#e2e8f0',
          borderRadius: 12,
          padding: '20px 24px',
          overflowX: 'auto',
          fontSize: 13,
          lineHeight: 1.7,
          margin: '24px 0',
          border: '1px solid rgba(255,255,255,0.08)'
        }}>
          <code>{code}</code>
        </pre>
      )
    }

    // Bullet list
    if (block.match(/^- /m)) {
      const items = block.split('\n').filter(l => l.trim())
      return (
        <ul key={bi} style={{ paddingLeft: 24, margin: '16px 0', color: 'var(--fg)', lineHeight: 1.8 }}>
          {items.map((item, ii) => {
            const clean = item.replace(/^- /, '')
            return <li key={ii} style={{ marginBottom: 6 }}>{renderInline(clean)}</li>
          })}
        </ul>
      )
    }

    // Numbered list
    if (block.match(/^\d+\. /m)) {
      const items = block.split('\n').filter(l => l.trim())
      return (
        <ol key={bi} style={{ paddingLeft: 24, margin: '16px 0', color: 'var(--fg)', lineHeight: 1.8 }}>
          {items.map((item, ii) => {
            const clean = item.replace(/^\d+\. /, '')
            return <li key={ii} style={{ marginBottom: 6 }}>{renderInline(clean)}</li>
          })}
        </ol>
      )
    }

    // Paragraph with possible bold/italic/code
    return <p key={bi} style={{ marginBottom: 20, lineHeight: 1.8, color: 'var(--fg)' }}>{renderInline(block)}</p>
  })
}

function renderInline(text) {
  // Split on **bold**, *italic*, `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} style={{ fontWeight: 700, color: 'var(--fg)' }}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} style={{ background: 'var(--surface2)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace', fontSize: '0.9em', color: 'var(--accent)' }}>{part.slice(1, -1)}</code>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}
