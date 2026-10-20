"""从核心仓库的 API 契约生成接口参考数据。

用法:
    python scripts/extract-api.py <AzurPilot 仓库路径> [commit]

输出:
    docs/.vitepress/data/api.json
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / '.vitepress' / 'data' / 'api.json'


def type_of(schema: dict) -> str:
    if 'anyOf' in schema:
        return ' | '.join(type_of(s) for s in schema['anyOf'])
    if '$ref' in schema:
        return schema['$ref'].split('/')[-1]
    t = schema.get('type', 'any')
    if t == 'array':
        return f"{type_of(schema.get('items', {}))}[]"
    return t


def describe(schema: dict) -> dict:
    out = {
        'type': type_of(schema),
        'description': (schema.get('description') or '').strip().split('\n')[0],
    }
    if 'enum' in schema:
        out['enum'] = schema['enum']
    if 'default' in schema:
        out['default'] = schema['default']
    if schema.get('type') == 'array' and 'items' in schema:
        out['item'] = describe(schema['items'])
    if 'anyOf' in schema:
        out['options'] = [describe(s) for s in schema['anyOf']]
    return out


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    repo = Path(sys.argv[1])
    contract = json.loads((repo / 'frontend/src/api/contract.json').read_text(encoding='utf-8'))
    methods = []
    for name, spec in contract['methods'].items():
        params = spec.get('params', {})
        props = params.get('properties', {})
        required = set(params.get('required', []))
        fields = []
        for key, schema in props.items():
            item = describe(schema)
            item['name'] = key
            item['required'] = key in required
            fields.append(item)
        methods.append({
            'name': name,
            'mutates': bool(spec.get('mutates')),
            'description': (spec.get('description') or '').strip().split('\n')[0],
            'fields': fields,
        })
    methods.sort(key=lambda m: m['name'])
    data = {
        'source': {
            'repository': 'https://github.com/wess09/AzurPilot',
            'commit': sys.argv[2] if len(sys.argv) > 2 else '',
            'audited': '2026-10-20',
            'contractVersion': contract.get('version'),
        },
        'count': len(methods),
        'methods': methods,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(methods)} methods -> {OUT}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
