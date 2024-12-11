import os
import torch
import torchvision
from torchvision import transforms
from torchvision.models.detection import fasterrcnn_resnet50_fpn
from PIL import Image, ImageDraw
from torchvision.ops import nms
import warnings
warnings.filterwarnings("ignore")


# Directory where your images are stored
image_dir = r"/home/t24202/svr/src/uploads"
#image_dir = r"/home/t24202/svr/yonghwan/Backend1"

# Get the most recently modified image file
# image_files = [f for f in os.listdir(image_dir) if f.endswith(('jpg', 'png', 'jpeg'))]
# image_files.sort(key=lambda f: os.path.getmtime(os.path.join(image_dir, f)), reverse=True)  # Sort by modification time
# image_path = os.path.join(image_dir, image_files[0])  # Take the most recently modified image

image_files = [f for f in os.listdir(image_dir) if f.endswith(('jpg', 'png', 'jpeg'))]
image_files.sort(key=lambda f: os.path.getmtime(os.path.join(image_dir, f)), reverse=True)  # Sort by modification time
image_path = os.path.join(image_dir, image_files[0])  # Take the most recently modified image


#print('image_path:', image_path, flush=True)

# Class mapping
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
reverse_class_map = {v: k for k, v in class_map.items()}

# Load and preprocess the image
val_transform = transforms.Compose([transforms.ToTensor()])
img = Image.open(image_path).convert("RGB")
original_img = img.copy()  # Save original image for drawing
img = val_transform(img)

# Load the model and set it to evaluation mode
#model = fasterrcnn_resnet50_fpn(pretrained=False)
model = fasterrcnn_resnet50_fpn(weights=None)
num_classes = 8  # 7 classes + background
in_features = model.roi_heads.box_predictor.cls_score.in_features
model.roi_heads.box_predictor = torchvision.models.detection.faster_rcnn.FastRCNNPredictor(in_features, num_classes)

# Load model checkpoint
#checkpoint_path = r"/home/t24202/Dataset/src/fasterrcnn_checkpoints_11101800/fasterrcnn_11101800_17.pt"
#checkpoint_path = r"saved_model/fasterrcnn_A567_best.pt"
checkpoint = torch.load('/home/t24202/svr/src/saved_model/best.pt')
model.load_state_dict(checkpoint['model_state_dict'])
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = model.to(device)

model.eval()

# Define NMS threshold
iou_threshold = 0.5

# Perform inference
with torch.no_grad():
    img = img.to(device).unsqueeze(0)  # Add batch dimension
    output = model(img)[0]

    pred_boxes = output['boxes'].cpu()
    pred_scores = output['scores'].cpu()
    pred_labels = output['labels'].cpu()

    # Apply NMS
    keep = nms(pred_boxes, pred_scores, iou_threshold)
    pred_boxes = pred_boxes[keep]
    pred_scores = pred_scores[keep]
    pred_labels = pred_labels[keep]

    # Draw bounding boxes on the image
    draw = ImageDraw.Draw(original_img)

    #if len(pred_scores) > 0:
    for box, score, label in zip(pred_boxes, pred_scores, pred_labels):
        box = box.tolist()
        x_min, y_min, x_max, y_max = box
        class_name = reverse_class_map[label.item()]
        confidence = score.item()

        # Draw the box and add text
        draw.rectangle([x_min, y_min, x_max, y_max], outline="red", width=3)
        draw.text((x_min, y_min - 10), f"{class_name} ({confidence:.2f})", fill="red")

    max_score_idx = pred_scores.argmax()
    pred_label = pred_labels[max_score_idx].item()
    pred_box = pred_boxes[max_score_idx].tolist()
    pred_class_name = reverse_class_map[pred_label]  # Map class ID to name
    #print(pred_class_name, flush=True)
    print(pred_class_name)

    # Save the image with bounding boxes and the same name as the input image
    output_filename = os.path.basename(image_path)  # Get the filename from the path
    output_path = os.path.join(image_dir, output_filename)  # Save in the same directory with the same name
    original_img.save(output_path)
    #print(f"Image with bounding boxes saved as {output_path}")