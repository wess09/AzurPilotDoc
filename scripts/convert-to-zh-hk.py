import os
import re
import opencc

cc = opencc.OpenCC("s2hk")

PRE_REPLACEMENTS = [
    # 故障排查 / 疑难排解
    ("故障排查", "疑難排解"),
    ("故障排除", "疑難排解"),
    ("排查方法", "疑難排解方法"),
    ("开始排查", "開始疑難排解"),
    ("排查顺序", "疑難排解順序"),
    ("定位与排查", "定位與疑難排解"),
    ("快速排查", "快速疑難排解"),
    ("排查", "疑難排解"),
    ("排障", "疑難排解"),

    # 屏幕 / 荧幕 (台用萤幕)
    ("屏幕分辨率", "熒幕解像度"),
    ("分辨率设置", "解像度設定"),
    ("分辨率", "解像度"),
    ("虚拟屏幕", "虛擬熒幕"),
    ("虚拟屏", "虛擬熒幕"),
    ("防烧屏屏保", "防燒屏熒幕保護"),
    ("防烧屏", "防燒屏"),
    ("屏保", "熒幕保護"),
    ("主屏", "主熒幕"),
    ("分屏", "分熒幕"),
    ("锁屏", "鎖定熒幕"),
    ("屏幕", "熒幕"),

    # 卸载 / 移除 (台用解除安装)
    ("完全卸载", "完全移除"),
    ("卸载", "移除"),

    # 网络 (台用网路)
    ("局域网", "區域網絡"),
    ("网络连接", "網絡連接"),
    ("公共网络", "公共網絡"),
    ("公网", "公網"),
    ("外网", "外網"),
    ("内网", "內網"),
    ("网络", "網絡"),

    # 软件 / 硬件 (台用软体 / 硬体)
    ("软件", "軟件"),
    ("硬件", "硬件"),
    ("软硬件", "軟硬件"),

    # 文件 / 档案 (注意文档保留文档)
    ("配置文件", "設定檔"),
    ("日志文件", "日誌檔案"),
    ("文件夹", "資料夾"),
    ("文件路径", "檔案路徑"),
    ("文件大小", "檔案大小"),
    ("单文件", "單一檔案"),
    ("文件", "檔案"),

    # 设置 / 设定
    ("游戏内设置", "遊戲內設定"),
    ("系统设置", "系統設定"),
    ("退役设置", "退役設定"),
    ("季节设置", "季節設定"),
    ("部署设置", "部署設定"),
    ("设置为", "設定為"),
    ("设置", "設定"),

    # 默认 / 预设
    ("默认端口", "預設連接埠"),
    ("默认分支", "預設分支"),
    ("默认值", "預設值"),
    ("默认开启", "預設開啟"),
    ("默认关闭", "預設關閉"),
    ("默认", "預設"),

    # 内存 / 记忆体
    ("内存占用", "記憶體佔用"),
    ("内存开销", "記憶體開銷"),
    ("内存泄漏", "記憶體洩漏"),
    ("内存", "記憶體"),

    # 线程 / 执行绪
    ("线程模型", "執行緒模型"),
    ("多线程", "多執行緒"),
    ("单线程", "單執行緒"),
    ("主线程", "主執行緒"),
    ("工作线程", "工作執行緒"),
    ("线程池", "執行緒池"),
    ("线程", "執行緒"),

    # 端口 / 连接埠
    ("端口占用", "連接埠佔用"),
    ("端口冲突", "連接埠衝突"),
    ("端口号", "連接埠號"),
    ("端口", "連接埠"),

    # 界面 / 介面
    ("用户界面", "用戶介面"),
    ("图形界面", "圖形介面"),
    ("WebUI 界面", "WebUI 介面"),
    ("界面导览", "介面導覽"),
    ("界面结构", "介面結構"),
    ("界面", "介面"),
    ("接口总览", "介面總覽"),
    ("接口参考", "介面參考"),
    ("薄接口", "薄介面"),
    ("接口契约", "介面契約"),
    ("接口清单", "介面清單"),
    ("接口", "介面"),

    # 变量 / 变数
    ("环境变量", "環境變數"),
    ("变量", "變數"),

    # 缓存 / 快取
    ("缓存策略", "快取策略"),
    ("清空缓存", "清空快取"),
    ("缓存", "快取"),

    # 数据库 / 资料库
    ("数据库", "資料庫"),

    # 搜索 / 搜寻
    ("搜索文档", "搜尋文檔"),
    ("搜索", "搜尋"),

    # 导入 / 导出
    ("导入导出", "匯入匯出"),
    ("导入", "匯入"),
    ("导出", "匯出"),

    # 账号 / 帐号
    ("账号密码", "帳號密碼"),
    ("账号保险库", "帳號保險庫"),
    ("账号信息", "帳號資訊"),
    ("账号", "帳號"),

    # 信息 / 资讯
    ("日志信息", "日誌資訊"),
    ("错误信息", "錯誤資訊"),
    ("提示信息", "提示資訊"),
    ("系统信息", "系統資訊"),
    ("信息", "資訊"),

    # 服务器 / 伺服器
    ("游戏服务器", "遊戲伺服器"),
    ("服务器", "伺服器"),
    ("服务端", "伺服端"),
    ("客户端", "客戶端"),

    # 创建 / 建立
    ("创建实例", "建立實例"),
    ("创建目录", "建立目錄"),
    ("创建任务", "建立任務"),
    ("创建", "建立"),

    # 点击
    ("点击", "點擊"),

    # 支持 / 支援
    ("支持的", "支援的"),
    ("支持", "支援"),

    # 重启 / 重新启动
    ("自动重启", "自動重新啟動"),
    ("反复重启", "反覆重新啟動"),
    ("重新启动", "重新啟動"),
    ("重启后", "重新啟動後"),
    ("重启软件", "重新啟動軟件"),
    ("重启", "重新啟動"),

    # 启动器 / 启动 (用 啟 非 啓)
    ("启动器开发者入口", "啟動器開發者入口"),
    ("启动器故障排查", "啟動器疑難排解"),
    ("启动器使用手册", "啟動器使用手冊"),
    ("安装启动器", "安裝啟動器"),
    ("桌面启动器", "桌面啟動器"),
    ("启动器", "啟動器"),
    ("启动画面", "啟動畫面"),
    ("首次启动", "首次啟動"),
    ("自启动", "自啟動"),
    ("开机自启", "開機自啟"),
    ("启动", "啟動"),

    # 模拟器
    ("模拟器", "模擬器"),

    # 备份
    ("备份", "備份"),

    # 权限激活 -> 权限启用
    ("权限激活", "權限啟用"),
    ("激活方式", "啟用方式"),
    ("激活", "啟用"),

    # 其他常见词
    ("高清", "高畫質"),
    ("在线", "線上"),
    ("离线", "離線"),
    ("截图", "截圖"),
    ("截屏", "截圖"),
    ("快捷键", "快速鍵"),
    ("弹窗", "彈出視窗"),
    ("下拉菜单", "下拉選單"),
    ("下拉框", "下拉選單"),
    ("复选框", "複選框"),
    ("单选框", "單選框"),
    ("滚动条", "捲軸"),
    ("登录", "登入"),
    ("链接", "連結"),
    ("模块", "模組"),
    ("保存", "儲存"),
    ("解压", "解壓縮"),
]

