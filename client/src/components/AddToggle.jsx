import { Plus } from 'lucide-react';

// Keeps "add" forms out of the way: shows one button, and the form only after it is pressed.
//   <AddToggle label="Add a baby" open={open} onOpen={() => setOpen(true)}> ...form... </AddToggle>
export default function AddToggle({ label, open, onOpen, children }) {
  if (open) return children;
  return (
    <p className="add-row">
      <button type="button" onClick={onOpen}><Plus size={18} /> {label}</button>
    </p>
  );
}
