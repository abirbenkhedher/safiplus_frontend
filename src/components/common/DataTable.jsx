import React, { useMemo, useState } from 'react';
import DataTableRDTC from 'react-data-table-component';
import { FaEdit, FaTrash, FaEye, FaFileExcel, FaSearch } from 'react-icons/fa';

const customStyles = {
  table: {
    style: {
      backgroundColor: 'white',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      width: '100%',
    },
  },
  headRow: {
    style: {
      backgroundColor: 'var(--gray-50)',
      borderBottom: '2px solid var(--gray-200)',
      minHeight: '48px',
    },
  },
  headCells: {
    style: {
      fontSize: '11px',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      color: 'var(--gray-600)',
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
  // ✅ NOUVEAU : Réduire la largeur de la colonne de sélection
  cells: {
    style: {
      paddingLeft: '16px',
      paddingRight: '16px',
    },
  },
  rows: {
    style: {
      minHeight: '56px',
      fontSize: '13.5px',
      color: 'var(--gray-700)',
      transition: 'background 150ms ease',
      '&:hover': {
        backgroundColor: 'var(--gray-50)',
        cursor: 'pointer',
      },
      '&:not(:last-of-type)': {
        borderBottom: '1px solid var(--gray-100)',
      },
    },
  },
  pagination: {
    style: {
      borderTop: '1px solid var(--gray-200)',
      minHeight: '56px',
      fontSize: '13px',
    },
  },
};

const DataTable = ({
  columns,
  data,
  loading = false,
  onView,
  onEdit,
  onDelete,
  actions = true,
  actionsWidth = '120px',
  searchable = true,
  searchPlaceholder = 'Rechercher...',
  pagination = true,
  paginationPerPage = 10,
  paginationRowsPerPageOptions = [10, 25, 50, 100],
  onRowClicked,
  selectableRows = false,
  onSelectedRowsChange,
  clearSelectedRows = false,
  emptyMessage = 'Aucune donnée à afficher',
  exportable = false,
  onExport,
  exportLabel = 'Exporter',
  striped = false,
  dense = false,
}) => {
  const [search, setSearch] = useState('');

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const query = search.toLowerCase().trim();
    return data.filter(row => {
      return Object.entries(row).some(([key, val]) => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'string' || typeof val === 'number') {
          return String(val).toLowerCase().includes(query);
        }
        if (typeof val === 'object') {
          return Object.values(val).some(
            v => typeof v === 'string' && v.toLowerCase().includes(query)
          );
        }
        return false;
      });
    });
  }, [data, search]);

  const finalColumns = useMemo(() => {
    const cols = [...columns];
    if (actions && (onView || onEdit || onDelete)) {
      cols.push({
        name: 'Actions',
        width: actionsWidth,
        center: true,
        cell: (row) => (
          <div className="d-flex gap-1 justify-content-center">
            {onView && (
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onView(row); }} title="Voir">
                <FaEye size={12} />
              </button>
            )}
            {onEdit && (
              <button className="btn-icon" onClick={(e) => { e.stopPropagation(); onEdit(row); }} title="Modifier">
                <FaEdit size={12} />
              </button>
            )}
            {onDelete && (
              <button className="btn-icon btn-icon-danger" onClick={(e) => { e.stopPropagation(); onDelete(row); }} title="Supprimer">
                <FaTrash size={12} />
              </button>
            )}
          </div>
        ),
        ignoreRowClick: true,
        allowOverflow: true,
        button: true,
      });
    }
    return cols;
  }, [columns, actions, onView, onEdit, onDelete, actionsWidth]);

  const CustomLoader = () => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <div className="spinner-modern" style={{ margin: '0 auto' }}></div>
      <p style={{ marginTop: '16px', color: 'var(--gray-500)', fontSize: '13px' }}>Chargement...</p>
    </div>
  );

  const CustomNoData = () => (
    <div className="empty-state">
      <div className="empty-state-icon">📭</div>
      <div className="empty-state-title">Aucune donnée</div>
      <div className="empty-state-text">
        {search ? `Aucun résultat pour "${search}"` : emptyMessage}
      </div>
    </div>
  );

  return (
    <div className="datatable-wrapper">
      {(searchable || exportable) && (
        <div className="datatable-header">
          {searchable && (
            <div className="datatable-search" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <FaSearch style={{
                position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--gray-400)', fontSize: '13px', pointerEvents: 'none', zIndex: 1,
              }} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="form-control-modern"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: '38px' }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  title="Effacer"
                  style={{
                    position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: 'var(--gray-400)',
                    cursor: 'pointer', fontSize: '14px', padding: '4px',
                  }}
                >
                  ×
                </button>
              )}
            </div>
          )}
          {exportable && onExport && (
            <button className="btn-modern btn-modern-success" onClick={onExport}>
              <FaFileExcel /> {exportLabel}
            </button>
          )}
        </div>
      )}

      <DataTableRDTC
        columns={finalColumns}
        data={filteredData}
        progressPending={loading}
        progressComponent={<CustomLoader />}
        noDataComponent={<CustomNoData />}
        customStyles={customStyles}
        pagination={pagination}
        paginationPerPage={paginationPerPage}
        paginationRowsPerPageOptions={paginationRowsPerPageOptions}
        paginationComponentOptions={{
          rowsPerPageText: 'Lignes par page:',
          rangeSeparatorText: 'sur',
          selectAllRowsItem: true,
          selectAllRowsItemText: 'Tous',
        }}
        noHeader
        highlightOnHover
        pointerOnHover={!!onRowClicked}
        onRowClicked={onRowClicked}
        selectableRows={selectableRows}
        onSelectedRowsChange={onSelectedRowsChange}
        clearSelectedRows={clearSelectedRows}
        selectableRowsComponentProps={{
          'aria-label': 'Sélectionner la ligne',
        }}
        responsive
        striped={striped}
        dense={dense}
        persistTableHead
      />

      <style>{`
        .datatable-wrapper { width: 100%; }
        .datatable-header {
          display: flex; justify-content: space-between; align-items: center;
          gap: 12px; margin-bottom: 16px; flex-wrap: wrap;
        }
        .datatable-search { flex: 1; max-width: 400px; }
        .form-control-modern {
          width: 100%; height: 42px; padding: 0 14px;
          border: 1px solid var(--gray-200); border-radius: var(--radius-md);
          font-size: 13.5px; transition: all var(--transition-fast); background: white;
        }
        .form-control-modern:focus {
          outline: none; border-color: var(--primary);
          box-shadow: 0 0 0 3px var(--primary-light);
        }
        .btn-icon {
          width: 32px; height: 32px; padding: 0;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: var(--radius-sm); border: 1px solid var(--gray-200);
          background: white; color: var(--gray-600); cursor: pointer;
          transition: all 150ms ease;
        }
        .btn-icon:hover {
          background: var(--primary); color: white; border-color: var(--primary);
          transform: translateY(-1px);
        }
        .btn-icon-danger:hover { background: var(--danger); border-color: var(--danger); }

        /* ✅ CORRECTION : Table pleine largeur */
        .datatable-wrapper .rdt_TableWrapper {
          width: 100% !important; overflow-x: auto !important;
        }
        .datatable-wrapper .rdt_Table {
          width: 100% !important; min-width: 100%;
        }
        .datatable-wrapper .rdt_TableHead,
        .datatable-wrapper .rdt_TableBody,
        .datatable-wrapper .rdt_TableRow { width: 100%; }
        .datatable-wrapper .rdt_TableCol,
        .datatable-wrapper .rdt_TableCell { flex-grow: 1; }

        /* ✅ NOUVEAU : Réduire la colonne de sélection (checkbox) */
        .rdt_TableCol:first-child,
        .rdt_TableCell:first-child {
          flex: 0 0 40px !important;
          min-width: 40px !important;
          max-width: 40px !important;
          padding-left: 8px !important;
          padding-right: 4px !important;
        }

        .rdt_Table [type="checkbox"] {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: var(--primary);
          margin: 0;
        }

        @media (max-width: 768px) {
          .datatable-header { flex-direction: column; align-items: stretch; }
          .datatable-search { max-width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default DataTable;