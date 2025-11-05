// src/pages/Booking/index.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "./useAppointments";
import { toast } from "react-toastify";
import { userData } from "../../helpers";
import { getStrapiClient, getCurrentUserId, strapiAxios } from "../../lib/strapiClient";
import BookingForm from "./BookingForm";
import SlotCard from "./SlotCard";

const Booking = () => {
  const { slots, loading: loadingSchedules, fetchSlots } = useAppointments();
  const [busy, setBusy] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const navigate = useNavigate();

  const { jwt } = userData();

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ Empty array - hanya jalankan sekali saat mount

  const handleBookClick = (schedule) => {
    if (!jwt) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    setSelectedSchedule(schedule);
    setShowBookingForm(true);
  };

  const handleCloseForm = () => {
    setShowBookingForm(false);
    setSelectedSchedule(null);
  };

  const handleBook = async (phoneNumber) => {
    const schedule = selectedSchedule;
    if (!schedule || !phoneNumber) {
      toast.error("Data tidak lengkap");
      return;
    }

    // Support both Strapi v4 (id) and v5 (documentId)
    const scheduleId = schedule.id || schedule.documentId;
    if (!scheduleId) {
      toast.error("Jadwal tidak valid");
      return;
    }

    setBusy(true);
    setShowBookingForm(false);
    
    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        toast.error("User ID tidak ditemukan");
        setBusy(false);
        return;
      }

      // Create appointment menggunakan axios langsung untuk kontrol format yang lebih baik
      // Strapi v5: Format data untuk relasi - gunakan ID saja (number atau string documentId)
      // Pastikan userId adalah number (untuk relation)
      // Schedule bisa number (id) atau string (documentId) tergantung Strapi version
      const studentId = typeof userId === 'number' ? userId : parseInt(userId);
      
      if (!studentId || isNaN(studentId)) {
        toast.error("User ID tidak valid");
        setBusy(false);
        return;
      }

      // Untuk schedule, gunakan ID yang ada (bisa number atau documentId string untuk Strapi v5)
      // Strapi v5 dengan documentId bisa menggunakan documentId langsung untuk relasi
      const scheduleIdForRelation = scheduleId;

      // Log data yang akan dikirim untuk debug
      console.log("Creating appointment with data:", {
        studentId,
        scheduleId: scheduleIdForRelation,
        schedule: schedule,
        phoneNumber
      });

      // Simpan phoneNumber di appointment untuk menghindari masalah CORS saat update schedule
      const appointmentData = {
        data: {
          student: studentId,
          schedule: scheduleIdForRelation,
          statusJadwal: "Scheduled ", // Dengan spasi di akhir sesuai format database
          phoneNumber: phoneNumber, // Simpan phoneNumber di appointment
        },
      };

      // Try using axios first (lebih reliable berdasarkan Network tab)
      try {
        const { data } = await strapiAxios.post('/appointments', appointmentData);
        console.log("Appointment created successfully:", data);
      } catch (axiosErr) {
        // Jika axios gagal, coba dengan @strapi/client
        try {
          const client = getStrapiClient();
          await client.collection('appointments').create(appointmentData);
        } catch (clientErr) {
          // Log error untuk debug
          console.error("Appointment creation error:", {
            axiosErr: axiosErr.response?.data || axiosErr.message,
            clientErr: clientErr.message || clientErr
          });
          
          const errorData = axiosErr.response?.data || clientErr.error || {};
          const errorMsg = errorData.error?.message || 
                          errorData.message || 
                          axiosErr.message || 
                          clientErr.message ||
                          "Gagal membuat appointment";
          
          throw new Error(errorMsg);
        }
      }

      // Update schedule isBooked to true setelah booking berhasil
      // Note: phoneNumber sudah disimpan di appointment, jadi tidak perlu update schedule untuk phoneNumber
      // Update schedule hanya untuk set isBooked = true
      if (scheduleId) {
        try {
          // Strapi v5: Prioritas documentId (string) untuk update, fallback ke id (number)
          const updateScheduleId = schedule.documentId || schedule.id || scheduleId;
          
          // Payload untuk update schedule - hanya isBooked, phoneNumber sudah di appointment
          const clientUpdatePayload = {
            data: {
              isBooked: true
            }
          };

          const axiosUpdatePayload = {
            isBooked: true
          };

          console.log("Updating schedule isBooked:", {
            updateScheduleId,
            documentId: schedule.documentId,
            id: schedule.id,
            payload: axiosUpdatePayload
          });

          // Strapi v5: Coba axios PUT terlebih dahulu (tanpa wrapper data)
          let scheduleUpdated = false;
          try {
            // Coba dengan axios - Strapi v5 REST API menggunakan format tanpa wrapper data
            const response = await strapiAxios.put(`/schedules/${updateScheduleId}`, axiosUpdatePayload, {
              headers: {
                'Content-Type': 'application/json',
              },
            });
            console.log("Schedule isBooked updated via axios successfully", response.data);
            scheduleUpdated = true;
          } catch (axiosErr) {
            // Jika axios gagal karena CORS, coba dengan @strapi/client (dengan wrapper data)
            console.warn("Axios update failed, trying @strapi/client:", axiosErr.message || axiosErr);
            
            try {
              const client = getStrapiClient();
              // Strapi v5 client menggunakan documentId untuk update dengan wrapper data
              await client.collection('schedules').update(updateScheduleId, clientUpdatePayload);
              console.log("Schedule isBooked updated via @strapi/client successfully");
              scheduleUpdated = true;
            } catch (clientErr) {
              // Log error detail untuk debug - termasuk response detail dari server
              const axiosErrorDetails = axiosErr.response?.data || axiosErr.error || {};
              const clientErrorDetails = clientErr.response?.data || clientErr.error || clientErr.data || {};
              
              console.error("Failed to update schedule isBooked:", {
                axiosError: {
                  message: axiosErr.message,
                  status: axiosErr.response?.status,
                  statusText: axiosErr.response?.statusText,
                  data: axiosErr.response?.data,
                  code: axiosErr.code,
                },
                clientError: {
                  message: clientErr.message,
                  status: clientErr.response?.status,
                  data: clientErr.response?.data || clientErr.data,
                  error: clientErr.error,
                },
                errorDetails: axiosErrorDetails.error || clientErrorDetails.error || {},
                updateScheduleId,
                documentId: schedule.documentId,
                id: schedule.id,
              });
              
              // CORS error atau network error
              if (axiosErr.message?.includes('CORS') || 
                  axiosErr.code === 'ERR_NETWORK' || 
                  axiosErr.message?.includes('Network Error') ||
                  axiosErr.message?.includes('blocked by CORS')) {
                // Jika CORS error, skip update schedule - appointment sudah dibuat dengan phoneNumber
                console.warn("CORS error saat update schedule, tapi appointment sudah dibuat dengan phoneNumber. Schedule akan tetap bisa di-booking ulang.");
                toast.warning("Booking berhasil! Nomor telepon tersimpan. Namun update jadwal gagal karena CORS - silakan hubungi admin untuk memperbaiki CORS di Strapi Cloud.");
              } else {
                // Error lain (400, 404, dll)
                const errorMsg = axiosErrorDetails.error?.message || 
                                clientErrorDetails.error?.message ||
                                axiosErrorDetails.message || 
                                clientErrorDetails.message ||
                                axiosErr.message || 
                                clientErr.message ||
                                "Update schedule gagal";
                toast.warning(`Booking berhasil dengan nomor telepon! Namun update jadwal gagal: ${errorMsg}`);
              }
            }
          }
          
          if (!scheduleUpdated) {
            console.warn("Schedule isBooked update gagal, tapi appointment sudah dibuat dengan phoneNumber");
          }
        } catch (updateErr) {
          // Log error but continue - appointment sudah dibuat dengan phoneNumber
          const errorDetails = updateErr.response?.data || updateErr.error || {};
          console.error("Error updating schedule isBooked:", {
            error: updateErr.message || updateErr,
            errorDetails: errorDetails,
            scheduleId: scheduleId,
            documentId: schedule.documentId,
          });
          
          // Show more detailed error message
          const errorMsg = errorDetails.error?.message || 
                          errorDetails.message || 
                          updateErr.message || 
                          "Update schedule gagal";
          toast.warning(`Booking berhasil dengan nomor telepon! Namun update jadwal gagal: ${errorMsg}`);
        }
      }

      toast.success("Booking berhasil!");
      
      // Refresh slots after booking untuk update list
      await fetchSlots();
      
      // Navigate to "Jadwal Saya" setelah booking berhasil agar user bisa langsung lihat jadwalnya
      setTimeout(() => {
        navigate("/jadwal");
      }, 1000); // Delay 1 detik untuk memberikan waktu toast message terlihat
    } catch (err) {
      // Handle AbortError specifically
      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        toast.error("Booking dibatalkan");
      } else {
        // Extract detailed error message
        const errorData = err.response?.data || err.error || {};
        const errorMsg = errorData.error?.message || 
                        errorData.message || 
                        err.message || 
                        "Booking gagal";
        
        toast.error(`Booking gagal: ${errorMsg}`);
      }
    } finally {
      setBusy(false);
      setSelectedSchedule(null);
    }
  };

  return (
    <div className="booking-page">
      <h1>Buat Janji Temu Baru</h1>
      <p>Pilih dari slot waktu yang tersedia di bawah ini</p>

      <div className="booking-card">
        {loadingSchedules ? (
          <p>Loading...</p>
        ) : slots && slots.length ? (
          <div className="booking-grid">
            {slots.map((s) => (
              <SlotCard key={s.id || s.documentId} schedule={s} onBookClick={handleBookClick} />
            ))}
          </div>
        ) : (
          <p>Tidak ada slot tersedia</p>
        )}
      </div>
      {busy && <div className="booking-busy">Processing...</div>}
      
      <BookingForm
        schedule={selectedSchedule}
        isOpen={showBookingForm}
        onClose={handleCloseForm}
        onConfirm={handleBook}
      />
    </div>
  );
};

export default Booking;