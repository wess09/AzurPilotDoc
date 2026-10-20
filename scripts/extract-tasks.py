"""从核心仓库快照生成任务与配置参考数据。

用法:
    python scripts/extract-tasks.py <AzurPilot 仓库路径>

输出:
    docs/.vitepress/data/tasks.json
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / '.vitepress' / 'data' / 'tasks.json'


def parse_task_yaml(text: str) -> dict[str, dict[str, list[str]]]:
    """解析 task.yaml 的 菜单 -> 子组 -> 任务 结构（仅取结构，不处理锚点）。"""
    groups: dict[str, dict[str, list[str]]] = {}
    group = None
    sub = None
    in_tasks = False
    for raw in text.splitlines():
        line = raw.rstrip()
        if not line or line.lstrip().startswith('#'):
            continue
        if re.match(r'^[A-Za-z][\w]*:\s*$', line):
            group = line[:-1]
            groups[group] = {}
            in_tasks = False
            continue
        if group and re.match(r'^  tasks:\s*$', line):
            in_tasks = True
            continue
        if not in_tasks:
            continue
        m = re.match(r'^    ([A-Za-z][\w]*):\s*$', line)
        if m:
            sub = m.group(1)
            groups[group][sub] = []
            continue
        m = re.match(r'^      - ([\w]+)\s*$', line)
        if m and sub:
            groups[group][sub].append(m.group(1))
    return groups


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    repo = Path(sys.argv[1])
    args = json.loads((repo / 'module/config/argument/args.json').read_text(encoding='utf-8'))
    i18n = json.loads((repo / 'module/config/i18n/zh-CN.json').read_text(encoding='utf-8'))
    menus = parse_task_yaml((repo / 'module/config/argument/task.yaml').read_text(encoding='utf-8'))
    names = i18n.get('Task', {})
    menu_names = i18n.get('Menu', {})

    tasks = []
    for command, groups in args.items():
        if command == 'Dashboard':
            continue
        meta = names.get(command, {})
        tasks.append({
            'command': command,
            'name': meta.get('name', command),
            'help': (meta.get('help') or '').strip(),
            'groups': list(groups.keys()),
        })
    tasks.sort(key=lambda t: t['name'])

    data = {
        'source': {
            'repository': 'https://github.com/wess09/AzurPilot',
            'branch': 'master',
            'commit': sys.argv[2] if len(sys.argv) > 2 else '',
            'audited': '2026-10-20',
        },
        'menus': [
            {'key': g, 'name': menu_names.get(g, {}).get('name', g), 'subgroups': subs}
            for g, subs in menus.items()
        ],
        'tasks': tasks,
        'count': len(tasks),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(tasks)} tasks -> {OUT}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
