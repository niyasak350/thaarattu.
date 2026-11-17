import { useEffect, useState } from 'react';
import { useSettings } from '../SettingsContext';
import MotherBaby from './MotherBaby';

// Works out what kind of link the admin gave for the intro video
export function readVideoLink(link) {
  if (!link) return { kind: 'none' };
  const youtube = link.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{6,})/);
  if (youtube) {
    return {
      kind: 'youtube',
      src: `https://www.youtube.com/embed/${youtube[1]}?autoplay=1&mute=1&controls=0&rel=0&playsinline=1`,
    };
  }
  return { kind: 'file', src: link }; // a direct link to an .mp4 / .webm file
}

// Opening screen. Plays every time the site is opened or the page is refreshed.
// The admin can replace the built-in animation with a video (Admin > Site Settings).
export default function Intro() {
  const { app_name, tagline, intro_video, intro_seconds, loaded } = useSettings();
  const [phase, setPhase] = useState('show'); // show -> leaving -> gone
  const [failed, setFailed] = useState(false); // the video could not be played
  const video = failed ? { kind: 'none' } : readVideoLink(intro_video);

  const close = () => setPhase((p) => (p === 'show' ? 'leaving' : p));

  // "Preview intro" in the admin settings plays it again
  useEffect(() => {
    const replay = () => { setFailed(false); setPhase('show'); };
    window.addEventListener('play-intro', replay);
    return () => window.removeEventListener('play-intro', replay);
  }, []);

  // close by itself: the built-in animation after 4 seconds, a YouTube video after the set time.
  // A video file closes when it ends (see onEnded below), or after 60 seconds at most.
  useEffect(() => {
    if (phase !== 'show' || !loaded) return;
    const seconds = video.kind === 'none' ? 4 : video.kind === 'youtube' ? Number(intro_seconds) || 6 : 60;
    const timer = setTimeout(close, seconds * 1000);
    return () => clearTimeout(timer);
  }, [phase, loaded, video.kind, intro_seconds]);

  // after the fade-out, remove it from the page
  useEffect(() => {
    if (phase !== 'leaving') return;
    const timer = setTimeout(() => setPhase('gone'), 500);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'gone') return null;
  return (
    <div className={phase === 'leaving' ? 'intro leaving' : 'intro'}>
      <div className="intro-stage">
        {loaded && video.kind === 'file' && (
          <video src={video.src} autoPlay muted playsInline onEnded={close} onError={() => setFailed(true)} />
        )}
        {loaded && video.kind === 'youtube' && (
          <iframe src={video.src} title="Intro video" allow="autoplay; encrypted-media" />
        )}
        {loaded && video.kind === 'none' && (
          <>
            <div className="intro-mark"><MotherBaby /></div>
            <h1 className="intro-name">{app_name}</h1>
            <p className="intro-tag">{tagline}</p>
            <div className="intro-bar"><i /></div>
          </>
        )}
        <button type="button" className="small intro-skip" onClick={close}>Skip</button>
      </div>
    </div>
  );
}
