import Keyboard from '../components/Keyboard';
import './TrainPage.css';

const TrainPage = () => {
  return (
    <div className="train-page">
      <h1>Тренировка слепой печати</h1>
      <div className="text-display">
        <p className="text-to-type">
          The quick brown fox jumps over the lazy dog.
        </p>
        <textarea
          className="typing-area"
          placeholder="Начните печатать здесь..."
          rows={3}
        />
      </div>
      <Keyboard />
    </div>
  );
};

export default TrainPage;