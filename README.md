# Hacking Notebook

A personal, content-first penetration-testing knowledge base hosted on GitHub Pages. It has a lab archive and an independently navigable learning guide, with automatically generated topic, tool, and attack-path indexes.

**Current state:** two guided TryHackMe lab reports (Vulnversity and Kenobi) and concise guide entries explicitly authorized by the learner. These were reconstructed from our actual lesson transcript on request; future content requires explicit approval.

## Run locally

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000/` from this directory. A local server is required because the browser loads `data/library.json` using `fetch()`.

## Publish with GitHub Pages

1. Put these files at the root of the `abslzero-in/hacking_notebook` repository (not inside an extra `hacking_notebook/` directory).
2. Open **Repository Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Select **main** and **/(root)**, then save.
5. After GitHub deploys, visit `https://abslzero-in.github.io/hacking_notebook/`.

The application uses relative paths and hash-based navigation, so direct links to individual records work within a project Pages site without a custom 404 handler. No build pipeline, package manager, server, API keys, or third-party JavaScript libraries are needed.

## How the notebook is updated

After completing a lab, provide a natural-language report in ChatGPT and explicitly ask to update this repository. The assistant should:

1. Read the submitted report and separate **observed facts**, **student understanding**, and **unverified assumptions**.
2. Add or update the lab record in `data/library.json` without inventing results, commands, dates, flags, credentials, or independent proficiency.
3. Add or update a guide entry **only for something the student explicitly says they learned or demonstrates they understand**, with concise, useful explanations rather than generic tutorials.
4. Build tags, categories, and relationships from the submitted material. Do not add unrelated subjects, placeholder entries, examples, or seeded lists.
5. Avoid publishing sensitive data: redact passwords, tokens, private keys, private network details if sensitive, and captured personal information. Do not publish actual flag values unless specifically desired.
6. Commit the data changes to the repository. The site refreshes automatically on the next visit.

**Do not equate guided completion with independent mastery.** Set `independence` and `status` according to evidence in the submitted report.

## Navigation

- **Overview**: live counts, recently added entries, learned topics.
- **Lab reports**: searchable and filterable lab history with attack sequences, evidence, findings, learning gaps and report text.
- **Learning guide**: concise technical notes grouped by their actual categories, with readable code examples.
- **Attack paths**: automatically generated from lab reports containing `attackPath` steps.
- **Tools & commands**: automatically generated from guide entries with `kind: "tool"` or `category: "Tools"`.
- **Quick search**: `Ctrl+K` / `Cmd+K` or `/`, searches across lab and guide content.
- **Dark/light**: saved as a local browser preference.

## Data format

All published data lives in [`data/library.json`](data/library.json). The source of truth is one JSON file with arrays named `labs` and `guides`. The initial empty file has since been populated with the two approved labs and related lessons.

See [`docs/CONTENT_MODEL.md`](docs/CONTENT_MODEL.md) for the supported fields and the source-of-truth rules. Schema examples in developer documentation are not automatically imported into the website.

## Privacy and design

This is a **public GitHub repository**. Everything committed, including reports and notes, can be viewed by anyone. Do not add proprietary customer details, personal information, live exploit targets, credentials, or reusable access artifacts.

The frontend is a static, dependency-free application: HTML, CSS, JavaScript and one JSON content file. The Markdown renderer escapes HTML in note content. All updates are made through GitHub commits, not editable on the public site.
