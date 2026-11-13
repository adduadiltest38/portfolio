---
title: 'Laya Typed Questions: Choice, Score and Noul Explained'
description: 'How to write typed questions for the Laya decision model: choice, score and noul schemas, what comes back, and the wording mistakes that cost accuracy.'
pubDate: 2026-11-20
tags: ['Laya', 'Decision Models', 'Edge AI', 'Oil and Gas', 'System 1']
draft: false
---

Laya does not take a prompt. It takes a **state** and a set of **typed questions**, and it answers those questions and nothing else. That makes the questions the whole interface. A vague option description or a badly named label costs accuracy in a way no amount of post-processing gets back.

This post covers the three question types, what the model returns for each, and seven rules for writing them. The examples are maintenance and field reports, because that is the kind of text I care about.

## The three question types

Every question has a `type` and an `instructions` string. What changes is the `criteria`.

```python
questions = {
    # choice: pick exactly one option. criteria maps label -> description.
    "equipment_class": {
        "type": "choice",
        "instructions": "Which equipment is involved?",
        "criteria": {
            "rotating": "compressors, pumps, turbines",
            "static": "separators, vessels, piping, valves",
            "electrical": "switchgear, motors, UPS",
            "instrument": "transmitters, gas detectors, control loops",
            "other": "everything else",
        },
    },
    # score: an ordered scale. criteria is a list, lowest level first.
    "urgency": {
        "type": "score",
        "instructions": "How urgent is this?",
        "criteria": ["routine", "this shift", "immediate"],
    },
    # noul: a yes/no question. No criteria needed.
    "gas_smell": {
        "type": "noul",
        "instructions": "Does the report mention a gas smell or a gas detector alarm?",
    },
}
```

- **`choice`** returns one label from the map.
- **`score`** returns a position on the ordered scale. The README notes that every level needs a description.
- **`noul`** returns a single number: the probability that the answer is yes.

## What comes back

Answers come back keyed by your question ids. With the router from the project README:

```python
from laya import Router

router = Router()
result = router.predict(state, questions)

print(result["answers"]["equipment_class"]["choice"])   # e.g. rotating
print(result["answers"]["gas_smell"]["noul"])           # probability the answer is yes
print(result["routing"]["model"])                       # which checkpoint answered
```

A `choice` answer also carries `probabilities` (one per option) and two different confidence values, which are easy to mix up:

- **`answer_confidence`** is the probability of the option that was picked.
- **`confidence`** is one minus the normalised entropy of the whole distribution.

They can disagree. Take five options where the model is split evenly between two of them and gives the other three nothing. `answer_confidence` is 0.50. The entropy-based `confidence` is about 0.57, because the model has ruled out three options and is only unsure between two. For gating a single decision, `answer_confidence` is the one that answers "how likely is this answer to be right?".

## Seven rules for writing questions

### 1. Describe options by meaning, not with yes/no words

The README warns that the checkpoints can follow labels such as true/false or yes/no instead of the option descriptions. So a two-option `choice` should not look like this:

```python
"criteria": {"yes": "possible leak", "no": "no leak"}
```

Name the options after what they mean:

```python
"criteria": {
    "possible_release": "gas smell, detector alarm, visible leak or hissing",
    "no_release": "no sign of a hydrocarbon leak",
}
```

### 2. Keep each question under about 20 options

Accuracy drops on long option lists. The README reports 0.425 on Banking77, which has 77 labels. If you have 60 failure modes, do not put them in one question. Ask for the equipment class first, then ask a second question with only the failure modes for that class.

### 3. Do not rely on it to read negation

The README cites an issue where negated requests were still routed to the action being negated. A field note like "no vibration, no leak, bearing temperature normal" is full of negation. Two things I would do: add an explicit option for the all-clear case, and put negated sentences from real logs into the test set before trusting any question that depends on them.

### 4. Order score levels from low to high and describe each one

A `score` question is an ordered scale, and the list order is the scale. "routine, this shift, immediate" works. Mixing the order, or leaving a level as an empty string, does not.

### 5. Always include a way out

Every `choice` needs an option for inputs that do not belong: "other", "none of these", "not about equipment". Without one, the model has to put an off-topic message somewhere, and it will do so with a confident-looking probability.

### 6. Route by language, and mind the length

The English checkpoint cannot read non-Latin scripts. The README's Khmer example scores 0.000 accuracy at 0.952 confidence before routing. Use the router so that Arabic, Hindi or Malayalam text goes to the multilingual checkpoint automatically.

Length matters too. For long documents the README shows the multilingual checkpoint with a larger window:

```python
result = router.predict(long_document, questions, model="multilingual", max_len=8192)
```

For a shift log or a technician note this rarely comes up. For a full inspection report it does.

### 7. Test with the options shuffled

The README mentions position bias, where an option's place in the list affects how often it is picked, and provides an `option_order` parameter to rotate the options. If accuracy on your test set changes when you shuffle the order, the question wording is not carrying enough of the decision.

## A worked example

Here is the technician's note from my [offshore triage post](/blog/laya-offline-ai-offshore-oil-gas/):

> K-201 discharge temp creeping up, vibration 7 mm/s on DE bearing, slight gas smell near skid. What should I check?

Applying the rules to the question set:

- `equipment_class` has five options and ends in "other" (rules 2 and 5).
- The gas-release question is a two-option `choice` with options named `possible_release` and `no_release`, not a bare yes/no (rule 1).
- `urgency` is a three-level `score`, lowest first (rule 4).
- The test set includes notes like "no gas smell, vibration normal" to check the negation case (rule 3).
- Everything goes through the router, because the same crew writes notes in more than one language (rule 6).

None of this replaces fine-tuning. On the authors' own benchmark the base English checkpoint scores 0.362 and the fine-tuned one 0.766. Good questions make fine-tuning easier. They do not make it optional. For where a decision model fits and where it does not, see [Laya vs LLM](/blog/laya-vs-llm-decision-model/).

## Takeaways

- The questions are the interface. Write them as carefully as you would write an API.
- `choice` picks one option, `score` places the input on an ordered scale, `noul` returns the probability of yes.
- Name options by meaning, keep lists short, add an "other", and test negation and option order.
- Use `answer_confidence` when gating one decision, and send non-English text through the router.

*Figures and API details are quoted from the Laya README at the time of writing. I have not reproduced the benchmarks. The question sets here are illustrative and have not been run on a live platform.*

---

**References**

- [Laya GitHub repository and README](https://github.com/NandhaKishorM/laya)
- [Laya model card on Hugging Face (Convai Innovations)](https://huggingface.co/convaiinnovations/laya)
- M, N.; M, A. *From Laya to Vega: Open Non-Autoregressive Decision Models with Calibrated Probabilities.* Preprints 2026. [doi:10.20944/preprints202611.0781.v1](https://doi.org/10.20944/preprints202611.0781.v1)
