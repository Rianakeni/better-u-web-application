import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Container } from "reactstrap";
import Login from "./components/Login";
import Registration from "./components/Registration";
import Logout from "./components/Logout";
import CustomNav from "./components/CustomNav";
import { ToastContainer } from "react-toastify";
import { Protector, userData } from "./helpers";
import Profile from "./components/Profile";
import Dashboard from "./components/Dashboard";
import Booking from "./components/Booking";
import Schedule from "./components/Schedule";
import History from "./components/History";
import MedicalRecords from "./components/MedicalRecords";
import Articles from "./components/Articles";

function App() {
  const { jwt, username } = userData();
  const isLoggedIn = !!jwt;

  return (
    <div>
      <BrowserRouter>
        <CustomNav isLoggedIn={isLoggedIn} username={username} />
        <Container>
          <Routes>
            <Route
              path="/"
              element={<Protector Component={<Dashboard token={jwt} />} />}
            />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/registration" element={<Registration />} />
            <Route
              path="/medical-records"
              element={<Protector Component={<MedicalRecords token={jwt} />} />}
            />
            <Route
              path="/dashboard"
              element={<Protector Component={<Dashboard token={jwt} />} />}
            />
            <Route
              path="/booking"
              element={<Protector Component={<Booking token={jwt} />} />}
            />
            <Route
              path="/jadwal"
              element={<Protector Component={<Schedule token={jwt} />} />}
            />
            <Route
              path="/riwayat"
              element={<Protector Component={<History token={jwt} />} />}
            />
            <Route
              path="/profile"
              element={<Protector Component={<Profile token={jwt} />} />}
            />
            <Route
              path="/articles"
              element={<Protector Component={<Articles token={jwt} />} />}
            />
          </Routes>
          <ToastContainer />
        </Container>
      </BrowserRouter>
    </div>
  );
}

export default App;