PRE_REPLACEMENTS.sort(key=lambda x: len(x[0]), reverse=True)

POST_REPLACEMENTS = [
    ("啓動", "啟動"),
    ("啓", "啟"),
    ("默認", "預設"),
    ("設置", "設定"),
    ("線程", "執行緒"),
    ("內存", "記憶體"),
    ("屏幕", "熒幕"),
    ("螢幕", "熒幕"),
    ("分辨率", "解像度"),
    ("解析度", "解像度"),
    ("網絡", "網絡"),
    ("網路", "網絡"),
    ("軟件", "軟件"),
    ("軟體", "軟件"),
    ("硬件", "硬件"),
    ("硬體", "硬件"),
    ("卸載", "移除"),
    ("解除安裝", "移除"),
    ("服務器", "伺服器"),
    ("服務端", "伺服端"),
    ("創建", "建立"),
    ("賬號", "帳號"),
    ("數據庫", "資料庫"),
    ("緩存", "快取"),
    ("變量", "變數"),
    ("重啓", "重新啟動"),
    ("檔檔", "文檔"),
    ("户", "戶"),
    ("模塊", "模組"),
]

def convert_text(text: str) -> str:
    for src, dst in PRE_REPLACEMENTS:
        text = text.replace(src, dst)
    text = cc.convert(text)
    for src, dst in POST_REPLACEMENTS:
        text = text.replace(src, dst)
    return text

