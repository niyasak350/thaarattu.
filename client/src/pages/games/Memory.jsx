import { useEffect, useState } from 'react';
import { Bird, Cloud, Flower, Heart, Leaf, Moon, Music, Sun } from 'lucide-react';

const ICONS = [Bird, Cloud, Flower, Heart, Leaf, Moon, Music, Sun];

// 16 cards: every icon twice, in random order
function newDeck() {
  return [...ICONS, ...ICONS]
    .map((Icon, i) => ({ id: i, Icon, order: Math.random() }))
    .sort((a, b) => a.order - b.order);
}

export default function Memory() {
  const [deck, setDeck] = useState(newDeck);
  const [open, setOpen] = useState([]);       // ids of the (up to 2) cards turned over now
  const [matched, setMatched] = useState([]); // ids of cards already paired
  const [moves, setMoves] = useState(0);

  // when two cards are open, check them after a short pause
  useEffect(() => {
    if (open.length !== 2) return;
    const [a, b] = open.map((id) => deck.find((c) => c.id === id));
    const timer = setTimeout(() => {
      if (a.Icon === b.Icon) setMatched((m) => [...m, a.id, b.id]);
      setOpen([]);
    }, 700);
    return () => clearTimeout(timer);
  }, [open]);

  function flip(card) {
    if (open.length === 2 || open.includes(card.id) || matched.includes(card.id)) return;
    setOpen([...open, card.id]);
    if (open.length === 1) setMoves(moves + 1);
  }

  function restart() {
    setDeck(newDeck()); setOpen([]); setMatched([]); setMoves(0);
  }

  const won = matched.length === deck.length;

  return (
    <section className="card">
      <div className="game-bar">
        <span>Moves <b>{moves}</b></span>
        <span>Pairs <b>{matched.length / 2} / {ICONS.length}</b></span>
      </div>
      {won && <p className="success center-text">Well done! You found every pair in {moves} moves.</p>}
      <div className="memory">
        {deck.map((card) => {
          const up = open.includes(card.id) || matched.includes(card.id);
          return (
            <button key={card.id} type="button" onClick={() => flip(card)} aria-label={up ? 'Open card' : 'Hidden card'}
              className={matched.includes(card.id) ? 'up matched' : up ? 'up' : ''}>
              <card.Icon size={30} />
            </button>
          );
        })}
      </div>
      <p className="center-text"><button className="ghost" onClick={restart}>New game</button></p>
    </section>
  );
}
