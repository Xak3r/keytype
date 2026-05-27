import './KeyboardHeatmap.css';

interface KeyboardHeatmapProps {
  errorKeys: Record<string, number>;
}

const rows = [
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'],
  ['Caps', 'a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'Enter'],
  ['Shift', 'z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Alt', 'Space', 'Alt', 'Ctrl'],
];

// Цвет от зелёного к красному в зависимости от доли ошибок
const getHeatColor = (count: number, maxCount: number): string => {
  if (maxCount === 0) return '#0f3460';
  const ratio = count / maxCount;
  // Градиент от зелёного (0 ошибок) к красному (максимум)
  const r = Math.round(255 * ratio);
  const g = Math.round(255 * (1 - ratio));
  return `rgb(${r}, ${g}, 0)`;
};

const KeyboardHeatmap: React.FC<KeyboardHeatmapProps> = ({ errorKeys }) => {
  const maxErrors = Math.max(...Object.values(errorKeys), 1);

  return (
    <div className="keyboard-heatmap">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key) => {
            const count = errorKeys[key.toLowerCase()] || 0;
            const bgColor = getHeatColor(count, maxErrors);
            return (
              <div
                key={key}
                className="key heatmap-key"
                style={{ backgroundColor: bgColor }}
                title={`${key}: ${count} ошибок`}
              >
                {key === 'Space' ? '␣' : key}
              </div>
            );
          })}
        </div>
      ))}
      <div className="heatmap-legend">
        <span className="legend-label">Меньше ошибок</span>
        <div className="legend-gradient"></div>
        <span className="legend-label">Больше ошибок</span>
      </div>
    </div>
  );
};

export default KeyboardHeatmap;