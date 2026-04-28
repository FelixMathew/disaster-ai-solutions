import { useState } from "react";
import axios from "axios";

const WildfirePrediction = () => {

  const [temperature, setTemperature] = useState("");
  const [humidity, setHumidity] = useState("");
  const [result, setResult] = useState("");

  const handlePredict = async () => {

    try {

      const response = await axios.post(
        "/api/predict/wildfire",
        null,
        {
          params: {
            temperature: parseFloat(temperature),
            humidity: parseFloat(humidity)
          }
        }
      );

      setResult(response.data.prediction);

    } catch (error) {

      setResult("Prediction failed");

    }

  };

  return (
    <div className="glass-card p-6">

      <h2 className="text-lg font-bold mb-4">
        Wildfire Prediction
      </h2>

      <div className="flex gap-2">

        <input
          type="number"
          placeholder="Temperature"
          value={temperature}
          onChange={(e)=>setTemperature(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <input
          type="number"
          placeholder="Humidity"
          value={humidity}
          onChange={(e)=>setHumidity(e.target.value)}
          className="border p-2 rounded w-full"
        />

        <button
          onClick={handlePredict}
          className="bg-blue-600 text-white px-4 rounded"
        >
          Predict
        </button>

      </div>

      {result && (
        <p className="mt-3 font-semibold">
          Result: {result}
        </p>
      )}

    </div>
  );
};

export default WildfirePrediction;