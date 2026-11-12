# Content model and editorial contract

This document describes storage fields; it is **not** sample educational content. The production data file has `labs` and `guides` arrays. It started empty and was populated with the user-authorized Vulnversity/Kenobi material.

## Report record

Each `labs[]` entry uses a stable unique `id` (e.g. `platform-slug`) and a `title`. Other fields are optional and must be supported by the student's submitted report.

| Field | Type | Display purpose |
|---|---|---|
| `id` | string | Stable URL slug; unique across both collections |
| `title` | string | Lab title |
| `platform` | string | Lab platform, e.g. provided by student |
| `date` | `YYYY-MM-DD` | Completion/report date, only when known |
| `difficulty` | string | Difficulty from the source, when known |
| `category` | string | Type of lab, e.g. `Linux` or `Web` |
| `status` | string | Student's actual status |
| `independence` | string | `guided`, `independent`, or another evidence-supported value |
| `tags` | string[] | Only confirmed technologies or skills |
| `summary` | string | Brief lab summary |
| `attackPath` | array of `{title, detail}` | Ordered steps demonstrated |
| `methodology` | Markdown string | Scope and approach |
| `recon` | array of `{title, detail, commands}` | Actual enumeration observations |
| `recon[].commands` | array of `{label, code, output}` | Real commands and optional captured output |
| `findings` | array of `{title, severity, evidence, rootCause, impact, remediation, validation}` | Verified findings, no invented scores |
| `learnings` | string[] | What the student can explain or demonstrated learning |
| `difficulties` | string[] | Specific difficulties and knowledge gaps |
| `report` | Markdown string | Original or edited report with source evidence preserved |
| `references` | array of `{label, url}` | Relevant sources |

## Guide record

Each `guides[]` entry requires a stable unique `id` and `title`. Add entries only when the student has explicitly learned the subject, or asks to add a particular guide.

| Field | Type | Display purpose |
|---|---|---|
| `id` | string | Stable unique URL slug |
| `title` | string | Concise topic title |
| `date` | `YYYY-MM-DD` | When the note was added/learned, when known |
| `category` | string | Browsable topic category |
| `kind` | string | `concept`, `tool`, `technique`, `workflow`, `command`, `playbook`, `troubleshooting` |
| `summary` | string | One-sentence takeaway |
| `tags` | string[] | Technologies relevant to the note |
| `takeaways` | string[] | Brief tested insights |
| `content` | Markdown string | Short explanation, only supported content |
| `examples` | array of `{title, language, code, explanation}` | Commands actually understood or requested |
| `pitfalls` | string[] | Observed errors and caveats |
| `sourceLabs` | string[] | Actual linked `labs[].id` values |
| `references` | array of `{label, url}` | Supporting URLs |

`Tools & commands` automatically collects guides whose `kind` is `tool` or whose `category` is `Tools`. `Attack paths` automatically collects labs with `attackPath` entries.

## Source-of-truth rules

- A lab's documented results come from the user report, not a walkthrough or known flags.
- Mark observed behavior as observed; call interpretations or possible vulnerabilities hypotheses until supported by evidence.
- Use the student's words where precision matters. Concise editing is fine; silent additions are not.
- Do not manufacture dates, exact output, CVEs, versions, exploit effects, privilege levels or completion states.
- Do not transfer knowledge from one lab into a guide unless the student learned it and authorized adding it.
- Do not add example/tutorial entries to the real data array.
- Keep the guide concise, structured, and practically useful (what, why, when, how, caveats).
- Prefer stable IDs and edit existing entries rather than creating duplicates when reviewing a subject.
- Never publish secrets. Redact password strings, private keys and tokens.
- Preserve historical reports: later corrections can be dated in the record rather than rewriting evidence misleadingly.

## Markdown subset

Guide `content` and report `report` support headings (`##` to `####`), paragraphs, bullets, ordered lists, fenced code blocks, inline code, bold/italics, blockquotes and HTTPS links. Raw HTML is escaped. For code intended to be easily copied, use fenced code blocks or guide `examples`.