<script setup lang="ts">
import { computed, ref } from 'vue'
import data from '../../data/tasks.json'

type Task = { command: string; name: string; help: string; groups: string[] }
const tasks = data.tasks as Task[]
const menus = data.menus as { key: string; name: string }[]

const PAGE: Record<string, string> = {
  系统: '/azurpilot/user/tasks/tools',
  出击: '/azurpilot/user/tasks/campaign',
  活动: '/azurpilot/user/tasks/campaign',
  活动每日: '/azurpilot/user/tasks/campaign',
  日常: '/azurpilot/user/tasks/daily',
  每日任务: '/azurpilot/user/tasks/daily',
  大世界: '/azurpilot/user/tasks/opsi',
  岛屿: '/azurpilot/user/tasks/island',
  工具: '/azurpilot/user/tasks/tools',
}
const GROUP_OF: Record<string, string> = {
  Alas: '系统',
  General: '系统',
  Restart: '系统',
  Main: '出击',
  Main2: '出击',
  Main3: '出击',
  GemsFarming: '出击',
  ThreeOilLowCost: '出击',
  Ambush11: '出击',
  EventGeneral: '活动',
  Event: '活动',
  Event2: '活动',
  Event3: '活动',
  Raid: '活动',
  RaidScuttle: '活动',
  Hospital: '活动',
  Coalition: '活动',
  CoalitionScuttle: '活动',
  MaritimeEscort: '活动',
  EventShop: '活动',
  WarArchives: '活动',
  EventA: '活动每日',
  EventB: '活动每日',
  EventC: '活动每日',
  EventD: '活动每日',
  EventSp: '活动每日',
  RaidDaily: '活动每日',
  CoalitionSp: '活动每日',
  Commission: '日常',
  Tactical: '日常',
  Research: '日常',
  StorageStatistics: '日常',
  Dorm: '日常',
  Meowfficer: '日常',
  Guild: '日常',
  Reward: '日常',
  Awaken: '日常',
  Secretary: '日常',
  OperationHandover: '日常',
  Daily: '每日任务',
  LimitChallenge: '每日任务',
  Hard: '每日任务',
  Exercise: '每日任务',
  ShopFrequent: '每日任务',
  ShopOnce: '每日任务',
  Shipyard: '每日任务',
  Gacha: '每日任务',
  Freebies: '每日任务',
  Minigame: '每日任务',
  PrivateQuarters: '每日任务',
  OpsiGeneral: '大世界',
  OpsiAshBeacon: '大世界',
  OpsiAshAssist: '大世界',
  OpsiExplore: '大世界',
  OpsiExploreCleanup: '大世界',
  OpsiShop: '大世界',
  OpsiVoucher: '大世界',
  OpsiDaily: '大世界',
  OpsiObscure: '大世界',
  OpsiAbyssal: '大世界',
  OpsiArchive: '大世界',
  OpsiStronghold: '大世界',
  OpsiMonthBoss: '大世界',
  OpsiMeowfficerFarming: '大世界',
  OpsiHazard1Leveling: '大世界',
  OpsiScheduling: '大世界',
  OpsiPreventActionPointOverflow: '大世界',
  OpsiCrossMonth: '大世界',
  OpsiSimulator: '大世界',
  IslandPlan: '岛屿',
  IslandBusiness: '岛屿',
  IslandFarm: '岛屿',
  IslandRancher: '岛屿',
  IslandMineForest: '岛屿',
  IslandRestaurant: '岛屿',
  IslandTeahouse: '岛屿',
  IslandGrill: '岛屿',
  IslandJuuEatery: '岛屿',
  IslandJuuCoffee: '岛屿',
  IslandManufacture: '岛屿',
  IslandDailyGather: '岛屿',
  IslandAirDrop: '岛屿',
  IslandCargoPreparation: '岛屿',
  IslandDailyOrder: '岛屿',
  IslandDailyInteract: '岛屿',
  IslandPearlSell: '岛屿',
  FleetInfo: '工具',
  RunParams: '工具',
  MindCalculatorScan: '工具',
  FleetTechScan: '工具',
  Daemon: '工具',
  OpsiDaemon: '工具',
  EventStory: '工具',
  BoxDisassemble: '工具',
  AutoEquip: '工具',
  Benchmark: '工具',
  OcrBenchmark: '工具',
  AzurLaneUncensored: '工具',
  GameManager: '工具',
  EmulatorManager: '工具',
  MeowfficerScore: '工具',
}

