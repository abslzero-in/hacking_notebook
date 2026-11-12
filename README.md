# Hacking Notebook

This is **my personal penetration-testing notebook**. I use it to record labs I complete, document my decisions, and keep the techniques, services, tools and attack points I have actually worked with.

I am preparing for practical penetration testing, including CPENT. I want this notebook to show not just *what* I did, but *why* I investigated a particular service, how I tested a hypothesis and what I still need to practice.

## What's inside

- **Lab reports:** One report per lab, with the attack chain, evidence, my decision log, findings and unresolved questions.
- **Reference library:** My reference pages organized into **Services**, **Tools**, **Attack points**, **Fundamentals** and **Methodology**.
- **Services:** What a protocol or service does, why I inspected it, and all the ways I have used or tested it so far. A new technique gets appended to the existing service page.
- **Tools:** Purpose, when I use each tool, command syntax, important flags and practical examples. For example, `smbclient` is a tool; SMB is the service it communicates with.
- **Attack points:** Actual weaknesses I investigated, such as executable file uploads, ProFTPD `mod_copy`, unexpected SUID permissions and PATH hijacking. These are distinct from tools used for enumeration.
- **Lab chains:** The sequence in which I combined findings during a specific lab.

At present the notebook covers my guided work on **Vulnversity** and **Kenobi**. I am not marking those labs as independently mastered. Where I have not retained final output, I note the evidence gap instead of claiming I verified something.

## My rule for updates

I add material only from my own lab sessions, notes and explicit requests. I do not want this to become a general cybersecurity wiki full of things I have not studied.

After a lab, I provide a text report. I use that report to update the lab's reasoning, add concepts I understood, and append techniques to the correct existing service or tool page. I keep one canonical page per service and one per tool. I create a new attack-point page only when I have a distinct weakness worth documenting.

I distinguish **what I actually observed** from **what I inferred**, and **guided work** from **independent work**. Failed tests, unanswered questions and reasoning errors are worth keeping.

## Run locally

```bash
python3 -m http.server 8000
```

I run that command from the repository root and open `http://localhost:8000/`. The site reads its content from `data/library.json` in the browser, so I use an HTTP server instead of opening `index.html` with `file://`.

## GitHub Pages

I publish this static site from the repository's `main` branch and `/(root)` directory under **Settings → Pages → Deploy from a branch**.

My Pages URL is expected to be: <https://abslzero-in.github.io/hacking_notebook/>

## Structure

```text
index.html             Site shell and navigation
assets/app.js          Rendering, search, filters, routing
assets/styles.css      Visual design and responsive layout
data/library.json      My lab reports and reference entries
docs/CONTENT_MODEL.md  Rules for keeping the content organized
```

The site is plain HTML, CSS and JavaScript, with no server, build step or paid hosting requirements. Navigation uses hashes, so individual entries remain linkable on GitHub Pages.

## Privacy

This repository is **public**. I keep real credentials, private keys, account secrets and actual flag contents out of published notes. IP addresses from temporary training ranges are placeholders unless needed as non-sensitive evidence.