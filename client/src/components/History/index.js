import React from "react";
import { useMyHistory } from "./useMyHistory";
import { Protector } from "../../helpers";
import ReactLoading from "react-loading";
import { FaCalendarAlt, FaClock, FaUserMd } from "react-icons/fa";

const HistoryCard = ({ item }) => {
  // Data langsung dari schedule, tidak perlu parse appointment structure
  // Support both Strapi v4 (with attributes) and v5 (without attributes)
  const scheduleData = item?.attributes || item || {};

  // Extract tanggal dan jam dari schedule langsung
  const tanggal = scheduleData.tanggal;
  const jam_mulai = scheduleData.jam_mulai;
  const jam_selesai = scheduleData.jam_selesai;

  // Format jam: jika ada jam_mulai dan jam_selesai, tampilkan range; jika hanya jam_mulai, tampilkan jam_mulai saja
  const jam =
    jam_mulai && jam_selesai
      ? `${jam_mulai} - ${jam_selesai}`
      : jam_mulai
      ? jam_mulai
      : "-";

  // Konselor dari field konselor langsung (oneWay relation ke User)
  const konselor =
    scheduleData.konselor?.username ||
    scheduleData.konselor?.data?.username ||
    scheduleData.konselor?.data?.attributes?.username ||
    scheduleData.konselor?.email ||
    "dr. konselor";

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
