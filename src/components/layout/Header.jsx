'use client';

// TODO: Swap with the destination project's Header/navigation component when integrating.

import { useState } from 'react';
import { Button } from '../ui/Button';
import { Container } from '../ui/Container';

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="gp-header">
      <Container>
        <div className="gp-header-content">
          <a href="/" className="gp-logo">
            <picture>
              <source media="(min-width: 768px)" srcSet="/assets/img/GP_logo.svg" />
              <img src="/assets/img/GP_favicon.svg" alt="Global Payments" style={{ height: 32, width: 'auto' }} />
            </picture>
          </a>

          <nav className={`gp-header-nav${mobileOpen ? ' open' : ''}`}>
            <a href="https://developer.globalpay.com/home">Docs</a>
            <a href="https://developer.globalpay.com/api/references-overview">API Reference</a>
            <a href="https://developer.globalpay.com/docs/integration-options/sdk/overview">SDKs</a>
            <Button href="https://github.com/globalpayments-samples" variant="header">
              GitHub
            </Button>
          </nav>

          <button
            className="gp-mobile-menu-toggle"
            aria-label="Toggle navigation"
            onClick={() => setMobileOpen(open => !open)}
          >
            <span /><span /><span />
          </button>
        </div>
      </Container>
    </header>
  );
}
