---
title: "Powering Mars Colonies: Solar, Fission, and Fusion"
summary: Compared five power architectures across colony scales from 6 to 2,000 people using McKelvey feasibility classification, LCOE modeling, and 1,000-run Monte Carlo reliability simulation under real Mars dust storm data.
tags: [Python, Monte Carlo, Energy Systems, Data Analysis, Policy]
status: Complete
date: "2026-05"
github: https://github.com/vineet-reddy/MarsColonyNuclearFusion
featured: false
---

## Problem

A Mars colony needs uninterrupted power for life support, thermal control, oxygen production, water recycling, and communications — any gap is mission-ending. Mars makes this hard: solar irradiance is 43% of Earth's, dust storms can suppress solar output to as low as 4.8% of rated capacity for weeks, and there are no hydrocarbons, running water, or reliable geothermal sources. The question is not just whether any single technology works, but what power mix makes sense as the colony scales from a 6-person outpost to a settlement of thousands.

We evaluated five options: Solar PV, Kilopower-class fission, CFS SPARC (tokamak fusion), Princeton FRC (field-reversed fusion), and Avalanche Orbitron (micro-reactor fusion concept).

## Approach

**Three analytical lenses:**

**1. McKelvey-style feasibility classification.** We adapted the resource economics McKelvey chart — originally used to classify oil and gas reserves by certainty and commerciality — to evaluate power system deployability. The two axes become "certainty of deployable system" (derived from TRL, capacity factor, and Mars operating penalties) and "chance of Mars commercial operation" (penalized further by LCOE). Each technology lands in a Proved, Prospective, or Contingent category.

**2. All-in LCOE model.** Levelized cost of energy calculated from Earth-side CapEx, launch cost ($1,500/kg baseline), annual OpEx, system lifetime, and capacity factor. Launch cost sensitivity tested at $1,000, $1,500, and $2,000/kg.

**3. Sol-by-sol Monte Carlo reliability simulation.** 1,000 simulations per scenario, each covering one full Mars year (668 sols). Storm sequences drawn from the Mars Dust Activity Database (MDAD), 14,974 storm-sol observations across 9 Mars years. Colony demand built from bottom-up habitat engineering assumptions: plug loads (1.2 kW/person), water recycling, MOXIE O₂ generation (0.3 kW/person), lighting, comms, medical lab, and thermal load from habitat geometry (500 m², U=0.15 W/m²K, 83 K ΔT). Three colony scales: 6-person (13.6 kW), 100-person (186.3 kW), 2,000-person (3,701.9 kW). Fission modeled at 92% capacity factor (anchored to 2016–2020 U.S. nuclear fleet average). Battery state of charge tracked across the full simulated year.

## Results

**Feasibility:** Fission is the only option in the high-certainty, high-commerciality corner. CFS SPARC reaches "Prospective" under base TRL assumptions. All other fusion concepts remain Contingent. The classification is stable across pessimistic/base/optimistic TRL scenarios — only SPARC moves between categories.

**LCOE:**

| Source | LCOE ($/kWh) |
|---|---|
| CFS SPARC (projected) | $0.64 |
| Princeton FRC | $2.16 |
| Avalanche Orbitron | $2.30 |
| Solar PV | $7.61 |
| Fission, Kilopower-class | $8.31 |

SPARC's cost is nearly insensitive to launch cost: LCOE rises only from $0.63 to $0.64/kWh as launch cost doubles from $1,000 to $2,000/kg, because its 120,000 kg launch mass is small relative to 10,512,000 MWh of 30-year lifetime generation. Solar's LCOE rises 27% over the same range.

**Reliability (1,000 Monte Carlo runs each):**

| Scenario | Mean reliability | 5th percentile |
|---|---|---|
| 6-person, solar only | 13.8% | 11.1% |
| 6-person, solar + fission | 100.0% | 100.0% |
| 100-person, solar only | 21.2% | 18.0% |
| 100-person, solar + fission | 99.6% | 99.1% |
| 2,000-person, solar only | 20.7% | 17.5% |
| 2,000-person, solar + fission | 99.6% | 99.1% |

Solar-only systems never exceed 29% mean reliability regardless of installed capacity — even 3,000 kW of solar in the 100-person case tops out at 29.3%. Adding fission baseload makes the system effectively insensitive to dust storms: reliability stays above 99.5% across all tested storm rate multipliers (0.5× to 1.5×) and battery sizes (125 to 2,000 kWh).

**Fission scaling pressure:** The 99.5% reliability threshold requires 8 Kilopower units ($258M) for a 100-person colony but 160 units ($5,160M) for a 2,000-person colony — a 20× increase in unit count for a 20× increase in population. This is the core finding driving the staged energy conclusion.

**Key finding:** Two independent failure modes define the energy timeline. Solar-only architectures fail on reliability (a generation ceiling imposed by dust and night, not panel count). Fission-only architectures fail on scaling logistics. Together they motivate a three-stage roadmap: fission + solar for early outposts, expanded fission + solar for growing settlements, and fusion (particularly SPARC) as firm baseload once Kilopower unit proliferation becomes untenable — somewhere between 100 and 2,000 people.
