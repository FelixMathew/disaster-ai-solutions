from tensorflow.keras.models import load_model

try:
    load_model('d:/MINOR/backend/disaster_model_resnet.keras', compile=False)
except Exception as e:
    print("CHUNKING ERROR:")
    err_str = repr(e)
    # Print the first 1000 and last 1000 chars to skip the 30kb layer dump
    if len(err_str) > 2000:
        print(err_str[:1000])
        print("\n\n...[SKIPPED]...\n\n")
        print(err_str[-1000:])
    else:
        print(err_str)
