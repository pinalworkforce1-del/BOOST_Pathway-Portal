#!/usr/bin/env python3
"""Refresh the Phase 1 Pinal County policy library from public PDF sources.

Outputs static JSON under assets/data/policies so TalentSync can search policy
content without exposing credentials or depending on live PDF parsing at query time.
"""

from __future__ import annotations

import hashlib
import io
import json
import re
from datetime import datetime, timezone
from pathlib import Path

import requests
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "data" / "policies"
OUT.mkdir(parents=True, exist_ok=True)

SOURCES = [
    {
        "chapter": "200",
        "title": "Adult & Dislocated Worker Programs Policy & Procedures",
        "url": "https://www.pinal.gov/DocumentCenter/View/12788",
        "programs": ["Adult", "Dislocated Worker"],
    },
    {
        "chapter": "400",
        "title": "Training Services",
        "url": "https://www.pinal.gov/DocumentCenter/View/12792",
        "programs": ["Adult", "Dislocated Worker", "Youth"],
    },
    {
        "chapter": "500",
        "title": "Youth Program Policies",
        "url": "https://www.pinal.gov/DocumentCenter/View/12794",
        "programs": ["Youth"],
    },
    {
        "chapter": "1000",
        "title": "Supportive Services",
        "url": "https://www.pinal.gov/DocumentCenter/View/12804",
        "programs": ["Adult", "Dislocated Worker", "Youth"],
    },
]

SECTION_RE = re.compile(r"(?m)^\s*((?:\d{3,4})(?:\.\d+)*)\s+([A-Z][A-Z0-9 /&()'’\-,:]{3,})\s*$")
DATE_PATTERNS = {
    "effective": re.compile(r"Effective\s*:\s*([^\n\r]+)", re.I),
    "revised": re.compile(r"Revised\s*:?\s*([^\n\r]+)", re.I),
}


def normalize(text: str) -> str:
    text = text.replace("\u00a0", " ").replace("\u2022", " • ")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def extract_dates(text: str) -> dict[str, str | None]:
    out = {}
    for key, rx in DATE_PATTERNS.items():
        m = rx.search(text[:6000])
        out[key] = normalize(m.group(1)) if m else None
    return out


def chunk_pages(pages: list[str], source: dict) -> list[dict]:
    chunks = []
    seq = 0
    current_section = None
    current_heading = None

    for page_no, page_text in enumerate(pages, start=1):
        clean = normalize(page_text)
        if not clean:
            continue

        matches = list(SECTION_RE.finditer(clean))
        spans = []
        if matches:
            first = matches[0]
            if first.start() > 0:
                spans.append((None, None, clean[: first.start()]))
            for i, m in enumerate(matches):
                end = matches[i + 1].start() if i + 1 < len(matches) else len(clean)
                spans.append((m.group(1), normalize(m.group(2).title()), clean[m.start():end]))
        else:
            spans.append((current_section, current_heading, clean))

        for section, heading, body in spans:
            if section:
                current_section, current_heading = section, heading
            section = section or current_section
            heading = heading or current_heading

            body = normalize(body)
            if not body:
                continue

            # Keep chunks compact enough for retrieval while preserving complete policy context.
            target = 1800
            overlap = 220
            start = 0
            while start < len(body):
                end = min(len(body), start + target)
                if end < len(body):
                    boundary = body.rfind("\n", start + 900, end)
                    if boundary < 0:
                        boundary = body.rfind(". ", start + 900, end)
                        if boundary >= 0:
                            boundary += 1
                    if boundary > start:
                        end = boundary
                part = body[start:end].strip()
                if part:
                    seq += 1
                    chunk_id = f"{source['chapter']}-{seq:04d}"
                    chunks.append(
                        {
                            "id": chunk_id,
                            "chapter": source["chapter"],
                            "title": source["title"],
                            "programs": source["programs"],
                            "source_url": source["url"],
                            "page": page_no,
                            "section": section,
                            "heading": heading,
                            "text": part,
                        }
                    )
                if end >= len(body):
                    break
                start = max(end - overlap, start + 1)
    return chunks


def fetch_pdf(url: str) -> tuple[bytes, str]:
    headers = {
        "User-Agent": "TalentSync-Policy-Library/1.0 (+public policy refresh)",
        "Accept": "application/pdf,*/*",
    }
    response = requests.get(url, headers=headers, timeout=60, allow_redirects=True)
    response.raise_for_status()
    data = response.content
    if not data.startswith(b"%PDF"):
        raise RuntimeError(f"Source did not return a PDF: {url} ({response.headers.get('content-type')})")
    return data, response.url


def main() -> None:
    refreshed_at = datetime.now(timezone.utc).isoformat()
    index = {
        "library": "Pinal County Workforce Policy Library",
        "scope": ["200", "400", "500", "1000"],
        "source_page": "https://www.pinal.gov/1934/Economic-Workforce-Governance",
        "refreshed_at": refreshed_at,
        "documents": [],
    }

    for source in SOURCES:
        pdf_bytes, resolved_url = fetch_pdf(source["url"])
        reader = PdfReader(io.BytesIO(pdf_bytes))
        pages = [(page.extract_text() or "") for page in reader.pages]
        full_text = "\n\n".join(pages)
        dates = extract_dates(full_text)
        chunks = chunk_pages(pages, source)
        digest = hashlib.sha256(pdf_bytes).hexdigest()

        doc = {
            **source,
            "resolved_url": resolved_url,
            "effective_date_text": dates["effective"],
            "revised_date_text": dates["revised"],
            "page_count": len(pages),
            "sha256": digest,
            "refreshed_at": refreshed_at,
            "chunks": chunks,
        }
        (OUT / f"chapter-{source['chapter']}.json").write_text(
            json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8"
        )

        index["documents"].append(
            {
                "chapter": source["chapter"],
                "title": source["title"],
                "programs": source["programs"],
                "source_url": source["url"],
                "resolved_url": resolved_url,
                "effective_date_text": dates["effective"],
                "revised_date_text": dates["revised"],
                "page_count": len(pages),
                "sha256": digest,
                "chunk_count": len(chunks),
                "file": f"chapter-{source['chapter']}.json",
            }
        )
        print(f"Chapter {source['chapter']}: {len(pages)} pages, {len(chunks)} chunks")

    (OUT / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    main()
