import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Password box with a show / hide button
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="password">
      <input {...props} type={visible ? 'text' : 'password'} />
      <button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? 'Hide password' : 'Show password'}>
        {visible ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </span>
  );
}
