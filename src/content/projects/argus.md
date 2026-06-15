---
title: "Project Argus: LEO Ground-Station Network Design"
summary: Modeled Starlink ground-station placement as a fixed-charge facility-location MILP, generating cost-coverage Pareto frontiers across demand models and elevation thresholds.
tags: [Python, MILP, Operations Research, PuLP, Skyfield, Optimization]
status: Complete
date: "2026-05"
featured: true
image: /images/argus-cover.png
---

## Problem

Low Earth orbit (LEO) constellations like Starlink require terrestrial ground stations to relay satellite traffic to the internet. Each station carries fixed capital and operating costs, can only serve satellites within line-of-sight, and must connect to fiber or an internet exchange point (IXP) for backhaul. Orbital geometry changes every few minutes, making the feasibility graph sparse and time-varying. The core question: given a station-count budget, which sites should be opened to maximize satellite-time coverage at minimum cost?

## Approach

We formulated the placement problem as a fixed-charge facility-location MILP — the same structure as a supply-chain network design problem, with candidate sites as facilities and satellite-time pairs as demand nodes.

**Data pipeline (10 stages):**

1. Acquired live Starlink TLEs from CelesTrak
2. Propagated orbits for 20 satellites over a 4-hour horizon (48 time steps) using Skyfield/SGP4
3. Generated 50 and 200 candidate ground-station sites via farthest-point sampling
4. Built a sparse CSR visibility tensor (960 demand rows × sites) at configurable elevation thresholds
5. Constructed three demand models: uniform, city-point proxy (4,215 cities via Natural Earth with Gaussian kernel weighting), and WorldPop 1 km population raster
6. Applied an IXP-proximity backhaul mask to encode fiber feasibility
7. Solved the MILP with PuLP/CBC
8. Swept the epsilon-constraint to generate the cost-coverage Pareto frontier
9. Ran a budget × elevation-threshold sensitivity grid
10. Produced interactive Plotly maps and charts

**MILP formulation:**

- Binary decision variables: `yᵢ ∈ {0,1}` (open site i), `xᵣᵢ ∈ {0,1}` (serve demand row r from site i)
- Objective: minimize fixed opening costs + latency-weighted service costs
- Key constraints: visibility feasibility, assignment only to open stations, at-most-one-site-per-row, station-count budget K, backhaul feasibility, epsilon-coverage lower bound for Pareto sweep

## Results

**Phase 1 (proxy network):** At 25° elevation threshold, the 50-site run produced 198 visible arcs and 14.1% row coverage; the 200-site run produced 732 visible arcs and 20.9% coverage (20 stations selected). The 59.7% visibility upper bound confirmed the coverage gap is budget-driven, not geometry-driven — the optimizer correctly declared targets above 20% infeasible under a 20-station budget.

**Sensitivity grid (uniform demand):** Coverage ranged from 7.4% (5 stations, 25° threshold) to 90.9% (30 stations, 0° threshold), cleanly separating budget-binding from geometry-binding regimes.

**Demand model comparison (25°, 20 stations):**

| Demand Model | Coverage |
|---|---|
| Uniform | 20.9% |
| City-point proxy | 51.7% |
| WorldPop raster | 61.4% |

The city-proxy and raster portfolios had zero site overlap with the uniform solution (Jaccard similarity = 0.0), demonstrating that demand modeling is not a reporting choice — it directly determines which physical infrastructure gets built.

**Key finding:** The cost-coverage Pareto frontier, rather than a single optimized target, is the right decision artifact. It exposes the true incremental cost of each additional coverage percentage point under each scenario, surfacing the binding constraint (budget vs. geometry) without pre-committing to a coverage target.
