import React, { useEffect } from "react";
import { useMySchedule } from "./useMySchedule";
import { Protector } from "../../helpers";
import { useNavigate, useLocation } from "react-router-dom";
import { FaCalendarAlt, FaClock, FaUserMd } from "react-icons/fa";
import { toast } from "react-toastify";
import { strapiAxios, getStrapiClient } from "../../lib/strapiClient";

const AppointmentCard = ({ appt, onEdit, onCancel }) => {
  // Strapi v5: data langsung di root, tidak ada attributes wrapper
  // Support both v4 (with attributes) and v5 (without attributes)
  const attrs = appt.attributes || appt || {};

  // Debug: Log full appointment structure untuk memahami format data
  // Cek di berbagai level: appt langsung, appt.attributes, atau di root level
  const scheduleData = appt.schedule || attrs.schedule || null;
  let scheduleRel = {};
  
  // Log full structure untuk debug - expand semua object untuk melihat struktur lengkap
  if (!scheduleData || scheduleData === null || scheduleData === undefined) {
    console.log("Full appointment structure (schedule null):", {
      appointmentId: appt.id || appt.documentId,
      fullAppt: appt,
      fullApptKeys: Object.keys(appt),
      attrs: attrs,
      attrsKeys: Object.keys(attrs),
      scheduleAtRoot: appt.schedule,
      scheduleInAttrs: attrs.schedule,
      scheduleData: scheduleData,
      // Expand semua field untuk melihat struktur lengkap
      allApptFields: JSON.stringify(appt, null, 2)
    });
  }
  
  if (scheduleData) {
    // Strapi v4: schedule.data.attributes
    if (scheduleData.data?.attributes) {
      scheduleRel = scheduleData.data.attributes;
    }
    // Strapi v5: schedule.data (bisa array atau object)
    else if (scheduleData.data) {
      // Jika schedule.data adalah array, ambil yang pertama
      if (Array.isArray(scheduleData.data) && scheduleData.data.length > 0) {
        scheduleRel = scheduleData.data[0];
      } else {
        scheduleRel = scheduleData.data;
      }
    }
    // Strapi v5: schedule langsung (object)
    else if (typeof scheduleData === 'object' && !Array.isArray(scheduleData)) {
      scheduleRel = scheduleData;
    }
  }

  // Extract tanggal dan jam dari scheduleRel
  const tanggal = scheduleRel.tanggal || attrs.date;
  const jam_mulai = scheduleRel.jam_mulai;
  const jam_selesai = scheduleRel.jam_selesai;
  const jam =
    jam_mulai && jam_selesai
      ? `${jam_mulai} - ${jam_selesai}`
      : scheduleRel.jam ||
        `${attrs.start_time || ""} - ${attrs.end_time || ""}`;

  // Debug log jika data tidak ada
  if (!tanggal || !jam_mulai || !jam_selesai) {
    console.warn("Schedule data incomplete:", {
      appointmentId: appt.id || appt.documentId,
      scheduleData,
      scheduleRel,
      scheduleRelKeys: Object.keys(scheduleRel),
      tanggal,
      jam_mulai,
      jam_selesai,
      fullScheduleData: JSON.stringify(scheduleData, null, 2)
    });
  }

  // Konselor: support both v4 and v5 format
  const konselor =
    attrs.konselor?.data?.attributes?.username ||
    attrs.konselor?.data?.username ||
    attrs.konselor?.username ||
    attrs.konselor ||
    "dr. konselor";

  const status = (attrs.statusJadwal || "").trim();

  const statusLabel =
    status === "Scheduled"
      ? "di jadwalkan"
      : status === "Cancelled"
      ? "dibatalkan"
      : status === "Completed"
      ? "selesai"
      : "belum dijadwalkan";

  return (
    <div className="scheduled-card">
      <div
        className={`dash-item ${
          status === "Completed" ? "history" : "upcoming"
        }`}
      >
        <div className="dash-item-left">
          <div className="dash-row dash-date">
            <FaCalendarAlt className="dash-icon" aria-hidden="true" />
            <span className="dash-text">
              {tanggal
                ? new Date(tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "-"}
            </span>
          </div>

          <div className="dash-row dash-time">
            <FaClock className="dash-icon" aria-hidden="true" />
            <span className="dash-text">{jam}</span>
          </div>

          <div className="dash-row dash-doctor">
            <FaUserMd className="dash-icon" aria-hidden="true" />
            <span className="dash-text">{konselor}</span>
          </div>
        </div>

        <div className="dash-item-right">
          {status === "Scheduled" && (
            <span className="badge scheduled">{statusLabel}</span>
          )}
          <div
            style={{
              flexDirection: "row",
              display: "flex",
              justifyContent: "right",
              padding: "10px",
              margin: "10px",
              gap: "10px",
            }}
          >
            <button
              style={{
                width: "15%",
                height: "30px",
                borderRadius: "8px",
                backgroundColor: "#dc4c4cff",
                color: "white",
                border: "none",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                alignContent: "center",
                justifyContent: "center",
              }}
              onClick={() => onCancel(appt)}
            >
              Batalkan Jadwal
            </button>
            <button
              style={{
                width: "15%",
                height: "30px",
                borderRadius: "8px",
                backgroundColor: "#3182ce",
                color: "white",
                border: "none",
                fontSize: "1rem",
                fontWeight: "500",
                cursor: "pointer",
                justifyContent: "center",
                alignItems: "center",
              }}
              onClick={() => onEdit(appt)}
            >
              Ubah jadwal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// const AppointmentCard = ({ appt, onEdit, onCancel }) => {
//   const attrs = appt.attributes || appt || {};

//   // Mendapatkan data jadwal
//   const scheduleRel =
//     attrs.schedule?.data?.attributes || attrs.schedule?.data || attrs.schedule || {};
//   const tanggal = scheduleRel?.tanggal || attrs.date;
//   const jam_mulai = scheduleRel.jam_mulai || attrs.start_time;
//   const jam_selesai = scheduleRel.jam_selesai || attrs.end_time;
//   const konselor = attrs.konselor?.data?.attributes?.username || attrs.konselor || "dr. konselor";

//   // Format tanggal dan jam
//   const jam = jam_mulai && jam_selesai ? `${jam_mulai} - ${jam_selesai}` : "-";
//   const status = attrs.statusJadwal?.trim();
//   const statusLabel =
//     status === "Scheduled"
//       ? "di jadwalkan"
//       : status === "Cancelled"
//       ? "dibatalkan"
//       : status === "Completed"
//       ? "selesai"
//       : "belum dijadwalkan";

//   return (
//     <div className="appointment-card">
//       <div className="appointment-card-header">
//         <FaCalendarAlt />
//         <span className="appointment-date">
//           {tanggal ? new Date(tanggal).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "-"}
//         </span>
//       </div>

//       <div className="appointment-card-body">
//         <div className="appointment-time">
//           <FaClock />
//           <span>{jam}</span>
//         </div>
//         <div className="appointment-doctor">
//           <FaUserMd />
//           <span>{konselor}</span>
//         </div>
//       </div>

//       <div className="appointment-card-footer">
//         <button
//           className="cancel-btn"
//           style={{ backgroundColor: "#e53e3e", color: "white" }}
//           onClick={() => onCancel(appt)}
//         >
//           Batalkan Jadwal
//         </button>
//         <button
//           className="edit-btn"
//           style={{ backgroundColor: "#3182ce", color: "white" }}
//           onClick={() => onEdit(appt)}
//         >
//           Ubah Jadwal
//         </button>
//       </div>
//     </div>
//   );
// };

const MySchedule = ({ token }) => {
  const { appointments, loading, refresh } = useMySchedule(token);
  const navigate = useNavigate();
  const location = useLocation();
  const [cancelling, setCancelling] = React.useState(false);

  // Refresh data saat navigate ke halaman ini (misalnya setelah booking)
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]); // Re-fetch when pathname changes

  const handleEdit = (appt) => {
    // currently navigate to booking page for reschedule; could be enhanced
    navigate("/booking");
  };

  const handleCancel = async (appt) => {
    if (cancelling) return; // Prevent multiple clicks
    
    setCancelling(true);
    try {
      const appointmentId = appt.id || appt.documentId;
      
      if (!appointmentId) {
        toast.error("Appointment ID tidak ditemukan");
        setCancelling(false);
        return;
      }

      // Update status appointment menjadi Cancelled
      // Server Strapi mengharapkan payload dengan wrapper { data: { ... } }
      
      const updatePayload = {
        data: {
          statusJadwal: "Cancelled"
        }
      };

      let updateSuccess = false;
      
      // Try axios first dengan format yang benar (wrapper data)
      try {
        await strapiAxios.put(`/appointments/${appointmentId}`, updatePayload, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        updateSuccess = true;
      } catch (axiosErr) {
        // Skip if it's an abort error from axios
        if (axiosErr.name === 'AbortError' || axiosErr.code === 'ERR_CANCELED') {
          console.warn("Request was aborted, skipping fallback");
          setCancelling(false);
          toast.error("Request dibatalkan. Silakan coba lagi.");
          return;
        }
        
        // Jika axios gagal karena CORS atau error lain, coba dengan @strapi/client
        console.warn("Axios update failed, trying @strapi/client:", axiosErr.message || axiosErr);
        
        try {
          const client = getStrapiClient();
          // Strapi v5: Prioritas documentId untuk update, fallback ke id
          const updateAppointmentId = appt.documentId || appt.id || appointmentId;
          
          // Strapi client juga menggunakan format dengan wrapper data
          await client.collection('appointments').update(updateAppointmentId, updatePayload);
          updateSuccess = true;
        } catch (clientErr) {
          // Log error untuk debug
          console.error("Appointment update error:", {
            axiosErr: {
              message: axiosErr.message,
              response: axiosErr.response?.data,
              status: axiosErr.response?.status,
              code: axiosErr.code
            },
            clientErr: {
              message: clientErr.message,
              error: clientErr.error,
              response: clientErr.response
            },
            appointmentId: appointmentId,
            documentId: appt.documentId,
            id: appt.id
          });
          
          // Prioritaskan error dari clientErr karena axios gagal karena CORS
          // Extract error message dari clientErr terlebih dahulu
          const clientErrorData = clientErr.error || clientErr.response?.data || {};
          const errorMsg = clientErrorData.error?.message || 
                          clientErrorData.message || 
                          clientErr.message ||
                          (axiosErr.response?.data?.error?.message || axiosErr.response?.data?.message) ||
                          axiosErr.message ||
                          "Gagal membatalkan jadwal";
          
          throw new Error(errorMsg);
        }
      }

      if (updateSuccess) {
        // Show success notification
        toast.success("Jadwal berhasil dibatalkan!");
        
        // Refresh data setelah cancel (tunggu sedikit agar toast terlihat)
        setTimeout(() => {
          refresh();
        }, 500);
        
        // Redirect ke halaman booking setelah delay
        setTimeout(() => {
          navigate("/booking");
        }, 1500);
      }
    } catch (error) {
      console.error("Error canceling appointment:", error);
      
      // Handle abort error specifically
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED' || error.message?.includes('aborted')) {
        toast.error("Request dibatalkan. Silakan coba lagi.");
      } else {
        const errorMessage = error.response?.data?.error?.message || 
                            error.response?.data?.message || 
                            error.message || 
                            "Gagal membatalkan jadwal";
        toast.error(`Gagal membatalkan jadwal: ${errorMessage}`);
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="schedule-page">
      <h1>Jadwal Saya</h1>
      <p>
        Kelola dan pantau jadwal konselingmu dengan mudah di sini. Pastikan
        setiap sesi sesuai dengan kebutuhan dan waktu yang kamu inginkan
      </p>

      <div className="schedule-card">
        {loading ? (
          <p>Loading...</p>
        ) : appointments && appointments.length ? (
          <div className="schedule-grid">
            {appointments.map((a) => (
              <AppointmentCard
                key={a.id || a.documentId}
                appt={a}
                onEdit={handleEdit}
                onCancel={handleCancel}
              />
            ))}
          </div>
        ) : (
          <p>Tidak ada jadwal</p>
        )}
      </div>
    </div>
  );
};

export default Protector
  ? (props) => <Protector Component={<MySchedule {...props} />} />
  : MySchedule;
