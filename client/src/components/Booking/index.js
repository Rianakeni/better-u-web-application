// src/pages/Booking/index.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "./useAppointments";
import { toast } from "react-toastify";
import { userData } from "../../helpers";
import {
  getStrapiClient,
  getCurrentUserId,
  strapiAxios,
} from "../../lib/strapiClient";

const SlotCard = ({ schedule, onBook }) => {
  // Strapi v5: data langsung di root, tidak ada attributes wrapper
  // Support both v4 (with attributes) and v5 (without attributes)
  // const attrs = schedule?.attributes || schedule || {};

  // if (!schedule || (!attrs.tanggal && !attrs.jam_mulai)) {
  //   return <div className="slot-card">Loading...</div>;
  // }

  const attrs = schedule.attributes;
  const tanggal = attrs.tanggal;
  const jam_mulai = attrs.jam_mulai;
  const jam_selesai = attrs.jam_selesai;

  // Konselor: support both v4 and v5 format
  const konselor =
    attrs.konselor?.data?.attributes?.nama ||
    attrs.konselor?.data?.nama ||
    attrs.konselor?.nama ||
    attrs.konselor ||
    "dr. konselor";

  return (
    <div className="slot-card">
      <div className="slot-left">
        <div className="slot-date">
          {tanggal
            ? new Date(tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "Tanggal"}
        </div>
        <div className="slot-time">
          {jam_mulai} - {jam_selesai}
        </div>
        <div className="slot-doctor">{konselor}</div>
      </div>
      <div className="slot-right">
        <button className="btn-book" onClick={() => onBookClick(schedule)}>
          Booking
        </button>
      </div>
    </div>
  );
};

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
      const studentId = typeof userId === "number" ? userId : parseInt(userId);

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
        phoneNumber,
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
        const client = getStrapiClient();
        result = await client
          .collection("appointments")
          .create(appointmentData);
      } catch (clientErr) {
        // Fallback to axios if client fails
        const { data } = await strapiAxios.post(
          "/appointments",
          appointmentData
        );
        result = data;
      }

      // Update schedule isBooked to true setelah booking berhasil
      // Note: phoneNumber sudah disimpan di appointment, jadi tidak perlu update schedule untuk phoneNumber
      // Update schedule hanya untuk set isBooked = true
      if (scheduleId) {
        try {
          // Strapi v5: Gunakan documentId untuk update (jika ada), fallback ke id
          const updateScheduleId =
            schedule.documentId || schedule.id || scheduleId;

          // Try different formats for Strapi v5
          // Format 1: With data wrapper (Strapi v4/v5 style)
          const updateDataWithWrapper = {
            data: {
              isBooked: true,
            },
          };

          // Format 2: Direct object (Strapi v5 style - mungkin tidak pakai wrapper)
          const updateDataDirect = {
            isBooked: true,
          };

          // Try axios directly first (more reliable for PUT requests)
          try {
            let response;
            // Try with data wrapper first
            try {
              response = await strapiAxios.put(
                `/schedules/${updateScheduleId}`,
                updateDataWithWrapper,
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );
            } catch (wrapperErr) {
              // If wrapper fails, try direct format
              response = await strapiAxios.put(
                `/schedules/${updateScheduleId}`,
                updateDataDirect,
                {
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );
            }
          } catch (axiosErr) {
            // If 404 with id, try with documentId
            if (
              axiosErr.response?.status === 404 &&
              schedule.documentId &&
              updateScheduleId === schedule.id
            ) {
              try {
                await strapiAxios.put(
                  `/schedules/${schedule.documentId}`,
                  updateDataWithWrapper,
                  {
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                );
              } catch (docIdErr) {
                throw docIdErr;
              }
            } else {
              // Fallback to @strapi/client if axios fails
              try {
                const client = getStrapiClient();
                // Try with wrapper format first
                await client
                  .collection("schedules")
                  .update(updateScheduleId, updateDataWithWrapper);
              } catch (clientErr) {
                // Try with direct format
                try {
                  const client = getStrapiClient();
                  await client
                    .collection("schedules")
                    .update(updateScheduleId, updateDataDirect);
                } catch (directClientErr) {
                  // Try with documentId if id failed
                  if (schedule.documentId && updateScheduleId === schedule.id) {
                    try {
                      const client = getStrapiClient();
                      await client
                        .collection("schedules")
                        .update(schedule.documentId, updateDataWithWrapper);
                    } catch (docIdErr) {
                      throw docIdErr;
                    }
                  } else {
                    throw directClientErr;
                  }
                }
              }
            }
          }

          if (!scheduleUpdated) {
            console.warn(
              "Schedule isBooked update gagal, tapi appointment sudah dibuat dengan phoneNumber"
            );
          }
        } catch (updateErr) {
          // Log error but continue - appointment sudah dibuat dengan phoneNumber
          const errorDetails =
            updateErr.response?.data || updateErr.error || {};
          console.error("Error updating schedule isBooked:", {
            error: updateErr.message || updateErr,
            errorDetails: errorDetails,
            scheduleId: scheduleId,
            documentId: schedule.documentId,
          });

          // Show more detailed error message
          const errorMsg =
            errorDetails.error?.message ||
            errorDetails.message ||
            updateErr.message ||
            "Update schedule gagal";
          toast.warning(
            `Booking berhasil dengan nomor telepon! Namun update jadwal gagal: ${errorMsg}`
          );
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
      if (err.name === "AbortError" || err.message?.includes("aborted")) {
        toast.error("Booking dibatalkan");
      } else {
        // Extract detailed error message
        const errorData = err.response?.data || err.error || {};
        const errorMsg =
          errorData.error?.message ||
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
              <SlotCard
                key={s.id || s.documentId}
                schedule={s}
                onBook={handleBook}
              />
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
