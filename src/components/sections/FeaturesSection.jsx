import { Container } from '../ui/Container';
import { FEATURES } from '../../data/projects';

export function FeaturesSection() {
  return (
    <section className="gp-section gp-section-alt">
      <Container>
        <div className="gp-section-header">
          <h2 className="gp-section-title">Every Sample Includes</h2>
        </div>
        <div className="gp-features-grid">
          {FEATURES.map(feature => (
            <div key={feature.title} className="gp-feature-card">
              <div className="gp-feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
