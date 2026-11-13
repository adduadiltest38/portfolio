---
title: 'Laya vs LLM: When a Decision Model Beats a Language Model'
description: 'Laya answers typed questions in about 33 ms and never writes text. A practical comparison with LLMs for triage and routing, with numbers and limits.'
pubDate: 2026-11-17
tags: ['Laya', 'LLM', 'Decision Models', 'Edge AI', 'System 1']
draft: false
---

"Should I use Laya or an LLM?" comes up every time a small decision model gets attention. For most systems it is the wrong question, because the two do different jobs. One picks an answer from a list you wrote. The other writes language.

This post compares them where it matters for triage and routing work: what each one returns, where Laya is the better tool, where it clearly is not, and a short checklist for choosing.

## The short answer

- **Use Laya** when the output is a decision from a fixed list, it has to run on every input, and it has to be fast or offline.
- **Use an LLM** when the output is language: an explanation, a plan, a summary, or an answer nobody listed in advance.
- **Use both** in most real systems: Laya in front sorting everything, the LLM behind it for the few inputs that need reasoning.

## What each one returns

[Laya](https://github.com/NandhaKishorM/laya) is an open-weight, non-autoregressive decision model from Convai Innovations. You give it a **state** (some text or a JSON object) and a set of **typed questions**. It returns typed answers with probabilities in a single forward pass. It never generates text.

The smallest example in the project README looks like this:

```python
from laya import Router

router = Router()  # downloads only the selected checkpoint on first use
result = router.predict(
    {"body": "We were billed twice. Please refund the duplicate."},
    {"billing": {"type": "noul", "instructions": "Does the user request a refund?"}},
)
print(result["answers"]["billing"]["noul"])  # P(true), a float from 0.0 to 1.0
print(result["routing"]["model"])            # which checkpoint answered, e.g. 'english'
```

An LLM works the other way round. It produces tokens one at a time, so to get a decision out of it you ask for JSON, parse what comes back, and handle the cases where it does not match.

| | Laya | LLM |
| --- | --- | --- |
| Output | One of your options, with a probability for each | Free text, or JSON you have to validate |
| How it runs | One forward pass for all questions | Token by token |
| Latency | 39.5 ms (English) or 32.8 ms (multilingual) for one question on a T4 GPU | Grows with every token it writes |
| Can it invent an answer? | No. It can only choose from your options | Yes |
| Confidence | A probability per option (needs calibration) | No native probability over your options |
| Size | 421M parameters (English), 322M (multilingual) | Billions of parameters for a useful local model |
| Multi-step reasoning | No | Yes |
| Zero-shot quality | Weak. Needs fine-tuning | Generally strong |

The Laya figures are from the project README, measured by its authors.

## Where Laya wins

**1. Volume.** If every log line, ticket or alarm needs a decision, cost per decision is what matters. The README reports ten questions answered in one call in 158.6 ms on the English checkpoint and 72.3 ms on the multilingual one, both on a single T4.

**2. Offline and edge hardware.** At 421M parameters the model fits on an ordinary server. The README also lists CPU numbers: 453 ms for a four-question call on the English checkpoint and 192 ms on the multilingual one, on the authors' own Intel machine. That is slower than a GPU, but it is a decision in under half a second with no GPU at all.

**3. Auditable routing.** The output is bounded, so the logic that acts on it can be plain code. A rule such as "if the gas-release probability is above the threshold, alert the control room" can be read, reviewed and tested. There is no generated text to interpret.

**4. Mixed languages.** A router checks the script of the input and sends it to the right checkpoint before the forward pass. With routing, the README reports 48 of the 51 languages it tested as usable on the MASSIVE intent benchmark.

## Where Laya loses

The README is direct about the limits, and they are the reason an LLM still belongs in the system.

- **It is not a zero-shot model.** On the authors' typed-decisions benchmark (2,000 decisions), the base English checkpoint scores 0.362. That is below the 0.461 you get by always guessing the most common answer. The fine-tuned checkpoint reaches 0.766.
- **Long option lists hurt.** On Banking77, with 77 labels, the README reports 0.425 and notes that a competing model leads above 20 options.
- **Negation is a known weak spot.** The README cites an issue where negated requests were still routed to the action they were negating.
- **Option labels can mislead it.** The checkpoints can follow labels such as true/false or yes/no instead of the option descriptions.
- **The English checkpoint cannot read non-Latin scripts.** The README's Khmer example scores 0.000 accuracy at 0.952 confidence before routing is applied. This is why the router exists.
- **It cannot explain or plan.** There is no generated text, so there is no reasoning to read and no multi-step answer.

One line from the README is worth keeping in view: "Confidence orders decisions; it does not establish that a decision is correct."

## A checklist for choosing

1. **Can I list every acceptable answer in advance?** If yes, a decision model fits. If the answer is open-ended, you need an LLM.
2. **Is each question under about 20 options?** If not, split it into a hierarchy or use something else.
3. **Do I have labelled examples from my own domain?** Without fine-tuning and calibration, the base checkpoints are not reliable enough to act on.
4. **Does it have to run on every input, offline, or in milliseconds?** That is where the small model pays for itself.
5. **Does someone need the reasoning in words?** That part is the LLM's job.

Three or more answers pointing at Laya usually means: put it in front, and keep the LLM for what is left.

## Using both together

The two fit together well because Laya's output is structured. The LLM does not have to work out what a message is about. It receives the equipment type, the urgency and the safety flag as fields, and spends its effort on the answer.

The package ships a LangChain integration built around this pattern. From the README:

```python
from laya.integrations.langchain import LayaRouter

router = LayaRouter(
    criteria={"billing": "invoices, charges", "tech": "bugs, outages"},
    confidence_threshold=0.80,
    fallback="human_agent",
)
workflow.add_conditional_edges("triage", router)
```

Anything below the confidence threshold goes to the fallback instead of being routed automatically. I walked through a full version of this split for an offshore platform in [Offline Edge AI for Offshore Oil & Gas: Laya on the Rig](/blog/laya-offline-ai-offshore-oil-gas/).

## Takeaways

- Laya and an LLM are not substitutes. One chooses from a list, the other writes.
- Laya is the better tool for high-volume, bounded, fast or offline decisions.
- It needs fine-tuning, struggles above about 20 options, and has documented problems with negation and misleading labels.
- The strongest design uses Laya to sort everything and an LLM to reason about the hard cases.

*Benchmark and latency figures are quoted from the Laya README at the time of writing and were measured by its authors. I have not reproduced them. Code samples follow the documented API and are illustrative.*

---

**References**

- [Laya GitHub repository and README](https://github.com/NandhaKishorM/laya)
- [Laya model card on Hugging Face (Convai Innovations)](https://huggingface.co/convaiinnovations/laya)
- M, N.; M, A. *From Laya to Vega: Open Non-Autoregressive Decision Models with Calibrated Probabilities.* Preprints 2026. [doi:10.20944/preprints202611.0781.v1](https://doi.org/10.20944/preprints202611.0781.v1)
