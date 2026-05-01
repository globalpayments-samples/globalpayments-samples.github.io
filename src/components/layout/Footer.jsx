// TODO: Swap with the destination project's Footer component when integrating.

import { Container } from '../ui/Container';

export function Footer() {
  return (
    <footer className="gp-footer">
      <Container>
        <div className="gp-footer-content">
          <div className="gp-footer-section">
            <a href="https://www.globalpayments.com" className="gp-footer-logo">
              <img
                src="/assets/img/GP_logo.svg"
                alt="Global Payments"
                style={{ height: 24, width: 'auto', filter: 'brightness(0) invert(1)' }}
              />
            </a>
          </div>
          <div className="gp-footer-section">
            <nav className="gp-footer-nav">
              <a href="https://developer.globalpay.com/home" className="gp-footer-link">
                Documentation
              </a>
              <a href="https://github.com/globalpayments" className="gp-footer-link">
                SDKs &amp; Plugins
              </a>
              <a href="https://github.com/globalpayments-samples" className="gp-footer-link">
                Sample Projects
              </a>
            </nav>
          </div>
        </div>
      </Container>
    </footer>
  );
}
