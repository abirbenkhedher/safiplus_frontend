import React from "react";
import { useStatistiques } from "../../../hooks/useStatistiques";
import KpiGrid from "../../../components/statistiques/KpiGrid";
import KpiCard from "../../../components/statistiques/KpiCard";
import ChartCard from "../../../components/statistiques/ChartCard";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from "recharts";

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const OverviewTab = () => {
  const { data, loading, error, refetch } = useStatistiques("overview");

  if (error) {
    return (
      <div className="card-modern" style={{ textAlign: "center", padding: "40px" }}>
        <p style={{ color: "var(--danger)" }}>⚠️ {error}</p>
        <button onClick={refetch} className="btn-modern btn-modern-primary" style={{ marginTop: "16px" }}>
          Réessayer
        </button>
      </div>
    );
  }

  const v = data?.variations || {};
  const fmt = (num) => new Intl.NumberFormat('fr-FR').format(num || 0);

  // 🎨 Composant personnalisé pour la légende (Famille + Montant + %)
  const renderCustomLegend = (props) => {
    const { payload } = props;
    
    // Calcul du total pour les pourcentages
    const total = payload.reduce((sum, entry) => sum + (entry.payload.ca || 0), 0);

    return (
      <ul style={{ 
        listStyle: "none", 
        padding: 0, 
        margin: "16px 0 0 0", 
        display: "flex", 
        flexWrap: "wrap", 
        gap: "12px", 
        justifyContent: "center" 
      }}>
        {payload.map((entry, index) => {
          const percent = total > 0 ? ((entry.payload.ca / total) * 100).toFixed(1) : 0;
          return (
            <li key={`item-${index}`} style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "6px",
              fontSize: "12px",
              color: "var(--gray-700)",
              background: "var(--gray-50)",
              padding: "4px 10px",
              borderRadius: "6px",
              border: "1px solid var(--gray-200)"
            }}>
              {/* Pastille de couleur */}
              <span style={{ 
                width: "10px", 
                height: "10px", 
                borderRadius: "50%", 
                backgroundColor: entry.color 
              }} />
              {/* Nom de la famille */}
              <span style={{ fontWeight: "600" }}>{entry.value}</span>
              {/* Montant + % */}
              <span style={{ color: "var(--gray-500)" }}>
                {fmt(entry.payload.ca)} DT ({percent}%)
              </span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div>
      {/* Ligne 1 : 4 KPI */}
      <KpiGrid cols={4}>
        <KpiCard icon="💰" label="Chiffre d'Affaires" value={fmt(data?.ca_total)} suffix=" DT" variation={v.ca_total} />
        <KpiCard icon="💵" label="Total Encaissé" value={fmt(data?.encaissements)} suffix=" DT" variation={v.encaissements} />
        <KpiCard icon="📉" label="Reste à recevoir" value={fmt(data?.creances)} suffix=" DT" variation={v.creances} />
        <KpiCard icon="🔧" label="Nb Réparations" value={fmt(data?.nb_reparations)} variation={v.nb_reparations} />
      </KpiGrid>

      {/* Ligne 2 : Graphique d'évolution */}
      <div style={{ marginBottom: "20px" }}>
        <ChartCard 
          title="📈 Évolution du CA et des encaissements" 
          loading={loading} 
          empty={!data?.evolution || data.evolution.length === 0}
          height={320}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} 
                formatter={(value) => [`${fmt(value)} DT`, ""]}
              />
              <Line type="monotone" dataKey="ca" name="CA" stroke="var(--primary, #3b82f6)" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="encaissements" name="Encaissements" stroke="var(--success, #10b981)" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Ligne 3 : Camembert + Top Pannes */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        
        {/* ✅ Camembert avec légende personnalisée */}
        <ChartCard 
          title="🗂️ Répartition du CA par Famille" 
          loading={loading} 
          empty={!data?.ca_par_famille || data.ca_par_famille.length === 0}
          height={380} // Un peu plus haut pour laisser de la place à la légende
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={data?.ca_par_famille} 
                dataKey="ca" 
                nameKey="nom" 
                cx="50%" cy="45%" // Remonté un peu pour laisser la place à la légende
                innerRadius={50} 
                outerRadius={80} 
                paddingAngle={4}
              >
                {data?.ca_par_famille?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name, props) => [`${fmt(value)} DT`, props.payload.nom]} 
                contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
              />
              {/* ✅ On ajoute la légende personnalisée ici */}
              <Legend 
                content={renderCustomLegend} 
                verticalAlign="bottom" 
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top 5 Pannes */}
        <ChartCard 
          title="🔧 Top 5 des pannes (par CA)" 
          loading={loading} 
          empty={!data?.top_reparations || data.top_reparations.length === 0}
          height={380}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.top_reparations} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="nom" type="category" width={100} tick={{ fontSize: 11, fill: "var(--gray-600)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} formatter={(value) => [`${fmt(value)} DT`, "CA"]} />
              <Bar dataKey="ca" fill="var(--primary, #3b82f6)" radius={[0, 4, 4, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
};

export default OverviewTab;