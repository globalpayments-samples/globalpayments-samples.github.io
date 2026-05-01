import { Container } from '../ui/Container';
import { COMMUNITY_LINKS } from '../../data/projects';

export function CommunitySection() {
  return (
    <section className="gp-section">
      <Container>
        <div className="gp-section-header">
          <h2 className="gp-section-title">Developer Community</h2>
          <p className="gp-section-subtitle">
            Join our developer community and stay up to date with the latest news
            from the Global Payments team.
          </p>
        </div>

        <div className="gp-community-grid">
          {COMMUNITY_LINKS.map(link => (
            <a key={link.href} href={link.href} className="gp-community-link">
              <strong>{link.label}</strong>
              <span>{link.desc}</span>
            </a>
          ))}
        </div>

        <p className="gp-text-center gp-mt-lg">
          Have a suggestion?{' '}
          <a href="mailto:communityexperience@globalpay.com?subject=Global%20Payments%20Developer%20Community%20Feedback">
            Email us your feedback
          </a>.
        </p>
      </Container>
    </section>
  );
}
