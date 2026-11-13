---
title: 'Laya on the Rig: Fast, Offline AI Decisions for Offshore Oil & Gas'
description: 'How Laya, a small open-weight System 1 model, could triage offshore field reports offline in milliseconds and pass only the hard questions to a local LLM.'
pubDate: 2026-11-13
tags: ['AI', 'Edge AI', 'Oil and Gas', 'Offshore', 'LLM', 'System 1', 'Laya']
draft: false
---

Picture a technician on an offshore platform. He's walking past a gas compressor and notices three things: the discharge temperature is creeping up, the bearing is vibrating more than usual, and there's a faint smell of gas near the skid. He types a quick note into his tablet.

What happens next depends on the software behind that tablet.

![Offshore technician in orange coveralls and a hard hat using a tablet on a platform deck at sunset, with glowing lines linking the tablet to an edge server rack and the control room](/blog/laya-offline-ai-offshore-oil-gas/offshore-technician-edge-ai.webp)

On many platforms the note joins a queue. Someone reads it when they get to it, or it's sent over a slow satellite link to a system onshore. Large language models (LLMs) are very good at answering questions like his. But running a big model on every log line, offshore, with limited bandwidth and very little GPU capacity, isn't realistic.

In this post I'll walk through a design that splits the work in two. A small, fast model called **Laya** sorts every message on the platform itself, and a larger model is used only when real reasoning is needed.

## What is Laya?

