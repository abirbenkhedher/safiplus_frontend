import { useEffect, useState } from "react";
import { getFamilles } from "../api/familles";

// ✅ Familles de la société (GSM, Informatique…) pour rattacher une dépense
export const useFamilles = () => {
  const [familles, setFamilles] = useState([]);
  useEffect(() => {
    getFamilles()
      .then((r) => {
        const list = r?.data || r || [];
        setFamilles(Array.isArray(list) ? [...list].sort((a, b) => (a.nom || "").localeCompare(b.nom || "")) : []);
      })
      .catch(() => setFamilles([]));
  }, []);
  return familles;
};
