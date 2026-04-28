from app.ai.data_loader import load_dataset

images, labels = load_dataset()

print("✅ Dataset Loaded Successfully")
print("Total Images:", len(images))
print("Total Labels:", len(labels))

# Show first 5 labels
print("Sample Labels:", labels[:5])