[Laya](https://huggingface.co/convaiinnovations/laya) is an open-weight model from Convai Innovations, released under the Apache 2.0 license. Its authors describe it as a **multilingual, non-autoregressive "System 1" decision model**.

In plain terms:

- You give it a **state**: some text, an email, a ticket, or a JSON object.
- You give it a set of **typed questions**: multiple choice, a score on a scale, or yes/no.
- It returns **typed answers with probabilities**, all in one forward pass.

It **never generates text**. There's no free-form output to parse and nothing to hallucinate. It just picks answers and tells you how confident it is.

Some numbers from the model card:

- **Speed:** about 33–40 ms for one question on an NVIDIA T4 GPU, and roughly 190–460 ms on CPU with the models preloaded.
- **Size:** the English checkpoint has 421M parameters (about 808 MB); the multilingual checkpoint has 322M (about 647 MB) and covers 100+ languages.
- **Training:** a reinforcement learning method the authors call RLCD (Reinforcement Learning for Calibrated Decisions). It rewards the model for reporting honest probabilities rather than overconfident guesses.
- **Deployment:** `pip install laya`, plus optional extras for an HTTP server, ONNX Runtime, an MCP server, and LangChain integration.

Compared with an LLM, that's small enough to run on an ordinary server sitting in the platform's equipment room, with no internet connection.

## System 1 and System 2

The idea comes from psychology. **System 1** is fast and intuitive: you glance at a face and know if someone is angry. **System 2** is slow and deliberate: working out a tax return.

In software:

- **System 1 (Laya)** answers fixed, structured questions instantly, for every single input.
- **System 2 (an LLM)** does the slow, expensive reasoning, but only for the inputs that need it.

Laya's output becomes **structured input for the LLM**. The LLM doesn't have to work out what the message is about; it already knows the equipment type, the urgency, and whether there's a safety concern.

## The offshore scenario: triaging field reports

Here's how the technician's note would flow through the system.

![Isometric diagram: a technician's report flows from the platform to a small edge model, which routes it three ways — to the control room alarm, to a log archive, or to a local LLM with procedure documents](/blog/laya-offline-ai-offshore-oil-gas/laya-triage-architecture.webp)

### Step 1: Laya reads every report, offline

Every incoming item goes to Laya on the platform's edge server: technician notes, shift-handover logs, alarm events from the control system. Laya answers the same set of questions each time:

```python
from laya import Router

router = Router(preload=True)  # weights cached locally, runs fully offline

questions = {
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
    "gas_release": {
        "type": "choice",
        "instructions": "Does this describe a possible hydrocarbon leak or gas release?",
        "criteria": {"A": "yes, possible leak, gas smell or detector alarm", "B": "no"},
    },
    "permit_needed": {
        "type": "choice",
        "instructions": "Would the work described need a permit to work?",
        "criteria": {"A": "yes, hot work, isolation or confined space", "B": "no"},
    },
    "urgency": {
        "type": "score",
        "instructions": "How urgent is this?",
        "criteria": ["routine", "this shift", "immediate"],
    },
    "intent": {
        "type": "choice",
        "instructions": "What does the user want?",
        "criteria": {
            "troubleshoot": "asks how to diagnose or fix",
            "procedure": "asks for an SOP or steps",
            "report": "just logging an observation",
        },
    },
}

msg = ("K-201 discharge temp creeping up, vibration 7 mm/s on DE bearing, "
       "slight gas smell near skid. What should I check?")
result = router.predict(msg, questions)
```

### Step 2: Simple rules act on the answers

Plain, deterministic code decides what happens next. No LLM is involved at this stage:

- **Likely gas release with high confidence:** alert the control room immediately. The safety path never waits on a generative model.
- **Routine observation:** save it as a structured log entry and stop there.
- **Anything else:** pass it to System 2.

### Step 3: A local LLM writes the answer

The System 2 model runs on the platform too (for example, a quantised 7–8B open model). It receives three things:

1. the technician's original message
2. Laya's structured answers and their confidence scores
3. procedures and manuals retrieved **only for that equipment class**, such as compressor SOPs and past work orders for K-201

With that context, it can write a short, specific checklist: move upwind, wait for the control room's instructions, get a gas test, and don't start work without a permit. Because Laya already narrowed down the equipment type, the retrieval step searches a much smaller pool of documents and is less likely to pull in something irrelevant.

### Step 4: Sync when the link is up

When the satellite connection is available, the structured records sync onshore, where reliability engineers can look for patterns across the fleet.

## Why this split works

- **Most traffic never touches the expensive model.** Routine logs are classified and filed in milliseconds.
- **Safety-relevant routing is fast and auditable.** Every decision has a probability attached and a clear rule behind it.
- **It works offline.** Nothing depends on the satellite link to sort or escalate a report.
- **Mixed-language crews are covered.** Laya's router detects the language automatically and sends non-English text to the multilingual checkpoint. That matters on rigs where notes are written in English, Hindi, Arabic, Tagalog and more.
- **The LLM's job gets easier.** It starts with structured context instead of having to guess what the message is about.

## The honest part: what it takes to make this real

The Laya model card is unusually upfront about its limits, and anyone building on it should read that section carefully. The main points for this scenario:

**1. You must fine-tune it on your own data.** Out of the box, the base checkpoints are close to chance on the authors' typed-decisions benchmark: about 0.36 accuracy. A version fine-tuned on that task reached about 0.77. The authors describe Laya as a fast base to specialise, not a zero-shot decision engine. For an offshore deployment, that means building a dataset of a few thousand labelled historical items: work orders, shift logs, incident and near-miss reports. Many labels can be derived from existing maintenance-system records. The authors provide a fine-tuning notebook that runs on free Kaggle GPUs.

**2. Calibrate before you trust the probabilities.** The model ships overconfident. Fitting temperature-scaling parameters on your own data brought the calibration error (ECE) down from about 0.47 to 0.08 in the authors' tests. Your routing thresholds depend on these probabilities, so this step isn't optional.

**3. Use the right signals.**
- The card notes that the built-in yes/no question type (`noul`) can be swayed by its own labels on the English checkpoint, so I phrase yes/no questions as two-option choices instead.
- It also says the `act_probability` output doesn't carry a usable signal yet. Gate your decisions on `confidence` instead.

**4. Mind the context length.** The English checkpoint reads about 512 tokens, so it's suited to individual reports, not whole manuals. The multilingual checkpoint handles longer inputs.

**5. Evaluate for recall on safety questions.** Missing a real gas-release report is far worse than raising a false alarm. Measure recall on held-out data for those questions specifically, and set thresholds accordingly.

**6. Roll out in shadow mode.** Run the system on live traffic first, without letting it act, and compare its decisions with what people actually did. Only then let it route anything.

**7. Keep it advisory.** This is a triage and decision-support tool. It must sit completely outside the safety-instrumented and fire-and-gas systems, with a human confirming every response. HSE and OT security teams need to sign off before it goes anywhere near a live platform.

## Final thoughts

Most discussion about AI in industry focuses on large models. On an offshore platform, a better question is often: *what is the smallest, fastest model that can make this decision reliably, offline?*

Laya is a good fit for that role. It's open, small, fast, multilingual, and it returns calibrated probabilities instead of free text. Paired with a local LLM for the hard questions, it points to an architecture where every report gets looked at in milliseconds, urgent ones reach people right away, and the expensive reasoning is saved for where it actually helps.

The model is only the starting point, though. The real work is in the data, the calibration, and a careful rollout.

*This post describes a design concept, not a production deployment. The platform scenario is illustrative.*

---

**References**

- [Laya model card on Hugging Face (Convai Innovations)](https://huggingface.co/convaiinnovations/laya)
- [Laya GitHub repository](https://github.com/NandhaKishorM/laya)
- [Laya documentation](https://nandhakishorm.github.io/laya/)
- M, N.; M, A. *From Laya to Vega: Open Non-Autoregressive Decision Models with Calibrated Probabilities.* Preprints 2026. [doi:10.20944/preprints202611.0781.v1](https://doi.org/10.20944/preprints202611.0781.v1)
