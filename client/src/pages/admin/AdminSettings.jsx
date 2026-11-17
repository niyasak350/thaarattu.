import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useSettings } from '../../SettingsContext';
import Logo from '../../components/Logo';
import { readPhoto } from '../../photo';

export default function AdminSettings() {
  const settings = useSettings();
  const [name, setName] = useState(settings.app_name);
  const [tagline, setTagline] = useState(settings.tagline);
  const [video, setVideo] = useState(settings.intro_video);
  const [seconds, setSeconds] = useState(settings.intro_seconds);
  const [note, setNote] = useState(settings.creators_note);
  const [hero, setHero] = useState(settings.hero_image);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    setName(settings.app_name); setTagline(settings.tagline);
    setVideo(settings.intro_video); setSeconds(settings.intro_seconds); setNote(settings.creators_note); setHero(settings.hero_image);
  }, [settings.hero_image, settings.app_name, settings.tagline, settings.intro_video, settings.intro_seconds, settings.creators_note]);

  async function save(e) {
    e.preventDefault();
    setMessage(''); setError('');
    try {
      await api('/admin/settings', 'PUT', { app_name: name, tagline, intro_video: video, intro_seconds: seconds, creators_note: note, hero_image: hero });
      await settings.reload(); // the new name shows everywhere straight away
      setMessage('Saved. The changes are now live across the site.');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h2>Site Settings</h2>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <form className="card narrow" onSubmit={save}>
        <h3>App name and tagline</h3>
        <label>App name
          <input value={name} maxLength="60" onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>Tagline
          <input value={tagline} maxLength="200" onChange={(e) => setTagline(e.target.value)} />
        </label>
        <p className="label">Preview</p>
        <p className="brand"><Logo /> <span>{name || 'App name'}</span></p>
        <p className="muted">{tagline}</p>
        <p className="muted">The name appears in the menu, the browser tab, the opening screen, and the login and landing pages.</p>

        <h3 style={{ marginTop: 24 }}>First page picture</h3>
        <p className="muted">The big picture on the first page. Leave it empty to show the mother and baby picture.</p>
        <span className="photo-pick">
          {hero && <img className="thumb" src={hero} alt="" />}
          <input type="file" accept="image/*" onChange={async (e) => {
            if (!e.target.files[0]) return;
            try { setHero(await readPhoto(e.target.files[0], { size: 900, square: true })); } catch (err) { setError(err.message); }
          }} />
          {hero && <button type="button" className="small ghost" onClick={() => setHero('')}>Remove</button>}
        </span>
        <p className="muted">Use your own photos, or photos you have permission to use.</p>

        <h3 style={{ marginTop: 24 }}>Creators page</h3>
        <label>Text under the heading
          <input value={note} maxLength="250" onChange={(e) => setNote(e.target.value)} placeholder="e.g. Final year project, Department of CS, XYZ College" />
        </label>
        <p className="muted">Add or edit the people themselves under <b>Creators</b> in the menu.</p>

        <h3 style={{ marginTop: 24 }}>Opening video (intro)</h3>
        <p className="muted">
          The intro plays every time someone opens or refreshes the site. Leave the link empty to
          use the built-in animation.
        </p>
        <label>Video link
          <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://www.youtube.com/watch?v=... or https://.../intro.mp4" />
        </label>
        <label>Seconds to show a YouTube video (2 to 60)
          <input type="number" min="2" max="60" value={seconds} onChange={(e) => setSeconds(e.target.value)} />
        </label>
        <p className="muted">
          You can paste a YouTube link, or a direct link to an .mp4 or .webm file. To use your own file
          without uploading it anywhere, copy it into the <b>client/public</b> folder as <b>intro.mp4</b> and
          type <b>/intro.mp4</b> here. Videos play without sound, because browsers block sound on autoplay.
          A video file closes when it ends.
        </p>
        <button>Save</button>{' '}
        <button type="button" className="ghost" onClick={() => window.dispatchEvent(new Event('play-intro'))}>Preview saved intro</button>
      </form>
    </>
  );
}
