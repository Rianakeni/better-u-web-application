import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const storeUser = (data) => {
  localStorage.setItem(
    "user",
    JSON.stringify({
      username: data.user.username,
      jwt: data.jwt,
    })
  );
};

// export const storeUser = (data) => {
//   // Kita tambahkan 'role' ke data yang disimpan
//   const userToStore = {
//     username: data.user.username,
//     jwt: data.jwt,
//     // Asumsi Strapi mengirim role sebagai objek di dalam user
//     // Sesuaikan 'data.user.role.name' jika strukturnya berbeda
//     role: data.user.role?.name || "Mahasiswa",
//   };

//   // Simpan ke localStorage
//   localStorage.setItem("user", JSON.stringify(userToStore));
// };

export const userData = () => {
  const stringifiedUser = localStorage.getItem("user") || '""';
  try {
    const user = JSON.parse(stringifiedUser);
    return user || {};
  } catch (e) {
    return {};
  }
};

export const Protector = ({ Component }) => {
  const navigate = useNavigate();

  const { jwt } = userData();

  useEffect(() => {
    if (!jwt) {
      navigate("/login");
    }
  }, [navigate, jwt]);

  // Render komponen yang dilindungi jika pengguna terautentikasi
  return jwt ? Component : null;
};
