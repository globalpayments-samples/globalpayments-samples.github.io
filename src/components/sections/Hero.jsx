import { Button } from '../ui/Button';
import { Container } from '../ui/Container';

export function Hero() {
  return (
    <section className="gp-hero">
      <Container>
        <h1 className="gp-hero-title">Global Payments Samples</h1>
        <p className="gp-hero-subtitle">
          Integration samples and examples for Global Payments API Platform,
          organized by programming language and complexity level.
        </p>
        <div className="gp-hero-actions">
          <Button href="https://developer.globalpay.com/docs/getting-started/overview" variant="primary">
            Get Started
          </Button>
          <Button href="#samples" variant="secondary">
            Browse Samples
          </Button>
        </div>
      </Container>
    </section>
  );
}
