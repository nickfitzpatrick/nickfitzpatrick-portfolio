---
title: "RAID: Retrieval-Augmented Inverse Dynamics"
summary: Proposed and implemented a retrieval-augmented inverse dynamics head for robotic manipulation that achieves 6.5x lower action prediction error than direct MLP baselines with only 25 demonstrations, by combining a frozen world-model encoder with cross-attention over a demonstration memory bank.
tags: [Python, PyTorch, Deep Learning, Robotics, Reinforcement Learning, Transformers]
status: Complete
date: "2026-05"
github: https://github.com/ConstantinVictorBeatErtel/RAID
featured: true
image: /images/raid-cover.jpg
---

## Problem

World models for robotics — systems that learn to "dream" future visual states from current observations — have shown strong results in games and locomotion but have largely failed at robot manipulation. The reason is a specific gap: a world model predicts *where the robot ends up*, but not *what motor command gets it there*. As Prof. Ken Goldberg (UC Berkeley AUTOLab) put it: "it's very hard to infer the associated robot commands."

This is the action-inference problem. Given a current visual state and a predicted next state, what 7-DOF action (dx, dy, dz, roll, pitch, yaw, grip) produces that transition? A direct neural network struggles because: (1) many action sequences can produce the same next state, (2) contact dynamics are discontinuous — tiny changes in grip angle cause completely different outcomes, and (3) friction and surface texture are invisible in the visual observation.

## Approach

We built RAID (Retrieval-Augmented Inverse Dynamics), a lightweight head that sits on top of a frozen world model and solves the action-inference step using retrieval rather than purely parametric learning.

**Architecture (three components):**

**1. Frozen world model (GR-1).** Rather than train a world model from scratch (GPU-weeks of compute), we repurposed GR-1 — a vision Transformer pretrained on large-scale video to predict future image features. We dropped its action head entirely and used only its visual encoder (384-dim class-token features) and one-step prediction head to produce the current state `f_t` and dreamed next state `f̂_{t+1}`.

**2. Memory bank.** Built offline from training demonstrations: every transition `(f_t, f_{t+1}, a_t)` is encoded with the frozen GR-1 encoder and stored. At inference, the bank is queried by cosine similarity.

**3. RAID decoder.** Takes the `(f_t, f̂_{t+1})` pair and produces the 7-DOF action through three sub-components:
- **MLP trunk:** direct parametric action estimate from concatenated features
- **Cross-attention prior:** retrieves top-k=3 most similar memory entries by cosine similarity, computes attention-weighted average of their actions as a template
- **Per-dimension gate:** learned sigmoid gate blends trunk and retrieval prior per action dimension, allowing gripper dimensions (which benefit most from exact templates) to rely heavily on retrieval

At training time, prior dropout (p=0.4) and Gaussian jitter (σ=0.05) on the retrieved prior prevent the optimizer from copying retrieval too aggressively, forcing the trunk and gate to remain useful when retrieval is imperfect.

**GRPO fine-tuning.** To bridge offline imitation to actual task completion, we applied Group Relative Policy Optimization (GRPO) — sampling groups of G=4 rollouts, computing within-group relative rewards as advantage signal, with no critic network required. RAID's retrieval prior naturally structures the action space for RL: instead of exploring from scratch, GRPO refines which retrieved demonstrations to weight.

**Experiment scope:** 171 training runs across 53 experimental cells, testing DINOv2 and SigLIP encoders, direct MLP, mean-pool RAID, cross-attention RAID, Transformer IDM, and Diffusion Policy IDM heads on RoboMimic and LIBERO-Spatial benchmarks across N=25 to N=200 demonstrations.

## Results

**Headline result (LIBERO-Spatial, GR-1 encoder):**

| Condition | N=25 | N=50 | N=100 | N=200 |
|---|---|---|---|---|
| Direct Visual MLP | 0.852 | 0.637 | 0.570 | 0.552 |
| RAID Cross-Attention | **0.131** | **0.154** | **0.169** | **0.171** |

6.5x lower MSE at 25 demonstrations. The advantage is sharpest in the low-data regime — exactly where parametric baselines have no signal to lean on — and persists through 200 demonstrations, though the gap narrows as the direct model gets more data.

**Key finding — the encoder is load-bearing.** The 6x improvement is not from retrieval alone. Early experiments with DINOv2 and SigLIP encoders showed no comparable gain even with a 10-task pooled memory bank. GR-1's pretraining objective (predict future image features) produces exactly the temporal-delta signal that inverse dynamics needs. Without that signal, a larger memory bank doesn't help.

**Temporal stride matters.** With DINOv2 at native 20Hz (consecutive frames), RAID ties the direct MLP. With stride-5 sampling (~250ms windows), RAID pulls ahead — the longer time gap makes visual transitions discriminable for retrieval. GR-1's dreamed features amplify this effect intrinsically.

**GRPO probe:** 195 GRPO updates from the N=200 behavior-cloned RAID checkpoint achieved best mean reward 1.226 and intermittent 25% success rate (1 of 4 rollouts completing the task). This confirms RAID is compatible with online RL fine-tuning, but stable manipulation success requires larger rollout groups and more compute.

**Broader implication:** If retrieval and world-model imagination can be fully decoupled, robots could adapt to new tasks by swapping or expanding memory banks rather than retraining large end-to-end policies — a path toward true one-shot task transfer.
