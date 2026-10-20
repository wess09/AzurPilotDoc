<template>
  <div class="dg-wrap">
    <svg class="dg" viewBox="0 0 720 384" role="img" aria-labelledby="android-title">
      <title id="android-title">
        AzurPilot for Android 分层：Compose 宿主、PRoot Runtime、特权服务与虚拟屏游戏实例
      </title>

      <!-- 应用壳层 -->
      <g class="dg-band--slate">
        <rect x="0" y="4" width="720" height="94" rx="10" class="dg-band" />
        <text x="16" y="40" class="dg-band__fx">应用壳层</text>
        <text x="16" y="55" class="dg-band__fk">APP SHELL</text>

        <rect x="104" y="14" width="144" height="32" rx="7" class="dg-node" />
        <text x="176" y="34" class="dg-node__s" text-anchor="middle">Compose UI / 设置</text>
        <rect x="256" y="14" width="144" height="32" rx="7" class="dg-node" />
        <text x="328" y="34" class="dg-node__s" text-anchor="middle">悬浮窗 / 屏保</text>
        <rect x="408" y="14" width="144" height="32" rx="7" class="dg-node" />
        <text x="480" y="34" class="dg-node__s" text-anchor="middle">AzurPilotGateway</text>
        <rect x="560" y="14" width="144" height="32" rx="7" class="dg-node" />
        <text x="632" y="34" class="dg-node__s" text-anchor="middle">OCR 工作进程 :ocr</text>

        <rect x="104" y="52" width="194" height="32" rx="7" class="dg-node" />
        <text x="201" y="72" class="dg-node__s" text-anchor="middle">RootfsProvisioner</text>
        <rect x="306" y="52" width="194" height="32" rx="7" class="dg-node" />
        <text x="403" y="72" class="dg-node__s" text-anchor="middle">ProotHost 会话</text>
        <rect x="508" y="52" width="196" height="32" rx="7" class="dg-node" />
        <text x="606" y="72" class="dg-node__s" text-anchor="middle">特权服务 · ADB / Shizuku / root</text>
      </g>

      <!-- PRoot -->
      <g class="dg-band--indigo">
        <rect x="0" y="110" width="720" height="40" rx="10" class="dg-band" />
        <text x="16" y="134" class="dg-band__fx">系统调用映射</text>
        <text x="16" y="146" class="dg-band__fk">PROOT</text>
        <text x="404" y="135" class="dg-node__t" text-anchor="middle">
          PROOT · 免 root 的系统调用映射（jniLibs 九件套）
        </text>
      </g>

      <!-- Runtime -->
      <g class="dg-band--blue">
        <rect x="0" y="162" width="720" height="104" rx="10" class="dg-band" />
        <text x="16" y="208" class="dg-band__fx">运行时</text>
        <text x="16" y="223" class="dg-band__fk">RUNTIME</text>

        <rect x="104" y="172" width="600" height="84" rx="7" class="dg-slab" />
        <text x="116" y="192" class="dg-node__t">上游 AzurPilot · Ubuntu 24.04 + Python 3.14</text>
        <text x="116" y="210" class="dg-node__s">
          WebUI（React dist）· 调度器 · 识别 · 游戏逻辑 · /android/* 薄接口
        </text>
        <text x="116" y="226" class="dg-node__s">监听 127.0.0.1:25548 · 部署配置来自 deploy.yaml</text>
        <text x="116" y="242" class="dg-node__s">
          /api/v1/ws（会话令牌）· /android/*（X-AzurPilot-Android-Token）· /healthz
        </text>
      </g>

      <!-- 游戏实例 -->
      <g class="dg-band--amber">
        <rect x="0" y="278" width="720" height="66" rx="10" class="dg-band" />
        <text x="16" y="306" class="dg-band__fx">游戏实例</text>
        <text x="16" y="321" class="dg-band__fk">GAME</text>

        <rect x="104" y="288" width="600" height="46" rx="7" class="dg-node" />
        <text x="116" y="306" class="dg-node__t">《碧蓝航线》游戏实例</text>
        <text x="116" y="321" class="dg-node__s">
          后台虚拟屏（Virtual Display）或主屏 · 共享内存帧通道 · 桥接输入注入
        </text>
      </g>

      <!-- 层间连接 -->
      <path d="M404 98 V110" class="dg-hop" />
      <path d="M404 150 V162" class="dg-hop" />
      <path d="M404 266 V278" class="dg-hop" />
      <path d="M399 106 h10 l-5 5 z" class="dg-hop-head" />
      <path d="M399 158 h10 l-5 5 z" class="dg-hop-head" />
      <path d="M399 274 h10 l-5 5 z" class="dg-hop-head" />

      <text x="2" y="370" class="dg-node__s">
        两层进程：App 壳层持有 Runtime 的 stdin，关闭 stdin 即触发 Runtime 进程组回收
      </text>
    </svg>
  </div>
</template>
