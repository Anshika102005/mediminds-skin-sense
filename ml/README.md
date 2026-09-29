# MediMinds Skin Sense — ML Pipeline

AI-assisted **skin-lesion screening** built on the **HAM10000** dermoscopy
dataset: TensorFlow/Keras transfer learning (EfficientNetB0) with a two-stage
fine-tuning schedule, class-imbalance handling, Grad-CAM explainability and a
TensorFlow-Lite export for offline/low-connectivity deployment.

> ### ⚠️ Disclaimer
> This is a **research and educational screening aid**, not a medical device.
> It does **not** diagnose cancer. It flags lesions that look statistically
> similar to known cases and must always be reviewed by a qualified
> dermatologist. No output of this pipeline should be used as the sole basis for
> a clinical decision.

---

## 1. Dataset — inspected, not assumed

Everything below was produced by `python -m ml.src.dataset --inspect`
(full JSON: `ml/artifacts/dataset_inspection_report.json`).

| Property | Measured value |
|---|---|
| Image files | 10,015 JPEGs (2.77 GB) |
| Resolution / mode | 600 × 450 px, RGB (all identical) |
| Metadata rows | 10,015 (`HAM10000_metadata.csv`) |
| Classes (`dx`) | 7 — `akiec`, `bcc`, `bkl`, `df`, `mel`, `nv`, `vasc` |
| Class counts | nv 6,705 · mel 1,113 · bkl 1,099 · bcc 514 · akiec 327 · vasc 142 · df 115 |
| Imbalance | **58.3 : 1** (most common vs rarest class) |
| Corrupted / unreadable | **0** |
| Exact duplicate pairs | **2** (byte-identical) → dropped, 10,013 images used |
| Near-duplicate (perceptual hash) groups | 8 groups / 9 files, all within the same lesion |
| Distinct lesions | 7,470 — **1,956 lesions have more than one image** (4,501 images) |
| Missing values | `age` missing in 57 rows (not used by the model) |

Those last two rows drive the split design: many "different" images are the same
lesion photographed repeatedly, so **splitting by image would leak lesion
identity across train/val/test**.

## 2. Split design (leakage-free)

`python -m ml.src.dataset --split` writes the manifests into `ml/data/`.

* **Grouping key:** `lesion_id` — every image of a lesion lands in exactly one split.
* **Stratification:** `StratifiedGroupKFold` keeps the class distribution stable
  while respecting lesion groups (test is held out first, then train/val).
* **Augmentation applies to the training split only**; validation and test are
  never augmented.
* **The test split is read exactly once**, by `evaluate.py`, after training has
  finished — no tuning loop ever sees it.

| Class | train | val | test |
|---|---|---|---|
| akiec | 232 | 51 | 44 |
| bcc | 371 | 77 | 66 |
| bkl | 784 | 152 | 163 |
| df | 82 | 15 | 18 |
| mel | 801 | 156 | 156 |
| nv | 4,764 | 956 | 983 |
| vasc | 99 | 20 | 23 |
| **total** | **7,133** | **1,427** | **1,453** |

## 3. Model

| Component | Choice | Why |
|---|---|---|
| Backbone | `EfficientNetB0` (ImageNet) | ~5.3 M parameters — best accuracy per FLOP of the family, still runnable on CPU/edge |
| Stage 1 | Backbone frozen, head only | fast, stable baseline |
| Stage 2 | Unfreeze `block6`+ (~3.1 M trainable), lr 2e-5 | adapts high-level texture features without destroying ImageNet priors |
| BatchNorm | kept frozen while fine-tuning | re-estimating BN statistics on ~7 k images destabilises training |
| Head | `GAP → Dropout(0.3) → Dense(7, softmax)` | a linear probe on frozen features is the best-regularised option at this data size |
| Loss | sparse CE + `class_weight='balanced'` | inverse-frequency weights: 0.21 for `nv` … 12.4 for `df` |
| Optional | `--loss focal` (γ = 2) | alternative objective for extreme imbalance |
| Input | 224 × 224 RGB scaled to **[0, 255]** | Keras 3 EfficientNet embeds its own `Rescaling` + ImageNet `Normalization` layers — feeding `[-1, 1]` would destroy accuracy (guarded by `model.validate_input_range()`) |

### Augmentation (training split only)

Light, anatomically plausible transforms — no shear, no large rotations and no
aggressive colour jitter, because lesion morphology and colour *are* the clinical
signal.

