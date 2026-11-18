---
title: "Hermes Multi-Agent Lab"
summary: A cheap, secure, always-on agent server on a 64 GB Mac mini, reached through Slack, where AI-written code only merges after an independent reviewer model approves it and automated checks pass.
tags: [Hermes Agent, Qwen, Multi-Agent, Slack, Tailscale, Python]
status: In Progress
date: "2026-11"
category: "AI & Machine Learning"
image: /images/hermes-lab-cover.png
---

## Problem

The goal is a cheap, secure agent server running all the time on a 64 GB Mac mini. The group reaches it through Slack and uses it to test business ideas. Each experiment tracks its cost, the time spent reviewing it, and the real outcome.

Built November 2026. Ongoing: the setup is complete and the lab is in its experimental phase.

## Approach

**Infrastructure.**

- Hermes Agent runs under a non-admin account.
- It uses local models (Qwen 3.8 27B and Qwen3.6 35B-A3B) through Hermes Local Models. Cloud models (DeepSeek, Kimi, Fable) are added in tiers, only when a task needs them.
- Remote access is through Tailscale, SSH keys, and Screen Sharing. Slack is the chat channel, with an allowlist.
- The rollout has four phases, each tested before the next: secure foundation, prove the model, add integrations, allow autonomy.

**Autonomous research pipeline.**

- **Coder agent:** implements a written experiment protocol exactly as specified, on a git branch, and writes its own tests.
- **Reviewer agent:** a different model with all tools turned off. It returns findings only, as structured JSON, judged against a checklist: fair baselines, numerical soundness, seed control, and no data leakage.
- **Gate:** before anything can merge, the code has to pass ruff, pyright, pytest, and a dry run that checks the output format.
- **merge.sh:** merges only when the reviewer approved that exact commit and the gate passes again. It refuses any change to the scripts, the protocols, or the check configuration.
- **Adversarial testing:** bugs are planted on purpose to check whether the reviewer catches them.

## Results

First result: one supervised run on a toy PCA protocol. The coder wrote 186 lines, the gate passed, the reviewer approved, and the code was merged.

It's a multi-agent system where AI-written code can only merge after an independent model reviews it and automated checks pass, with security built in from the start.

## Stack

Hermes Agent, Qwen (local), Slack, Tailscale, git, uv, ruff, pyright, pytest, Python, and Bash.
