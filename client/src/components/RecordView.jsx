import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ageText, formatDate, today } from '../api';

const DAY = 86400000;
const toText = (date) => new Date(date - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// Day / Week / Month chooser with back and forward arrows.
// Use:  const period = usePeriod();   <PeriodPicker period={period} />   period.from, period.to
export function usePeriod() {
  const [mode, setMode] = useState('week');
  const [end, setEnd] = useState(today()); // last day of the period shown
  const endDate = new Date(end + 'T00:00:00');
  let from = end;
  if (mode === 'week') from = toText(new Date(endDate.getTime() - 6 * DAY));
  if (mode === 'month') from = toText(new Date(endDate.getTime() - 29 * DAY));
  const days = mode === 'day' ? 1 : mode === 'week' ? 7 : 30;
  const move = (direction) => {
    const next = toText(new Date(endDate.getTime() + direction * days * DAY));
    setEnd(next > today() ? today() : next);
  };
  return { mode, setMode, from, to: end, move, atToday: end === today() };
}

export function PeriodPicker({ period }) {
  return (
    <div className="period">
      <div className="choices">
        {[['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([value, text]) => (
          <button key={value} type="button" className={period.mode === value ? 'choice on' : 'choice'} onClick={() => period.setMode(value)}>{text}</button>
        ))}
      </div>
      <div className="when">
        <button type="button" className="icon-btn" onClick={() => period.move(-1)} aria-label="Earlier"><ChevronLeft size={20} /></button>
        <span>{period.from === period.to ? formatDate(period.to) : formatDate(period.from) + ' – ' + formatDate(period.to)}</span>
        <button type="button" className="icon-btn" onClick={() => period.move(1)} disabled={period.atToday} aria-label="Later"><ChevronRight size={20} /></button>
      </div>
    </div>
  );
}

const average = (list, field) => (list.length ? (list.reduce((sum, x) => sum + Number(x[field]), 0) / list.length).toFixed(1) : null);
const HEALTH_TYPES = { fever: 'Fever', medicine: 'Medicine', doctor_visit: 'Doctor visit', symptom: 'Symptom', other: 'Other' };

function Tile({ label, value, note }) {
  return <div><span>{label}</span><b>{value ?? '–'}</b>{note && <small>{note}</small>}</div>;
}

// Shows the combined health record of a mother and her children for the chosen period.
// Used on the parent's Records page and on the doctor's patient page.
export default function RecordView({ record }) {
  const m = record.mother;
  // the newest reading that has a blood pressure, and the newest that has a weight
  const lastBp = [...m.vitals].reverse().find((v) => v.bp_high);
  const lastWeight = [...m.vitals].reverse().find((v) => v.weight_kg);
  const lastScreen = m.screenings[m.screenings.length - 1];
  const nothing = !m.moods.length && !m.sleep.length && !m.screenings.length && !m.vitals.length && !m.checkups.length && !m.kicks.length;

  // mood and sleep are entered separately; show them together, one row for each day
  const days = {};
  for (const x of m.moods) days[x.log_date] = { ...days[x.log_date], date: x.log_date, mood: x.mood, stress: x.stress };
  for (const x of m.sleep) days[x.log_date] = { ...days[x.log_date], date: x.log_date, sleep: Number(x.sleep_hours), energy: x.energy, pain: x.pain };
  const daily = Object.values(days).sort((a, b) => (a.date < b.date ? -1 : 1));

  return (
    <>
      <section className="card">
        <div className="rec-title">
          <span className="avatar">{record.user.name[0].toUpperCase()}</span>
          <div>
            <h3>{record.user.name} <span className="badge">Mother</span></h3>
            {record.pregnancy && <span className="muted">Pregnant: week {record.pregnancy.week} · due {formatDate(record.pregnancy.due_date)}</span>}
          </div>
        </div>
        <div className="rec-grid">
          <Tile label="Average mood" value={average(m.moods, 'mood') && average(m.moods, 'mood') + ' / 5'} note={m.moods.length + ' check-ins'} />
          <Tile label="Average stress" value={average(m.moods, 'stress') && average(m.moods, 'stress') + ' / 5'} />
          <Tile label="Average sleep" value={average(m.sleep, 'sleep_hours') && average(m.sleep, 'sleep_hours') + ' h'} note={m.sleep.length + ' nights logged'} />
          <Tile label="Blood pressure" value={lastBp ? lastBp.bp_high + '/' + lastBp.bp_low : null} note={lastBp ? formatDate(lastBp.record_date) : null} />
          <Tile label="Weight" value={lastWeight ? Number(lastWeight.weight_kg) + ' kg' : null} note={lastWeight ? formatDate(lastWeight.record_date) : null} />
          <Tile label="Wellbeing screening" value={lastScreen ? lastScreen.score + ' / 30' : null} note={lastScreen ? (lastScreen.score >= 15 ? 'High' : lastScreen.score >= 10 ? 'Moderate' : 'Low') + ' risk' : null} />
        </div>
        {nothing && <p className="muted">Nothing was recorded for the mother in this period.</p>}

        {m.vitals.length > 0 && (
          <>
            <p className="label">Health readings</p>
            <table>
              <thead><tr><th>Date</th><th>Weight</th><th>Blood pressure</th><th>Sugar</th><th>Note</th></tr></thead>
              <tbody>
                {m.vitals.map((v) => (
                  <tr key={v.id}>
                    <td className="nowrap">{formatDate(v.record_date)}</td>
                    <td>{v.weight_kg ? Number(v.weight_kg) + ' kg' : '–'}</td>
                    <td>{v.bp_high ? v.bp_high + '/' + v.bp_low : '–'}</td>
                    <td>{v.sugar ? v.sugar + ' mg/dL' : '–'}</td>
                    <td>{v.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {daily.length > 0 && (
          <>
            <p className="label">Mood, sleep and recovery, day by day</p>
            <table>
              <thead><tr><th>Date</th><th>Mood</th><th>Stress</th><th>Sleep</th><th>Energy</th><th>Pain</th></tr></thead>
              <tbody>
                {daily.map((d) => (
                  <tr key={d.date}>
                    <td className="nowrap">{formatDate(d.date)}</td>
                    <td>{d.mood ? d.mood + ' / 5' : '–'}</td>
                    <td>{d.stress ? d.stress + ' / 5' : '–'}</td>
                    <td>{d.sleep != null ? d.sleep + ' h' : '–'}</td>
                    <td>{d.energy ? d.energy + ' / 5' : '–'}</td>
                    <td>{d.pain ? d.pain + ' / 5' : '–'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {(m.checkups.length > 0 || m.kicks.length > 0 || m.screenings.length > 0) && (
          <ul className="plain">
            {m.screenings.map((s, i) => (
              <li key={'s' + i}><span className="badge">Screening</span> {formatDate(s.taken_on)} · score <b>{s.score} / 30</b></li>
            ))}
            {m.checkups.map((c, i) => (
              <li key={'c' + i}>
                <span className={c.done ? 'badge ok' : 'badge warn'}>{c.done ? 'Check-up done' : 'Check-up'}</span>{' '}
                {formatDate(c.checkup_date)} · <b>{c.title}</b>{c.place && ', ' + c.place}
              </li>
            ))}
            {m.kicks.map((k, i) => (
              <li key={'k' + i}><span className="badge">Kick count</span> {formatDate(k.started_at)} · <b>{k.kicks} kicks</b> in {k.minutes} min</li>
            ))}
          </ul>
        )}
      </section>

      {record.children.map((c) => {
        const last = c.growth[c.growth.length - 1];
        const empty = !c.growth.length && !c.health.length && !c.vaccines.length;
        return (
          <section className="card" key={c.id}>
            <div className="rec-title">
              <span className="avatar">{c.name[0].toUpperCase()}</span>
              <div>
                <h3>{c.name} <span className="badge">Child</span></h3>
                <span className="muted">
                  {ageText(c.dob)} old · {c.gender === 'male' ? 'Boy' : c.gender === 'female' ? 'Girl' : 'Other'}
                  {c.blood_group && ' · ' + c.blood_group}{c.allergies && ' · Allergies: ' + c.allergies}
                </span>
              </div>
            </div>
            <div className="rec-grid">
              <Tile label="Weight" value={last ? Number(last.weight_kg) + ' kg' : null} note={last ? formatDate(last.record_date) : null} />
              <Tile label="Height" value={last ? Number(last.height_cm) + ' cm' : null} />
              <Tile label="Vaccines given" value={c.vaccines.length} note="in this period" />
              <Tile label="Vaccines overdue" value={c.vaccines_overdue} note="as of today" />
            </div>
            {empty && <p className="muted">Nothing was recorded for {c.name} in this period.</p>}
            {(c.growth.length > 0 || c.health.length > 0 || c.vaccines.length > 0) && (
              <ul className="plain">
                {c.growth.map((g, i) => (
                  <li key={'g' + i}><span className="badge">Growth</span> {formatDate(g.record_date)} · <b>{Number(g.weight_kg)} kg</b>, {Number(g.height_cm)} cm</li>
                ))}
                {c.health.map((h, i) => (
                  <li key={'h' + i}>
                    <span className="badge warn">{HEALTH_TYPES[h.type]}</span> {formatDate(h.record_date)} · <b>{h.title}</b>
                    {h.temperature_c && ' · ' + Number(h.temperature_c) + ' °C'}{h.details && ' · ' + h.details}
                  </li>
                ))}
                {c.vaccines.map((v, i) => (
                  <li key={'v' + i}><span className="badge ok">Vaccine</span> {formatDate(v.given_date)} · <b>{v.name}</b></li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
