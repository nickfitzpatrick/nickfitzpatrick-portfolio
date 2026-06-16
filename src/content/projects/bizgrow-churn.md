---
title: "Google Hackathon: Understanding Customer Churn for 'BizGrow'"
summary: Identified the root cause of a Q3 churn spike for a SaaS client by isolating a high-value customer cohort, tracing their support ticket language to a specific oversold feature, and quantifying $29M in at-risk contract value — delivered as an analytical consulting case in UC Berkeley's Google Hackathon.
tags: [Python, Data Analysis, Product Analytics, Customer Analytics, SQL]
status: Complete
date: "2025-12"
featured: true
image: /images/Google-cover.png
---

## Problem

BizGrow, a B2B SaaS company, experienced a sharp churn spike in Q3 2023. Churn is defined as a non-renewal event after a customer contract ends. The task: identify the single biggest driver of that spike and produce actionable recommendations for the product and sales teams.

The complicating factor was that BizGrow serves customers across five company-size segments (1-10 up to 1000+ employees), with dramatically different revenue contributions per segment. Treating all churned customers equally would obscure the signal.

## Approach

**Step 1: Define the "Poison Group."** Revenue share analysis showed that enterprise customers (1,000+ employees, 5.5% of companies) and mid-market customers (201-1,000 employees, 10.3% of companies) together account for the overwhelming majority of ACV. Retention rate time series by segment revealed that all segments experienced retention collapse in the June-August 2023 window, but recovery was uneven. Approximately 80% of revenue loss due to churn traced to customers who started contracts from July 2023 onward. We defined this cohort -- companies with >50 employees that joined July 2023 or later -- as the "Poison Group" and focused all subsequent analysis on them.

**Step 2: Trace the support ticket signal.** We compared support ticket language between the Poison Group and a control cohort of similar-vintage customers who did not churn. Two features stood out with dramatically higher mention frequency in the Poison Group: "multi-warehouse" (peaking at 0.7 mentions/ticket at month 2, vs ~0.1 for controls) and "bulk upload" (spiking at month 5, vs flat controls). The multi-warehousing feature -- which allows customers to store data across multiple warehouses -- had been oversold by the sales team as an out-of-the-box capability when it was not yet fully stable.

**Step 3: Connect feature issues to productivity and churn.** Customer productivity (measured as feature events per minute) diverged sharply between cohorts. The Poison Group entered contracts with higher baseline productivity, then dropped 27% at month 4 -- precisely when bulk upload issues peaked in support tickets. Productivity never recovered to baseline before churn. The causal chain: sales overpromise → customer attempts multi-warehousing → bulk upload failures → productivity collapse → non-renewal.

## Results

**Root cause:** Churn is driven by a specific sales-to-product misalignment, not by price sensitivity, competitor switching, or general dissatisfaction. The Poison Group was sold a feature that didn't work reliably for their use case.

**Business impact:** $29M in current contract value is at risk from ongoing churn in this cohort.

**Recommendations delivered:**

Short-term -- Sales pitch correction: Refocus sales efforts away from the Data Warehouse feature until it stabilizes. Train sales teams to align their pitch with current product capabilities and the actual roadmap, not aspirational ones.

Long-term -- Product roadmap pivot: Prioritize resolving the Data Warehouse / bulk upload reliability issues. Fixing this stops the productivity dip driving 80% of churn and unlocks a new tier of enterprise customers whose data complexity currently makes them unserviceable.
