import { useEffect, useState } from 'react';
import { api } from '../../api';

const LETTERS = ['a', 'b', 'c', 'd'];
const shuffle = (list) => [...list].sort(() => Math.random() - 0.5);

export default function Quiz() {
  const [all, setAll] = useState([]);
  const [questions, setQuestions] = useState([]); // the 5 chosen for this round
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => { api('/content/quiz').then((list) => { setAll(list); setQuestions(shuffle(list).slice(0, 5)); }); }, []);

  function restart() {
    setQuestions(shuffle(all).slice(0, 5)); setIndex(0); setPicked(null); setScore(0);
  }

  function pick(letter) {
    if (picked) return;
    setPicked(letter);
    if (letter === questions[index].correct) setScore(score + 1);
  }

  if (!questions.length) return <p className="muted">No quiz questions yet.</p>;

  if (index >= questions.length) {
    return (
      <section className="card center-text">
        <h3>Quiz finished</h3>
        <p className="score">{score} <span className="muted">out of {questions.length}</span></p>
        <p className="muted">{score === questions.length ? 'Perfect score!' : 'Every question you read teaches you something new.'}</p>
        <button onClick={restart}>Play again</button>
      </section>
    );
  }

  const q = questions[index];
  return (
    <section className="card narrow" style={{ margin: '0 auto 20px' }}>
      <p className="muted">Question {index + 1} of {questions.length} · Score {score}</p>
      <h3>{q.question}</h3>
      {LETTERS.map((letter) => {
        let look = 'quiz-option';
        if (picked && letter === q.correct) look += ' right';
        else if (picked === letter) look += ' wrong';
        return (
          <button key={letter} type="button" className={look} onClick={() => pick(letter)}>{q['option_' + letter]}</button>
        );
      })}
      {picked && (
        <>
          <p className={picked === q.correct ? 'success' : 'error'}>
            {picked === q.correct ? 'Correct. ' : 'Not quite. '}{q.explanation}
          </p>
          <button onClick={() => { setIndex(index + 1); setPicked(null); }}>
            {index + 1 === questions.length ? 'See my score' : 'Next question'}
          </button>
        </>
      )}
    </section>
  );
}
