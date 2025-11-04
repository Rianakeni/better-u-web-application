// src/hooks/useAppointments.js
import { useState, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

export const useAppointments = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gunakan useCallback untuk membuat function stabil
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API_URL}/api/schedules?populate=*`
      );
      const all = data.data || [];
      
      // Safe filtering dengan null checks
      const available = all.filter((a) => {
        // Handle jika item tidak punya attributes
        if (!a || !a.attributes) return false;
        
        const student = a.attributes.student;
        
        // Consider slot available if it has no student relation
        if (!student) return true;
        
        // Handle nested student structure
        if (student.data === null || student.data === undefined) return true;
        
        // Jika student ada data, berarti sudah dibooking
        return false;
      });
      
      setSlots(available);
    } catch (err) {
      console.error("fetchSlots error:", err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array - function tidak akan berubah

  return { slots, loading, fetchSlots };
};
