import StatCard from "../common/StatCard";

// ✅ Même carte KPI que le reste de l'application
const KpiCard = ({ icon, label, value, suffix = "", variation, subtitle }) => (
  <StatCard icon={icon} label={label} value={value} suffix={suffix} variation={variation} hint={subtitle} />
);

export default KpiCard;
