import { useState } from "react";
import axios from "axios";

const FloodPrediction = () => {

  const [rainfall, setRainfall] = useState("");
  const [riverLevel, setRiverLevel] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {

    if (!rainfall || !riverLevel) {
      setResult("Please enter all values");
      return;
    }

    try {

      setLoading(true);
      setResult("");

      const response = await axios.post(
        "/api/predict/flood",
        null,
        {
          params: {
            rainfall: parseFloat(rainfall),
            river_level: parseFloat(riverLevel)
          }
        }
      );

      setResult(response.data.prediction);

    } catch (error) {

      setResult("Prediction failed");

    } finally {

      setLoading(false);

    }
  };

  return (
    <div className="glass-card p-6">

      <h2 className="text-lg font-bold mb-4">
        Flood Prediction
      </h2>

      <div className="flex gap-3">

        <input
          type="number"
          placeholder="Rainfall"
          value={rainfall}
          onChange={(e) => setRainfall(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <input
          type="number"
          placeholder="River Level"
          value={riverLevel}
          onChange={(e) => setRiverLevel(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <button
          onClick={handlePredict}
          className="bg-blue-600 text-white px-4 rounded"
        >
          {loading ? "Predicting..." : "Predict"}
        </button>

      </div>

      {result && (
        <p className="mt-4 font-semibold text-sm">
          Result: {result}
        </p>
      )}

    </div>
  );
};

export default FloodPrediction;