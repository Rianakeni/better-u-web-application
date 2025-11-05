import React from "react";
import { useMyHistory } from "./useMyHistory";
import { Protector } from "../../helpers";
import ReactLoading from "react-loading";
import { FaCalendarAlt, FaClock, FaUserMd } from "react-icons/fa";

const API_URL =
  process.env.REACT_APP_API_URL ||
  "https://radiant-gift-29f5c55e3b.strapiapp.com";

const HistoryCard = ({ item }) => {
  // Support both Strapi v4 (attributes) and v5 (direct) formats
  const attrs = item.attributes || item || {};

  // Handle schedule - support both v4 and v5 formats
  const scheduleRel =
    attrs.schedule?.data?.attributes ||
    attrs.schedule?.data ||
    attrs.schedule ||
    {};
  const scheduleComp = scheduleRel.schedule ? scheduleRel.schedule[0] : null;

  // Get tanggal - try multiple paths
  const tanggal =
    scheduleComp?.tanggal ||
    scheduleRel?.tanggal ||
    attrs.date ||
    attrs.tanggal;

  // Get jam_mulai and jam_selesai
  const jam_mulai = scheduleComp?.jam_mulai || scheduleRel?.jam_mulai;
  const jam_selesai = scheduleComp?.jam_selesai || scheduleRel?.jam_selesai;
  const jam =
    jam_mulai && jam_selesai
      ? `${jam_mulai} - ${jam_selesai}`
      : scheduleComp?.jam ||
        scheduleRel?.jam ||
        `${attrs.start_time || ""} - ${attrs.end_time || ""}`;

  // Get konselor - support both v4 and v5 formats
  // Try from schedule.konselor first, then from appointment.konselor
  const konselorFromSchedule =
    scheduleRel.konselor?.data?.attributes?.username ||
    scheduleRel.konselor?.data?.username ||
    scheduleRel.konselor?.username ||
    scheduleRel.konselor;

  const konselor =
    konselorFromSchedule ||
    attrs.konselor?.data?.attributes?.username ||
    attrs.konselor?.data?.username ||
    attrs.konselor?.username ||
    attrs.konselor ||
    "dr. konselor";

  // Handle medical_record - support both v4 and v5 formats
  const medicalRecord =
    attrs.medical_record?.data?.attributes ||
    attrs.medical_record?.data ||
    attrs.medical_record;

  return (
    <div className="scheduled-card">
      <div className="dash-item history">
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
      </div>
    </div>
  );
};

const MyHistory = ({ token }) => {
  const { history, loading } = useMyHistory(token);

  return (
    <div className="history-page">
      <h1>Riwayat Konseling</h1>
      <p>
        Halaman ini menampilkan riwayat sesi konselingmu. Gunakan informasi ini
        untuk melihat kembali jadwal, topik, dan catatan dari setiap pertemuan.
      </p>

      <div className="history-card">
        {loading ? (
          <div className="loading-overlay">
            <ReactLoading type="spin" color="#3182ce" height={50} width={50} />
          </div>
        ) : history && history.length ? (
          <div className="history-grid">
            {history.map((h) => (
              <HistoryCard key={h.id || h.documentId} item={h} />
            ))}
          </div>
        ) : (
          <p>Tidak ada riwayat</p>
        )}
      </div>
    </div>
  );
};

export default Protector
  ? (props) => <Protector Component={<MyHistory {...props} />} />
  : MyHistory;
