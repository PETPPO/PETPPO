import torch
import torchvision
import os
import json
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from PIL import Image
from sklearn.metrics import accuracy_score, f1_score
from torchvision.ops import box_iou, nms
from collections import defaultdict



# Define paths and load model checkpoint
test_root_dir = r"/home/t24202/former_dataset/dataset/test"  # Adjust this to your test data path
checkpoint_path = r"best.pt"

class_map = {
    'background': 0,
    'A1': 1,
    'A2': 2,
    'A3': 3,
    'A4': 4,
    'A5': 5,
    'A6': 6,
    'A7': 7  # no disease
}

class CustomDataset(Dataset):
    def __init__(self, root_dir, transform=None):
        self.root_dir = root_dir
        self.transform = transform
        self.data = self.load_data()

    def load_data(self):
        data = []
        for symptom_dir in ['yes', 'no']:
            symptom_path = os.path.join(self.root_dir, symptom_dir)
            for class_dir in os.listdir(symptom_path):
                class_path = os.path.join(symptom_path, class_dir)
                if os.path.isdir(class_path):
                    for file in os.listdir(class_path):
                        if file.endswith(".jpg"):
                            image_path = os.path.join(class_path, file)
                            #print('image_path:', image_path)
                            json_path = os.path.join(class_path, file.replace(".jpg", ".json"))

                            if os.path.exists(json_path):
                                with open(json_path, 'r', encoding='utf-8') as f:
                                    json_data = json.load(f)

                                if symptom_dir == 'no':
                                    label = class_map['A7']
                                else:
                                    lesions = json_data['metaData']['lesions']
                                    label = class_map.get(lesions, None)
                                    #print('label:', label)

                                    if label is None:
                                        print(f"Warning: Unknown lesions '{lesions}' for file {file}", flush=True)

                                for labeling_info in json_data['labelingInfo']:
                                    if 'box' in labeling_info:
                                        bbox = labeling_info['box']['location'][0]
                                        data.append((image_path, label, bbox))

        return data

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        image_path, label, bbox = self.data[idx]
        #print('image_path:', image_path)
        #print('label:', label)

        try:
            img = Image.open(image_path).convert("RGB")
            if self.transform:
                img = self.transform(img)

            x_min, y_min = bbox['x'], bbox['y']
            x_max, y_max = bbox['x'] + bbox['width'], bbox['y'] + bbox['height']
            
            if bbox['width'] <= 0 or bbox['height'] <= 0 or x_min >= x_max or y_min >= y_max:
                print(f"Warning: Invalid bounding box {bbox} for file {image_path}. Replacing with default bounding box.", flush=True)
                x_min, y_min, x_max, y_max = 0, 0, img.width, img.height

            target = {
                'boxes': torch.tensor([[x_min, y_min, x_max, y_max]], dtype=torch.float32),
                'labels': torch.tensor([label], dtype=torch.int64),
                'area': torch.tensor([(x_max - x_min) * (y_max - y_min)], dtype=torch.float32),
                'iscrowd': torch.tensor([0], dtype=torch.int64)
            }

            return img, target, image_path
        except Exception as e:
            print(f"Error loading image {image_path}: {e}", flush=True)
            return self.__getitem__((idx + 1) % len(self.data))


val_transform = transforms.Compose([
    transforms.ToTensor(),
])

# Define test dataset and data loader
test_dataset = CustomDataset(root_dir=test_root_dir, transform=val_transform)
test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False, collate_fn=lambda x: tuple(zip(*x)))

# Load the model and set it to evaluation mode
model = fasterrcnn_resnet50_fpn(pretrained=False)
num_classes = 8  # 7 classes + background
in_features = model.roi_heads.box_predictor.cls_score.in_features
model.roi_heads.box_predictor = torchvision.models.detection.faster_rcnn.FastRCNNPredictor(in_features, num_classes)

# Load checkpoint
checkpoint = torch.load(checkpoint_path)
model.load_state_dict(checkpoint['model_state_dict'])
model.eval()
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# Define NMS threshold
iou_threshold = 0.5

