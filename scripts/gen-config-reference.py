"""生成 reference/config.md。"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'docs' / '.vitepress' / 'data' / 'config.json'
OUT = ROOT / 'docs' / 'reference' / 'config.md'


def row(r: dict) -> str:
    fields = ' '.join(f'`{x}`' for x in r['fields'][:12])
    if len(r['fields']) > 12:
        fields += f" …（共 {r['fieldCount']} 项）"
    return f"| `{r['group']}` | {r['fieldCount']} | {r['usedByCount']} | {fields} |"


def table(rows: list[dict]) -> list[str]:
    out = ['| 选项组 | 字段数 | 被引用任务数 | 字段 |', '| --- | --- | --- | --- |']
    out += [row(r) for r in rows]
    return out


def main() -> None:
    data = json.loads(DATA.read_text(encoding='utf-8'))
    rows = data['groups']
    top = [r for r in rows if r['usedByCount'] >= 3][:40]
    out = [
        '---',
        'title: 配置参考',
        'description: AzurPilot 配置的路径语义、调度字段、常用选项组与全部 167 个参数组的字段索引。',
        'updated: 2026-10-20',
        '---',
        '',
        '# 配置参考',
        '',
        '配置不是一堆散落的开关，而是三层路径：',
        '',
        '```text',
        '<Task>.<Group>.<Argument>',
        '例如 Research.Research.UseCube',
        '     └ 任务   └ 选项组  └ 字段',
        '```',
        '',
        '运行时绑定后，业务代码用下划线属性访问：`self.config.Research_UseCube`。',
        '',
        f'当前版本共 **{data["groupCount"]} 个选项组**、**102 个任务**。数据来源：`{data["source"]["repository"]}` @ `{data["source"]["commit"][:7]}`。',
        '',
        '::: tip 完整字段以 WebUI 为准',
        '下表列出字段名与数量，但**不复制每个字段的默认值、取值范围与帮助文案**——那些由 `argument.yaml` 与 `i18n/*.json` 在运行时分发，手抄会过期。需要精确值时看 WebUI 的字段提示，或直接读源码。',
        ':::',
        '',
        '## 调度字段',
        '',
        '每个任务都有 `Scheduler` 组：',
        '',
        '| 字段 | 类型 | 默认 | 含义 |',
        '| --- | --- | --- | --- |',
        '| `Enable` | checkbox | false | 是否加入调度 |',
        '| `PushNotification` | checkbox | false | 任务结束推送 |',
        '| `NextRun` | datetime | 2020-01-01 | 下一次允许运行的时间 |',
        '| `Command` | text | 任务名 | 内部命令，自动维护 |',
        '| `SuccessInterval` | int | 0 | 成功后推迟分钟数 |',
        '| `FailureInterval` | int | 120 | 失败后推迟分钟数 |',
        '| `ServerUpdate` | time | 00:00 | 每日排期基准 |',
        '| `Sensitive` | checkbox | 视任务 | 出错停止而非重启 |',
        '',
        '## 常用选项组',
        '',
        '按「被多少任务引用」排序，只列引用数 ≥ 3 的组：',
        '',
        *table(top),
        '',
        '## 全部选项组',
        '',
        '展开查看 167 个组的字段索引。',
        '',
        '::: details 全部选项组',
        '',
        *table(rows),
        '',
        ':::',
        '',
        '## 字段语义的分类',
        '',
        '### 用户可改 vs 强制覆盖',
        '',
        '| 来源 | 行为 |',
        '| --- | --- |',
        '| `argument.yaml` | 定义类型与默认值 |',
        '| `default.yaml` | 任务特定的可修改默认值 |',
        '| `override.yaml` | 强制覆盖，用户改不了（包括 `display: hide`） |',
        '',
        '在 WebUI 改了值又变回去，先查 `override.yaml`。',
        '',
        '### 可见 vs 内部状态',
        '',
        '标记 `display: hide` 的字段（如 `Campaign.Name` 之外的大量 `*Record`、`*State`）是内部状态，用于跨运行记忆。不要手动改，除非你明确知道它的状态机。',
        '',
        '### 需要重启 vs 立即生效',
        '',
        '| 类型 | 生效时机 |',
        '| --- | --- |',
        '| 任务参数 | 任务边界（下一个任务开始时） |',
        '| 调度开关与时间 | 下一轮调度 |',
        '| `deploy.yaml`（端口、密码、语言） | 重启后端 |',
        '| Android Runtime 部署字段 | 重启 Runtime |',
        '',
        '## 常见错误',
        '',
        '| 现象 | 原因 |',
        '| --- | --- |',
        '| 字段不存在 | 该任务没有挂这个选项组 |',
        '| 保存后回退 | 被 `override.yaml` 覆盖 |',
        '| 中文显示为键名 | `i18n` 缺翻译 |',
        '| 改了没生效 | 还在任务执行中，等下个任务边界 |',
        '| 导入后丢字段 | 跨版本迁移，字段被重命名或删除 |',
        '',
        '## 相关',
        '',
        '- [配置系统（开发者）](/azurpilot/developer/config)',
        '- [任务命令总表](/reference/tasks)',
        '- [命令行、端口与环境变量](/reference/cli)',
        '',
    ]
    OUT.write_text('\n'.join(out), encoding='utf-8')
    print('written', OUT)


if __name__ == '__main__':
    main()
