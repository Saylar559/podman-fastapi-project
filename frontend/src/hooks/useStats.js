import { useState, useEffect } from "react";
import { getStats } from "../api/admin";

export function useStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    getStats().then(setStats);
  }, []);

  return stats;
}

