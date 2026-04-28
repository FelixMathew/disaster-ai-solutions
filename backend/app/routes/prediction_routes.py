from fastapi import APIRouter
from app.ai.flood_model import predict_flood
from app.ai.cyclone_model import predict_cyclone
from app.ai.wildfire_model import predict_wildfire
from app.ai.earthquake_model import predict_earthquake

router = APIRouter()


@router.post("/predict/flood")
def flood_prediction(rainfall: float, river_level: float):

    result = predict_flood(rainfall, river_level)

    return {"prediction": result}


@router.post("/predict/cyclone")
def cyclone_prediction(
    wind_speed: float, 
    pressure: float, 
    humidity: float = 80, 
    sst: float = 28, 
    visibility: float = 5
):

    result = predict_cyclone(wind_speed, pressure, humidity, sst, visibility)

    return result


@router.post("/predict/wildfire")
def wildfire_prediction(temperature: float, humidity: float):

    result = predict_wildfire(temperature, humidity)

    return {"prediction": result}


@router.post("/predict/earthquake")
def earthquake_prediction(seismic_activity: float, fault_distance: float):

    result = predict_earthquake(seismic_activity, fault_distance)

    return {"prediction": result}