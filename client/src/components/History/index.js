import React from "react";
import { useMyHistory } from "./useMyHistory";
import { Protector } from "../../helpers";

const HistoryCard = ({ item }) => {
  const attrs = item.attributes || {};
  const scheduleRel = attrs.schedule?.data?.attributes || {};
  const scheduleComp = scheduleRel.schedule ? scheduleRel.schedule[0] : null;
  const tanggal = scheduleComp?.tanggal || scheduleRel?.tanggal || attrs.date;
  const jam =
    scheduleComp?.jam ||
    scheduleRel?.jam ||
    `${attrs.start_time || ""} - ${attrs.end_time || ""}`;
  const konselor =
    attrs.konselor?.data?.attributes?.username ||
    attrs.konselor ||
    "dr. konselor";

  return (
    <div className="history-item">
      <div className="history-left">
        <div className="history-date">
          {tanggal
            ? new Date(tanggal).toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "-"}
        </div>
        <div className="history-time">{jam}</div>
        <div className="history-doctor">{konselor}</div>
      </div>
      <div className="history-right">
        {attrs.medical_record?.data?.id ? (
          <a
            className="download-btn"
            href={`http://localhost:1337${
              attrs.medical_record.data.attributes.file?.data?.attributes
                ?.url || ""
            }`}
            target="_blank"
            rel="noreferrer"
          >
            download rekam medis
          </a>
        ) : null}
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
          <p>Loading...</p>
        ) : history && history.length ? (
          <div className="history-grid">
            {history.map((h) => (
              <HistoryCard key={h.id} item={h} />
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
