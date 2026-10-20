"""生成配置组索引数据。

用法:
    python scripts/extract-config.py <AzurPilot 仓库路径>
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / '.vitepress' / 'data' / 'config.json'


def parse_groups(text: str) -> dict[str, list[str]]:
    groups: dict[str, list[str]] = {}
    current = None
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith('#'):
            continue
        indent = len(raw) - len(raw.lstrip())
        if indent == 0:
            m = re.match(r'^([A-Za-z][A-Za-z0-9_]*):[ \t]*$', raw)
            if m:
                current = m.group(1)
                groups[current] = []
            else:
                current = None
            continue
        if current and indent == 2:
            m = re.match(r'^  ([A-Za-z][A-Za-z0-9_]*):', raw)
            if m:
                groups[current].append(m.group(1))
    return groups


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    repo = Path(sys.argv[1])
    args = json.loads((repo / 'module/config/argument/args.json').read_text(encoding='utf-8'))
    args_groups = parse_groups((repo / 'module/config/argument/argument.yaml').read_text(encoding='utf-8'))

    usage: dict[str, set[str]] = {}
    for task, groups in args.items():
        for group in groups:
            usage.setdefault(group, set()).add(task)

    rows = []
    for group, fields in args_groups.items():
        rows.append({
            'group': group,
            'fields': fields,
            'fieldCount': len(fields),
            'usedBy': sorted(usage.get(group, [])),
            'usedByCount': len(usage.get(group, [])),
        })
    rows.sort(key=lambda r: (-r['usedByCount'], r['group']))
    data = {
        'source': {
            'repository': 'https://github.com/wess09/AzurPilot',
            'commit': sys.argv[2] if len(sys.argv) > 2 else '',
            'audited': '2026-10-20',
        },
        'groupCount': len(rows),
        'groups': rows,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(rows)} groups -> {OUT}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
