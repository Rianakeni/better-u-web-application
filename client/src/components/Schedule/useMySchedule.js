import { useState, useEffect } from "react";
import { fetchCurrentUser, strapiAxios } from "../../lib/strapiClient";

export const useMySchedule = (token) => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAppointments = async () => {
    setLoading(true);
    try {
      if (!token) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      const user = await fetchCurrentUser();
      const userId = user?.id || user?.data?.id || user?.documentId;

      if (!userId) {
        setAppointments([]);
        setLoading(false);
        return;
      }

      console.log("🔵 Fetching appointments for userId:", userId);
      
      // Gunakan populate=* seperti Dashboard (sudah terbukti bekerja)
      // Ini akan populate semua relasi termasuk schedule melalui linking table
      const appointmentsUrl = `/appointments?filters[student][id]=${userId}&filters[statusJadwal]=${encodeURIComponent('Scheduled ')}&populate=*&sort=id:ASC`;
      
      console.log("🔵 URL:", appointmentsUrl);
      
      try {
        const response = await strapiAxios.get(appointmentsUrl);
        const appointmentsData = response.data;
        
        console.log("✅ Response received:", appointmentsData);
        console.log("✅ Appointments count:", appointmentsData?.data?.length || 0);
        
        // Log detail untuk debug schedule populate - LOG SEMUA APPOINTMENTS
        if (appointmentsData?.data && appointmentsData.data.length > 0) {
          console.log("✅ Total appointments:", appointmentsData.data.length);
          
          // Log semua appointments untuk melihat mana yang schedule-nya null
          appointmentsData.data.forEach((appt, index) => {
            console.log(`✅ Appointment ${index + 1} (id: ${appt.id}):`, {
              id: appt.id,
              documentId: appt.documentId,
              statusJadwal: appt.statusJadwal,
              schedule: appt.schedule,
              scheduleIsNull: appt.schedule === null,
              scheduleIsUndefined: appt.schedule === undefined,
              hasSchedule: !!appt.schedule,
              konselor: appt.konselor ? "exists" : "null"
            });
            
            if (appt.schedule) {
              console.log(`  ✅ Schedule populated for appointment ${appt.id}:`, {
                scheduleId: appt.schedule.id || appt.schedule.documentId,
                tanggal: appt.schedule.tanggal,
                jam_mulai: appt.schedule.jam_mulai,
                jam_selesai: appt.schedule.jam_selesai
              });
            } else {
              console.error(`  ❌ Schedule NOT populated for appointment ${appt.id}`);
            }
          });
        } else {
          console.warn("⚠️ No appointments found");
        }
        
        setAppointments(appointmentsData?.data || []);
      } catch (err) {
        console.error("❌ Error fetching appointments:", err);
        console.error("Error details:", err.response?.data || err.message);
        setAppointments([]);
      }
    } catch (err) {
      console.error("❌ Error in fetchMyAppointments:", err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { appointments, loading, refresh: fetchMyAppointments };
};
