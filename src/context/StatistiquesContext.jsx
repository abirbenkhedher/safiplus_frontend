import { createContext, useContext, useState } from "react";
import { usePeriod } from "../hooks/usePeriod";

const StatistiquesContext = createContext(null);

export const StatistiquesProvider = ({ children }) => {
  const periodHook = usePeriod();
  const [filters, setFilters] = useState({
    famille_id: "",
    categorie_id: "",
  });

  return (
    <StatistiquesContext.Provider value={{ ...periodHook, filters, setFilters }}>
      {children}
    </StatistiquesContext.Provider>
  );
};

export const useStatistiquesContext = () => {
  const context = useContext(StatistiquesContext);
  if (!context) throw new Error("useStatistiquesContext doit être dans un Provider");
  return context;
};