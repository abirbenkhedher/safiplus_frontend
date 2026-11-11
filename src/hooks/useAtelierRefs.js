import { useEffect, useState } from "react";
import { getStock } from "../api/stock";
import { getReparateurs } from "../api/atelier";

/** Articles (lignes de stock) de la boutique active. */
export const useArticles = () => {
  const [articles, setArticles] = useState([]);
  useEffect(() => {
    getStock().then((r) => setArticles(r.data.data || [])).catch(() => setArticles([]));
  }, []);
  return articles;
};

/** Réparateurs (utilisateurs) visibles + contrat courant. */
export const useReparateurs = () => {
  const [list, setList] = useState([]);
  useEffect(() => {
    getReparateurs().then((r) => setList(r.data.data || [])).catch(() => setList([]));
  }, []);
  return list;
};

