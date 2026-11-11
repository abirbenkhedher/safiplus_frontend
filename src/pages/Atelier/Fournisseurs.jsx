import { useEffect, useState } from "react";
import { FaPlus, FaEdit, FaBan, FaTruck, FaSearch } from "react-icons/fa";
import { getFournisseurs, createFournisseur, updateFournisseur, deleteFournisseur } from "../../api/atelier";
import { useAuth } from "../../context/AuthContext";
import { Page, PageHeader, Alert, Table, FormModal, Field, IconBtn } from "../../components/atelier/ui";
import { errMsg } from "../../utils/atelier";

const EMPTY = { nom: "", telephone: "", email: "", adresse: "", matriculeFiscal: "", observation: "" };
const FIELDS = [["nom", "Nom *"], ["telephone", "Téléphone"], ["email", "Email"], ["matriculeFiscal", "Matricule fiscal"], ["adresse", "Adresse"], ["observation", "Observation"]];

const Fournisseurs = () => {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("fournisseurs");
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => getFournisseurs().then((r) => setRows(r.data.data)).catch((e) => setMsg(errMsg(e)));
  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      if (edit._id) await updateFournisseur(edit._id, edit);
      else await createFournisseur(edit);
      setEdit(null);
      load();
    } catch (e) { setMsg(errMsg(e)); }
  };

  const q = search.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => `${r.nom} ${r.telephone} ${r.email}`.toLowerCase().includes(q)) : rows;

  return (
    <Page>
      <PageHeader icon={<FaTruck />} title="Fournisseurs" subtitle={`${rows.length} fournisseur(s) — partagés par toutes les boutiques`}>
        {canEdit && <button className="btn-modern btn-modern-primary" onClick={() => setEdit({ ...EMPTY })}><FaPlus /> Nouveau fournisseur</button>}
      </PageHeader>
      <Alert msg={msg} onClose={() => setMsg(null)} />
      <div className="card-modern at-filters">
        <div style={{ position: "relative", flex: 1, maxWidth: 400 }}>
          <FaSearch style={{ position: "absolute", left: 13, top: 14, color: "var(--gray-400)", fontSize: 13 }} />
          <input className="form-control-modern" style={{ paddingLeft: 36 }} placeholder="Rechercher un fournisseur…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>
      <Table
        rows={filtered}
        empty="Aucun fournisseur"
        cols={[
          { label: "Nom", render: (r) => <b>{r.nom}</b> },
          { key: "telephone", label: "Téléphone" },
          { key: "email", label: "Email" },
          { key: "matriculeFiscal", label: "Matricule fiscal" },
          { label: "Statut", render: (r) => <span className={`badge-modern badge-modern-${r.isActive ? "success" : "gray"}`}>{r.isActive ? "Actif" : "Inactif"}</span> },
          canEdit && {
            label: "", render: (r) => (
              <div className="at-actions">
                <IconBtn title="Modifier" onClick={() => setEdit(r)}><FaEdit /></IconBtn>
                {r.isActive && (
                  <IconBtn title="Désactiver" tone="danger" onClick={async () => { if (window.confirm("Désactiver ce fournisseur ?")) { await deleteFournisseur(r._id); load(); } }}>
                    <FaBan />
                  </IconBtn>
                )}
              </div>
            ),
          },
        ].filter(Boolean)}
      />
      <FormModal show={!!edit} size="lg" title={edit?._id ? "Modifier le fournisseur" : "Nouveau fournisseur"} onClose={() => setEdit(null)} onSubmit={save}>
        {edit && (
          <div className="row g-3">
            {FIELDS.map(([k, l]) => (
              <Field key={k} label={l} col="col-12 col-md-6">
                <input className="form-control-modern" required={k === "nom"} value={edit[k] || ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
              </Field>
            ))}
          </div>
        )}
      </FormModal>
    </Page>
  );
};

export default Fournisseurs;
