---
title: 'Calibrating Laya: Confidence Thresholds You Can Trust'
description: 'Laya ships over-confident. How to measure calibration error, fit a temperature on held-out data and pick thresholds for safety routing, with code.'
pubDate: 2026-11-24
tags: ['Laya', 'Calibration', 'Decision Models', 'Edge AI', 'Safety']
draft: false
---

A decision model is only as useful as its probabilities, because rules act on them. "If the gas-release probability is above 0.9, alert the control room" is a good rule only if 0.9 means roughly nine times out of ten.

The Laya README says plainly that it does not, out of the box: "Both checkpoints are over-confident as shipped." This post explains what that means, how to measure it, how to fix it, and how to choose thresholds afterwards. The code is plain NumPy and runs on synthetic data, so you can try it without downloading a model.

## What over-confident means

A model is **calibrated** if its confidence matches how often it is right. Of all the answers it gives with 90% confidence, about 90% should be correct. An over-confident model says 97% and is right 88% of the time.

The usual measure is **expected calibration error (ECE)**: group predictions by confidence, compare each group's average confidence with its actual accuracy, and take the weighted average of the gaps. Zero is perfect.

The numbers in the README: refitting one temperature per question type and option count on held-out data moves mean ECE from 0.466 to 0.081 on the English checkpoint, and from 0.314 to 0.106 on the multilingual one. It also notes that the multilingual checkpoint ships with no fitted temperatures at all.

## Measuring it

ECE is a few lines:

```python
import numpy as np

def ece(probs, labels, bins=15):
    """Expected calibration error of the top answer."""
    conf = probs.max(axis=1)
    hit = (probs.argmax(axis=1) == labels).astype(float)
    edges = np.linspace(0.0, 1.0, bins + 1)
    total = 0.0
    for lo, hi in zip(edges[:-1], edges[1:]):
        m = (conf > lo) & (conf <= hi)
        if m.any():
            total += m.mean() * abs(hit[m].mean() - conf[m].mean())
    return total
```

`probs` is one row of option probabilities per example, and `labels` is the correct option for each.

## Fixing it with temperature scaling

Temperature scaling divides the model's logits by a single number `T` before the softmax. A value above 1 flattens the probabilities. It never changes which option is on top, so accuracy stays exactly the same.

```python
def softmax(z):
    z = z - z.max(axis=1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=1, keepdims=True)

def nll(logits, labels, t):
    p = softmax(logits / t)
    return -np.log(p[np.arange(len(labels)), labels] + 1e-12).mean()

def fit_temperature(logits, labels):
    """One number: the temperature that minimises NLL on held-out data."""
    grid = np.linspace(0.5, 5.0, 451)
    return float(grid[np.argmin([nll(logits, labels, t) for t in grid])])
```

The grid runs from 0.5 to 5.0 because that is the range Laya clamps its own temperatures to when it loads them.

## What calibration changes

To see the effect I generated a synthetic three-option classifier that is deliberately over-confident, fitted the temperature on 2,000 examples and measured on a separate 2,000.

| | Raw | Calibrated (T = 1.85) |
| --- | --- | --- |
| Accuracy | 0.785 | 0.785 |
| ECE | 0.100 | 0.022 |
| Passed a 0.85 confidence gate | 71.2% | 49.0% |
| Stated confidence of those | 0.973 | 0.943 |
| Actual accuracy of those | 0.885 | 0.933 |

Accuracy did not move. What changed is the gate. Before calibration, 71% of decisions passed a 0.85 threshold while claiming 97% confidence and delivering 88.5% accuracy. After calibration, fewer decisions pass, and the ones that do are as reliable as they claim: 94.3% stated, 93.3% actual.

That is the practical meaning of calibration. A threshold of 0.85 starts to mean 0.85.

## Gating decisions in Laya

Laya exposes the gate directly through `min_confidence`. From the README:

