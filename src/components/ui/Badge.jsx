// TODO: Swap these with the destination project's Badge/Tag components when integrating.

import { BADGE_CLASS } from '../../data/projects';

export function CategoryBadge({ category, label, className = '' }) {
  const cls = `gp-badge ${BADGE_CLASS[category] ?? ''} ${className}`.trim();
  return <span className={cls}>{label}</span>;
}

export function LanguageBadge({ language, langClass, className = '' }) {
  const cls = `gp-lang ${langClass} ${className}`.trim();
  return <span className={cls}>{language}</span>;
}

export function TopicTag({ tag, className = '' }) {
  const cls = `gp-tag ${className}`.trim();
  return <span className={cls}>{tag}</span>;
}
