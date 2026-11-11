// ============================================================
// ✅ MULTI-TENANT : colonne « Boutique » des listes en vue globale
// usage : const cols = withBoutiqueColumn(columns, isAllBoutiques, boutiqueOf)
// (row.boutique peut être un id ou un objet peuplé)
// ============================================================
// nullLabel : libellé quand row.boutique est vide (ex : dépense « Administrative »)
export const withBoutiqueColumn = (columns, isAllBoutiques, boutiqueOf, nullLabel = null) => {
  if (!isAllBoutiques) return columns;
  return [
    {
      name: 'Boutique',
      selector: (row) => boutiqueOf(row.boutique)?.nom || (row.boutique ? '' : nullLabel || ''),
      sortable: true,
      width: '130px',
      cell: (row) => {
        const b = boutiqueOf(row.boutique);
        if (!row.boutique && nullLabel) {
          return <span className="badge-modern badge-modern-primary">{nullLabel}</span>;
        }
        return (
          <span className="badge-modern badge-modern-gray" title={b?.nom}>
            {b?.code || '—'}
          </span>
        );
      },
    },
    ...columns,
  ];
};
