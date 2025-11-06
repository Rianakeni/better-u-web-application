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

      console.log("�� Fetching schedules for userId:", userId);

      // DEBUG: Fetch semua schedules dengan booked_by=userId untuk debugging
      // Hapus populate dulu untuk debug - lihat apakah query dasar bekerja
      const debugUrl = `/schedules?filters[booked_by][id]=${userId}&sort=tanggal:ASC&pagination[pageSize]=-1`;
      try {
        const debugResponse = await strapiAxios.get(debugUrl);
        const debugData = debugResponse.data?.data || [];
        console.log("🔍 DEBUG - All schedules with booked_by=userId:", {
          count: debugData.length,
          schedules: debugData.map((s) => {
            const scheduleData = s.attributes || s;
            return {
              id: s.id || s.documentId,
              tanggal: scheduleData.tanggal,
              isBooked: scheduleData.isBooked,
              statusJadwal: scheduleData.statusJadwal,
              booked_by: scheduleData.booked_by || scheduleData.bookedBy,
              hasBookedBy: !!(scheduleData.booked_by || scheduleData.bookedBy),
            };
          }),
        });
      } catch (debugErr) {
        console.warn("⚠️ Debug query failed:", debugErr);
        console.warn(
          "Debug error details:",
          debugErr.response?.data || debugErr.message
        );
      }

      // Fetch schedules dengan filter booked_by=userId, isBooked=true, statusJadwal="Scheduled " (with trailing space!)
      // Hapus populate dulu - kita akan populate setelah fetch jika perlu
      const schedulesUrl = `/schedules?filters[booked_by][id]=${userId}&filters[isBooked]=true&filters[statusJadwal]=${encodeURIComponent(
        "Scheduled "
      )}&sort=tanggal:ASC&pagination[pageSize]=-1`;

      console.log("🔵 URL:", schedulesUrl);

      try {
        const response = await strapiAxios.get(schedulesUrl);
        const schedulesData = response.data;

        console.log("✅ Response received:", schedulesData);
        console.log("✅ Schedules count:", schedulesData?.data?.length || 0);
        console.log("✅ Pagination meta:", schedulesData?.meta);
        console.log("✅ All schedules:", schedulesData?.data);

        // Check if we need pagination to get more results
        if (schedulesData?.meta?.pagination) {
          const { page, pageSize, pageCount, total } =
            schedulesData.meta.pagination;
          console.log("📄 Pagination info:", {
            page,
            pageSize,
            pageCount,
            total,
          });

          // If there are more pages, fetch all pages
          if (pageCount > 1) {
            console.log(
              `⚠️ Found ${total} total schedules, but only ${pageSize} per page. Fetching all pages...`
            );

            const allSchedules = [...(schedulesData.data || [])];

            // Fetch remaining pages
            for (let p = 2; p <= pageCount; p++) {
              try {
                const pageUrl = `${schedulesUrl}&pagination[page]=${p}`;
                const pageResponse = await strapiAxios.get(pageUrl);
                const pageData = pageResponse.data?.data || [];
                allSchedules.push(...pageData);
                console.log(
                  `✅ Fetched page ${p}: ${pageData.length} schedules`
                );
              } catch (pageErr) {
                console.error(`❌ Error fetching page ${p}:`, pageErr);
              }
            }

            console.log(`✅ Total schedules fetched: ${allSchedules.length}`);
            setAppointments(allSchedules);
            return;
          }
        }

        // Data langsung dari schedules, tidak perlu parse appointment structure
        setAppointments(schedulesData?.data || []);
      } catch (err) {
        console.error("❌ Error fetching schedules:", err);
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
