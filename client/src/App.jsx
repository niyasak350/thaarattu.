import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext';
import Intro from './components/Intro';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Forgot from './pages/Forgot';
import Dashboard from './pages/Dashboard';
import Pregnancy from './pages/Pregnancy';
import Children from './pages/Children';
import ChildDetail from './pages/ChildDetail';
import Wellness from './pages/Wellness';
import Games from './pages/Games';
import Assistant from './pages/Assistant';
import Profile from './pages/Profile';
import Creators from './pages/Creators';
import Records from './pages/Records';
import Videos from './pages/Videos';
import { DoctorAppointments, DoctorPatient, DoctorPatients, DoctorTiming } from './pages/doctor/DoctorPages';
import { HospitalAppointments, HospitalDoctors, HospitalHome, HospitalReviews } from './pages/hospital/HospitalPages';
import Hospitals from './pages/care/Hospitals';
import HospitalDetail from './pages/care/HospitalDetail';
import DoctorDetail from './pages/care/DoctorDetail';
import Appointments from './pages/care/Appointments';
import Emergency from './pages/care/Emergency';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminContent from './pages/admin/AdminContent';
import AdminVaccines from './pages/admin/AdminVaccines';
import AdminMeals from './pages/admin/AdminMeals';
import AdminHospitals from './pages/admin/AdminHospitals';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminReviews from './pages/admin/AdminReviews';
import AdminFeedback from './pages/admin/AdminFeedback';

export default function App() {
  const { user, loading } = useAuth();

  let pages;
  if (loading) {
    pages = <p className="center">Loading...</p>;
  } else if (!user) {
    // Visitors who are not logged in
    pages = (
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/creators" element={<Creators />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  } else if (user.role === 'admin') {
    pages = (
      <Layout>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/pregnancy-guides" element={<AdminContent type="pregnancy-guides" />} />
          <Route path="/admin/pregnancy-foods" element={<AdminContent type="pregnancy-foods" />} />
          <Route path="/admin/baby-guides" element={<AdminContent type="baby-guides" />} />
          <Route path="/admin/quiz" element={<AdminContent type="quiz" />} />
          <Route path="/admin/affirmations" element={<AdminContent type="affirmations" />} />
          <Route path="/admin/creators" element={<AdminContent type="creators" />} />
          <Route path="/admin/videos" element={<AdminContent type="videos" />} />
          <Route path="/admin/site-photos" element={<AdminContent type="site-photos" />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/admin/vaccines" element={<AdminVaccines />} />
          <Route path="/admin/meals" element={<AdminMeals />} />
          <Route path="/admin/hospitals" element={<AdminHospitals />} />
          <Route path="/admin/appointments" element={<AdminAppointments />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/feedback" element={<AdminFeedback />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/admin" />} />
        </Routes>
      </Layout>
    );
  } else if (user.role === 'doctor') {
    pages = (
      <Layout>
        <Routes>
          <Route path="/doctor" element={<DoctorAppointments />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/patients/:id" element={<DoctorPatient />} />
          <Route path="/doctor/timing" element={<DoctorTiming />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/doctor" />} />
        </Routes>
      </Layout>
    );
  } else if (user.role === 'hospital_admin') {
    pages = (
      <Layout>
        <Routes>
          <Route path="/hospital" element={<HospitalHome />} />
          <Route path="/hospital/doctors" element={<HospitalDoctors />} />
          <Route path="/hospital/appointments" element={<HospitalAppointments />} />
          <Route path="/hospital/reviews" element={<HospitalReviews />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/hospital" />} />
        </Routes>
      </Layout>
    );
  } else {
    pages = (
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pregnancy" element={<Pregnancy />} />
          <Route path="/children" element={<Children />} />
          <Route path="/child/:id" element={<ChildDetail />} />
          <Route path="/baby-guide" element={<Navigate to="/children?tab=guide" />} />
          <Route path="/wellness" element={<Wellness />} />
          <Route path="/games" element={<Games />} />
          <Route path="/hospitals" element={<Hospitals />} />
          <Route path="/hospitals/:id" element={<HospitalDetail />} />
          <Route path="/doctors/:id" element={<DoctorDetail />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/assistant" element={<Assistant />} />
          <Route path="/records" element={<Records />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/creators" element={<Creators />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    );
  }

  return (
    <>
      <Intro />
      {pages}
    </>
  );
}
