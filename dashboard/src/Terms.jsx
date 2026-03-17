export function TermsPage({ onNavigate }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: '-apple-system, sans-serif' }}>
      {/* Nav */}
      <div style={{ borderBottom: '1px solid var(--border)', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 15, color: 'var(--text)', textDecoration: 'none' }}>
          <div style={{ width: 20, height: 20, background: 'var(--accent)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white', fontWeight: 800 }}>g</div>
          galuli
        </a>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <a href="/pricing" style={{ fontSize: 13, color: 'var(--subtle)', textDecoration: 'none' }}>Pricing</a>
          <a href="/blog" style={{ fontSize: 13, color: 'var(--subtle)', textDecoration: 'none' }}>Blog</a>
          <a href="/dashboard/" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Dashboard →</a>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 32px 80px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Terms of Service</h1>
        <p style={{ color: 'var(--subtle)', fontSize: 13, marginBottom: 40 }}>Last updated: March 17, 2026</p>

        <Section title="1. Acceptance">
          <p>By using Galuli ("the Service") you agree to these Terms of Service. If you do not agree, do not use the Service. These terms apply to all users, including free-tier users and customers on paid plans.</p>
        </Section>

        <Section title="2. Description of Service">
          <p>Galuli is a SaaS tool that analyzes publicly available website content to produce AI Readiness Scores, Entity Establishment reports, and AI traffic analytics. It includes a JavaScript snippet ("galuli.js") you may install on sites you own or are authorized to instrument.</p>
        </Section>

        <Section title="3. Accounts">
          <p>You must provide a valid email address to create an account. You are responsible for maintaining the security of your API key. Do not share your API key publicly or embed it in client-side code you do not control. Notify us immediately at hello@galuli.io if you believe your key has been compromised.</p>
        </Section>

        <Section title="4. Acceptable Use">
          <p>You may not use Galuli to:</p>
          <ul>
            <li>Scan or monitor domains you do not own or are not authorized to analyze</li>
            <li>Circumvent rate limits or plan quotas by any means</li>
            <li>Attempt to access other users' data</li>
            <li>Use the service for any illegal purpose</li>
            <li>Resell or white-label the service without a written agreement</li>
          </ul>
          <p>We reserve the right to suspend accounts that violate these terms without refund.</p>
        </Section>

        <Section title="5. Plans, Payment, and Refunds">
          <p>Paid plans are billed through Lemon Squeezy, our Merchant of Record. By subscribing you agree to their terms of service. Subscription fees are charged at the start of each billing period and are non-refundable except where required by law. You may cancel at any time; your plan stays active until the end of the billing period. Downgrading to the Free plan removes domains over the Free limit.</p>
        </Section>

        <Section title="6. Free Tier">
          <p>The Free plan is provided as-is with no uptime guarantees. We may modify or discontinue the Free plan at any time with reasonable notice to registered users.</p>
        </Section>

        <Section title="7. Intellectual Property">
          <p>The Galuli platform, scoring algorithms, and brand are our intellectual property. Your website data (content we crawl) remains yours. We grant you a limited, non-exclusive license to embed the galuli.js snippet and score badge on your own sites.</p>
        </Section>

        <Section title="8. Data and Privacy">
          <p>Our <a href="/privacy" style={{ color: 'var(--accent)' }}>Privacy Policy</a> describes how we collect and use data. By using the Service you consent to our data practices as described there.</p>
        </Section>

        <Section title="9. Disclaimers">
          <p>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE DO NOT GUARANTEE THAT USING GALULI WILL RESULT IN YOUR SITE BEING CITED BY ANY AI ENGINE. AI CITATION BEHAVIOR IS CONTROLLED BY THIRD PARTIES (OPENAI, ANTHROPIC, GOOGLE, ETC.) OVER WHOM WE HAVE NO CONTROL.</p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, OUR LIABILITY TO YOU IS LIMITED TO THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM. WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES.</p>
        </Section>

        <Section title="11. Changes to Terms">
          <p>We may update these terms. Material changes will be communicated via email. Continued use after the effective date of changes constitutes acceptance.</p>
        </Section>

        <Section title="12. Governing Law">
          <p>These terms are governed by the laws of Israel. Any disputes will be resolved in the courts of Tel Aviv.</p>
        </Section>

        <Section title="13. Contact">
          <p>Questions: <a href="mailto:hello@galuli.io" style={{ color: 'var(--accent)' }}>hello@galuli.io</a></p>
        </Section>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>© 2026 Galuli</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <a href="/privacy" style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>Privacy</a>
          <a href="/terms" style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>Terms</a>
          <a href="mailto:hello@galuli.io" style={{ fontSize: 12, color: 'var(--subtle)', textDecoration: 'none' }}>hello@galuli.io</a>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--text)' }}>{title}</h2>
      <div style={{ fontSize: 14, color: 'var(--subtle)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </div>
  )
}
