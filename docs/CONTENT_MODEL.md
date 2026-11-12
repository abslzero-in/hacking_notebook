# How I organize Hacking Notebook

I use a single content file, `data/library.json`, with `labs[]` and `guides[]` arrays. These are the records displayed by the website. `schemaVersion` is currently `2`.

## Lab reports (`labs[]`)

Each lab has a stable `id`, `title`, `platform`, `date`, `difficulty`, `category`, `status`, `independence`, `summary` and `tags`. I keep these detail fields:

| Field | What I record |
|---|---|
| `attackPath` | The actual sequence of steps and evidence |
| `decisions` | My thinking: `signal`, `question`, `decision`, `reason`, `result` |
| `methodology` | Why I approached the environment in that order |
| `recon` | Observed details and the commands I actually used |
| `findings` | Evidence, root cause, impact, remediation, validation |
| `learnings` | Concepts and techniques I now understand |
| `difficulties` | Mistakes, unproven assumptions and areas to practice |
| `report` | My final first-person summary and evidence limitations |
| `references` | Public reference links when relevant |

I do not call guided completion independent mastery. I do not invent command output, flag contents or results I did not record.

## My reference library (`guides[]`)

I keep these **top-level categories**:

1. `Services` — one page per technology/service (`service-smb`, `service-ftp`, etc.). Service pages are short descriptions plus an append-only `techniques[]` collection. Each technique records `title`, `why`, `approach`, linked `tools`, linked `attackPoints`, and `sourceLabs`.
2. `Tools` — one page per application/utility (`tool-smbclient`, `tool-nmap`, etc.). Tool pages carry command `examples[]` and, where useful, `options[]` with `flag`, `meaning` and `when`.
3. `Attack points` — one page per tested vulnerability or dangerous misconfiguration (`attack-proftpd-modcopy`, `attack-suid-systemctl`, etc.). These entries contain `recognition`, `conditions`, `validation`, `impact`, and links to the relevant services/tools.
4. `Fundamentals` — basic mechanisms I have learned, such as TCP states and Linux privilege boundaries.
5. `Methodology` — how I find, investigate, verify and connect attack points.

Every reference entry includes `id`, `title`, `category`, `summary` and `content`. Optional relationships use arrays of canonical IDs: `sourceLabs`, `services`, `tools`, `attackPoints`. These create clickable cross-links without copying the same explanation into multiple pages.

### Where each subject belongs

- **SMB** → Services. What SMB is, where it appears and how I used it.
- **smbclient** → Tools. Common flags, examples, when I use it instead of Nmap.
- **Anonymous SMB information exposure** → Attack points. The specific weakness and its impact.
- **ProFTPD `mod_copy`** → Attack points. How I recognized and tested the actual exploit path.
- **A new way to test FTP** → Append a new entry to `service-ftp.techniques[]` and add any new standalone tool/attack-point page only if needed.
- **A specific lab's decisions** → That lab's `decisions[]`, not a duplicated tutorial.

## Editorial rules I follow

- I write the notebook in **first person**. It is my record, not an outside description of a student.
- I use only observed and explicitly requested subject matter; I do not prefill unrelated material.
- I keep one canonical page per service and tool and append new usages to it.
- I separate a tool (e.g. `smbclient`) from the technology it communicates with (SMB), and from a weakness discovered through it.
- I label hypotheses, guided steps and missing evidence rather than making them look verified.
- I keep short descriptions and practical commands. I avoid padding.
- I never publish live credentials, private keys, personal data or sensitive targets.

`content`, `report` and `methodology` support lightweight Markdown. I place copyable terminal commands in `examples[]`. The renderer escapes HTML and uses HTTPS links.