```python
res = agent.predict(state, questions, min_confidence=0.85)
ans = res["answers"]["department"]

if ans.get("low_confidence"):        # answer_confidence < 0.85
    escalate_to_human_agent(ans["choice"], reason=f"Low confidence ({ans['answer_confidence']:.2f})")
else:
    route_automatically(ans["choice"])
```

Newer versions go further. According to the README, `agent.fit(...)` on your own labelled rows refits the temperature, a conformal threshold and a review line in one step, and `agent.save_calibration(...)` stores the result for later sessions.

## Safety questions: choose the threshold for recall

For most questions you pick a threshold that keeps automatic decisions accurate. For a safety question, the cost is lopsided. A missed gas-release report is far worse than a false alert, so the threshold should be chosen to hit a **recall** target: the share of real events you catch.

Picking it is one line. Take the scores of the real positives in your held-out data and find the value that keeps the share you want:

```python
threshold = np.quantile(scores[labels == 1], 1 - target_recall)
```

I ran this on a synthetic rare event, positive in about 5% of 20,000 reports, with a classifier that separates the classes only moderately well.

| Target recall | Threshold | Recall on test data | Precision | Alerts per 1,000 reports |
| --- | --- | --- | --- | --- |
| Default cut at 0.5 | 0.500 | 0.865 | 0.256 | 166 |
| 0.90 | 0.406 | 0.899 | 0.208 | 213 |
| 0.95 | 0.260 | 0.949 | 0.149 | 313 |
| 0.99 | 0.073 | 0.992 | 0.083 | 590 |

The default cut misses more than one real event in eight. Reaching 99% recall with this classifier means alerting on 590 of every 1,000 reports, and a control room that is alerted on most reports will stop reading them.

That is the useful lesson from the table. When the recall you need costs too many false alerts, the fix is a better model: more labelled examples of the rare case, clearer question wording, more fine-tuning. Lowering the threshold further only moves the problem to the operators.

## Three rules

**1. Calibrate on data the model has not trained on.** The repository's fine-tuning notes warn that fitting temperatures on examples the run already trained on gives a degenerate scale. Keep a held-out split for calibration and another for the final measurement.

**2. One temperature is often not enough.** The README refits a temperature per question type and option count, not one global value. A five-option `choice` and a three-level `score` are over-confident by different amounts.

**3. Re-check when anything changes.** New equipment, new wording in reports, a new language on the crew. Calibration describes the data it was fitted on. One line from the README is worth repeating: "Confidence orders decisions; it does not establish that a decision is correct."

## Takeaways

- Laya's probabilities are over-confident as shipped. The README reports ECE of 0.466 before and 0.081 after refitting temperatures on the English checkpoint.
- Temperature scaling does not change answers. It changes how many pass your confidence gate, and makes the stated confidence true.
- For safety questions, choose the threshold from a recall target on held-out data, then look at how many alerts that costs.
- If the alert volume is unworkable, improve the model. Do not keep lowering the threshold.

This is the part of the design I called "not optional" in [Offline Edge AI for Offshore Oil & Gas: Laya on the Rig](/blog/laya-offline-ai-offshore-oil-gas/). For writing the questions these probabilities belong to, see [Laya Typed Questions](/blog/laya-typed-questions-choice-score-noul/), and for where a decision model fits at all, [Laya vs LLM](/blog/laya-vs-llm-decision-model/).

*The two experiments in this post use synthetic data generated with NumPy. They are not Laya outputs. Laya figures are quoted from its README at the time of writing and were measured by its authors. I have not reproduced them.*

---

**References**

- [Laya GitHub repository and README](https://github.com/NandhaKishorM/laya)
- [Laya fine-tuning notes](https://github.com/NandhaKishorM/laya/blob/main/docs/finetune.md)
- [Laya model card on Hugging Face (Convai Innovations)](https://huggingface.co/convaiinnovations/laya)
- M, N.; M, A. *From Laya to Vega: Open Non-Autoregressive Decision Models with Calibrated Probabilities.* Preprints 2026. [doi:10.20944/preprints202611.0781.v1](https://doi.org/10.20944/preprints202611.0781.v1)
