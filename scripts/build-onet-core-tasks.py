#!/usr/bin/env python3
"""Build a small browser-ready core-task index from the official O*NET database.

O*NET 31.0 Database; source https://www.onetcenter.org/database.html
O*NET is a trademark of USDOL/ETA. This product uses O*NET information
but is not endorsed by USDOL/ETA. See https://www.onetcenter.org/license.html
"""
import csv
import io
import json
import os
import urllib.request
import zipfile

VERSION = os.environ.get("ONET_VERSION", "31_0")
URL = f"https://www.onetcenter.org/dl_files/database/db_{VERSION}_text.zip"
OUT = "assets/data/onet-core-tasks-v31.js"

req = urllib.request.Request(URL, headers={"User-Agent":"BOOST-career-education/1.0"})
with urllib.request.urlopen(req, timeout=120) as response:
    content = response.read()
with zipfile.ZipFile(io.BytesIO(content)) as archive:
    path = next((p for p in archive.namelist() if p.endswith("Task Statements.txt")), None)
    if path is None:
        raise RuntimeError("Official database archive has no Task Statements.txt")
    with archive.open(path) as raw:
        rows = csv.DictReader(io.TextIOWrapper(raw, encoding="utf-8-sig"), delimiter="\t")
        data = {}
        for row in rows:
            if row.get("Task Type", "").strip().lower() != "core":
                continue
            code = row.get("O*NET-SOC Code", "").strip()
            task = row.get("Task", "").strip()
            if code and task:
                items = data.setdefault(code, [])
                if task not in items and len(items) < 6:
                    items.append(task)
if len(data) < 500:
    raise RuntimeError(f"Incomplete O*NET task extraction: only {len(data)} occupations")
os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as f:
    f.write("// O*NET 31.0 Database — Core Task Statements; not endorsed by USDOL/ETA.\n")
    f.write("window.BOOST_ONET_CORE_TASKS_V31 = ")
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))
    f.write(";\n")
print(f"Generated {OUT} with {len(data)} occupations")
