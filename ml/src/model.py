"""
CNN architecture, loss functions and Grad-CAM plumbing for MediMinds Skin Sense.

Design
------
* **Backbone** — a Keras ``EfficientNet*`` application pre-trained on ImageNet,
  used with ``include_top=False``.  EfficientNet was picked over ResNet/Xception
  because it reaches comparable ImageNet accuracy with ~5.3 M parameters
  (EfficientNetB0), which keeps CPU training and on-device inference viable.
* **Input contract** — Keras' EfficientNet applications already contain their own
  ``Rescaling`` + ``Normalization`` (ImageNet statistics) layers and therefore
  expect pixel values in **[0, 255]**.  ``preprocessing.py`` feeds exactly that.
  ``validate_input_range()`` fails loudly if the configured range and the chosen
  backbone disagree — a silent mismatch here costs tens of accuracy points.
* **Head** — GlobalAveragePooling -> Dropout -> Dense(softmax).  A hidden layer
  is optional (``HEAD_UNITS``) but defaults to 0: with ~7 k training images a
  linear probe on frozen ImageNet features is the best-regularised choice.
* **Two-stage transfer learning** — ``build_model()`` returns a head-only model;
  ``unfreeze_backbone()`` opens the upper blocks for fine-tuning.  BatchNorm
  layers stay frozen in both stages unless explicitly asked otherwise, which is
  the recommended recipe when the target dataset is small.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Ensure this directory (src/) is on sys.path so `import config` works whether
# the module is imported as a package or executed as a script.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import tensorflow as tf
from tensorflow.keras import layers, models, regularizers

import config
from config import (
    BACKBONE, DROPOUT, FREEZE_BATCHNORM, HEAD_DROPOUT, HEAD_UNITS, IMAGE_SIZE,
    L2, MODEL_INPUT_RANGE,
)

# ---------------------------------------------------------------------------
# Backbone registry — explicit input-range contract per architecture family.
# ---------------------------------------------------------------------------
# Keras applications whose Keras-3 implementation ships its own Rescaling +
# Normalization layers (they must be fed raw [0, 255] pixels).
_BACKBONES_WITH_INTERNAL_PREPROCESSING: Dict[str, Tuple[float, float]] = {
    "EfficientNetB0": (0.0, 255.0),
    "EfficientNetB1": (0.0, 255.0),
    "EfficientNetB2": (0.0, 255.0),
    "EfficientNetB3": (0.0, 255.0),
}

# Backbones whose Keras implementation expects inputs already normalised to a
# given range (they contain no preprocessing layers).
_BACKBONES_WITHOUT_INTERNAL_PREPROCESSING: Dict[str, Tuple[float, float]] = {
    "ResNet50V2": (-1.0, 1.0),
    "Xception": (-1.0, 1.0),
}

SUPPORTED_BACKBONES = tuple(
    list(_BACKBONES_WITH_INTERNAL_PREPROCESSING)
    + list(_BACKBONES_WITHOUT_INTERNAL_PREPROCESSING)
)


# ===========================================================================
# 1. Backbone construction
# ===========================================================================

def build_backbone(
    backbone_name: str = BACKBONE,
    image_size: Tuple[int, int] = IMAGE_SIZE,
    weights: Optional[str] = "imagenet",
) -> tf.keras.Model:
    """Instantiate a pre-trained convolutional backbone (no classifier).

    Parameters
    ----------
    backbone_name : one of :data:`SUPPORTED_BACKBONES`.
    image_size    : (height, width) — the backbone adapts to any size >= 32.
    weights       : ``"imagenet"`` (default) or ``None`` (random init, as used
                    by the smoke test to avoid a download).
    """
    if backbone_name not in SUPPORTED_BACKBONES:
        raise ValueError(
            f"Unsupported backbone '{backbone_name}'. Supported: "
            f"{', '.join(SUPPORTED_BACKBONES)}. To add a new family, register "
            "its expected input range in model.py (this prevents a silent "
            "normalisation mismatch that would cripple accuracy)."
        )

    app = getattr(tf.keras.applications, backbone_name)
    # NOTE 1: Keras 3 dropped the ``include_preprocessing`` argument — the
    # Rescaling + Normalization layers are now *always* part of the graph
    # (verified: layer 1 = Rescaling, layer 2 = Normalization).  The backbone
    # therefore consumes raw [0, 255] pixels, matching MODEL_INPUT_RANGE.
    #
    # NOTE 2: do NOT pass ``name=`` to the application constructor.  Keras
    # derives the ImageNet weight filename from the model name
    # (``file_name = name + "_notop.h5"`` in keras/src/applications/efficientnet.py),
    # so a custom name makes the download 403.  The backbone is identified
    # structurally by ``get_backbone()`` instead.
    return app(
        include_top=False,
        weights=weights,
        input_shape=(int(image_size[0]), int(image_size[1]), 3),
    )


def expected_input_range(backbone_name: str = BACKBONE) -> Tuple[float, float]:
    """Return the (min, max) pixel range the backbone must be fed with."""
    if backbone_name in _BACKBONES_WITH_INTERNAL_PREPROCESSING:
        return _BACKBONES_WITH_INTERNAL_PREPROCESSING[backbone_name]
    if backbone_name in _BACKBONES_WITHOUT_INTERNAL_PREPROCESSING:
        return _BACKBONES_WITHOUT_INTERNAL_PREPROCESSING[backbone_name]
    raise ValueError(f"Unsupported backbone '{backbone_name}'.")


def validate_input_range(backbone_name: str = BACKBONE) -> None:
    """Raise if ``config.MODEL_INPUT_RANGE`` does not match the backbone."""
    expected = expected_input_range(backbone_name)
    configured = (float(MODEL_INPUT_RANGE[0]), float(MODEL_INPUT_RANGE[1]))
    if expected != configured:
        raise ValueError(
            f"Input-range mismatch: config.MODEL_INPUT_RANGE={configured} but "
            f"{backbone_name} expects {expected}. Fix config.py / "
            "preprocessing.py before training."
        )
    if backbone_name in _BACKBONES_WITHOUT_INTERNAL_PREPROCESSING:
        raise ValueError(
            f"{backbone_name} needs an external preprocessing layer which this "
            "pipeline does not add yet — either extend build_model() or use an "
            "EfficientNet backbone."
        )


# ===========================================================================
# 2. Model assembly
# ===========================================================================

def build_model(
    num_classes: int,
    image_size: Tuple[int, int] = IMAGE_SIZE,
    backbone_name: str = BACKBONE,
    dropout: float = DROPOUT,
    head_units: int = HEAD_UNITS,
    head_dropout: float = HEAD_DROPOUT,
    l2: float = L2,
    weights: Optional[str] = "imagenet",
    backbone_trainable: bool = False,
) -> tf.keras.Model:
    """Build the classifier: EfficientNet backbone + regularised head.

    The returned model expects float32 images in ``config.MODEL_INPUT_RANGE``;
    it is *not* compiled yet — call :func:`compile_model`.
    """
    validate_input_range(backbone_name)

    backbone = build_backbone(backbone_name, image_size, weights=weights)
    backbone.trainable = backbone_trainable

    inputs = layers.Input(
        shape=(int(image_size[0]), int(image_size[1]), 3),
        dtype=tf.float32,
        name="image",
    )

    # ``training=False`` keeps BatchNorm in inference mode while the backbone is
    # frozen (stage 1).  ``unfreeze_backbone()`` re-opens individual layers for
    # stage 2 through their ``trainable`` flags, so this call site is unchanged.
    x = backbone(inputs, training=backbone_trainable)
    x = layers.GlobalAveragePooling2D(name="gap")(x)
    x = layers.Dropout(dropout, name="head_dropout")(x)

    if head_units and head_units > 0:
        x = layers.Dense(
            int(head_units),
            activation="swish",
            kernel_regularizer=regularizers.l2(l2),
            name="head_dense",
        )(x)
        x = layers.Dropout(head_dropout, name="head_dropout_2")(x)

    outputs = layers.Dense(
        num_classes,
        activation="softmax",
        dtype=tf.float32,          # numerical stability under mixed precision
        name="predictions",
    )(x)

    return models.Model(inputs, outputs, name=f"MediMinds_{backbone_name}")


def get_backbone(model: tf.keras.Model) -> tf.keras.Model:
    """Return the nested backbone sub-model of *model*.

    The backbone is found structurally (the only nested ``Model`` inside the
    classifier) rather than by name, because it cannot carry a custom name —
    Keras derives the ImageNet weight filename from the model name.
    """
    for layer in model.layers:
        if isinstance(layer, tf.keras.Model):
            return layer
    raise ValueError("No nested backbone sub-model found in the supplied model.")


def backbone_layer_index(model: tf.keras.Model, name_prefix: str) -> int:
    """Index (inside the backbone) of the first layer matching *name_prefix*."""
    backbone = get_backbone(model)
    names = [layer.name for layer in backbone.layers]
    for i, name in enumerate(names):
        if name.startswith(name_prefix):
            return i
    blocks = sorted({n.split("_")[0] for n in names if n.startswith("block")})
    raise ValueError(
        f"No backbone layer starts with '{name_prefix}'. Available block "
        f"prefixes: {', '.join(blocks)}"
    )


def unfreeze_backbone(
    model: tf.keras.Model,
    from_block: str = config.FINE_TUNE_FROM,
    freeze_batchnorm: bool = FREEZE_BATCHNORM,
    verbose: bool = True,
) -> Dict[str, float]:
    """Open the backbone from *from_block* upwards for fine-tuning.

    Every layer at or above the first layer whose name starts with
    ``from_block`` becomes trainable; ``BatchNormalization`` layers stay frozen
    when ``freeze_batchnorm`` is True (their ImageNet statistics are already
    good, and re-estimating them on ~7 k images destabilises training).

    Returns the trainable-parameter summary dict.
    """
    start = backbone_layer_index(model, from_block)
    backbone = get_backbone(model)

    unfrozen, bn_frozen = 0, 0
    for i, layer in enumerate(backbone.layers):
        if i < start:
            layer.trainable = False
            continue
        if isinstance(layer, layers.BatchNormalization) and freeze_batchnorm:
            layer.trainable = False
            bn_frozen += 1
        else:
            layer.trainable = True
            unfrozen += 1

    summary = trainable_parameter_summary(model)
    if verbose:
        print(f"[Model] Unfroze {unfrozen} backbone layers from '{from_block}' "
              f"(index {start}); kept {bn_frozen} BatchNorm layers frozen.")
        print(f"[Model] Trainable params: {summary['trainable']:,} / "
              f"{summary['total']:,} ({summary['trainable_pct']:.1f}%)")
    return summary


def freeze_backbone(model: tf.keras.Model, verbose: bool = False) -> Dict[str, float]:
    """Freeze the entire backbone (used before stage 1 and for re-runs)."""
    backbone = get_backbone(model)
    backbone.trainable = False
    for layer in backbone.layers:
        layer.trainable = False
    summary = trainable_parameter_summary(model)
    if verbose:
        print(f"[Model] Frozen backbone — trainable params: "
              f"{summary['trainable']:,} ({summary['trainable_pct']:.1f}%)")
    return summary


def trainable_parameter_summary(model: tf.keras.Model) -> Dict[str, float]:
    """Count trainable / non-trainable / total parameters."""
    trainable = int(sum(
        tf.keras.backend.count_params(w) for w in model.trainable_weights
    ))
    non_trainable = int(sum(
        tf.keras.backend.count_params(w) for w in model.non_trainable_weights
    ))
    total = trainable + non_trainable
    return {
        "trainable": trainable,
        "non_trainable": non_trainable,
        "total": total,
        "trainable_pct": (100.0 * trainable / total) if total else 0.0,
    }


# ===========================================================================
# 3. Loss functions
# ===========================================================================

@tf.keras.utils.register_keras_serializable(package="mediminds")
def weighted_sparse_categorical_ce(y_true, y_pred):
    """Plain sparse categorical cross-entropy (per-sample).

    Per-class weighting is supplied separately through ``Model.fit(class_weight=)``,
    which multiplies this per-sample loss.  Keeping the weighting out of the
    function makes it trivially serialisable inside ``.keras`` files.
    """
    y_true = tf.cast(tf.reshape(y_true, [-1]), tf.int32)
    y_pred = tf.clip_by_value(tf.cast(y_pred, tf.float32), 1e-7, 1.0)
    return -tf.math.log(tf.gather(y_pred, y_true, batch_dims=1))


@tf.keras.utils.register_keras_serializable(package="mediminds")
class FocalLoss(tf.keras.losses.Loss):
    """Multi-class focal loss (Lin et al., 2017).

    ``FL = -alpha * (1 - p_t)**gamma * log(p_t)``

    With ``gamma > 0`` the loss down-weights easy, well-classified examples —
    useful when a head class (here *nv*, ~67 % of the data) would otherwise
    dominate the gradient.  Use focal loss *either* with focal ``alpha`` and no
    class weights, *or* with class weights and a small ``gamma``; applying both
    aggressively over-corrects the rare classes.
    """

    def __init__(self, gamma: float = 2.0, alpha: Optional[float] = None,
                 name: str = "focal_loss", **kwargs):
        super().__init__(name=name, **kwargs)
        self.gamma = float(gamma)
        self.alpha = alpha

    def call(self, y_true, y_pred):
        y_true = tf.cast(tf.reshape(y_true, [-1]), tf.int32)
        y_pred = tf.clip_by_value(tf.cast(y_pred, tf.float32), 1e-7, 1.0)
        p_t = tf.gather(y_pred, y_true, batch_dims=1)
        loss = -tf.pow(1.0 - p_t, self.gamma) * tf.math.log(p_t)
        if self.alpha is not None:
            loss = loss * tf.cast(self.alpha, loss.dtype)
        return loss

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"gamma": self.gamma, "alpha": self.alpha})
        return cfg


@tf.keras.utils.register_keras_serializable(package="mediminds")
class SparseCategoricalCELoss(tf.keras.losses.Loss):
    """Sparse categorical cross-entropy with optional label smoothing.

    Implemented explicitly so that label smoothing and ``class_weight`` compose
    predictably.
    """

    def __init__(self, label_smoothing: float = 0.0, name: str = "sparse_ce", **kwargs):
        super().__init__(name=name, **kwargs)
        self.label_smoothing = float(label_smoothing)

    def call(self, y_true, y_pred):
        y_true = tf.cast(tf.reshape(y_true, [-1]), tf.int32)
        y_pred = tf.clip_by_value(tf.cast(y_pred, tf.float32), 1e-7, 1.0)
        nll = -tf.math.log(tf.gather(y_pred, y_true, batch_dims=1))
        if self.label_smoothing <= 0.0:
            return nll
        num_classes = tf.cast(tf.shape(y_pred)[-1], nll.dtype)
        smooth = tf.reduce_sum(-tf.math.log(y_pred), axis=-1)
        smooth = smooth * (self.label_smoothing / num_classes)
        return (1.0 - self.label_smoothing) * nll + smooth

    def get_config(self):
        cfg = super().get_config()
        cfg.update({"label_smoothing": self.label_smoothing})
        return cfg


CUSTOM_OBJECTS = {
    "weighted_sparse_categorical_ce": weighted_sparse_categorical_ce,
    "FocalLoss": FocalLoss,
    "SparseCategoricalCELoss": SparseCategoricalCELoss,
}


def get_loss(loss_name: str = config.LOSS,
             label_smoothing: float = config.LABEL_SMOOTHING,
             focal_gamma: float = config.FOCAL_GAMMA) -> tf.keras.losses.Loss:
    """Return the loss instance for *loss_name*.

    ``weighted_ce``/``ce`` use :class:`SparseCategoricalCELoss` and expect the
    caller to pass ``class_weight`` to ``fit``.  ``focal`` expects
    ``class_weight=None``.
    """
    name = (loss_name or "weighted_ce").lower()
    if name in ("weighted_ce", "ce", "cross_entropy"):
        return SparseCategoricalCELoss(label_smoothing=label_smoothing)
    if name == "focal":
        return FocalLoss(gamma=focal_gamma)
    raise ValueError(f"Unknown loss '{loss_name}'. Use weighted_ce | ce | focal.")


def uses_class_weights(loss_name: str = config.LOSS) -> bool:
    """True when the chosen objective should be combined with class weights."""
    return (loss_name or "").lower() in ("weighted_ce", "ce", "cross_entropy")


# ===========================================================================
# 4. Compilation
# ===========================================================================

def compile_model(
    model: tf.keras.Model,
    learning_rate: float,
    loss_name: str = config.LOSS,
    label_smoothing: float = config.LABEL_SMOOTHING,
    focal_gamma: float = config.FOCAL_GAMMA,
    jit_compile: Optional[bool] = None,
) -> tf.keras.Model:
    """Compile with Adam, top-1 + top-3 accuracy and the selected objective."""
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=learning_rate),
        loss=get_loss(loss_name, label_smoothing, focal_gamma),
        metrics=[
            tf.keras.metrics.SparseCategoricalAccuracy(name="accuracy"),
            tf.keras.metrics.SparseTopKCategoricalAccuracy(k=3, name="top3_accuracy"),
        ],
        jit_compile=jit_compile,
    )
    return model


# ===========================================================================
# 5. Persistence helpers (model + label mapping)
# ===========================================================================

def save_label_map(path: Path, class_names: List[str],
                   extra: Optional[Dict] = None) -> None:
    """Write the index -> class mapping next to the model.

    The mapping is the contract between this pipeline and any consumer (the web
    app, a FastAPI service, a TFLite client), so it stores both directions plus
    the clinical description of every class.
    """
    payload = {
        "index_to_class": {str(i): c for i, c in enumerate(class_names)},
        "class_to_index": {c: i for i, c in enumerate(class_names)},
        "num_classes": len(class_names),
        "class_descriptions": {c: config.DX_TO_NAME.get(c, "") for c in class_names},
        "high_recall_classes": list(config.HIGH_RECALL_CLASSES),
        "backbone": BACKBONE,
        "image_size": list(IMAGE_SIZE),
        "input_range": list(MODEL_INPUT_RANGE),
        "disclaimer": config.DISCLAIMER,
    }
    if extra:
        payload.update(extra)
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2)
    print(f"[Model] Label map written to {path}")


def load_label_map(path: Path = config.LABEL_MAP_PATH) -> Dict:
    """Read the JSON label mapping written by :func:`save_label_map`."""
    with open(path, "r", encoding="utf-8") as fh:
        payload = json.load(fh)
    payload["index_to_class"] = {int(k): v for k, v in payload["index_to_class"].items()}
    return payload


def load_trained_model(path: Path = config.BEST_MODEL_PATH,
                       compile_model_flag: bool = False) -> tf.keras.Model:
    """Load a ``.keras`` model, resolving the custom losses automatically."""
    return tf.keras.models.load_model(
        str(path), custom_objects=CUSTOM_OBJECTS, compile=compile_model_flag
    )


def find_last_conv_layer(model: tf.keras.Model) -> str:
    """Name of the last 4-D (convolutional) layer inside the backbone.

    Used by Grad-CAM: EfficientNet's deepest spatial feature map is ``top_conv``.
    """
    backbone = get_backbone(model)
    for layer in reversed(backbone.layers):
        try:
            if len(layer.output.shape) == 4:
                return layer.name
        except AttributeError:                      # pragma: no cover
            continue
    raise ValueError("No 4-D convolutional layer found in the backbone.")


if __name__ == "__main__":
    # Quick self-check: architecture, parameter counts and input contract.
    import numpy as _np
    from config import CLASS_NAMES as _CLASS_NAMES

    _m = build_model(len(_CLASS_NAMES), weights=None)
    print(f"Backbone      : {BACKBONE}")
    _s = trainable_parameter_summary(_m)
    print(f"Parameters    : {_s['total']:,} total / {_s['trainable']:,} trainable")
    print(f"Last conv     : {find_last_conv_layer(_m)}")
    _x = _np.zeros((2, *IMAGE_SIZE, 3), dtype="float32")
    print(f"Forward pass  : {_m.predict(_x, verbose=0).shape}")
    unfreeze_backbone(_m, from_block=config.FINE_TUNE_FROM)



