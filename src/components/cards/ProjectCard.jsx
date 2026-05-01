import { CATEGORY_LABELS, LANG_CLASS } from '../../data/projects';
import { CategoryBadge, LanguageBadge, TopicTag } from '../ui/Badge';

export function ProjectCard({ project }) {
  const { title, url, category, description, language_labels, tags } = project;

  return (
    <a
      className="gp-project-card"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="gp-project-card-header">
        <CategoryBadge category={category} label={CATEGORY_LABELS[category] ?? category} />
      </div>

      <h3 className="gp-project-card-title">{title}</h3>
      <p className="gp-project-card-desc">{description}</p>

      {language_labels.length > 0 && (
        <div className="gp-project-card-langs">
          {language_labels.map(lang => (
            <LanguageBadge key={lang} language={lang} langClass={LANG_CLASS[lang] ?? ''} />
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="gp-project-card-tags">
          {tags.map(tag => (
            <TopicTag key={tag} tag={tag} />
          ))}
        </div>
      )}

      <span className="gp-project-card-link">View on GitHub →</span>
    </a>
  );
}