| Transform | Setting | Rationale |
|---|---|---|
| Flip | horizontal **and** vertical | dermoscopy has no canonical orientation |
| Rotation | ±5 % (~±18°) | camera tilt |
| Zoom | ±10 % | variable magnification / distance |
| Translation | ±10 % | off-centre framing |
| Contrast | ±10 %, `value_range=(0, 1)` | lighting variation |
| Brightness | ±10 %, `value_range=(0, 1)` | exposure variation |

> `RandomContrast` / `RandomBrightness` default to `value_range=(0, 255)` in
> Keras 3. This pipeline feeds `[0, 1]` at that point, so the range is set
> explicitly — otherwise every pixel saturates and the image is destroyed.
> `python -m ml.src.augmentation` prints the numeric proof (saturation fraction,
> mean brightness before/after) and renders a preview grid.

## 4. Training (two-stage transfer learning)

```bash
python -m ml.src.train --smoke        # ~3 min end-to-end sanity check (tiny subset)
python -m ml.src.train                # full run: 6 head-only epochs + 6 fine-tune epochs
python -m ml.src.train --stage 1      # head only
python -m ml.src.train --loss focal   # focal loss (gamma = 2) instead of weighted CE
```

| Stage | What trains | LR | Epochs | Why |
|---|---|---|---|---|
| 1 — head only | New `GAP -> Dropout -> Dense(7)` head; backbone frozen | 1e-3 | 12 (6 in the live CPU run) | Fast CPU baseline; no backbone backprop |
| 2 — fine-tune | Upper backbone from `block6` up (~3.1 M params), BatchNorm frozen | 2e-5 | 12 (6 in the live CPU run) | Adapts texture features without destroying ImageNet priors |

Stage 2 starts from the **best** stage-1 checkpoint (by `val_accuracy`), never
the last epoch. Safety rails on every run: `ModelCheckpoint` + `EarlyStopping`
(patience 4, restores best weights) on `val_accuracy`, `ReduceLROnPlateau` on
`val_loss` (x0.3, patience 2), `TerminateOnNaN`, and an `OverfitWatchdog` that
logs the train-val accuracy gap each epoch, warns after 3 epochs above 0.12,
and writes `artifacts/overfitting_report.json`.

> **Smoke-test proof** (`ml/artifacts/smoke/`, 2 + 1 epochs on a tiny subset):
> stage-1 val_accuracy 0.11 -> 0.23, stage-2 0.29, top-3 0.60 — the pipeline
> learns end to end with no overfitting flags.
>
> **Full run in progress** (CPU-only, detached, 1-thread runtime):
> stage 1 already reached val_accuracy **0.63** by epoch 2 (log tail in
> `ml/artifacts/_train.out`); the frozen reports (`training_history.json`,
> `run_info.json`, `best_model.keras`) land in `ml/artifacts/` when it finishes.
> Afterwards run `python -m ml.src.evaluate` (test, once), then
> `python -m ml.src.explainability` and `python -m ml.src.deploy`.

## 5. Evaluation — the test set is touched exactly once

```bash
python -m ml.src.evaluate                  # best model on the test split, flip-TTA on
python -m ml.src.evaluate --split val      # validation split instead
python -m ml.src.evaluate --no-tta         # disable test-time augmentation
```

`evaluate.py` is the **only** module that reads the test split, and nothing it
produces feeds back into training. Metrics: top-1 / top-3 accuracy,
**balanced accuracy** (macro recall — the honest number at 58:1 imbalance),
per-class precision/recall/F1, macro + weighted averages, Cohen's kappa,
one-vs-rest macro ROC-AUC with per-class AUCs, confusion matrices (counts and
row-normalised), plus two clinical screening blocks — recall on the high-risk
classes (`mel`, `bcc`) and grouped malignant (`mel`/`bcc`/`akiec`) vs benign
sensitivity/specificity. Flip-TTA (identity + horizontal/vertical/both,
averaged) is on by default since lesions have no canonical orientation.

## 6. Explainability (Grad-CAM)

```bash
python -m ml.src.explainability                    # 24 test images
python -m ml.src.explainability --split val --n 12
python -m ml.src.explainability --image path/to/lesion.jpg
```
Grad-CAM weights the deepest convolutional feature map (`top_activation`,
found via `model.find_last_conv_layer()`) by the predicted-class gradient. The
gradient model receives the same `[0, 255]` tensors the classifier sees — no
double normalisation. Heat-maps are bilinearly up-sampled and overlaid JET at
45 % opacity. Split mode saves correct/misclassified grids plus
`gradcam_summary_<split>.json` (pool accuracy, per-image predicted/true class
and confidence) so errors can be inspected, not just counted.

