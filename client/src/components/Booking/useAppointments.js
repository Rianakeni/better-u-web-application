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

      // Fetch schedules dengan filter:
      // - isBooked: false (belum dibooking)
      // ATAU statusJadwal: "Cancelled" (sudah dibatalkan, bisa di-booking lagi)
      // Ini akan include schedule yang available dan yang cancelled
      const schedulesData = await client.collection("schedules").find({
        filters: {
          $or: [
            { isBooked: { $eq: false } },
            { statusJadwal: { $eq: "Cancelled" } },
          ],
        },
        populate: "*",
        sort: ["tanggal:asc", "jam_mulai:asc"],
      });

      setSlots(schedulesData.data || []);
    } catch (err) {
      console.error("Error fetching available slots:", err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { slots, loading, fetchSlots };
};
