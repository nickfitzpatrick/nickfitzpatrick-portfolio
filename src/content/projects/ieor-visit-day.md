---
title: "IEOR Visit Day Scheduler"
summary: End-to-end scheduling tool for UC Berkeley IEOR's prospective graduate student visit days — collects student preferences and faculty availability via auto-generated Google Forms, then runs a preference-weighted matching optimizer to produce personalized two-day meeting schedules for every student.
tags: [Python, Streamlit, Operations Research, Optimization, Google Forms, Scheduling]
status: In Progress
date: "2026-06"
github: https://github.com/nickfitzpatrick/Summer2026_Project
featured: true
---

## Problem

Every year, UC Berkeley's IEOR department hosts prospective PhD and master's students for a two-day visit. Each student wants to meet as many relevant faculty as possible; each faculty member has limited, non-uniform availability across the two days. Coordinating this manually — collecting preferences by email, cross-referencing calendars, building individual schedules — takes staff days of work and produces suboptimal results: popular faculty get overbooked, students with niche interests get generic schedules, and last-minute availability changes cascade into manual reschedules.

The department needed a system that handles the full pipeline: collect preferences, collect availability, solve the matching, deliver schedules.

## Approach

The tool is a multi-page Streamlit app structured around four stages the program coordinator works through in order.

**Stage 1: Build visit days.** The coordinator sets meeting length, buffer time, start/end times, and blocked events (lunch, welcome sessions, campus tours) for each of the two days. The tool computes the resulting time slots in real time.

**Stage 2: Prospective students.** Upload a CSV of student names and emails (or use test data). The tool generates a Google Form asking each student to: select their top 8 faculty to meet, rank them 1–8, and choose their research interest areas. Forms are sent to all students in one click; responses flow into a linked Google Sheet the optimizer can read.

**Stage 3: Faculty availability.** Upload a CSV of faculty names and emails (or load the IEOR roster directly). The tool generates a second Google Form showing the exact time windows from Stage 1 and asking each faculty member to check off when they can meet. Same send-and-collect flow.

**Stage 4: Build schedules.** Once responses are in, the optimizer runs. It reads student preferences and faculty availability, then solves a preference-weighted bipartite matching problem — maximizing total preference satisfaction while respecting hard constraints: no student double-booked, no faculty double-booked, student only meets faculty who are available in that slot, meetings fit within day boundaries.

**Matching algorithm.** Modeled as an integer linear program. Decision variables `x[s, f, t] ∈ {0,1}` indicate whether student `s` meets faculty `f` at time slot `t`. The objective maximizes a weighted sum of meetings, where weight is inversely proportional to preference rank (top choice = highest weight). Hard constraints enforce: one student per slot per faculty, one faculty per slot per student, meetings only during faculty-available slots, and day-level slot limits. With demo data (25 students, 25 faculty, 16 slots/day), the solver achieves 25/25 students getting their top-choice faculty and 3.00/3.00 average top-3 faculty met, across 197 total meetings.

**Data modes.** Every stage has a "use demo data" path — preloaded students, the IEOR faculty roster, and simulated form responses — so the coordinator can test the full pipeline without real credentials. Live operation requires Google API credentials (documented in `SETUP_GOOGLE.md`); the simulated path uses the same code paths, substituting logged records for actual email sends.

## Results

MVP built in one day. End-to-end demo pipeline works: load demo data → configure visit days → generate and "send" forms → load sample responses → run optimizer → view schedules by student or faculty → download CSV.

**Optimizer performance on 25×25 demo:**

| Metric | Value |
|---|---|
| Total meetings scheduled | 197 |
| Students who got their #1 choice | 25 / 25 |
| Average top-3 faculty met | 3.00 / 3 |
| Worst-off student (top-3 met) | 3 / 3 |

The remaining work is live Google Forms integration (OAuth flow), handling partial faculty responses gracefully, and a constraint tuning pass for real-world edge cases (faculty who block all of Day 2, students with highly overlapping preference lists).
