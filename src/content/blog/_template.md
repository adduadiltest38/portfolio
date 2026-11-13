---
# HOW TO WRITE A POST
# 1. Copy this file and rename it to the URL you want, lowercase-with-dashes:
#      src/content/blog/whisper-kokoro-voice-assistant-react-native.md  →  /blog/whisper-kokoro-voice-assistant-react-native/
#    Put the main search phrase in the file name. Never rename it after publishing (the URL would change).
# 2. Fill in the fields below. Lines starting with # are comments — delete them.
# 3. Keep `draft: true` while writing. Preview with `npm run dev` → http://localhost:4321/blog/
# 4. Set `draft: false`, commit, push to main. Vercel publishes it and it joins the sitemap + RSS automatically.
# 5. Google Search Console → URL inspection → paste the post URL → Request indexing. Share it on LinkedIn.

# Title: under ~60 characters, main search phrase first. This is the blue link in Google.
title: 'Real-time voice assistant with Whisper and Kokoro in React Native'
# Description: 120–160 characters. This is the grey text under the link in Google — make people want to click.
description: 'How I built hands-free voice chat for field engineers: Whisper speech-to-text, Kokoro text-to-speech and a React Native client — with latency numbers.'
# A future date schedules the post: it stays hidden until the first deploy on or after that day.
pubDate: 2026-11-20
# updatedDate: 2026-12-05   # add when you meaningfully update the post
tags: ['Voice AI', 'Whisper', 'Kokoro', 'React Native']
# image: '/blog/my-post/og.jpg'   # optional — 1200×630 JPG/PNG shown in LinkedIn/X link previews and as the Google article image
# imageAlt: 'What the image shows'
# project: plant            # optional — links the post to a case study: plant | pid | erp | aips
draft: true
---

Open with the problem in 2–3 sentences and say what the reader will get. Use the main phrase (e.g. "Whisper and Kokoro voice assistant") naturally once here.

## The problem

Who needed it, and why existing options didn't work. Real constraints: offline sites, latency, accuracy, hardware.

## Architecture

A diagram or a short list of the moving parts. Images go in `public/blog/<post-name>/` and are linked like this:

![Voice pipeline: mic → Whisper → LLM → Kokoro → speaker](/blog/whisper-kokoro-voice-assistant-react-native/pipeline.png)

## Building it

The core of the post. Real code beats description:

```python
# Short, runnable snippets — the interesting part only.
```

## Results

Numbers: latency, accuracy, cost, what users said. Tables work:

| Stage | Latency |
| --- | --- |
| Speech-to-text | 300 ms |

## What I'd do differently

Mistakes and trade-offs. Honest lessons are what make people trust (and link to) a post.

## Takeaways

3–5 bullet points. Link to the related project page, e.g. [VAIL-Plant](/projects/plant/), and to other posts.