const GROUPS = ['全部', '系统', '出击', '活动', '活动每日', '日常', '每日任务', '大世界', '岛屿', '工具']
const active = ref('全部')
const query = ref('')

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return tasks.filter((t) => {
    const group = GROUP_OF[t.command] || '工具'
    if (active.value !== '全部' && group !== active.value) return false
    if (!q) return true
    return (
      t.command.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.help.toLowerCase().includes(q)
    )
  })
})
const link = (t: Task) => PAGE[GROUP_OF[t.command] || '工具'] || '/azurpilot/user/tasks/'
</script>

<template>
  <div class="task-ref">
    <div class="task-ref__bar">
      <div class="task-ref__filters" role="tablist" aria-label="按分组筛选任务">
        <button
          v-for="g in GROUPS"
          :key="g"
          type="button"
          role="tab"
          :aria-selected="active === g"
          :class="['task-ref__chip', { 'is-on': active === g }]"
          @click="active = g"
        >
          {{ g }}
        </button>
      </div>
      <input
        v-model="query"
        class="task-ref__search"
        type="search"
        placeholder="搜索任务名或命令…"
        aria-label="搜索任务"
      />
    </div>

    <p class="task-ref__count" aria-live="polite">
      显示 {{ rows.length }} / {{ tasks.length }} 个任务 · 数据来自 {{ data.source.commit.slice(0, 7) }}
    </p>

    <div class="task-ref__wrap">
      <table class="task-ref__table">
        <thead>
          <tr>
            <th style="width: 26%">任务</th>
            <th style="width: 24%">命令</th>
            <th>说明</th>
            <th style="width: 12%">手册</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in rows" :key="t.command">
            <td><span class="task-ref__name">{{ t.name }}</span></td>
            <td><code>{{ t.command }}</code></td>
            <td class="task-ref__help">{{ t.help || '—' }}</td>
            <td><a :href="link(t)">阅读</a></td>
          </tr>
          <tr v-if="!rows.length">
            <td colspan="4" class="task-ref__empty">没有匹配的任务。</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.task-ref {
  margin: 24px 0;
}
.task-ref__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ap-line);
}
.task-ref__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.task-ref__chip {
  font-family: var(--ap-font-mono);
  font-size: 11px;
  letter-spacing: 0.04em;
  padding: 4px 9px;
  border: 1px solid var(--ap-line);
  background: var(--ap-surface);
  color: var(--ap-ink-2);
  cursor: pointer;
  transition: border-color var(--ap-dur-fast) var(--ap-ease), color var(--ap-dur-fast) var(--ap-ease);
}
.task-ref__chip:hover {
  border-color: var(--ap-accent);
}
.task-ref__chip.is-on {
  background: var(--ap-ink);
  border-color: var(--ap-ink);
  color: var(--ap-paper);
}
.task-ref__search {
  flex: 1 1 220px;
  max-width: 280px;
  height: 32px;
  border: 1px solid var(--ap-line);
  background: var(--ap-surface);
  padding: 0 10px;
  font-size: 13px;
  color: var(--ap-ink);
  border-radius: 2px;
}
.task-ref__search:focus {
  border-color: var(--ap-accent);
  outline: none;
}
.task-ref__count {
  font-family: var(--ap-font-mono);
  font-size: 11px;
  color: var(--ap-muted);
  margin: 10px 0 0;
}
.task-ref__wrap {
  overflow-x: auto;
  margin-top: 4px;
}
.task-ref__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.task-ref__table th {
  text-align: left;
  font-family: var(--ap-font-mono);
  font-size: 10.5px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ap-muted);
  padding: 10px 8px;
  border-bottom: 1px solid var(--ap-line-strong);
  white-space: nowrap;
}
.task-ref__table td {
  padding: 8px;
  border-bottom: 1px solid var(--ap-line);
  vertical-align: top;
  color: var(--ap-ink-2);
}
.task-ref__name {
  color: var(--ap-ink);
  font-weight: 550;
}
.task-ref__help {
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--ap-muted);
  max-width: 460px;
}
.task-ref__table code {
  font-size: 11.5px;
  background: var(--ap-surface-3);
  padding: 1px 4px;
  border: 1px solid var(--ap-line);
}
.task-ref__empty {
  text-align: center;
  color: var(--ap-muted);
  padding: 24px;
}
</style>
