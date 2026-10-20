<template>
  <div class="dg-wrap">
    <svg class="dg" viewBox="0 0 720 384" role="img" aria-labelledby="arch-title">
      <title id="arch-title">
        AzurPilot 核心程序分层架构：入口层、运行时、业务模块、基础能力与数据资源
      </title>

      <!-- 入口层 -->
      <g class="dg-band--slate">
        <rect x="0" y="4" width="720" height="60" rx="10" class="dg-band" />
        <text x="16" y="28" class="dg-band__fx">入口层</text>
        <text x="16" y="43" class="dg-band__fk">ENTRY</text>

        <rect x="104" y="14" width="144" height="40" rx="7" class="dg-node" />
        <text x="176" y="32" class="dg-node__t" text-anchor="middle">alas.py</text>
        <text x="176" y="45" class="dg-node__s" text-anchor="middle">调度器进程</text>

        <rect x="256" y="14" width="144" height="40" rx="7" class="dg-node" />
        <text x="328" y="32" class="dg-node__t" text-anchor="middle">gui.py</text>
        <text x="328" y="45" class="dg-node__s" text-anchor="middle">WebUI 后端</text>

        <rect x="408" y="14" width="144" height="40" rx="7" class="dg-node" />
        <text x="480" y="32" class="dg-node__t" text-anchor="middle">mcp_server_sse.py</text>
        <text x="480" y="45" class="dg-node__s" text-anchor="middle">MCP SSE 服务</text>

        <rect x="560" y="14" width="144" height="40" rx="7" class="dg-node" />
        <text x="632" y="32" class="dg-node__t" text-anchor="middle">tui.py</text>
        <text x="632" y="45" class="dg-node__s" text-anchor="middle">终端界面</text>
      </g>

      <!-- 运行时 -->
      <g class="dg-band--blue">
        <rect x="0" y="76" width="720" height="60" rx="10" class="dg-band" />
        <text x="16" y="100" class="dg-band__fx">运行时</text>
        <text x="16" y="115" class="dg-band__fk">RUNTIME</text>

        <rect x="104" y="86" width="296" height="40" rx="7" class="dg-node" />
        <text x="116" y="104" class="dg-node__t">module/api</text>
        <text x="116" y="117" class="dg-node__s">WebSocket v1 · 方法路由 · 会话鉴权</text>

        <rect x="408" y="86" width="296" height="40" rx="7" class="dg-node" />
        <text x="420" y="104" class="dg-node__t">module/runtime</text>
        <text x="420" y="117" class="dg-node__s">进程管理 · 更新 · 远程访问 · 账号保险库</text>
      </g>

      <!-- 业务模块 -->
      <g class="dg-band--indigo">
        <rect x="0" y="148" width="720" height="76" rx="10" class="dg-band" />
        <text x="16" y="182" class="dg-band__fx">业务模块</text>
        <text x="16" y="197" class="dg-band__fk">MODULES</text>

        <rect x="104" y="156" width="600" height="60" rx="7" class="dg-slab" />
        <text x="116" y="174" class="dg-node__t">游戏功能模块 · module/*</text>
        <text x="116" y="189" class="dg-node__s">
          research · commission · reward · daily · opsi · island · campaign · event · shop · retire · exercise
        </text>
        <text x="116" y="203" class="dg-node__s">每个模块实现 run()，由 alas.py 同名方法惰性导入</text>
      </g>

      <!-- 基础能力 -->
      <g class="dg-band--teal">
        <rect x="0" y="236" width="720" height="60" rx="10" class="dg-band" />
        <text x="16" y="260" class="dg-band__fx">基础能力</text>
        <text x="16" y="275" class="dg-band__fk">BASE</text>

        <rect x="104" y="246" width="144" height="40" rx="7" class="dg-node" />
        <text x="176" y="264" class="dg-node__t" text-anchor="middle">device</text>
        <text x="176" y="277" class="dg-node__s" text-anchor="middle">ADB / 截图 / 点击</text>

        <rect x="256" y="246" width="144" height="40" rx="7" class="dg-node" />
        <text x="328" y="264" class="dg-node__t" text-anchor="middle">ui</text>
        <text x="328" y="277" class="dg-node__s" text-anchor="middle">页面图与控件</text>

        <rect x="408" y="246" width="144" height="40" rx="7" class="dg-node" />
        <text x="480" y="264" class="dg-node__t" text-anchor="middle">ocr / map</text>
        <text x="480" y="277" class="dg-node__s" text-anchor="middle">识别与寻路</text>

        <rect x="560" y="246" width="144" height="40" rx="7" class="dg-node" />
        <text x="632" y="264" class="dg-node__t" text-anchor="middle">base / config</text>
        <text x="632" y="277" class="dg-node__s" text-anchor="middle">ModuleBase · 参数生成</text>
      </g>

      <!-- 数据 -->
      <g class="dg-band--amber">
        <rect x="0" y="308" width="720" height="60" rx="10" class="dg-band" />
        <text x="16" y="332" class="dg-band__fx">数据资源</text>
        <text x="16" y="347" class="dg-band__fk">DATA</text>

        <rect x="104" y="318" width="194" height="40" rx="7" class="dg-node" />
        <text x="116" y="336" class="dg-node__t">config/&lt;实例&gt;.json</text>
        <text x="116" y="349" class="dg-node__s">用户配置 · Scheduler.NextRun</text>

        <rect x="306" y="318" width="194" height="40" rx="7" class="dg-node" />
        <text x="318" y="336" class="dg-node__t">SQLite 总库</text>
        <text x="318" y="349" class="dg-node__s">统计 · 持久化 · 迁移</text>

        <rect x="508" y="318" width="196" height="40" rx="7" class="dg-node" />
        <text x="520" y="336" class="dg-node__t">assets / campaign</text>
        <text x="520" y="349" class="dg-node__s">四服模板 · 关卡定义</text>
      </g>

      <!-- 层间连接 -->
      <g>
        <path d="M404 64 V76" class="dg-hop" />
        <path d="M404 136 V148" class="dg-hop" />
        <path d="M404 224 V236" class="dg-hop" />
        <path d="M404 296 V308" class="dg-hop" />
        <path d="M399 72 h10 l-5 5 z" class="dg-hop-head" />
        <path d="M399 144 h10 l-5 5 z" class="dg-hop-head" />
        <path d="M399 232 h10 l-5 5 z" class="dg-hop-head" />
        <path d="M399 304 h10 l-5 5 z" class="dg-hop-head" />
      </g>
    </svg>
  </div>
</template>
