import { useState } from "react";

const PRESET_TO_RANGE = (preset) => {
  const to = new Date();
  const from = new Date();
  if (preset === "7d")   from.setDate(to.getDate() - 7);
  if (preset === "30d")  from.setDate(to.getDate() - 30);
  if (preset === "90d")  from.setDate(to.getDate() - 90);
  if (preset === "year") from.setMonth(0, 1); // 1er Janvier de cette année
  
  return {
    from: from.toISOString().slice(0, 10),
    to:   to.toISOString().slice(0, 10),
  };
};

export const usePeriod = () => {
  // Par défaut, on met 30 jours
  const [period, setPeriod] = useState({ 
    preset: "30d", 
    ...PRESET_TO_RANGE("30d") 
  });

  const setPreset = (preset) => {
    setPeriod({ preset, ...PRESET_TO_RANGE(preset) });
  };

  const setCustomRange = (customPeriod) => {
    setPeriod({ ...customPeriod, preset: "custom" });
  };

  return { period, setPreset, setCustomRange };
};