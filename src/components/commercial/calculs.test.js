// ✅ Tests des calculs de documents (npm test)
import { describe, it, expect } from "vitest";
import {
  calcLigne, calcTotaux, repartirM, montantEnLettres, nombreEnLettres, prixVersBase, baseCommerce, remiseLabel,
} from "./calculs";
import { r3, versTTC, versHT } from "../../utils/tva";
import reference from "./calculs.cas-serveur.json";

describe("mêmes montants que le serveur (DocumentVente.calculer)", () => {
  // Cas générés par le serveur : npm run fixture:calculs (safiplus_backend)
  it.each(reference.cas.map((c, i) => [i, c]))("cas %i", (_i, { entree, attendu }) => {
    const timbre = entree.type === "FACTURE" && entree.appliquerTimbre ? entree.timbreFiscal : 0;
    const t = calcTotaux(entree.lignes, entree.prixSaisis, timbre, { type: entree.remiseGlobaleType, valeur: entree.remiseGlobaleValeur });
    expect({
      totalHT: t.ht, totalTVA: t.tva, totalTTC: t.ttc, netAPayer: t.net,
      totalAvantRemise: t.avantRemise, remiseGlobaleMontant: t.remise,
    }).toEqual(attendu);
  });

  it("contient assez de cas variés", () => {
    expect(reference.cas.length).toBeGreaterThanOrEqual(100);
    expect(new Set(reference.cas.map((c) => c.entree.prixSaisis))).toEqual(new Set(["TTC", "HT"]));
  });
});

describe("calcLigne", () => {
  it("prix TTC : HT = TTC / 1,19", () => {
    expect(calcLigne({ prixUnitaire: 119, quantite: 1, tauxTVA: 19 }, "TTC")).toEqual({ ht: 100, tva: 19, ttc: 119 });
  });
  it("prix HT : TVA ajoutée", () => {
    expect(calcLigne({ prixUnitaire: 100, quantite: 2, tauxTVA: 7 }, "HT")).toEqual({ ht: 200, tva: 14, ttc: 214 });
  });
  it("remise en % et en montant", () => {
    expect(calcLigne({ prixUnitaire: 100, quantite: 1, tauxTVA: 0, remisePct: 10 }, "HT").ht).toBe(90);
    expect(calcLigne({ prixUnitaire: 100, quantite: 1, tauxTVA: 0, remiseType: "montant", remiseMontant: 15 }, "HT").ht).toBe(85);
    expect(calcLigne({ prixUnitaire: 10, quantite: 1, tauxTVA: 0, remiseType: "montant", remiseMontant: 50 }, "HT").ht).toBe(0);
  });
});

describe("calcTotaux", () => {
  it("timbre fiscal ajouté au net à payer seulement", () => {
    const t = calcTotaux([{ prixUnitaire: 119, quantite: 1, tauxTVA: 19 }], "TTC", 1);
    expect(t).toMatchObject({ ttc: 119, net: 120 });
  });
  it("remise globale en montant plafonnée au total", () => {
    const t = calcTotaux([{ prixUnitaire: 10, quantite: 1, tauxTVA: 0 }], "HT", 0, { type: "montant", valeur: 50 });
    expect(t).toMatchObject({ remise: 10, ht: 0 });
  });
  it("document vide", () => {
    expect(calcTotaux([], "TTC")).toMatchObject({ ht: 0, tva: 0, ttc: 0, net: 0 });
  });
});

describe("repartirM", () => {
  it("répartit exactement la remise (aucun millime perdu)", () => {
    const parts = repartirM(1000, [333, 333, 334]);
    expect(parts.reduce((s, p) => s + p, 0)).toBe(1000);
  });
  it("rien à répartir", () => {
    expect(repartirM(0, [10, 20])).toEqual([0, 0]);
    expect(repartirM(5, [0, 0])).toEqual([0, 0]);
  });
});

describe("montant en lettres", () => {
  it.each([
    [0, "Zéro dinar"],
    [1, "Un dinar"],
    [21, "Vingt et un dinars"],
    [71, "Soixante et onze dinars"],
    [80, "Quatre-vingts dinars"],
    [99, "Quatre-vingt-dix-neuf dinars"],
    [200, "Deux cents dinars"],
    [1000, "Mille dinars"],
    [1250.5, "Mille deux cent cinquante dinars et cinq cents millimes"],
  ])("%s → %s", (v, attendu) => expect(montantEnLettres(v)).toBe(attendu));
  it("nombre", () => expect(nombreEnLettres(380)).toBe("trois cent quatre-vingts"));
});

describe("bases de prix", () => {
  it("commerce TTC par défaut", () => {
    expect(baseCommerce({})).toBe("TTC");
    expect(baseCommerce({ commerce: { prixTTC: false } })).toBe("HT");
  });
  it("prix d'article converti vers la base du document", () => {
    expect(prixVersBase(100, { prixTTC: false }, "TTC", 19)).toBe(119);
    expect(prixVersBase(119, { prixTTC: true }, "HT", 19)).toBe(100);
    expect(prixVersBase(50, { prixTTC: true }, "TTC", 19)).toBe(50);
  });
  it("libellé de remise", () => {
    expect(remiseLabel({ remisePct: 12.5 })).toBe("12.5 %");
    expect(remiseLabel({ remiseType: "montant", remiseMontant: 5 })).toBe("5.000 DT");
    expect(remiseLabel({})).toBe("");
  });
});

describe("utils/tva", () => {
  it("HT ↔ TTC au millime", () => {
    expect(versTTC(100, 19)).toBe(119);
    expect(versHT(119, 19)).toBe(100);
    expect(versTTC("", 19)).toBe("");
    expect(r3(1.23456)).toBe(1.235);
  });
});
