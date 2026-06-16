---
title: "Predicting Water Quality Violations in California"
summary: Built a Random Forest classifier on five years of California drinking water test data to predict which water systems will violate Maximum Contaminant Level standards, achieving 85% recall and 0.94 ROC-AUC on held-out 2025 data — enabling proactive intervention before contamination events occur.
tags: [Python, Machine Learning, Random Forest, Public Health, Data Analysis]
status: Complete
date: "2025-12"
featured: false
image: /images/water-cover.png
---

## Problem

Approximately 700,000 Californians still lack access to safe and affordable drinking water. Current regulatory enforcement is reactive: agencies detect violations after contamination has already occurred, often affecting communities for months before corrective action is taken. Nitrate levels at just half the legal limit are associated with a 47% increased risk of spontaneous preterm birth; 220 drinking water-attributed cancer cases are recorded statewide each year.

The goal was to flip that model. Given five years of historical water quality test results across California's water systems, predict which systems will violate Maximum Contaminant Level (MCL) standards in the following year — before the contamination occurs — so suppliers and regulators can intervene proactively.

## Approach

**Data.** California drinking water quality records from 2020–2024, covering MCL exceedances across all regulated contaminants. Total detected safety violations were roughly stable at 33,000–34,000 per year through 2022–2024, with a partial-year count of 27,851 in 2025 (the test set). Two EDA findings shaped modeling: violation risk has a seasonal component (peaking in March and December, lowest in July–August), and geographic concentration is heavy in Los Angeles, Riverside, San Bernardino, and Kern counties.

A predictive power check on arsenic levels confirmed the core assumption: year-over-year contaminant concentrations are strongly autocorrelated, so historical measurements carry real signal about future violations rather than just noise.

**Feature engineering (time-stacked approach).** Rather than a static snapshot, features were constructed as rolling statistical summaries of each water system's historical test results: prior-year mean contaminant level, max result, standard deviation, sample count, and prior-year violation count. System characteristics (population served, service connections, principal county, system classification, facility water type) were added as contextual features.

**Model.** Random Forest classifier with cross-validated hyperparameter tuning. Maximum tree depth of 20 was selected to balance accuracy and generalization. Class imbalance was handled during training given the low base rate of violations relative to all system-year combinations.

**Dashboard.** A "Water Quality Violation Predictor" tool was built allowing users to input a water system's prior-year test statistics and system characteristics, then receive a risk score (0–100), violation probability, risk level (Low/Moderate/High), and tailored recommendations (e.g., "Increase monitoring frequency," "Review treatment processes," "Prepare compliance response plan").

## Results

| Metric | Value |
|---|---|
| ROC-AUC | 0.9362 |
| Recall (detection rate) | 85% |
| Precision | 80% |
| Violations correctly flagged | 2,793 of 3,286 |

The model identified 2,793 out of 3,286 actual violations in the 2025 test year. An 80% precision rate means 4 out of 5 systems flagged as high-risk were genuinely failing -- important for keeping inspector time focused on real threats rather than false alarms.

**Operational framing.** The primary evaluation metric was recall, not accuracy. Missing a violation (false negative) means a community continues drinking contaminated water; a false positive means an unnecessary inspection. Given that asymmetry, the 85% recall rate is the number that matters.

**Impact pathway.** The model supports three use cases: targeted dispatch of technical assistance and state grants to high-risk systems before violations occur; early warning for water districts to schedule additional testing or treatment adjustments; and policy advocacy for using predictive risk scores as a prioritization criterion for California's SAFER grant program.
