#!/usr/bin/env python3
"""Publish O*NET OnLine national Bright Outlook designations (2025–2035).

Source: https://www.onetonline.org/find/bright?b=0
BLS projections updated October 2026. This is national, not Pinal demand.
"""
import csv
import io
import json
from pathlib import Path
from urllib.request import Request, urlopen

SOURCE = "https://www.onetonline.org/find/bright/All_Bright_Outlook_Occupations.csv?b=0&fmt=csv"
OUT = Path("assets/data/onet-bright-outlook-2025-35.js")
request = Request(SOURCE, headers={"User-Agent": "Mozilla/5.0 (compatible; BOOST workforce education)", "Accept": "text/csv"})
with urlopen(request, timeout=90) as resp:
    payload = resp.read()
content = payload.decode("utf-8-sig")
reader = csv.reader(io.StringIO(content))
records = {}
for row in reader:
    if not row:
        continue
    code = row[0].strip()
    if not __import__("re").fullmatch(r"\d{2}-\d{4}\.\d{2}", code):
        continue
    title = row[1].strip() if len(row)>1 else ""
    category = " ".join(row[2:]).strip()
    reasons = []
    if "rapid growth" in category.lower():
        reasons.append("Rapid Growth")
    if "numerous job openings" in category.lower():
        reasons.append("Numerous Job Openings")
    if "new" in category.lower() and "emerging" in category.lower():
        reasons.append("New and Emerging")
    records[code] = {"bright": True, "reasons": reasons, "occupation": title}

if len(records) < 250:
    raise RuntimeError(f"Only {len(records)} Bright Outlook occupations found; refusing incomplete export")
OUT.parent.mkdir(parents=True, exist_ok=True)
header = "// O*NET OnLine Bright Outlook; national BLS projections 2025–2035, updated October 6 2026.\n"
OUT.write_text(header+"window.BOOST_ONET_OUTLOOK_BY_SOC="+json.dumps(records,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
print(f"Generated {len(records)} O*NET Bright Outlook occupations in {OUT}")