## 7. Deployment (TensorFlow Lite)

```bash
python -m ml.src.deploy                  # float16: ~2x smaller (default)
python -m ml.src.deploy --mode int8      # full-integer: ~4x smaller, uint8 in/out
python -m ml.src.deploy --mode float32   # unquantised baseline
```

The exported graph **keeps the `[0, 255]` input contract** — the EfficientNet
rescaling/normalisation layers are inside the model, so clients only resize to
224 x 224 (int8 takes raw `uint8` directly). Every export is verified:
`verify_tflite()` compares Keras vs TFLite argmax agreement on 64 real
validation images, and `mediminds_skin_sense_metadata.json` records the input
contract, class map, quantisation mode, verification scores and a usage snippet.

## 8. Runtime tuning (measured, not guessed)

`ml/src/runtime.py` exports `TF_NUM_INTRAOP_THREADS` / `TF_NUM_INTEROP_THREADS`
**before** TensorFlow is imported (`tf.config.threading` raises once an op has
run, so env vars are the only robust mechanism). Override without code changes:

```bash
MEDIMINDS_INTRA_OP_THREADS=4 MEDIMINDS_INTER_OP_THREADS=1 python -m ml.src.train
```

Measured on this project's 12-logical-core shared CPU
(EfficientNetB0, batch 16, 224 x 224 — `ml/artifacts/_bench_threads_*.json`):

| intra-op threads | frozen s/image | fine-tune s/image |
|---|---|---|
| **1 (shipped default)** | **0.041** | **0.061** |
| 2 | 0.076 | 0.092 |
| 12 (TF default) | ~0.59 | ~1.2 |

TF's default (one thread per logical core) oversubscribes the machine and runs
~14x slower here. On a dedicated workstation or GPU host, raise to 4–8.
`config.DATA_NUM_PARALLEL_CALLS = 3` applies the same logic to `tf.data` map
parallelism for the same reason.

## 9. Reproducibility

* Single seed (`SEED = 42`): `set_random_seed` in every entry point, fixed
  shuffle seeds in `tf.data`, seeded `StratifiedGroupKFold`.
* Frozen artefacts per run: `training_history.json`, `training_log.csv`,
  `training_curves.png`, `run_info.json` (environment + arguments + parameter
  counts + timings), `label_map.json` (index to class contract for consumers),
  `overfitting_report.json`, evaluation JSONs and Grad-CAM summaries.
* `ml/requirements.txt`: `tensorflow>=2.15`, numpy, pandas, scikit-learn,
  pillow, matplotlib, seaborn, opencv-python, scipy.

## 10. Limitations and ethical use

* HAM10000 is heavily imbalanced and demographically narrow; accuracy on rare
  classes (`df`, `vasc`) and unseen populations will be lower — read the
  balanced accuracy and per-class recalls, not just top-1.
* Dermoscopy images only: phone-camera photos are out of distribution.
* The malignant-vs-benign grouping in evaluation is a research convenience, not
  a triage rule. Every output — prediction, probability, heat-map — requires
  review by a qualified clinician. See the disclaimer at the top.

## 11. Module map

| File | Responsibility |
|---|---|
| `ml/src/config.py` | All paths, hyper-parameters and the `[0, 255]` input contract |
| `ml/src/runtime.py` | TF thread/log env tuning (import before TensorFlow) |
| `ml/src/dataset.py` | Inspection report + lesion-grouped stratified splits |
| `ml/src/preprocessing.py` | `tf.data` pipelines, training-only augmentation, class weights |
| `ml/src/model.py` | EfficientNet backbone + head, losses, Grad-CAM plumbing, persistence |
| `ml/src/train.py` | Two-stage loop, callbacks, overfit watchdog, run reports |
| `ml/src/evaluate.py` | Test-once evaluation: balanced acc, ROC-AUC, screening blocks, TTA |
| `ml/src/explainability.py` | Grad-CAM heat-maps + split summaries |
| `ml/src/deploy.py` | TFLite export (float32/float16/int8) + Keras-parity verification |
| `ml/src/augmentation.py` | Augmentation preview grid + pixel sanity statistics |
| `ml/src/plots.py` | Headless matplotlib helpers (curves, confusion, ROC, grids) |
