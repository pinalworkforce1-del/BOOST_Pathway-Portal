# BOOST Pathways Portal Prototype v2

This version changes the prototype from **bundled/local module copies** to the production-style architecture discussed for GitHub Pages.

## Architecture

The portal repository contains only:

- the master BOOST pathway map
- the existing topic-page illustrations for Modules 1–4 and AI & You
- the shared navigation/progress shell
- hotspot coordinates
- a single link configuration file

The actual BOOST modules remain in their **existing GitHub repositories with their existing assets and folder structures**. Nothing inside those repositories needs to move or be rewired for this portal prototype.

## Live module connections

All live destinations are centralized in:

`assets/js/config.js`

Current destinations:

- Module 1 — Career Direction: `https://pinalworkforce1-del.github.io/BOOST/`
- Module 2 — Career Reality Check: `https://pinalworkforce1-del.github.io/BOOST-Career-Validation/`
- Module 3 — Career Mobility Exploration: `https://pinalworkforce1-del.github.io/BOOST-Career-Mobility/`
- Module 4 — Decide: `https://pinalworkforce1-del.github.io/BOOST-Decide/`
- Module 5 — AI & You: `https://pinalworkforce1-del.github.io/AI_Literacy/`
- Career Investment Explorer: `https://pinalworkforce1-del.github.io/BOOST_Skill_Gap_Closure/`
- Healthcare: `https://pinalworkforce1-del.github.io/MedicalSkills/`
- Skilled Trades: `https://pinalworkforce1-del.github.io/Skilled-Trades/`
- Advanced Manufacturing: `https://pinalworkforce1-del.github.io/BOOST-Advanced-Manufacturing/`
- Information Technology: `https://pinalworkforce1-del.github.io/BOOST_Information_Tech/`
- CDL / Transportation & Logistics: `https://pinalworkforce1-del.github.io/BOOSTCDL/`

The Microsoft Interest Form is wired to:

`https://forms.cloud.microsoft/r/ZTsLaQY4qC`

## How a module opens

Example:

`index.html` → `topic/module2.html` → `activity.html?m=module2` → live GitHub Pages Module 2

`activity.html` keeps the BOOST progress/navigation bar visible and loads the existing module URL in an iframe. An **Open in New Tab** button is also provided as a fallback and for testing.

The industry modules currently go directly from the master map into the activity shell because dedicated industry topic-page images have not yet been added. They can be inserted later without changing the live industry repositories.

## Progress prototype

Progress is stored in browser `localStorage`.

Career Exploration & Development currently tracks:

1. Module 1
2. Module 2
3. Module 3
4. Module 4
5. AI & You
6. One selected industry workplace skills experience
7. Career Investment Explorer

Rapid Employment currently reserves:

1. Module 1
2. Build Strong Financial Habits / Needs Assessment
3. Skill Mobility
4. AI & You
5. 48 Hour Job Search Strategies

The Rapid Employment resources that do not yet have live GitHub destinations remain visibly reserved rather than linking to placeholder content.

Completing any one live industry experience unlocks the overlaid **Career Investment Explorer** step on the home map. That step was not present in the original artwork, so it is added as an HTML overlay rather than requiring the home image to be regenerated immediately.

## Module 4

Module 4 is explicitly marked **Coach Supported** in the portal. The activity shell uses a special completion label for this step.

## Intro videos and reflections

v2 treats the live self-contained modules as the required activity. Legacy module-specific intro videos and stand-alone reflection forms are no longer required by the prototype. Topic pages retain space that can later be used for optional YouTube videos, TED Talks, employer content, or other supporting resources when those resources add value.

The overall BOOST orientation video remains wired on the master map.

## Future integration

Because the existing repositories all publish under the same GitHub Pages origin (`https://pinalworkforce1-del.github.io`), a future version can add direct completion signals from the module repositories to the shared BOOST progress key without consolidating repositories or moving assets.

Before production, test progress/storage behavior inside the final Google Sites embed on the browsers and devices participants will use. Browser privacy rules can affect third-party embedded storage.
