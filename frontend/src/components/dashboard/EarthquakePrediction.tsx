import { useState } from "react";
import axios from "axios";

const EarthquakePrediction = () => {

  const [seismicActivity, setSeismicActivity] = useState("");
  const [faultDistance, setFaultDistance] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {

    if (!seismicActivity || !faultDistance) {
      setResult("Please enter all values");
      return;
    }

    try {

      setLoading(true);
      setResult("");

      const response = await axios.post(
        "/api/predict/earthquake",
        null,
        {
          params: {
            seismic_activity: parseFloat(seismicActivity),
            fault_distance: parseFloat(faultDistance)
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
        Earthquake Prediction
      </h2>

      <div className="flex gap-3">

        <input
          type="number"
          placeholder="Seismic Activity"
          value={seismicActivity}
          onChange={(e) => setSeismicActivity(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <input
          type="number"
          placeholder="Fault Distance"
          value={faultDistance}
          onChange={(e) => setFaultDistance(e.target.value)}
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

export default EarthquakePrediction;