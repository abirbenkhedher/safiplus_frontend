import React from "react";
import { useStatistiques } from "../../../hooks/useStatistiques";
import KpiGrid from "../../../components/statistiques/KpiGrid";
import KpiCard from "../../../components/statistiques/KpiCard";
import ChartCard from "../../../components/statistiques/ChartCard";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList
} from "recharts";

const PALETTE = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

const ReparationsTab = () => {
  const { data, loading, error, refetch } = useStatistiques("reparations");

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

  // Composant réutilisable pour les mini barres horizontales "Top"
  const MiniTopBar = ({ title, data, color }) => (
    <ChartCard 
      title={title} 
      loading={loading} 
      empty={!data || data.length === 0}
      height={180}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="nom" 
            type="category" 
            width={80} 
            tick={{ fontSize: 10, fill: "var(--gray-600)" }} 
            axisLine={false} 
            tickLine={false} 
          />
          <Tooltip cursor={{ fill: 'transparent' }} />
          <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} barSize={14}>
            <LabelList dataKey="count" position="right" style={{ fontSize: 10, fill: "var(--gray-500)", fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );

  return (
    <div>
      {/* Ligne 1 : 3 KPI */}
      <KpiGrid cols={3}>
        <KpiCard icon="🔧" label="Nb réparations" value={fmt(data?.nb_reparations)} variation={v.nb_reparations} />
        <KpiCard icon="⏱️" label="Délai moyen" value={data?.delai_moyen ?? 0} suffix=" jours" variation={v.delai_moyen} />
        <KpiCard icon="✅" label="Taux de réussite" value={data?.taux_reussite ?? 0} suffix="%" variation={v.taux_reussite} />
      </KpiGrid>

      {/* Ligne 2 : 4 Top (Catégories, Objets, Marques, Modèles) */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
        gap: "16px",
        marginBottom: "20px"
      }}>
        <MiniTopBar title="📦 Top Catégories" data={data?.top_categories} color="#3b82f6" />
        <MiniTopBar title="📱 Top Objets" data={data?.top_objets} color="#10b981" />
        <MiniTopBar title="🏷️ Top Marques" data={data?.top_marques} color="#f59e0b" />
        <MiniTopBar title="📲 Top Modèles" data={data?.top_modeles} color="#8b5cf6" />
      </div>

      {/* Ligne 3 : 2 graphiques (type + jour) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px" }}>
        
        {/* Camembert par type */}
        <ChartCard 
          title="📊 Répartition par type d'appareil" 
          loading={loading} 
          empty={!data?.par_type || data.par_type.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={data?.par_type} 
                dataKey="count" 
                nameKey="type" 
                cx="50%" cy="50%" 
                innerRadius={50} outerRadius={80} 
                paddingAngle={5}
              >
                {data?.par_type?.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PALETTE[index % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Barres par jour */}
        <ChartCard 
          title="🗓️ Charge par jour de la semaine" 
          loading={loading} 
          empty={!data?.par_jour || data.par_jour.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.par_jour} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-200)" />
              <XAxis dataKey="jour" tick={{ fontSize: 12, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "var(--gray-500)" }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'var(--gray-100)' }} />
              <Bar dataKey="count" name="Réparations" fill="var(--success, #10b981)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

      </div>
    </div>
  );
};

export default ReparationsTab;