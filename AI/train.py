import torch
import torchvision
from torchvision import transforms
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from torchvision.models.detection import FasterRCNN
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import json
import os
from sklearn.metrics import f1_score, accuracy_score
from torchvision.ops import box_iou
from torchvision.ops import nms
from collections import defaultdict

# train_root_dir = r"/home/t24202/Dataset/dataset/train"
# val_root_dir = r"/home/t24202/Dataset/dataset/val"

train_root_dir = r"/home/t24202/Dataset/dataset/train"
val_root_dir = r"/home/t24202/Dataset/dataset/val"

#train_root_dir = r"/home/t24202/former_dataset/dataset/test"
#val_root_dir = r"/home/t24202/former_dataset/dataset/test"

# train_root_dir = r"/home/t24202/former_dataset/dataset/train"
# val_root_dir = r"/home/t24202/former_dataset/dataset/val"

print("dataset: main 1116", flush=True)


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

print("background: 0, A1: 1, A2: 2, A3: 3, A4: 4, A5: 5, A6: 6, A7: 7", flush=True)

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
                            #print('imagepath:', image_path, flush=True)
                            json_path = os.path.join(class_path, file.replace(".jpg", ".json"))
                            #print('jsonpath:', json_path, flush=True)

                            if os.path.exists(json_path):
                                with open(json_path, 'r', encoding='utf-8') as f:
                                    json_data = json.load(f)

                                if symptom_dir == 'no':
                                    label = class_map['A7']
                                else:
                                    lesions = json_data['metaData']['lesions']
                                    label = class_map.get(lesions, None)
                                    #if lesions == 'A6':    
                                        #print('imagepath:', image_path, flush=True)
                                        #print('jsonpath:', json_path, flush=True)
                                        #print('lesions:', lesions)
                                        #print('label:', label)

                                    if label is None:
                                        print(f"Warning: Unknown lesions '{lesions}' for file {file}", flush=True)
                                #print('label:', label, flush=True)
                                for labeling_info in json_data['labelingInfo']:
                                    if 'box' in labeling_info:
                                        bbox = labeling_info['box']['location'][0]
                                        #print('bbox:', bbox, flush=True)
                                        data.append((image_path, label, bbox))

        return data

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        image_path, label, bbox = self.data[idx]

        try:
            img = Image.open(image_path).convert("RGB")
            if self.transform:
                img = self.transform(img)

            x_min, y_min = bbox['x'], bbox['y']
            x_max, y_max = bbox['x'] + bbox['width'], bbox['y'] + bbox['height']
            #print('x_min:', x_min, 'y_min:', y_min, 'x_max:', x_max, 'y_max:', y_max, flush=True)
            
            if bbox['width'] <= 0 or bbox['height'] <= 0 or x_min >= x_max or y_min >= y_max:
                print(f"Warning: Invalid bounding box {bbox} for file {image_path}. Replacing with default bounding box.", flush=True)
                x_min, y_min, x_max, y_max = 0, 0, img.width, img.height

            target = {
                'boxes': torch.tensor([[x_min, y_min, x_max, y_max]], dtype=torch.float32),
                'labels': torch.tensor([label], dtype=torch.int64),
                'area': torch.tensor([(x_max - x_min) * (y_max - y_min)], dtype=torch.float32),
                'iscrowd': torch.tensor([0], dtype=torch.int64)
            }
            # print(f"boxes: {target['boxes'].shape}", flush=True)
            # print(f"labels: {target['labels'].shape}", flush=True)
            # print(f"area: {target['area'].shape}", flush=True)
            # print(f"iscrowd: {target['iscrowd'].shape}", flush=True)

            return img, target
        except Exception as e:
            print(f"Error loading image {image_path}: {e}", flush=True)
            return self.__getitem__((idx + 1) % len(self.data))

# Image preprocessing (use the same transformations)
train_transform = transforms.Compose([
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(degrees=10),
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
    transforms.ToTensor(),
])
print("yes aug", flush=True)

# Validation data transformations (without augmentations)
val_transform = transforms.Compose([
    transforms.ToTensor(),
])

# Create datasets with respective transforms
train_dataset = CustomDataset(root_dir=train_root_dir, transform=train_transform)
val_dataset = CustomDataset(root_dir=val_root_dir, transform=val_transform)

# Dataloaders
train_loader = DataLoader(train_dataset, batch_size=16, shuffle=True, collate_fn=lambda x: tuple(zip(*x)))
val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False, collate_fn=lambda x: tuple(zip(*x)))
print("batchsize: 16", flush=True)

# Define the model
model = fasterrcnn_resnet50_fpn(pretrained=True)
print("model: fasterrcnn_resnet50_fpn", flush=True)

# Modify the classifier head to match the number of classes (including background)
num_classes = 8  # 7 classes + background
in_features = model.roi_heads.box_predictor.cls_score.in_features
model.roi_heads.box_predictor = torchvision.models.detection.faster_rcnn.FastRCNNPredictor(in_features, num_classes)


