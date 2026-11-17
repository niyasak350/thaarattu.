import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useLang } from '../../i18n';

// Indian helpline numbers. Check that these are current before you submit the project.
const HELPLINES = [
  ['112', 'Emergency (police, fire, ambulance)'],
  ['108', 'Ambulance'],
  ['102', 'Ambulance for pregnant women and babies'],
  ['1098', 'Childline (children in distress)'],
  ['181', 'Women helpline'],
  ['14416', 'Tele-MANAS mental health support (free, 24 hours)'],
];

export default function Emergency() {
  const { t } = useLang();
  const [hospitals, setHospitals] = useState([]);
  useEffect(() => { api('/care/hospitals?emergency=1').then(setHospitals); }, []);

  return (
    <>
      <h2>{t('emergency')}</h2>
      <section className="card">
        <h3>Helplines</h3>
        <div className="grid">
          {HELPLINES.map(([number, text]) => (
            <a key={number} href={'tel:' + number} className="helpline">
              <b>{number}</b><span>{text}</span>
            </a>
          ))}
        </div>
        <p className="muted">Tap a number to call from your phone.</p>
      </section>

      <section className="card">
        <h3>Hospitals with 24-hour emergency</h3>
        {hospitals.length === 0 && <p className="muted">None listed yet.</p>}
        <table>
          <tbody>
            {hospitals.map((h) => (
              <tr key={h.id}>
                <td><Link to={'/hospitals/' + h.id}><b>{h.name}</b></Link><br /><span className="muted">{h.address}, {h.city}</span></td>
                <td>{h.phone && <a href={'tel:' + h.phone}>{h.phone}</a>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
