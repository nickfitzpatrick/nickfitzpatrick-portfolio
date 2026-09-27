---
title: "Sketchboard: Sketch-to-Mockup iPad App"
summary: A SwiftUI/PencilKit iPad app, co-built in six hours, that turns hand-drawn sketches plus voice dictation into rendered HTML mockups using a multi-step Gemma 4 generation loop. 3rd place of 20+ teams at the Google DeepMind x Gradient x tokens& Open Models Hackathon.
tags: [Gemma 4, SwiftUI, PencilKit, Multimodal, Hackathon]
status: Complete
date: "2026-09"
category: "AI Engineering"
image: /images/sketchboard-cover.svg
---

## Overview

Sketchboard is an iPad app that turns multimodal input (hand-drawn sketches plus voice dictation) into rendered HTML mockups, with conversational refinement. A five-person team co-built it in six hours at the Google DeepMind x Gradient x tokens& Open Models Hackathon, where it placed **3rd out of 20+ teams**.

<video controls muted playsinline preload="metadata" poster="/images/sketchboard-demo-poster.jpg" style="width:100%; border-radius:12px; border:1px solid var(--border); margin:1rem 0 0.5rem;">
  <source src="/videos/sketchboard-demo.mp4" type="video/mp4" />
</video>
<p class="muted" style="font-size:0.8rem;">Demo: sketching screens on the iPad and generating mockups.</p>

## What I Built

**Generation loop.** A multi-step Gemma 4 26B loop that streamed drafts, ran automated validation checks, critiqued and revised, and returned an approved or best-of-N output. Gemma 4 26B was chosen for near-flagship quality at small-model speed, plus native vision.

**Design and integration.** Designed the app interface and design system; integrated the Lambda GPU inference backend and Nango GitHub OAuth.

## Stack

SwiftUI, PencilKit, Gemma 4 26B, Lambda GPU inference, Nango.

## Team

Ari'El Encarnacion, Sean Hall, Justin Milner, Helen Zeng, and Nick Fitzpatrick.
