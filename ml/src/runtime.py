"""
Process-wide TensorFlow runtime tuning for MediMinds Skin Sense.

Why this module exists
----------------------
TensorFlow defaults to ``intra_op_parallelism_threads = <all logical cores>``.
On a shared, containerised or thermally-limited CPU that oversubscription is
catastrophic for small-batch CNN work: the threads fight each other and
throughput collapses.  Measured on this project's 12-logical-core CPU
(EfficientNetB0, batch 16, 224x224):

    intra-op threads | frozen s/step | fine-tune s/step
    -----------------+---------------+------------------
                    1|           0.65|             0.97
                   12|           9.40|             ~20*
    (* default setting — roughly 14x slower than the tuned value)

Why thread settings must be *environment variables*
---------------------------------------------------
``tf.config.threading.set_*`` raises once an op has already run, so the only
robust way to guarantee the setting is honoured is to export
``TF_NUM_INTRAOP_THREADS`` / ``TF_NUM_INTEROP_THREADS`` **before** TensorFlow is
imported.  Every entry point therefore does:

    import runtime          # noqa: F401  - must come before `import tensorflow`
    import tensorflow as tf

Override at runtime with ``MEDIMINDS_INTRA_OP_THREADS`` (and
``MEDIMINDS_INTER_OP_THREADS``) without touching the code.
"""
from __future__ import annotations

import os
from typing import Dict

#: Tuned default for this dataset/model on a CPU-only machine.  Measured on a
#: 12-logical-core (shared) CPU with EfficientNetB0 @224, batch 16:
#: 1 thread -> 0.041 s/image frozen, 2 threads -> 0.076, 12 threads -> 0.59.
#: Raise this on a dedicated machine (e.g. 4-8) and it will scale up.
DEFAULT_INTRA_OP_THREADS = 1
DEFAULT_INTER_OP_THREADS = 1

#: Suppress the oneDNN/CPU-feature INFO banners (errors and warnings still show).
DEFAULT_LOG_LEVEL = "2"


def configure(intra_op_threads: int | None = None,
              inter_op_threads: int | None = None,
              log_level: str | None = None,
              verbose: bool = False) -> Dict[str, str]:
    """Export the TensorFlow thread/log environment variables.

    Safe to call multiple times; the first call wins because TensorFlow caches
    its thread pools at import time.  Returns the values that are now in effect.
    """
    intra = int(os.environ.get("MEDIMINDS_INTRA_OP_THREADS",
                               intra_op_threads or DEFAULT_INTRA_OP_THREADS))
    inter = int(os.environ.get("MEDIMINDS_INTER_OP_THREADS",
                               inter_op_threads or DEFAULT_INTER_OP_THREADS))

    os.environ.setdefault("TF_NUM_INTRAOP_THREADS", str(intra))
    os.environ.setdefault("TF_NUM_INTEROP_THREADS", str(inter))
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL",
                          log_level or DEFAULT_LOG_LEVEL)
    # Keep oneDNN enabled — it accelerates the CPU convolutions.
    os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "1")

    applied = {
        "TF_NUM_INTRAOP_THREADS": os.environ["TF_NUM_INTRAOP_THREADS"],
        "TF_NUM_INTEROP_THREADS": os.environ["TF_NUM_INTEROP_THREADS"],
        "TF_CPP_MIN_LOG_LEVEL": os.environ["TF_CPP_MIN_LOG_LEVEL"],
    }
    if verbose:
        print(f"[runtime] TensorFlow threads -> {applied}")
    return applied


# Apply on import so that a plain `import runtime` is enough.
configure()
