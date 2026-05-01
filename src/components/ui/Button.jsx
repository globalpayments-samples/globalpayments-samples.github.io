// TODO: Swap this with the destination project's Button component when integrating.
// Props map to GP brand variants; translate to the target design system's equivalents.

const VARIANT_CLASS = {
  primary:   'gp-button-primary',
  secondary: 'gp-button-secondary',
  header:    'gp-button-header',
};

export function Button({ href, variant = 'primary', className = '', children, ...props }) {
  const cls = `gp-button ${VARIANT_CLASS[variant] ?? VARIANT_CLASS.primary} ${className}`.trim();

  if (href) {
    return (
      <a href={href} className={cls} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}
