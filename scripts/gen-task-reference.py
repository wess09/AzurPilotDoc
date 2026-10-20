"""生成 reference/tasks.md 与 reference/config.md 的表格部分。

用法:
    python scripts/gen-task-reference.py <AzurPilot 仓库路径>
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
DATA = DOCS / '.vitepress' / 'data' / 'tasks.json'

MENU_NAME = {
    'Alas': '系统',
    'Farm': '出击',
    'Event': '活动',
    'EventDaily': '活动-每日任务',
    'Reward': '自动收获',
    'DailyMission': '每日任务',
    'Opsi': '大世界',
    'Island': '赤石计划',
    'FleetManagement': '舰队管理',
    'RunParams': '运行参数',
    'Tool': '工具',
    'Dashboard': '仪表盘',
}
PAGE = {
    'Farm': 'campaign',
    'Event': 'campaign',
    'EventDaily': 'campaign',
    'Reward': 'daily',
    'DailyMission': 'daily',
    'Opsi': 'opsi',
    'Island': 'island',
}


def parse_groups(text: str) -> dict[str, dict[str, list[str]]]:
    groups: dict[str, dict[str, list[str]]] = {}
    group = None
    sub = None
    in_tasks = False
    for raw in text.splitlines():
        if not raw.strip() or raw.lstrip().startswith('#'):
            continue
        m = re.match(r'^([A-Za-z][A-Za-z0-9_]*):[ \t]*$', raw)
        if m:
            group = m.group(1)
            groups[group] = {}
            in_tasks = False
            continue
        if re.match(r'^[ \t]+tasks:[ \t]*$', raw):
            in_tasks = True
            continue
        if not in_tasks or group is None:
            continue
        m = re.match(r'^[ \t]{2,6}([A-Za-z][A-Za-z0-9_]*):[ \t]*$', raw)
        if m and len(raw) - len(raw.lstrip()) <= 4:
            sub = m.group(1)
            groups[group][sub] = []
            continue
        m = re.match(r'^[ \t]+-[ \t]+([A-Za-z0-9_]+)[ \t]*$', raw)
        if m and sub:
            groups[group][sub].append(m.group(1))
    return groups


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    repo = Path(sys.argv[1])
    data = json.loads(DATA.read_text(encoding='utf-8'))
    groups = parse_groups((repo / 'module/config/argument/task.yaml').read_text(encoding='utf-8'))
    tasks = {t['command']: t for t in data['tasks']}

    out: list[str] = [
        '---',
        'title: 任务命令总表',
        'description: 102 个任务命令的中文名、菜单分组、参数组与手册链接，由仓库配置在构建期生成。',
        'updated: 2026-10-20',
        '---',
        '',
        '# 任务命令总表',
        '',
        '下表覆盖 `args.json` 中的全部任务键（不含 Dashboard 资源定义）。**命令**是 `alas.py` 的方法名（驼峰转下划线），也是配置里 `Scheduler.Command` 的值。',
        '',
        f'共 {data["count"]} 个任务。数据来源：`{data["source"]["repository"]}` @ `{data["source"]["commit"][:7]}`。',
        '',
    ]
    covered = 0
    for group, subs in groups.items():
        if group == 'Dashboard':
            continue
        out.append(f'## {MENU_NAME.get(group, group)}（`{group}`）')
        out.append('')
        out.append('| 任务 | 命令 | 参数组 | 手册 |')
        out.append('| --- | --- | --- | --- |')
        for command, params_list in subs.items():
            task = tasks.get(command)
            if not task:
                continue
            covered += 1
            params = ' '.join(
                f'`{g}`' for g in params_list if g not in ('Scheduler', 'Storage')
            )
            page = PAGE.get(group, 'tools')
            out.append(
                f'| {task["name"]} | `{command}` | {params or "—"} | '
                f'[{page}](/azurpilot/user/tasks/{page}) |'
            )
        out.append('')

    written = {t for group, subs in groups.items() for t in subs}
    unlisted = [t for t in data['tasks'] if t['command'] not in written]
    if unlisted:
        out += ['## 配置中存在、菜单未登记的任务', '',
                '以下任务在 `args.json` 中有定义，但没有出现在 `task.yaml` 的菜单里。它们可能由 API 或内部调用触发，当前 WebUI 不直接暴露。文档不为其编造操作步骤。', '',
                '| 任务 | 命令 | 参数组 | 状态 |', '| --- | --- | --- | --- |']
        for task in unlisted:
            params = ' '.join(f'`{g}`' for g in task['groups'] if g not in ('Scheduler', 'Storage'))
            out.append(f'| {task["name"]} | `{task["command"]}` | {params or "—"} | 未在菜单暴露（待核实） |')
        out.append('')

    out += [
        '## 说明',
        '',
        '### 参数组',
        '',
        '每个任务的「其他参数组」是它在 `task.yaml` 中引用的选项组。`Scheduler` 提供启用、时间与间隔，`Storage` 决定统计写入哪张表，表里省略了这两组。',
        '',
        '### 菜单名与命令不是一回事',
        '',
        '菜单名（如「主线图-1」）只用于显示；命令（如 `Main`）是调度器与 API 使用的标识。`tasks.run`、`trigger_task` 都传命令。',
        '',
        '### 活动任务的时效',
        '',
        '`Hospital`、`Coalition`、`CoalitionSp` 等是特定活动的专用流程。活动结束后即使启用也不会运行。活动适配会增删任务，以你当前版本的 `task.yaml` 为准。',
        '',
    ]
    (DOCS / 'reference' / 'tasks.md').write_text('\n'.join(out) + '\n', encoding='utf-8')
    print(f'{covered} tasks written')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
