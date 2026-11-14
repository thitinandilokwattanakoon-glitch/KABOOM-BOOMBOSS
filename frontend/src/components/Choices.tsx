const LETTERS = ['A', 'B', 'C', 'D'];

interface Props {
  choices: string[];
  /** The option the player picked (-1 = none). */
  picked?: number;
  /** Set only once the answer is revealed. */
  correctIndex?: number;
  /** Players can tap; the teacher's screen only displays. */
  onPick?: (i: number) => void;
  disabled?: boolean;
}

export function Choices({ choices, picked = -1, correctIndex, onPick, disabled }: Props) {
  return (
    <div className="choices menu">
      {choices.map((c, i) => {
        const cls = ['choice-btn'];
        if (i === picked) cls.push('picked');
        if (correctIndex !== undefined) {
          if (i === correctIndex) cls.push('correct');
          else if (i === picked) cls.push('wrong-pick');
          else cls.push('dim');
        }
        const body = (
          <>
            <span className="choice-letter">{LETTERS[i]}</span>
            <span>{c}</span>
          </>
        );
        return onPick ? (
          <button key={i} type="button" className={cls.join(' ')} disabled={disabled} onClick={() => onPick(i)}>
            {body}
          </button>
        ) : (
          <div key={i} className={cls.join(' ')}>
            {body}
          </div>
        );
      })}
    </div>
  );
}