def convert_url(url: str) -> str:
    if url.startswith("http://") or url.startswith("https://") or url.startswith("mailto:"):
        return url
    if url.startswith("/img/") or url.startswith("/robots.txt"):
        return url
    
    parts = url.split("#", 1)
    path = parts[0]
    anchor = parts[1] if len(parts) > 1 else None

    new_path = path
    if path.startswith("/"):
        if not path.startswith("/zh-HK/"):
            new_path = "/zh-HK" + path if path != "/" else "/zh-HK/"
    
    if anchor:
        new_anchor = convert_text(anchor)
        return f"{new_path}#{new_anchor}"
    return new_path

def convert_markdown(content: str) -> str:
    placeholders = {}
    counter = 0

    def add_ph(val: str) -> str:
        nonlocal counter
        k = f"___PH_{counter}___"
        counter += 1
        placeholders[k] = val
        return k

    # 1. Frontmatter
    fm_match = re.match(r"^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)", content)
    body = content
    fm_converted = ""
    if fm_match:
        fm_text = fm_match.group(1)
        body = content[fm_match.end():]
        fm_lines = fm_text.split("\n")
        new_fm_lines = []
        for line in fm_lines:
            m_title = re.match(r"^(\s*(?:-\s*)?title:\s*)(.*)$", line)
            m_desc = re.match(r"^(\s*(?:-\s*)?description:\s*)(.*)$", line)
            m_text = re.match(r"^(\s*(?:-\s*)?text:\s*)(.*)$", line)
            m_tagline = re.match(r"^(\s*(?:-\s*)?tagline:\s*)(.*)$", line)
            m_details = re.match(r"^(\s*(?:-\s*)?details:\s*)(.*)$", line)
            m_linktext = re.match(r"^(\s*(?:-\s*)?linkText:\s*)(.*)$", line)
            m_link = re.match(r"^(\s*(?:-\s*)?link:\s*)(.*)$", line)
            
            if m_title:
                val = m_title.group(2).strip().strip("'\"")
                new_fm_lines.append(f"{m_title.group(1)}{convert_text(val)}")
            elif m_desc:
                val = m_desc.group(2).strip().strip("'\"")
                new_fm_lines.append(f"{m_desc.group(1)}{convert_text(val)}")
            elif m_text:
                val = m_text.group(2).strip().strip("'\"")
                new_fm_lines.append(f"{m_text.group(1)}{convert_text(val)}")
            elif m_tagline:
                val = m_tagline.group(2).strip().strip("'\"")
                new_fm_lines.append(f"{m_tagline.group(1)}{convert_text(val)}")
            elif m_details:
                val = m_details.group(2).strip().strip("'\"")
                new_fm_lines.append(f"{m_details.group(1)}{convert_text(val)}")
            elif m_linktext:
                val = m_linktext.group(2).strip().strip("'\"")
                new_fm_lines.append(f"{m_linktext.group(1)}{convert_text(val)}")
            elif m_link:
                val = m_link.group(2).strip().strip("'\"")
                new_fm_lines.append(f"{m_link.group(1)}{convert_url(val)}")
            else:
                new_fm_lines.append(line)
        fm_converted = "---\n" + "\n".join(new_fm_lines) + "\n---\n"

    # 2. Extract code blocks
    def repl_fenced(match):
        prefix = match.group(1)
        fence = match.group(2)
        lang = match.group(3)
        code = match.group(4)
        if lang.strip() == "mermaid":
            lines = code.split("\n")
            new_lines = []
            for line in lines:
                def repl_label(m):
                    d1 = m.group(1)
                    txt = m.group(2)
                    d2 = m.group(3)
                    return f"{d1}{convert_text(txt)}{d2}"
                line = re.sub(r'(\["|\|"|\(")([\s\S]*?)("\]|"\||"\))', repl_label, line)
                new_lines.append(line)
            new_code = "\n".join(new_lines)
            new_block = f"{prefix}{fence}{lang}\n{new_code}\n{fence}"
            return add_ph(new_block)
        else:
            return add_ph(match.group(0))

    body = re.sub(r"(^|\n)(`{3,5}|~{3,5})([^\n]*)\n([\s\S]*?)\n\2(?=\n|$)", repl_fenced, body)

    # 3. Inline code
    body = re.sub(r"(`[^`\n]+`)", lambda m: add_ph(m.group(1)), body)

    # 4. DocIcon
    body = re.sub(r'(<DocIcon\s+name="[^"]+"\s*(?:\/>|><\/DocIcon>))', lambda m: add_ph(m.group(1)), body)

    # 5. Custom Vue components
    body = re.sub(r"(<(?:Confetti|TaskTable|ApiTable|CoreArchDiagram|AndroidStack|RemotePairing|SchedulerFlow)\s*\/?>)", lambda m: add_ph(m.group(1)), body)

    # 6. Step and Figure components
    def repl_step(m):
        attr = m.group(1)
        title = m.group(2)
        return add_ph(f'<Step {attr}title="{convert_text(title)}">')
    body = re.sub(r'<Step\s+([^>]*?)title="([^"]+)">', repl_step, body)

    def repl_figure(m):
        attr = m.group(1)
        caption = m.group(2)
        return add_ph(f'<Figure {attr}caption="{convert_text(caption)}" />')
    body = re.sub(r'<Figure\s+([^>]*?)caption="([^"]+)"\s*\/?>', repl_figure, body)

    # 7. HTML tags
    def repl_a_tag(m):
        full = m.group(0)
        href_m = re.search(r'href="([^"]+)"', full)
        if href_m:
            orig_href = href_m.group(1)
            new_href = convert_url(orig_href)
            full = full.replace(f'href="{orig_href}"', f'href="{new_href}"')
        return add_ph(full)
    body = re.sub(r'<a\s+[^>]*>', repl_a_tag, body)

    def repl_html_tag(m):
        return add_ph(m.group(0))
    body = re.sub(r'<\/?(?:a|table|thead|tbody|tr|th|td|small|b|strong|code|kbd|span|div|p|ul|ol|li|br|hr)(?:\s+[^>]*)?\/?>', repl_html_tag, body)

    # 8. Raw URLs
    body = re.sub(r'https?:\/\/[^\s)\]>"\'`]+', lambda m: add_ph(m.group(0)), body)

    # 9. Markdown links: [text](url)
    def repl_md_link(m):
        is_img = m.group(1)
        txt = m.group(2)
        url = m.group(3)
        converted_txt = convert_text(txt)
        converted_url = convert_url(url)
        ph_url = add_ph(f"({converted_url})")
        return f"{is_img}[{converted_txt}]{ph_url}"
    body = re.sub(r'(!?)\[([^\]]*)\]\(([^)\s]+(?:\s+"[^"]*")?)\)', repl_md_link, body)

    # 10. Container headers
    def repl_container(m):
        kind = m.group(1)
        rest = m.group(2)
        return f"::: {kind}{convert_text(rest)}"
    body = re.sub(r'^:::\s+(tip|warning|danger|info|details)(.*)$', repl_container, body, flags=re.MULTILINE)

    # 11. Convert body text
    body = convert_text(body)

    # 12. Restore placeholders
    for _ in range(5):
        has_ph = False
        for k, v in placeholders.items():
            if k in body:
                body = body.replace(k, v)
                has_ph = True
        if not has_ph:
            break

    return fm_converted + body

if __name__ == "__main__":
    source_dir = "docs"
    target_dir = os.path.join("docs", "zh-HK")
    os.makedirs(target_dir, exist_ok=True)
    
    skip_dirs = {".vitepress", "node_modules", "public", "en", "ja", "zh-HK", "zh-TW"}
    converted_files = []
    
    for root, dirs, files in os.walk(source_dir):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for file in files:
            if not file.endswith(".md"):
                continue
            src_path = os.path.join(root, file)
            rel_path = os.path.relpath(src_path, source_dir)
            dst_path = os.path.join(target_dir, rel_path)
            os.makedirs(os.path.dirname(dst_path), exist_ok=True)
            
            with open(src_path, "r", encoding="utf-8") as f:
                content = f.read()
            converted = convert_markdown(content)
            with open(dst_path, "w", encoding="utf-8") as f:
                f.write(converted)
            converted_files.append(rel_path)
    
    print(f"Successfully converted {len(converted_files)} files to {target_dir}")