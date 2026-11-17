import { Link } from 'react-router-dom';

// Shown whenever the app suggests reaching out for help
export default function SupportNote({ children }) {
  return (
    <div className="card notice">
      {children}
      <p>
        Please talk to someone you trust or a doctor. In India you can call Tele-MANAS free
        at <a href="tel:14416"><b>14416</b></a>, any time.
      </p>
      <Link to="/hospitals">Find a doctor near you</Link> · <Link to="/emergency">Emergency contacts</Link>
    </div>
  );
}
