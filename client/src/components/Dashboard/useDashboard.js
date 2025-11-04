import { useState, useEffect } from "react";
import { fetchCurrentUser, fetchWithQuery, strapiAxios } from "../../lib/strapiClient";

export const useDashboard = (token) => {
  const [profile, setProfile] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [history, setHistory] = useState([]);
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    try {
      const data = await fetchCurrentUser();
      setProfile(data);
    } catch (err) {
      console.error("fetchProfile error:", err);
      setProfile(null);
    }
  };

  const fetchAppointments = async () => {
    try {
      if (!token) {
        setUpcoming([]);
        setHistory([]);
        return;
      }

      const user = await fetchCurrentUser();
      const userId = user?.id || user?.data?.id || user?.documentId;

      console.log('👤 User data:', {
        user,
        userId,
        userKeys: user ? Object.keys(user) : null
      });

      if (!userId) {
        console.warn('⚠️ No userId found');
        setUpcoming([]);
        setHistory([]);
        return;
      }

      // First, fetch ALL appointments untuk user ini tanpa filter status untuk debugging
      try {
        const allAppointmentsData = await fetchWithQuery('/appointments', {
          'filters[student][id]': userId,
          populate: ['schedule', 'konselor', 'medical_record'],
          sort: 'id:DESC'
        });

        console.log('📋 ALL appointments for user:', {
          totalCount: allAppointmentsData.data?.length,
          appointments: allAppointmentsData.data,
          statuses: allAppointmentsData.data?.map(apt => {
            // Support both Strapi v4 and v5 format
            const aptData = apt.attributes || apt;
            const status = aptData.statusJadwal;
            
            // Log langsung ke console untuk setiap appointment
            console.log('📌 Appointment:', {
              id: apt.id || apt.documentId,
              statusJadwal: status,
              statusType: typeof status,
              statusValue: status,
              fullData: aptData
            });
            
            return {
              id: apt.id || apt.documentId,
              statusJadwal: status,
              statusJadwalType: typeof status,
              statusJadwalRaw: JSON.stringify(status),
              student: aptData.student,
              studentId: aptData.student?.id || aptData.student?.documentId || aptData.student,
              allKeys: Object.keys(aptData)
            };
          })
        });
      } catch (err) {
        console.error("fetchAllAppointments error:", err);
      }

      // Upcoming appointments - schedule yang sudah di-booking (status = "Scheduled")
      // Note: Database menyimpan 'Scheduled ' dengan spasi di akhir, jadi kita gunakan nilai yang benar
      try {
        const upcomingData = await fetchWithQuery('/appointments', {
          'filters[student][id]': userId,
          'filters[statusJadwal]': 'Scheduled ', // Dengan spasi di akhir sesuai database
          populate: ['schedule', 'konselor', 'medical_record'],
          sort: 'id:ASC'
        });

        console.log('📊 Upcoming data:', {
          rawResponse: upcomingData,
          dataArray: upcomingData.data,
          dataLength: upcomingData.data?.length,
          firstItem: upcomingData.data?.[0],
          firstItemStructure: upcomingData.data?.[0] ? {
            hasAttributes: !!upcomingData.data[0].attributes,
            hasDocumentId: !!upcomingData.data[0].documentId,
            hasId: !!upcomingData.data[0].id,
            keys: Object.keys(upcomingData.data[0]),
            statusJadwal: upcomingData.data[0].statusJadwal || upcomingData.data[0].attributes?.statusJadwal
          } : null,
          // Log setiap item untuk debugging
          allItems: upcomingData.data?.map((item, index) => {
            const itemData = item.attributes || item;
            console.log(`📌 Upcoming Item ${index}:`, {
              id: item.id || item.documentId,
              statusJadwal: itemData.statusJadwal,
              fullItem: item
            });
            return {
              id: item.id || item.documentId,
              statusJadwal: itemData.statusJadwal,
              fullItem: item
            };
          })
        });

        setUpcoming(upcomingData.data || []);
      } catch (err) {
        console.error("fetchUpcoming error:", err);
        setUpcoming([]);
      }

      // History appointments - status = "Completed"
      try {
        const historyData = await fetchWithQuery('/appointments', {
          'filters[student][id]': userId,
          'filters[statusJadwal]': 'Completed',
          populate: ['schedule', 'konselor', 'medical_record'],
          sort: 'id:DESC'
        });

        console.log('📊 History data:', {
          rawResponse: historyData,
          dataArray: historyData.data,
          dataLength: historyData.data?.length,
          firstItem: historyData.data?.[0],
          firstItemStructure: historyData.data?.[0] ? {
            hasAttributes: !!historyData.data[0].attributes,
            hasDocumentId: !!historyData.data[0].documentId,
            hasId: !!historyData.data[0].id,
            keys: Object.keys(historyData.data[0]),
            statusJadwal: historyData.data[0].statusJadwal || historyData.data[0].attributes?.statusJadwal
          } : null,
          // Log setiap item untuk debugging
          allItems: historyData.data?.map((item, index) => {
            const itemData = item.attributes || item;
            console.log(`📌 History Item ${index}:`, {
              id: item.id || item.documentId,
              statusJadwal: itemData.statusJadwal,
              fullItem: item
            });
            return {
              id: item.id || item.documentId,
              statusJadwal: itemData.statusJadwal,
              fullItem: item
            };
          })
        });

        setHistory(historyData.data || []);
      } catch (err) {
        console.error("fetchHistory error:", err);
        setHistory([]);
      }
    } catch (err) {
      console.error("fetchAppointments error:", err);
      setUpcoming([]);
      setHistory([]);
    }
  };

  const fetchArticles = async () => {
    try {
      // Gunakan axios langsung untuk articles dengan publicationState
      const { data } = await strapiAxios.get('/articles?publicationState=live');
      setArticles(data.data || []);
    } catch (err) {
      console.error("fetchArticles error:", err);
      setArticles([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchProfile(), 
        fetchAppointments(), 
        fetchArticles()
      ]);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return { profile, upcoming, history, articles, loading, error };
};
