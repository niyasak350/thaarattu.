import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { api, formatDate, today } from '../../api';

export default function VaccinesTab({ child }) {
  const base = '/children/' + child.id + '/vaccinations';
  const [vaccines, setVaccines] = useState([]);
  const load = () => api(base).then(setVaccines);
  useEffect(() => { load(); }, [child.id]);

  async function setGiven(id, given) {
    await api(base + '/' + id, 'PUT', { given_date: given ? today() : null });
    load();
  }

  const status = (v) => (v.given_date ? 'Given' : v.due_date < today() ? 'Overdue' : 'Upcoming');

  // Builds the PDF in the browser and downloads it
  function downloadPdf() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Vaccination Report', 14, 18);
    doc.setFontSize(11);
    doc.text(`Child: ${child.name}    Date of birth: ${formatDate(child.dob)}`, 14, 27);
    doc.text(`Report date: ${formatDate(today())}`, 14, 33);
    autoTable(doc, {
      startY: 40,
      head: [['Vaccine', 'Due date', 'Status', 'Given on']],
      body: vaccines.map((v) => [v.name, formatDate(v.due_date), status(v), formatDate(v.given_date) || '-']),
      headStyles: { fillColor: [184, 24, 92] },
    });
    doc.save(`vaccination-report-${child.name}.pdf`);
  }

  const givenCount = vaccines.filter((v) => v.given_date).length;

  return (
    <section className="card">
      <div className="title-row">
        <h3>Vaccinations <span className="muted">· {givenCount} of {vaccines.length} given</span></h3>
        <button className="small" onClick={downloadPdf}>Download PDF report</button>
      </div>
      <table>
        <thead><tr><th>Vaccine</th><th>Due date</th><th>Status</th><th></th></tr></thead>
        <tbody>
          {vaccines.map((v) => (
            <tr key={v.id}>
              <td><b>{v.name}</b><br /><span className="muted">{v.description}</span></td>
              <td>{formatDate(v.due_date)}</td>
              <td>
                {v.given_date
                  ? <span className="badge ok">Given {formatDate(v.given_date)}</span>
                  : status(v) === 'Overdue'
                    ? <span className="badge late">Overdue</span>
                    : <span className="badge">Upcoming</span>}
              </td>
              <td>
                {v.given_date
                  ? <button className="link" onClick={() => setGiven(v.id, false)}>Undo</button>
                  : <button className="small" onClick={() => setGiven(v.id, true)}>Mark given</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">Sample schedule for this project. Always follow your doctor's advice.</p>
    </section>
  );
}
