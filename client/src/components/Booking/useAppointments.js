// src/hooks/useAppointments.js
import { useState, useCallback } from "react";
import { getStrapiClient } from "../../lib/strapiClient";

export const useAppointments = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gunakan useCallback untuk membuat function stabil
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const client = getStrapiClient();
      const schedulesData = await client.collection('schedules').find({
        populate: '*',
        sort: ['tanggal:asc', 'jam_mulai:asc']
      });
      
      const all = schedulesData.data || [];
      
      // Filter available slots (no student relation)
      const available = all.filter((a) => {
        if (!a || !a.attributes) return false;
        
        const student = a.attributes.student;
        if (!student) return true;
        if (student.data === null || student.data === undefined) return true;
        
        return false;
      });
      
      setSlots(available);
    } catch (err) {
      console.error("fetchSlots error:", err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { slots, loading, fetchSlots };
};
