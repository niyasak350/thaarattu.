// Illustration: a mother holding her sleeping newborn.
// Her dress, sleeves and the little hearts use the theme colours (see .mother-baby in styles.css).
export default function MotherBaby() {
  return (
    <svg className="mother-baby" viewBox="0 0 240 252" aria-hidden="true">
      <path className="float one" d="M0 4C-6-2-4-8 0-5 4-8 6-2 0 4Z" transform="translate(204 46) scale(2.2)" style={{ fill: 'var(--primary)' }} />
      <path className="float two" d="M0 4C-6-2-4-8 0-5 4-8 6-2 0 4Z" transform="translate(34 62) scale(1.5)" style={{ fill: 'var(--heart)' }} />
      <path className="float three" d="M0 4C-6-2-4-8 0-5 4-8 6-2 0 4Z" transform="translate(214 104) scale(1.2)" style={{ fill: 'var(--heart)' }} />
      <path d="M72 88c0-38 21-60 52-60s52 22 52 60c0 38-4 74-10 104H82c-6-30-10-66-10-104z" fill="#4a302b" />
      <path d="M30 252c2-52 34-86 94-86s92 34 94 86z" style={{ fill: 'var(--primary)' }} />
      <path d="M111 128h26v28q-13 12-26 0z" fill="#eab79c" />
      <g transform="rotate(-9 124 100)">
      <circle cx="124" cy="94" r="39" fill="#f6d2bd" />
      <path d="M84 92c0-29 17-48 42-48 24 0 39 18 39 44-15-3-26-11-33-25-8 16-26 27-48 29z" fill="#4a302b" />
      <circle cx="128" cy="36" r="14" fill="#4a302b" />
      <path d="M104 102q7 5 14 0M131 102q7 5 14 0" fill="none" stroke="#3b2a2a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M122 108q2 4 5 4" fill="none" stroke="#3b2a2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M116 119q9 6 18 0" fill="none" stroke="#3b2a2a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy="113" r="6" fill="#f2a391" opacity=".5" />
      <circle cx="149" cy="113" r="6" fill="#f2a391" opacity=".5" />
      </g>
      <path d="M188 190q14 14 2 34" fill="none" style={{ stroke: 'var(--arm)' }} strokeWidth="26" strokeLinecap="round" />
      <g transform="rotate(-7 120 200)">
      <path d="M100 178c26-10 76-6 92 16 8 14-10 32-48 34-30 1-50-10-56-24z" fill="#bfd0ee" />
      <path d="M104 190c24 6 52 6 84-2M120 226c20-6 38-16 54-34" fill="none" stroke="#9db4dd" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M96 176c10 10 14 26 8 42" fill="none" stroke="#9db4dd" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="55" cy="192" rx="6" ry="8" fill="#eab79c" />
      <circle cx="82" cy="190" r="29" fill="#f6d2bd" />
      <path d="M55 184c2-20 18-31 36-27 12 3 19 11 20 22-10-9-21-13-33-11-9 2-17 7-23 16z" fill="#4a302b" />
      <path d="M68 193q6 5 12 0M90 191q6 5 12 0" fill="none" stroke="#3b2a2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M83 197q0 4 4 4" fill="none" stroke="#3b2a2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M80 208q6 4 11-1" fill="none" stroke="#3b2a2a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="68" cy="204" r="5.500" fill="#f2a391" opacity=".5" />
      <circle cx="103" cy="201" r="5.500" fill="#f2a391" opacity=".5" />
      <circle cx="119" cy="207" r="7.500" fill="#f6d2bd" />
      <path d="M114 205q5-4 10 0" fill="none" stroke="#3b2a2a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path d="M40 218q60 44 142 6" fill="none" style={{ stroke: 'var(--arm)' }} strokeWidth="26" strokeLinecap="round" />
      <path d="M172 212c8-6 22-4 26 6 3 9-4 17-14 17-12 0-19-14-12-23z" fill="#f6d2bd" />
      <path d="M180 220q8-3 14 2M178 227q8-2 13 2" fill="none" stroke="#3b2a2a" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 208c8-5 20-2 22 8 2 9-6 16-15 14-11-2-15-16-7-22z" fill="#f6d2bd" />
    </svg>
  );
}
