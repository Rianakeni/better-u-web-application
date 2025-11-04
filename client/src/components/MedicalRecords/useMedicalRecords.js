// MedicalRecordDetail.jsx
import { useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

function MedicalRecordDetail({ id }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  // misal ini dipanggil di useEffect buat ambil data awal
  async function fetchRecord() {
    const res = await fetch(
      `${API_URL}/api/medical-records/${id}?populate[filePDF]=true`
    );
    const json = await res.json();
    setRecord(json.data);
  }

  async function handleGeneratePdf() {
    setLoading(true);
    await fetch(`${API_URL}/api/medical-records/${id}/generate-pdf`, {
      method: "POST", // atau GET, terserah kamu bikin di Strapi
    });
    await fetchRecord(); // refresh supaya field filePDF keisi
    setLoading(false);
  }

  return (
    <div>
      <button onClick={handleGeneratePdf} disabled={loading}>
        {loading ? "Generating..." : "Generate PDF"}
      </button>

      {record?.attributes?.filePDF?.data && (
        <a
          href={`${API_URL}${record.attributes.filePDF.data.attributes.url}`}
          target="_blank"
          rel="noreferrer"
        >
          Download PDF
        </a>
      )}
    </div>
  );
}

export default MedicalRecordDetail;