// Work Index content. EDIT ME: everything in the section is derived from these two lists.
//
// CATEGORIES  the hubs. `pos` is the hub's position as a fraction of the section [x, y].
//             `id` is also the page anchor the hub scrolls to (#ai, #design, ...).
// PROJECTS    one entry per project in src/content/projects (matched by `slug`).
//             `title` and `hook` are written for this section; the thumbnail and the
//             case-study link come from the project file itself.
//             `cats` lists category ids. Two or more = the dot sits between hubs and glows gold.
export const CATEGORIES = [
  { name: 'AI', id: 'ai', pos: [0.23, 0.33] },
  { name: 'Design', id: 'design', pos: [0.77, 0.30] },
  { name: 'Machine Learning', id: 'ml', pos: [0.29, 0.76] },
  { name: 'Side Projects', id: 'side', pos: [0.74, 0.73] },
];

export const PROJECTS = [
  { slug: 'argus', title: 'Project Argus', hook: 'Finds the cheapest satellite ground-station layout for any coverage goal.', cats: ['ml'] },
  { slug: 'raid', title: 'RAID', hook: 'Teaches a robot arm new moves from 25 demonstrations by looking up similar past examples.', cats: ['ml'] },
  { slug: 'sketchboard', title: 'Sketchboard', hook: 'Turns a hand-drawn sketch and a spoken note into an app mockup on iPad.', cats: ['ai', 'design', 'side'] },
  { slug: 'emilys-sales-log', title: "Emily's Sales Log Automation", hook: 'Turns a month of handwritten sales logs into vendor billing, with the owner reviewing before anyone is billed.', cats: ['ai', 'side'] },
  { slug: 'emergency-response', title: 'Emergency Response Allocation', hook: 'Shows where California should put emergency response centers, and when crash risk peaks.', cats: ['ml'] },
  { slug: 'water-quality', title: 'Water Quality Violations', hook: 'Predicts which California water systems will break contamination limits before it happens.', cats: ['ml'] },
  { slug: 'bizgrow-churn', title: 'BizGrow Customer Churn', hook: 'Traced a spike in lost customers to one oversold feature, with $29M in contracts at risk.', cats: ['ml'] },
  { slug: 'ieor-visit-day', title: 'IEOR Visit Day Scheduler', hook: 'Builds every visiting student a two-day schedule of faculty meetings from their preferences.', cats: ['ml', 'design'] },
  { slug: 'mars-power', title: 'Powering Mars Colonies', hook: 'Compares solar, fission and fusion for powering Mars colonies of 6 to 2,000 people.', cats: ['ml'] },
  { slug: 'voyla-database', title: 'Voyla! Database Design', hook: 'The full data stack behind a travel app: transactions, warehouse and analytics dashboard.', cats: ['side'] },
];
