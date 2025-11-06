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
import BookingForm from "./BookingForm";
import SlotCard from "./SlotCard";
import ReactLoading from "react-loading";

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

      // Ensure userId is a number for relation
      const userIdNumber =
        typeof userId === "number" ? userId : parseInt(userId);
      if (!userIdNumber || isNaN(userIdNumber)) {
        toast.error("User ID tidak valid");
        setBusy(false);
        return;
      }

      // Get user info for logging
      const { fetchCurrentUser } = await import("../../lib/strapiClient");
      const user = await fetchCurrentUser().catch(() => null);

      // Update schedule directly: isBooked=true, statusJadwal="Scheduled " (with trailing space!), bookedBy=userId, phoneNumber
      const updateScheduleId = schedule.documentId || schedule.id || scheduleId;

      console.log("🔵 Booking schedule:", {
        scheduleId: updateScheduleId,
        userId: userIdNumber,
        phoneNumber: phoneNumber,
        bookingUser: user?.username || user?.email || "Unknown",
      });

      // Update schedule directly: isBooked=true, statusJadwal="Scheduled " (with trailing space!), bookedBy=userId, phoneNumber
      // Try multiple update strategies
      let scheduleUpdated = false;
      let lastError = null;

      // Strategy 1: Try updating all fields at once with different relation formats
      const updateAttempts = [
        // Format 1: All fields together with direct ID for relation (manyToOne)
        {
          name: "Direct ID format",
          data: {
            isBooked: true,
            statusJadwal: "Scheduled ", // Note: trailing space required!
            booked_by: userIdNumber, // Gunakan booked_by (underscore) sesuai schema
            phoneNumber: phoneNumber,
          },
        },
        // Format 2: All fields with object format for relation (manyToOne)
        {
          name: "Object ID format",
          data: {
            isBooked: true,
            statusJadwal: "Scheduled ", // Note: trailing space required!
            booked_by: { id: userIdNumber }, // Gunakan booked_by (underscore) sesuai schema
            phoneNumber: phoneNumber,
          },
        },
        // Format 3: All fields with connect format for relation
        {
          name: "Connect format",
          data: {
            isBooked: true,
            statusJadwal: "Scheduled ", // Note: trailing space required!
            booked_by: { connect: [{ id: userIdNumber }] }, // Gunakan booked_by (underscore) sesuai schema
            phoneNumber: phoneNumber,
          },
        },
        // Format 4: Without relation first, then add relation
        {
          name: "Without relation first",
          data: {
            isBooked: true,
            statusJadwal: "Scheduled ", // Note: trailing space required!
            phoneNumber: phoneNumber,
          },
        },
      ];

      for (const updateAttempt of updateAttempts) {
        try {
          console.log(
            `🔵 Attempting update with format: ${updateAttempt.name}`
          );
          console.log(
            "🔵 Payload:",
            JSON.stringify(updateAttempt.data, null, 2)
          );

          // Wrap payload dengan { data: { ... } } untuk Strapi v5
          const payload = {
            data: updateAttempt.data,
          };

          const response = await strapiAxios.put(
            `/schedules/${updateScheduleId}`,
            payload,
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          console.log(
            "✅ Schedule updated successfully via axios:",
            response.data
          );
          scheduleUpdated = true;

          // Verify bookedBy was set correctly - fetch schedule dengan populate untuk verify
          const updatedSchedule = response.data?.data || response.data;
          let bookedByValue =
            updatedSchedule?.bookedBy || updatedSchedule?.booked_by; // Support both formats

          // Response update tidak include populated relation, jadi fetch ulang untuk verify
          if (!bookedByValue) {
            try {
              // Gunakan booked_by untuk populate karena itu nama field di schema
              const verifyResponse = await strapiAxios.get(
                `/schedules/${updateScheduleId}?populate=booked_by`
              );
              const verifiedSchedule =
                verifyResponse.data?.data || verifyResponse.data;
              bookedByValue =
                verifiedSchedule?.booked_by || verifiedSchedule?.bookedBy; // Support both formats
              console.log("🔵 Fetched schedule for verification:", {
                scheduleId: updateScheduleId,
                bookedBy: bookedByValue,
                hasBookedBy: !!bookedByValue,
              });
            } catch (verifyErr) {
              console.warn("⚠️ Failed to verify bookedBy:", verifyErr);
            }
          }

          if (bookedByValue) {
            const bookedById = bookedByValue?.id || bookedByValue;
            console.log("✅✅✅ bookedBy verified:", {
              bookedById: bookedById,
              expectedUserId: userIdNumber,
              match: bookedById === userIdNumber || bookedById === userId,
              bookedByUser:
                bookedByValue?.username || bookedByValue?.email || "N/A",
            });
          } else {
            // Jika bookedBy masih tidak ada, set separately
            console.warn(
              "⚠️ bookedBy not found after verification, will try to set separately"
            );

            // Set booked_by separately
            console.log("🔵 Setting booked_by relation separately...");
            // Gunakan booked_by (underscore) sesuai schema
            const relationPayloads = [
              {
                name: "Direct ID",
                data: { data: { booked_by: userIdNumber } },
              },
              {
                name: "Object ID",
                data: { data: { booked_by: { id: userIdNumber } } },
              },
              {
                name: "Connect format",
                data: {
                  data: { booked_by: { connect: [{ id: userIdNumber }] } },
                },
              },
            ];

            for (const relPayload of relationPayloads) {
              try {
                console.log(`🔵 Trying relation format: ${relPayload.name}`);
                await strapiAxios.put(
                  `/schedules/${updateScheduleId}`,
                  relPayload.data,
                  {
                    headers: { "Content-Type": "application/json" },
                  }
                );

                // Verify relation was set - gunakan booked_by untuk populate
                const verifyResponse = await strapiAxios.get(
                  `/schedules/${updateScheduleId}?populate=booked_by`
                );
                const verifiedSchedule =
                  verifyResponse.data?.data || verifyResponse.data;
                const verifiedBookedBy =
                  verifiedSchedule?.booked_by || verifiedSchedule?.bookedBy; // Support both formats

                if (verifiedBookedBy) {
                  console.log(
                    `✅✅✅ bookedBy relation set successfully with ${relPayload.name}:`,
                    {
                      bookedById: verifiedBookedBy?.id || verifiedBookedBy,
                      bookedByUser:
                        verifiedBookedBy?.username ||
                        verifiedBookedBy?.email ||
                        "N/A",
                    }
                  );
                  break;
                }
              } catch (relErr) {
                console.warn(
                  `⚠️ Relation update failed (${relPayload.name}):`,
                  relErr.response?.data || relErr.message
                );
              }
            }
          }

          break; // Success, exit loop
        } catch (axiosErr) {
          lastError = axiosErr;
          const errorDetails = axiosErr.response?.data || {};
          console.warn("⚠️ Update attempt failed:", {
            error: errorDetails.error || errorDetails,
            message:
              errorDetails.error?.message ||
              errorDetails.message ||
              axiosErr.message,
            status: axiosErr.response?.status,
          });
          // Continue to next format
        }
      }

      // Strategy 2: If axios failed, try @strapi/client
      if (!scheduleUpdated) {
        console.warn("⚠️ All axios attempts failed, trying @strapi/client");

        try {
          const client = getStrapiClient();
          // @strapi/client expects payload without wrapper { data }
          // Gunakan booked_by (underscore) sesuai schema
          await client.collection("schedules").update(updateScheduleId, {
            isBooked: true,
            statusJadwal: "Scheduled ", // Note: trailing space required!
            booked_by: userIdNumber, // Gunakan booked_by (underscore) sesuai schema
            phoneNumber: phoneNumber,
          });
          scheduleUpdated = true;
          console.log("✅ Schedule updated successfully via @strapi/client");
        } catch (clientErr) {
          const errorDetails = lastError?.response?.data || {};
          const clientErrorDetails =
            clientErr.error || clientErr.response?.data || {};

          console.error("❌ Failed to update schedule:", {
            axiosError: errorDetails.error || errorDetails,
            axiosMessage:
              errorDetails.error?.message ||
              errorDetails.message ||
              lastError?.message,
            clientError: clientErrorDetails.error || clientErrorDetails,
            clientMessage:
              clientErrorDetails.error?.message ||
              clientErrorDetails.message ||
              clientErr.message,
            scheduleId: updateScheduleId,
          });

          // Extract more detailed error message
          const errorMsg =
            errorDetails.error?.message ||
            clientErrorDetails.error?.message ||
            errorDetails.message ||
            clientErrorDetails.message ||
            lastError?.message ||
            clientErr.message ||
            "Gagal update schedule";
          throw new Error(errorMsg);
        }
      }

      if (!scheduleUpdated) {
        throw new Error("Gagal update schedule");
      }

      toast.success("Booking berhasil!");

      // Refresh slots after booking untuk update list
      await fetchSlots();

      // Navigate to "Jadwal Saya" setelah booking berhasil
      setTimeout(() => {
        navigate("/jadwal");
      }, 1000);
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
          <div className="loading-overlay">
            <ReactLoading type="spin" color="#3182ce" height={50} width={50} />
          </div>
        ) : slots && slots.length ? (
          <div className="booking-grid">
            {slots.map((s) => (
              <SlotCard
                key={s.id || s.documentId}
                schedule={s}
                onBookClick={handleBookClick}
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
