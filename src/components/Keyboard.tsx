import './Keyboard.css';

interface KeyboardProps {
  activeKey: string | null;
  expectedKey: string | null;
}

const rows = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl'],
];

const Keyboard: React.FC<KeyboardProps> = ({ activeKey, expectedKey }) => {
  return (
    <div className="keyboard">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key, keyIndex) => {
            const isActive = activeKey?.toLowerCase() === key.toLowerCase();
            const isExpected = expectedKey?.toLowerCase() === key.toLowerCase();
            let className = 'key';
            if (key.length > 1) className += ' wide';
            if (isActive) className += ' active';
            if (isExpected && !isActive) className += ' expected';
            return (
              <div key={`${rowIndex}-${key}-${keyIndex}`} className={className}>
                {key === 'Space' ? '␣' : key}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Keyboard;