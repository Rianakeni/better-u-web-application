import React, { useState } from "react";
import { Button, FormGroup, Input, Label } from "reactstrap";
import { toast } from "react-toastify";
import { getStrapiClient } from "../../lib/strapiClient";

const ArticleManagement = ({ onArticleCreated }) => {
  // State untuk menyimpan input judul artikel
  const [title, setTitle] = useState("");
  // State untuk menyimpan input konten artikel
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    // Mencegah behavior default form submission (page refresh)
    e.preventDefault();
    // Validasi: Pastikan judul dan konten tidak kosong
    if (!title || !content) {
      toast.error("Judul dan Konten tidak boleh kosong");
      return;
    }

    try {
      // Mengirim POST request ke Strapi API untuk membuat artikel baru
      const client = getStrapiClient();
      await client.collection('articles').create({
        data: {
          title: title,
          content: content,
        },
      });

      // Tampilkan notifikasi sukses jika artikel berhasil dibuat
      toast.success("Artikel berhasil dibuat!");
      
      // Reset form: Kosongkan input judul dan konten
      setTitle("");
      setContent("");
      
      // Panggil callback function jika tersedia
      // Biasanya digunakan untuk me-refresh daftar artikel di parent component
      if (onArticleCreated) {
        onArticleCreated();
      }
    } catch (error) {
      // Tangkap error dan tampilkan notifikasi error dengan pesan detail
      toast.error("Gagal membuat artikel: " + error.message);
    }
  };

  return (
    <div
      className="article-management"
      style={{
        background: "#f4f4f4",      // Background abu-abu terang
        padding: "20px",            // Padding dalam container
        borderRadius: "8px",        // Sudut membulat
        marginBottom: "30px",       // Jarak bawah dari elemen lain
      }}
    >
      {/* Header/Title untuk section manajemen artikel */}
      <h4>Manajemen Artikel (Konselor)</h4>
      
      {/* Form Group untuk input judul artikel */}
      <FormGroup>
        <Label for="title">Judul Artikel</Label>
        <Input
          type="text"                                    // Input tipe text
          id="title"                                     // ID untuk label accessibility
          value={title}                                  // Controlled component: nilai dari state
          onChange={(e) => setTitle(e.target.value)}    // Update state saat user mengetik
          placeholder="Tulis judul..."                   // Placeholder text
        />
      </FormGroup>
      
      {/* Form Group untuk input konten artikel */}
      <FormGroup>
        <Label for="content">Konten</Label>
        <Input
          type="textarea"                                  // Input tipe textarea untuk konten panjang
          id="content"                                     // ID untuk label accessibility
          value={content}                                  // Controlled component: nilai dari state
          onChange={(e) => setContent(e.target.value)}    // Update state saat user mengetik
          placeholder="Tulis konten artikel..."            // Placeholder text
          rows={5}                                         // Tinggi textarea (5 baris)
        />
      </FormGroup>
      
      {/* Button untuk submit/publish artikel */}
      <Button 
        color="primary"      // Warna button primary (biru)
        onClick={handleSubmit}  // Handler saat button diklik
      >
        Publish Artikel
      </Button>
    </div>
  );
};

// Export komponen sebagai default export
export default ArticleManagement;