# Loss function: already handled by Faster R-CNN
# Optimizer
optimizer = torch.optim.AdamW(model.parameters(), lr=0.0001, weight_decay=1e-5)
print("optimizer: adamw, lr: 0.0001, weight decay: 1e-5", flush=True)

# Move model to GPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model.to(device)

# Start training loop
#start_epoch = 0

# Load checkpoint to resume training
checkpoint = torch.load('best.pt')
model.load_state_dict(checkpoint['model_state_dict'])
optimizer.load_state_dict(checkpoint['optimizer_state_dict'])
start_epoch = checkpoint['epoch']
#running_loss = checkpoint['loss']

print('iou_threshold=0.5', flush=True)
def apply_nms(pred_boxes, pred_scores, iou_threshold=0.5):
    keep = nms(pred_boxes, pred_scores, iou_threshold)
    return keep

# Training loop
num_epochs = 20
for epoch in range(start_epoch, start_epoch + num_epochs):
    model.train()
    epoch_loss = 0.0
    for images, targets in train_loader:
        images = [image.to(device) for image in images]
        targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

        optimizer.zero_grad()
        loss_dict = model(images, targets)
        #print('train_loss_dict:', loss_dict, flush=True)

        if isinstance(loss_dict, dict):
            losses = sum(loss for loss in loss_dict.values())
            losses.backward()
            optimizer.step()
            epoch_loss += losses.item()
    
    avg_training_loss = epoch_loss / len(train_loader)

    # Validation step
    model.eval()
    val_loss = 0.0
    class_correct = defaultdict(int)
    class_total = defaultdict(int)
    class_fp = defaultdict(int)  # False Positives
    class_fn = defaultdict(int)  # False Negatives
    class_iou_scores = defaultdict(list)
    all_preds = []
    all_labels = []
    iou_scores = []
    iou_threshold = 0.5

    with torch.no_grad():
        for images, targets in val_loader:
            images = [image.to(device) for image in images]
            targets = [{k: v.to(device) for k, v in t.items()} for t in targets]

            # Get predictions (after NMS)
            outputs = model(images)
            
            for i, output in enumerate(outputs):
                pred_boxes = output['boxes'].cpu()
                pred_scores = output['scores'].cpu()
                pred_labels = output['labels'].cpu()

                # Apply NMS and filter predictions
                keep = apply_nms(pred_boxes, pred_scores)
                pred_boxes = pred_boxes[keep]
                pred_labels = pred_labels[keep]

                # Get ground truth for the current image
                true_boxes = targets[i]['boxes'].cpu()
                true_labels = targets[i]['labels'].cpu()

                matched_preds = []
                matched_labels = []
                used_true_indices = set()

                # Match each prediction to the best ground truth box using IoU
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

                # Extend all_preds and all_labels with matched pairs only
                all_preds.extend(matched_preds)
                all_labels.extend(matched_labels)

                # Per-class accuracy tracking
                for true_label in true_labels:
                    class_total[true_label.item()] += 1

                for pred, true in zip(matched_preds, matched_labels):
                    if pred == true:
                        class_correct[true] += 1

    accuracy = accuracy_score(all_labels, all_preds)
    f1 = f1_score(all_labels, all_preds, average='weighted')
    avg_iou = sum(iou_scores) / len(iou_scores) if iou_scores else 0.0
    
    

    print(f"Epoch {epoch + 1}/{num_epochs}, "
          f"Train Loss: {avg_training_loss:.4f}, "
          f"Accuracy: {accuracy:.4f}, "
          f"F1 Score: {f1:.4f}, "
          f"Avg IOU: {avg_iou:.4f}", flush=True)
    
    print("\nClass-wise Metrics:", flush=True)
    for cls, idx in class_map.items():
        tp = class_correct[idx]
        fp = class_fp[idx]
        fn = class_fn[idx]

        precision = tp / (tp + fp) if tp + fp > 0 else 0.0
        recall = tp / (tp + fn) if tp + fn > 0 else 0.0
        f1_score = 2 * (precision * recall) / (precision + recall) if precision + recall > 0 else 0.0
        avg_class_iou = sum(class_iou_scores[idx]) / len(class_iou_scores[idx]) if class_iou_scores[idx] else 0.0

        print(f"Class: {cls}", flush=True)
        print(f"  Precision: {precision:.4f}", flush=True)
        print(f"  Recall: {recall:.4f}", flush=True)
        print(f"  F1 Score: {f1_score:.4f}", flush=True)
        print(f"  Average IoU: {avg_class_iou:.4f}", flush=True)
    
    # Save checkpoint
    checkpoint = {
        'epoch': epoch + 1,
        'model_state_dict': model.state_dict(),
        'optimizer_state_dict': optimizer.state_dict(),
    }

    torch.save(checkpoint, f'fasterrcnn_checkpoints_1127/fasterrcnn_1127_{epoch}.pt')

print("Training complete", flush=True)
