<script setup lang="ts">
import { computed, ref } from 'vue'
import data from '../../data/api.json'

type Field = {
  name: string
  type: string
  required: boolean
  description?: string
  enum?: unknown[]
  default?: unknown
}
type Method = { name: string; mutates: boolean; description: string; fields: Field[] }

const methods = data.methods as Method[]
const groups = computed(() => {
  const set = new Set<string>()
  for (const m of methods) set.add(m.name.split('.')[0])
  return ['全部', ...Array.from(set).sort()]
})
const active = ref('全部')
const query = ref('')
const open = ref<string | null>(null)

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  return methods.filter((m) => {
    if (active.value !== '全部' && !m.name.startsWith(active.value + '.')) return false
    if (!q) return true
    return m.name.toLowerCase().includes(q) || JSON.stringify(m.fields).toLowerCase().includes(q)
  })
})

function toggle(name: string) {
  open.value = open.value === name ? null : name
}
</script>

<template>
  <div class="api-ref">
    <div class="api-ref__bar">
      <div class="api-ref__filters" role="tablist" aria-label="按命名空间筛选">
        <button
          v-for="g in groups"
          :key="g"
          type="button"
          role="tab"
          :aria-selected="active === g"
          :class="['api-ref__chip', { 'is-on': active === g }]"
          @click="active = g"
        >
          {{ g }}
        </button>
      </div>
      <input
        v-model="query"
        class="api-ref__search"
        type="search"
        placeholder="搜索方法或字段…"
        aria-label="搜索 API 方法"
      />
    </div>

    <p class="api-ref__count" aria-live="polite">
      {{ rows.length }} / {{ methods.length }} 个方法 · 契约版本 {{ data.source.contractVersion }} · {{ data.source.commit.slice(0, 7) }}
    </p>

    <div class="api-ref__list">
      <div v-for="m in rows" :key="m.name" class="api-ref__row">
        <button
          type="button"
          class="api-ref__head"
          :aria-expanded="open === m.name"
          @click="toggle(m.name)"
        >
          <code class="api-ref__name">{{ m.name }}</code>
          <span class="api-ref__mut" :class="{ 'is-write': m.mutates }">{{ m.mutates ? '写入' : '只读' }}</span>
          <span class="api-ref__params">{{ m.fields.length }} 参数</span>
          <span class="api-ref__arrow" aria-hidden="true">{{ open === m.name ? '−' : '+' }}</span>
        </button>
        <div v-if="open === m.name" class="api-ref__body">
          <p v-if="m.description" class="api-ref__desc">{{ m.description }}</p>
          <table v-if="m.fields.length">
            <thead>
              <tr>
                <th>字段</th>
                <th>类型</th>
                <th>必填</th>
                <th>约束</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="f in m.fields" :key="f.name">
                <td><code>{{ f.name }}</code></td>
                <td><code>{{ f.type }}</code></td>
                <td>{{ f.required ? '是' : '否' }}</td>
                <td class="api-ref__constraint">
                  <span v-if="f.enum">{{ f.enum.join(' / ') }}</span>
                  <span v-if="f.default !== undefined">默认 {{ JSON.stringify(f.default) }}</span>
                  <span v-if="!f.enum && f.default === undefined">—</span>
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="api-ref__desc">无参数。</p>
        </div>
      </div>
      <p v-if="!rows.length" class="api-ref__empty">没有匹配的方法。</p>
    </div>
  </div>
</template>

<style scoped>
.api-ref {
  margin: 24px 0;
}
.api-ref__bar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--ap-line);
  padding-bottom: 12px;
}
.api-ref__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.api-ref__chip {
  font-family: var(--ap-font-mono);
  font-size: 11px;
  padding: 4px 8px;
  border: 1px solid var(--ap-line);
  background: var(--ap-surface);
  color: var(--ap-ink-2);
  cursor: pointer;
}
.api-ref__chip.is-on {
  background: var(--ap-ink);
  border-color: var(--ap-ink);
  color: var(--ap-paper);
}
.api-ref__search {
  flex: 1 1 200px;
  max-width: 260px;
  height: 32px;
  border: 1px solid var(--ap-line);
  background: var(--ap-surface);
  padding: 0 10px;
  font-size: 13px;
  color: var(--ap-ink);
}
.api-ref__count {
  font-family: var(--ap-font-mono);
  font-size: 11px;
  color: var(--ap-muted);
  margin: 10px 0;
}
.api-ref__row {
  border-bottom: 1px solid var(--ap-line);
}
.api-ref__head {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 9px 2px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.api-ref__head:hover {
  background: var(--ap-surface-2);
}
.api-ref__name {
  font-size: 12.5px;
  color: var(--ap-ink);
  border: none;
  background: transparent;
  padding: 0;
}
.api-ref__mut {
  font-family: var(--ap-font-mono);
  font-size: 9.5px;
  letter-spacing: 0.06em;
  padding: 1px 5px;
  border: 1px solid var(--ap-line-strong);
  color: var(--ap-muted);
}
.api-ref__mut.is-write {
  color: var(--ap-accent-strong);
  border-color: var(--ap-accent);
}
.api-ref__params {
  margin-left: auto;
  font-family: var(--ap-font-mono);
  font-size: 10px;
  color: var(--ap-muted);
}
.api-ref__arrow {
  width: 18px;
  text-align: center;
  color: var(--ap-accent);
  font-family: var(--ap-font-mono);
}
.api-ref__body {
  padding: 4px 2px 16px;
}
.api-ref__desc {
  font-size: 13px;
  color: var(--ap-ink-2);
  margin: 0 0 10px;
}
.api-ref__body table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
}
.api-ref__body th {
  text-align: left;
  font-family: var(--ap-font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--ap-muted);
  padding: 6px 8px;
  border-bottom: 1px solid var(--ap-line-strong);
}
.api-ref__body td {
  padding: 6px 8px;
  border-bottom: 1px solid var(--ap-line);
  color: var(--ap-ink-2);
  vertical-align: top;
}
.api-ref__constraint {
  font-size: 12px;
  color: var(--ap-muted);
}
.api-ref__empty {
  color: var(--ap-muted);
  padding: 20px 0;
}
</style>
