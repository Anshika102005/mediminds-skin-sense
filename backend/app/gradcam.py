"""Grad-CAM for single API image. Adapted from ml/src/explainability.py (JET @45%)."""
from __future__ import annotations
import base64
import io
import numpy as np
import cv2
import tensorflow as tf
from PIL import Image
from . import config, inference
def _to_png_b64(rgb01: np.ndarray) -> str:
    arr = (np.clip(rgb01, 0, 1) * 255).astype(np.uint8)
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("ascii")
def gradcam_for_array(input_batch: np.ndarray, class_index: int | None = None):
    conv_submodel, head_layers = inference.get_gradcam_parts()
    batch = tf.convert_to_tensor(input_batch, dtype=tf.float32)
    with tf.GradientTape() as tape:
        conv_out = conv_submodel(batch, training=False)
        tape.watch(conv_out)
        x = conv_out
        for layer in head_layers:
            x = layer(x, training=False)
        preds = x
        ci = int(tf.argmax(preds[0])) if class_index is None else int(class_index)
        score = preds[:, ci]
    grads = tape.gradient(score, conv_out)
    if grads is None:
        raise RuntimeError("Grad-CAM: unable to compute gradients.")
    pooled = tf.reduce_mean(grads, axis=(0, 1, 2)).numpy()
    heat = np.tensordot(conv_out[0].numpy(), pooled, axes=([-1], [0]))
    heat = np.maximum(heat, 0)
    if heat.max() > 0:
        heat = heat / heat.max()
    heat = tf.image.resize(heat[..., None], config.IMAGE_SIZE, method="bilinear").numpy()[..., 0]
    # overlay JET at 45% on resized display image
    disp = np.asarray(Image.fromarray(input_batch[0].astype(np.uint8)).resize(
        (config.IMAGE_SIZE[1], config.IMAGE_SIZE[0]), Image.BILINEAR), dtype=np.float32) / 255.0
    heat_u8 = np.uint8(np.clip(heat, 0, 1) * 255)
    colour = cv2.cvtColor(cv2.applyColorMap(heat_u8, cv2.COLORMAP_JET), cv2.COLOR_BGR2RGB).astype(np.float32) / 255.0
    overlay = np.clip(0.55 * disp + 0.45 * colour, 0, 1)
    heat_rgb = np.stack([heat, heat, heat], axis=-1)
    return _to_png_b64(heat_rgb), _to_png_b64(overlay)
EXPLANATION = ("The highlighted region shows the area that contributed most to the model's "
    "prediction. It is an AI visualization, not a diagnosis, and does not show cancer location.")
