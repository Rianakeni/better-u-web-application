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
      
      // PASTIKAN: Untuk relasi Strapi v5, gunakan ID number, bukan documentId string
      // Jika scheduleId adalah documentId (string), perlu convert ke id (number)
      let finalScheduleIdForRelation = scheduleIdForRelation;
      
      // Cek apakah schedule object memiliki id (number) - ini yang diperlukan untuk relasi
      if (schedule && schedule.id && typeof schedule.id === 'number') {
        finalScheduleIdForRelation = schedule.id;
        console.log("✅ Using schedule.id (number) for relation:", finalScheduleIdForRelation);
      } else if (typeof scheduleIdForRelation === 'string') {
        // Jika scheduleId adalah documentId string, coba parse ke number jika memungkinkan
        // Atau cari schedule.id dari object schedule
        if (schedule && schedule.id) {
          finalScheduleIdForRelation = schedule.id;
          console.log("✅ Found schedule.id from schedule object:", finalScheduleIdForRelation);
        } else {
          // Fallback: coba parse string ke number (jika formatnya seperti "35")
          const parsedId = parseInt(scheduleIdForRelation);
          if (!isNaN(parsedId)) {
            finalScheduleIdForRelation = parsedId;
            console.log("✅ Parsed scheduleId to number:", finalScheduleIdForRelation);
          } else {
            console.error("❌ Cannot convert scheduleId to number:", scheduleIdForRelation);
            console.error("Schedule object:", schedule);
            toast.error("Schedule ID tidak valid untuk relasi");
            setBusy(false);
            return;
          }
        }
      }
      
      // VALIDASI: Pastikan finalScheduleIdForRelation adalah number
      if (typeof finalScheduleIdForRelation !== 'number' || isNaN(finalScheduleIdForRelation)) {
        console.error("❌ CRITICAL: finalScheduleIdForRelation is not a valid number!", {
          scheduleIdOriginal: scheduleId,
          scheduleIdForRelation: finalScheduleIdForRelation,
          scheduleIdType: typeof finalScheduleIdForRelation,
          schedule: schedule,
          scheduleHasId: !!schedule?.id,
          scheduleIdValue: schedule?.id
        });
        toast.error("Schedule ID tidak valid untuk relasi");
        setBusy(false);
        return;
      }
      
      // Log data yang akan dikirim untuk debug
      console.log("Creating appointment with data:", {
        studentId,
        studentIdType: typeof studentId,
        scheduleIdOriginal: scheduleId,
        scheduleIdForRelation: finalScheduleIdForRelation,
        scheduleIdType: typeof finalScheduleIdForRelation,
        schedule: schedule,
        scheduleHasId: !!schedule?.id,
        scheduleIdValue: schedule?.id,
        appointmentData: {
          student: studentId,
          schedule: finalScheduleIdForRelation,
          statusJadwal: "Scheduled "
        }
      });

      // Simpan phoneNumber di appointment untuk menghindari masalah CORS saat update schedule
      // NOTE: Jika field phoneNumber tidak ada di schema Strapi appointments, hapus field ini
      // atau tambahkan field phoneNumber di Strapi Content-Type Builder terlebih dahulu
      
      // Gunakan strapiAxios untuk create appointment (lebih reliable untuk relasi)
      // Format Strapi v5: { data: { ... } } untuk REST API
      // Untuk relasi one-to-one, coba format dengan connect
      const appointmentData = {
        data: {
          student: studentId,
          // Coba format dengan connect untuk relasi one-to-one
          schedule: {
            connect: [finalScheduleIdForRelation] // Array untuk connect
          },
          statusJadwal: "Scheduled ", // Dengan spasi di akhir sesuai format database
          // phoneNumber: phoneNumber, // DISABLED: Field tidak ada di schema Strapi
        }
      };
      
      console.log("🔵 Creating appointment with schedule connect format:", {
        student: studentId,
        schedule: { connect: [finalScheduleIdForRelation] },
        scheduleId: finalScheduleIdForRelation,
        fullAppointmentData: appointmentData
      });

      // Coba dengan strapiAxios dulu (lebih reliable untuk relasi)
      let createdAppointment = null;
      let appointmentId = null;
      let appointmentDocumentId = null; // Added for Strapi v5 documentId
      let createSuccess = false;
      
      try {
        const { strapiAxios } = await import("../../lib/strapiClient");
        const createResponse = await strapiAxios.post('/appointments', appointmentData, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        createdAppointment = createResponse.data;
        const createdApptData = createdAppointment.data || createdAppointment;
        appointmentId = createdApptData.id || createdApptData.documentId;
        appointmentDocumentId = createdApptData.documentId; // Assign documentId
        createSuccess = true;
        
        console.log("✅ Appointment created with strapiAxios (connect format):", createdAppointment);
      } catch (axiosErr) {
        console.warn("⚠️ strapiAxios create failed with connect format, trying direct ID:", axiosErr.response?.data || axiosErr.message);
        
        // Fallback 1: Coba format langsung ID (number)
        try {
          const directIdData = {
            data: {
              student: studentId,
              schedule: finalScheduleIdForRelation, // Langsung ID number
              statusJadwal: "Scheduled ",
            }
          };
          
          const { strapiAxios } = await import("../../lib/strapiClient");
          const createResponse = await strapiAxios.post('/appointments', directIdData, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          createdAppointment = createResponse.data;
          const createdApptData = createdAppointment.data || createdAppointment;
          appointmentId = createdApptData.id || createdApptData.documentId;
          appointmentDocumentId = createdApptData.documentId; // Assign documentId
          createSuccess = true;
          
          console.log("✅ Appointment created with strapiAxios (direct ID format):", createdAppointment);
        } catch (directIdErr) {
          console.warn("⚠️ Direct ID format also failed, trying @strapi/client:", directIdErr.response?.data || directIdErr.message);
          
          // Fallback 2: Coba @strapi/client
          try {
            const client = getStrapiClient();
            // @strapi/client tidak butuh wrapper { data }
            const clientAppointmentData = {
              student: studentId,
              schedule: finalScheduleIdForRelation, // Langsung ID
              statusJadwal: "Scheduled ",
            };
            
            const clientCreated = await client.collection('appointments').create(clientAppointmentData);
            createdAppointment = clientCreated;
            const createdApptData = clientCreated.data || clientCreated;
            appointmentId = createdApptData.id || createdApptData.documentId;
            appointmentDocumentId = createdApptData.documentId; // Assign documentId
            createSuccess = true;
            
            console.log("✅ Appointment created with @strapi/client:", createdAppointment);
          } catch (clientErr) {
            console.error("❌ All create methods failed!");
            console.error("Errors:", {
              connectFormat: axiosErr.response?.data || axiosErr.message,
              directIdFormat: directIdErr.response?.data || directIdErr.message,
              clientFormat: clientErr.error || clientErr.message,
              scheduleId: finalScheduleIdForRelation,
              scheduleIdType: typeof finalScheduleIdForRelation,
              studentId: studentId
            });
            
            const errorMsg = axiosErr.response?.data?.error?.message || 
                            directIdErr.response?.data?.error?.message ||
                            clientErr.error?.message || 
                            axiosErr.message ||
                            directIdErr.message ||
                            clientErr.message ||
                            "Gagal membuat appointment";
            throw new Error(errorMsg);
          }
        }
      }
      
      if (!createSuccess || !appointmentId) {
        console.error("❌ CRITICAL: Appointment creation failed or no ID returned!");
        throw new Error("Appointment ID tidak ditemukan setelah create");
      }
      
      console.log("✅ Appointment created successfully, ID:", appointmentId, "DocumentID:", appointmentDocumentId);
      
      // UPDATE RELASI: Karena relasi tidak ter-set otomatis, update appointment dengan schedule
      // Ini diperlukan karena di Strapi Admin pun relasi harus dibuat manual
      console.log("🔵 Updating appointment to set schedule relation...");
      console.log("🔵 Appointment IDs:", {
        id: appointmentId,
        documentId: appointmentDocumentId,
        scheduleId: finalScheduleIdForRelation,
        scheduleIdType: typeof finalScheduleIdForRelation
      });
      
      // Gunakan documentId jika tersedia (lebih reliable untuk Strapi v5), fallback ke id
      const updateAppointmentId = appointmentDocumentId || appointmentId;
      
      if (!updateAppointmentId) {
        console.error("❌ CRITICAL: No appointment ID available for update!");
        throw new Error("Appointment ID tidak ditemukan untuk update");
      }
      
      let scheduleRelationSet = false;
      
      // Coba beberapa format update untuk relasi
      const updateAttempts = [
        // Format 1: Langsung ID number
        {
          name: "Direct ID number",
          data: {
            data: {
              schedule: finalScheduleIdForRelation
            }
          }
        },
        // Format 2: ID sebagai object dengan id
        {
          name: "ID as object",
          data: {
            data: {
              schedule: {
                id: finalScheduleIdForRelation
              }
            }
          }
        },
        // Format 3: Tanpa wrapper data
        {
          name: "Without data wrapper",
          data: {
            schedule: finalScheduleIdForRelation
          }
        }
      ];
      
      for (const attempt of updateAttempts) {
        try {
          console.log(`🔵 Attempting update with format: ${attempt.name}`, {
            appointmentId: updateAppointmentId,
            updateData: attempt.data
          });
          
          const { strapiAxios } = await import("../../lib/strapiClient");
          const updateResponse = await strapiAxios.put(`/appointments/${updateAppointmentId}`, attempt.data, {
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          console.log(`✅ Update successful with format: ${attempt.name}`, updateResponse.data);
          
          // Verifikasi setelah update
          const verifyUrl = `/appointments/${updateAppointmentId}?populate=*`;
          const verifyResponse = await strapiAxios.get(verifyUrl);
          const verifiedAppt = verifyResponse.data.data || verifyResponse.data;
          
          console.log("✅ Verification after update:", {
            appointmentId: verifiedAppt.id || verifiedAppt.documentId,
            schedule: verifiedAppt.schedule,
            scheduleId: verifiedAppt.schedule?.id || verifiedAppt.schedule?.documentId,
            scheduleIsNull: verifiedAppt.schedule === null
          });
          
          if (verifiedAppt.schedule) {
            scheduleRelationSet = true;
            console.log(`✅✅✅ Schedule relation successfully set with format: ${attempt.name}! ✅✅✅`);
            break; // Berhasil, stop loop
          }
        } catch (updateErr) {
          console.warn(`⚠️ Update failed with format: ${attempt.name}`, {
            error: updateErr.response?.data || updateErr.message,
            status: updateErr.response?.status
          });
          // Continue ke format berikutnya
        }
      }
      
      // Jika semua format strapiAxios gagal, coba dengan @strapi/client
      if (!scheduleRelationSet) {
        console.log("⚠️ All strapiAxios formats failed, trying @strapi/client...");
        try {
          const client = getStrapiClient();
          
          // Coba beberapa format dengan @strapi/client juga
          const clientAttempts = [
            {
              name: "Direct ID",
              data: {
                schedule: finalScheduleIdForRelation
              }
            },
            {
              name: "ID as object",
              data: {
                schedule: {
                  id: finalScheduleIdForRelation
                }
              }
            }
          ];
          
          for (const attempt of clientAttempts) {
            try {
              console.log(`🔵 Attempting @strapi/client update with format: ${attempt.name}`);
              await client.collection('appointments').update(updateAppointmentId, attempt.data);
              console.log(`✅ @strapi/client update successful with format: ${attempt.name}`);
              
              // Verifikasi
              const { strapiAxios } = await import("../../lib/strapiClient");
              const verifyUrl = `/appointments/${updateAppointmentId}?populate=*`;
              const verifyResponse = await strapiAxios.get(verifyUrl);
              const verifiedAppt = verifyResponse.data.data || verifyResponse.data;
              
              if (verifiedAppt.schedule) {
                scheduleRelationSet = true;
                console.log(`✅✅✅ Schedule relation set via @strapi/client with format: ${attempt.name}!`);
                break;
              }
            } catch (clientErr) {
              console.warn(`⚠️ @strapi/client update failed with format: ${attempt.name}`, clientErr);
            }
          }
        } catch (fallbackErr) {
          console.error("❌ All update methods failed:", fallbackErr);
        }
      }
      
      if (!scheduleRelationSet) {
        console.error("❌ CRITICAL: Schedule relation NOT set after all update attempts!");
        console.error("Details:", {
          appointmentId: appointmentId,
          documentId: appointmentDocumentId,
          updateAppointmentId: updateAppointmentId,
          scheduleId: finalScheduleIdForRelation,
          scheduleIdType: typeof finalScheduleIdForRelation
        });
        console.error("Check Strapi:");
        console.error("1. appointments_schedule_lnk table should have row with appointment_id:", appointmentId);
        console.error("2. Strapi permissions for appointments.update");
        console.error("3. Content-Type Builder - check if schedule relation field is properly configured");
        toast.error("Booking berhasil, tapi relasi schedule gagal. Silakan hubungi admin atau coba booking lagi.");
      }

      // Update schedule isBooked to true setelah booking berhasil
      // Note: phoneNumber sudah disimpan di appointment, jadi tidak perlu update schedule untuk phoneNumber
      // Update schedule hanya untuk set isBooked = true
      if (scheduleId) {
        try {
          // Strapi v5: Prioritas documentId (string) untuk update, fallback ke id (number)
          const updateScheduleId = schedule.documentId || schedule.id || scheduleId;
          
          // @strapi/client mengharapkan payload TANPA wrapper { data }
          const updatePayload = {
            isBooked: true
          };

          // Langsung pakai @strapi/client untuk menghindari error dan kompleksitas
          const client = getStrapiClient();
          await client.collection('schedules').update(updateScheduleId, updatePayload);
          console.log("Schedule isBooked updated successfully");
        } catch (updateErr) {
          // Log error tapi continue - appointment sudah dibuat dengan phoneNumber
          console.warn("Failed to update schedule isBooked:", {
            error: updateErr.error || updateErr.message || updateErr,
            scheduleId: scheduleId,
            documentId: schedule.documentId,
          });
          
          // Show warning tapi tidak throw error - appointment sudah berhasil dibuat
          const errorMsg = updateErr.error?.message || 
                          updateErr.message || 
                          "Update jadwal gagal";
          toast.warning(`Booking berhasil! Namun update jadwal gagal: ${errorMsg}`);
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