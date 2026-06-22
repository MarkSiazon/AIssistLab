interface ExportBundleSummaryProps {
  stats: readonly (readonly [string, string])[];
}

export function ExportBundleSummary({ stats }: ExportBundleSummaryProps) {
  return (
    <section className="export-bundle-summary" aria-label="Bundle summary">
      {stats.map(([label, value]) => (
        <div key={label} className="export-bundle-stat">
          <div className="export-bundle-stat-value">{value}</div>
          <div className="export-bundle-stat-label">{label}</div>
        </div>
      ))}
    </section>
  );
}
