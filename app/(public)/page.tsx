import { PublicSiteFooter } from '@/modules/public/ui/public-site-footer'

const links = [
  { href: '/app', label: 'Member App' },
  { href: '/admin', label: 'Admin' },
]

export default function MarketingHomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 920,
          padding: 32,
          borderRadius: 24,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        <p style={{ margin: 0, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
          WellStudio V1
        </p>
        <h1 style={{ marginBottom: 12 }}>Modular monolith bootstrap</h1>
        <p style={{ marginTop: 0, maxWidth: 680, color: 'var(--muted)' }}>
          Initial repository structure for public, member, and admin surfaces. Product logic will live in isolated
          domain modules, not in route components.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 24 }}>
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              style={{
                padding: '12px 16px',
                borderRadius: 999,
                border: '1px solid var(--border)',
                background: 'var(--background)',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <PublicSiteFooter />
        </div>
      </section>
    </main>
  )
}
