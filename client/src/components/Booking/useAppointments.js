// src/hooks/useAppointments.js
import { useState, useCallback } from "react";
import { getStrapiClient, fetchWithQuery } from "../../lib/strapiClient";

export const useAppointments = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gunakan useCallback untuk membuat function stabil
  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const client = getStrapiClient();
      
      // Ambil semua schedules dan appointments yang sudah scheduled secara parallel
      const [schedulesData, scheduledAppointmentsData] = await Promise.all([
        // Ambil semua schedules
        client.collection('schedules').find({
          populate: '*',
          sort: ['tanggal:asc', 'jam_mulai:asc']
        }),
        // Ambil appointments dengan status "Scheduled " (yang sudah di-booking menjadi appointment terscheduled)
        fetchWithQuery('/appointments', {
          'filters[statusJadwal]': 'Scheduled ',
          populate: 'schedule'
        }).catch(() => ({ data: [] }))
      ]);
      
      // Extract schedule IDs dari appointments yang sudah scheduled
      const scheduledAppointments = scheduledAppointmentsData.data || [];
      const scheduledScheduleIds = new Set(
        scheduledAppointments
          .map((appt) => {
            // Support both Strapi v4 and v5 format
            const schedule = appt.schedule?.data || appt.schedule;
            const scheduleId = schedule?.id || schedule?.documentId;
            return scheduleId;
          })
          .filter(Boolean) // Remove undefined/null
      );
      
      // Filter schedules yang tidak ada di scheduled appointments
      // (schedule yang belum di-booking menjadi appointment yang terscheduled)
      const allSchedules = schedulesData.data || [];
      const available = allSchedules.filter((schedule) => {
        const scheduleId = schedule.id || schedule.documentId;
        // Hanya return schedule yang ID-nya tidak ada di scheduled appointments
        return !scheduledScheduleIds.has(scheduleId);
      });
      
      setSlots(available);
    } catch (err) {
      console.error("Error fetching available slots:", err);
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { slots, loading, fetchSlots };
};
