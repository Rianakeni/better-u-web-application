import { useState, useEffect } from "react";
import { fetchCurrentUser, strapiAxios } from "../../lib/strapiClient";

export const useMyHistory = (token) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (!token) {
        setHistory([]);
        setLoading(false);
        return;
      }

      const user = await fetchCurrentUser();
      const userId = user?.id || user?.data?.id || user?.documentId;

      if (!userId) {
        setHistory([]);
        setLoading(false);
        return;
      }

      console.log("🔵 Fetching history schedules for userId:", userId);

      // Fetch schedules dengan status "Completed" yang booked_by=userId
      // NOTE: Gunakan booked_by (underscore) karena itu nama field di schema Strapi
      // Hapus populate yang bermasalah untuk sekarang
      try {
        const historyUrl = `/schedules?filters[booked_by][id]=${userId}&filters[isBooked]=true&filters[statusJadwal]=Completed&sort=tanggal:DESC&pagination[pageSize]=-1`;

        console.log("🔵 History URL:", historyUrl);

        const { data: historyData } = await strapiAxios.get(historyUrl);

        console.log("✅ History schedules data:", historyData);
        console.log("✅ History count:", historyData?.data?.length || 0);

        // Check if we need pagination to get more results
        if (historyData?.meta?.pagination) {
          const { page, pageSize, pageCount, total } =
            historyData.meta.pagination;
          console.log("📄 Pagination info:", {
            page,
            pageSize,
            pageCount,
            total,
          });

          // If there are more pages, fetch all pages
          if (pageCount > 1) {
            console.log(
              `⚠️ Found ${total} total history schedules, but only ${pageSize} per page. Fetching all pages...`
            );

            const allHistory = [...(historyData.data || [])];

            // Fetch remaining pages
            for (let p = 2; p <= pageCount; p++) {
              try {
                const pageUrl = `${historyUrl}&pagination[page]=${p}`;
                const pageResponse = await strapiAxios.get(pageUrl);
                const pageData = pageResponse.data?.data || [];
                allHistory.push(...pageData);
                console.log(
                  `✅ Fetched history page ${p}: ${pageData.length} schedules`
                );
              } catch (pageErr) {
                console.error(`❌ Error fetching history page ${p}:`, pageErr);
              }
            }

            console.log(
              `✅ Total history schedules fetched: ${allHistory.length}`
            );
            setHistory(allHistory);
            setLoading(false);
            return;
          }
        }

        setHistory(historyData?.data || []);
      } catch (err) {
        console.error("❌ Error fetching history schedules:", {
          error: err.message || err,
          response: err.response?.data,
          status: err.response?.status,
          url: err.config?.url,
          userId,
        });
        setHistory([]);
      }
    } catch (err) {
      console.error("❌ Error in fetchHistory:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { history, loading, refresh: fetchHistory };
};
