// Work Index content. EDIT ME: everything in the section is derived from these two lists.
//
// CATEGORIES  the hubs. `pos` is the hub's position as a fraction of the section [x, y].
//             `id` is also the page anchor the hub scrolls to (#ai, #design, ...).
// PROJECTS    one entry per project in src/content/projects (matched by `slug`).
//             `title` and `hook` are written for this section; the thumbnail and the
//             case-study link come from the project file itself.
//             `cats` lists category ids. Two or more = the dot sits between hubs and glows gold.
export const CATEGORIES = [
  // Array order = order of the category sections down the page; `pos` only places the hub.
  { name: 'AI', id: 'ai', pos: [0.20, 0.27] },
  { name: 'Design', id: 'design', pos: [0.80, 0.27] },
  { name: 'Machine Learning', id: 'ml', pos: [0.22, 0.60] }, // between AI and Data: it bridges the two
  { name: 'Data', id: 'data', pos: [0.44, 0.84] },
  { name: 'Optimization', id: 'optimization', pos: [0.78, 0.70] },
  { name: 'Product', id: 'product', pos: [0.50, 0.15] },
];

// The first category in `cats` is the project's home: clicking its dot opens it in that section.
export const PROJECTS = [
  { slug: 'argus', title: 'Project Argus', hook: 'Finds the cheapest satellite ground-station layout for any coverage goal.', cats: ['optimization'] },
  { slug: 'raid', title: 'RAID', hook: 'Teaches a robot arm new moves from 25 demonstrations by looking up similar past examples.', cats: ['ml'] },
  { slug: 'sketchboard', title: 'Sketchboard', hook: 'Turns a hand-drawn sketch and a spoken note into an app mockup on iPad.', cats: ['ai', 'design', 'product'] },
  { slug: 'emilys-sales-log', title: "Emily's Sales Log Automation", hook: 'Turns a month of handwritten sales logs into vendor billing, with the owner reviewing before anyone is billed.', cats: ['ai', 'product'] },
  { slug: 'hermes-lab', title: 'Hermes Multi-Agent Lab', hook: 'An always-on agent server where AI-written code merges only after a second model reviews it and the checks pass.', cats: ['ai'] },
  { slug: 'emergency-response', title: 'Emergency Response Allocation', hook: 'Shows where California should put emergency response centers, and when crash risk peaks.', cats: ['optimization', 'ml'] },
  { slug: 'water-quality', title: 'Water Quality Violations', hook: 'Predicts which California water systems will break contamination limits before it happens.', cats: ['ml'] },
  { slug: 'bizgrow-churn', title: 'BizGrow Customer Churn', hook: 'Traced a spike in lost customers to one oversold feature, with $29M in contracts at risk.', cats: ['data'] },
  { slug: 'ieor-visit-day', title: 'IEOR Visit Day Scheduler', hook: 'Builds every visiting student a two-day schedule of faculty meetings from their preferences.', cats: ['ml', 'design'] },
  { slug: 'mars-power', title: 'Powering Mars Colonies', hook: 'Compares solar, fission and fusion for powering Mars colonies of 6 to 2,000 people.', cats: ['optimization', 'data'] },
  { slug: 'voyla-database', title: 'Voyla! Database Design', hook: 'The full data stack behind a travel app: transactions, warehouse and analytics dashboard.', cats: ['data'] },
];
