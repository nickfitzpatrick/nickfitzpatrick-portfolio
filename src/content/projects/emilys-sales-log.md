---
title: "Emily's Sales Log Automation (n8n)"
summary: A monthly n8n workflow that reads photos of handwritten sales logs with Claude, compiles them into a two-tab Google Sheet, and turns the owner-reviewed sheet into per-vendor billing.
tags: [n8n, Claude, Gmail, Google Drive, Google Sheets, JavaScript]
status: Complete
date: "2026-10"
category: "AI & Machine Learning"
image: /images/emilys-sales-log-cover.svg
---

## Problem

Emily's is an antique consignment store. Staff record each sale by hand on paper Daily Sales Log sheets, and whoever is working that day photographs the sheets on an iPhone. Each month, 30+ sheets have to become a record of sales by day and by vendor, so Emily can see what each vendor sold and bill them correctly.

Built July–October 2026.

## Approach

**Phase 1: Extraction and compilation.** A cloud-hosted n8n workflow that runs on the 1st of each month:

1. Checks a Google Sheet before starting, then copies a spreadsheet file in Drive and logs the run.
2. Checks Gmail for messages with log photos.
3. Creates a Drive folder for the month, then processes the photos with JavaScript code nodes.
4. Sends each photo to Claude through n8n's Anthropic "Analyze image" node to extract the sales data, then parses the result.
5. Names each photo and uploads it to Drive.
6. Checks whether each photo is usable. For usable photos, it builds the rows, runs checks, and appends the rows to the sheet.

The output is a two-tab Google Sheet:

- **Sales Records:** sales grouped by day, with daily totals, a monthly total, and an area chart of sales across the month.
- **Vendor Records:** sales grouped by vendor, with each vendor's monthly total.
- Entries with unclear handwriting are highlighted yellow, with a note saying what's unclear.

**Phase 2: Human review and vendor billing.** Emily gets the compiled sheet back with errors flagged. She corrects anything she sees, then sends the sheet back to the workflow, which parses it into billing for each vendor.

**Real-world details it handles.** Some sales take up more than one line, there's no handwritten daily total to check against, and photos show either one page or two depending on who took them.

## Results

It turned the client's 6 hours of monthly invoicing into a 5–10 minute workflow.

It was my first n8n project. It replaced a manual monthly task at a real store, with a person reviewing the AI's output before any vendor gets billed.

## Stack

n8n (cloud), Claude (Anthropic API), Gmail, Google Drive, Google Sheets, and JavaScript.
