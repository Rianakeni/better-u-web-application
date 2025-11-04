// MedicalRecordDetail.jsx
import { useState } from "react";
import { getStrapiClient, strapiAxios } from "../../lib/strapiClient";

const API_URL = process.env.REACT_APP_API_URL || "https://radiant-gift-29f5c55e3b.strapiapp.com";

function MedicalRecordDetail({ id }) {
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(false);

  // misal ini dipanggil di useEffect buat ambil data awal
  async function fetchRecord() {
    try {
      const client = getStrapiClient();
      const recordData = await client.collection('medical-records').findOne(id, {
        populate: {
          filePDF: true
        }
      });
      setRecord(recordData.data);
    } catch (error) {
      // Error handled silently
    }
  }

  async function handleGeneratePdf() {
    setLoading(true);
    try {
      await strapiAxios.post(`/medical-records/${id}/generate-pdf`);
      await fetchRecord();
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false);
    }
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