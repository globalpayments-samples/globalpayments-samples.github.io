// TODO: Swap with the destination project's layout container when integrating.

export function Container({ children, className = '' }) {
  const cls = `gp-container ${className}`.trim();
  return <div className={cls}>{children}</div>;
}
