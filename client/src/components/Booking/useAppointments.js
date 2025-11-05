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
      // Filter hanya yang isBooked: false (belum di-booking)
      const schedulesData = await client.collection("schedules").find({
        filters: {
          isBooked: {
            $eq: false,
          },
        },
        populate: "*",
        sort: ["tanggal:asc", "jam_mulai:asc"],
      });

      const available = schedulesData.data || [];
      setSlots(available);
    } catch (err) {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { slots, loading, fetchSlots };
};