# Metrics containers
class_correct = defaultdict(int)
class_total = defaultdict(int)
class_fp = defaultdict(int)  # False Positives
class_fn = defaultdict(int)  # False Negatives
class_iou_scores = defaultdict(list)

# For overall metrics
all_preds = []
all_labels = []
iou_scores = []
image_paths_list = []

# Evaluation loop
with torch.no_grad():
    for images, targets, image_paths in test_loader:
        images = [image.to(device) for image in images]
        targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

        outputs = model(images)

        for i, output in enumerate(outputs):
            pred_boxes = output['boxes'].cpu()
            pred_scores = output['scores'].cpu()
            pred_labels = output['labels'].cpu()

            # Apply NMS
            keep = nms(pred_boxes, pred_scores, iou_threshold)
            pred_boxes = pred_boxes[keep]
            pred_labels = pred_labels[keep]

            true_boxes = targets[i]['boxes'].cpu()
            true_labels = targets[i]['labels'].cpu()

            matched_preds = []
            matched_labels = []
            used_true_indices = set()

            # Calculate IoU for matched boxes
            if len(pred_boxes) > 0 and len(true_boxes) > 0:
                iou_matrix = box_iou(pred_boxes, true_boxes)

                for j, pred_label in enumerate(pred_labels):
                    max_iou, max_idx = iou_matrix[j].max(0)
                    if max_iou >= iou_threshold and max_idx.item() not in used_true_indices:
                        matched_preds.append(pred_label.item())
                        matched_labels.append(true_labels[max_idx].item())
                        iou_scores.append(max_iou.item())
                        class_iou_scores[pred_label.item()].append(max_iou.item())
                        used_true_indices.add(max_idx.item())
                    else:
                        class_fp[pred_label.item()] += 1  # False Positive

            # Add unmatched true boxes to False Negatives
            for k, true_label in enumerate(true_labels):
                if k not in used_true_indices:
                    class_fn[true_label.item()] += 1  # False Negative

            # Store predictions and labels
            all_preds.extend(matched_preds)
            all_labels.extend(matched_labels)
            image_paths_list.extend([image_paths[i]] * len(matched_preds))

            # Per-class accuracy tracking
            for true_label in true_labels:
                class_total[true_label.item()] += 1

            for pred, true in zip(matched_preds, matched_labels):
                if pred == true:
                    class_correct[true] += 1

# Calculate overall metrics
accuracy = accuracy_score(all_labels, all_preds)
f1 = f1_score(all_labels, all_preds, average='weighted')
avg_iou = sum(iou_scores) / len(iou_scores) if iou_scores else 0.0

# Print class-wise metrics
print("\nClass-wise Metrics:")
for cls, idx in class_map.items():
    tp = class_correct[idx]
    fp = class_fp[idx]
    fn = class_fn[idx]

    precision = tp / (tp + fp) if tp + fp > 0 else 0.0
    recall = tp / (tp + fn) if tp + fn > 0 else 0.0
    f1_score = 2 * (precision * recall) / (precision + recall) if precision + recall > 0 else 0.0
    avg_class_iou = sum(class_iou_scores[idx]) / len(class_iou_scores[idx]) if class_iou_scores[idx] else 0.0

    print(f"Class: {cls}")
    print(f"  Precision: {precision:.4f}")
    print(f"  Recall: {recall:.4f}")
    print(f"  F1 Score: {f1_score:.4f}")
    print(f"  Average IoU: {avg_class_iou:.4f}")

# Print overall metrics
print(f"\nTest Accuracy: {accuracy:.4f}")
print(f"Test F1 Score: {f1:.4f}")
print(f"Average IoU: {avg_iou:.4f}")

# Print image paths with predictions
# for path, pred, label in zip(image_paths_list, all_preds, all_labels):
#     print(f"Image Path: {path}, Predicted Class: {pred}, True Class: {label}")