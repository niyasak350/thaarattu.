import AppointmentList from '../../components/AppointmentList';

export default function AdminAppointments() {
  return (
    <>
      <h2>Appointments</h2>
      <p className="muted">Every appointment at every hospital.</p>
      <AppointmentList url="/admin/appointments" />
    </>
  );
}
