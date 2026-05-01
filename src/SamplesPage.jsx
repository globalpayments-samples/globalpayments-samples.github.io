// Main page component — drop this in as a Next.js page (app/samples/page.jsx or similar).
//
// CSS dependencies to carry over to the destination project:
//   - css/styles.css  (GP brand tokens + base styles; also used by sample projects as a CDN asset)
//   - css/portal.css  (portal-specific layout and component styles)
//
// Swap points for destination project components are marked with TODO comments in:
//   - src/components/ui/Button.jsx
//   - src/components/ui/Badge.jsx
//   - src/components/ui/Container.jsx
//   - src/components/layout/Header.jsx
//   - src/components/layout/Footer.jsx

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/sections/Hero';
import { SamplesSection } from './components/sections/SamplesSection';
import { FeaturesSection } from './components/sections/FeaturesSection';
import { CommunitySection } from './components/sections/CommunitySection';

export default function SamplesPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SamplesSection />
        <FeaturesSection />
        <CommunitySection />
      </main>
      <Footer />
    </>
  );
}
