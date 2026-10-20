import os
import re
import yaml
import opencc

c_s2tw = opencc.OpenCC('s2tw')

# Comprehensive dictionary for Simplified Chinese -> Traditional Chinese (Taiwan terms)
# Longest matches first
DICT_SC2TW = {
    # Explicit user rules (40 terms) and specific compound variants
    '故障排查': '疑難排解',
    '故障排除': '疑難排解',
    '排查方法': '疑難排解方法',
    '解除安装': '解除安裝',
    '卸载': '解除安裝',
    '重新启动': '重新啟動',
    '重启': '重新啟動',
    '启动器进程': '啟動器處理程序',
    '启动器开发者入口': '啟動器開發者入口',
    '启动器': '啟動器',
    '核心程序概览': '核心程式概覽',
    '核心程序文档': '核心程式說明文件',
    '核心程序': '核心程式',
    '后端进程生命周期': '後端處理程序生命週期',
    '后端进程': '後端處理程序',
    '守护进程': '守護處理程序',
    '子进程': '子處理程序',
    '单进程': '單處理程序',
    '多进程': '多處理程序',
    '主进程': '主處理程序',
    '杀进程': '結束處理程序',
    '进程间': '處理程序間',
    '进程列表': '處理程序清單',
    '进程生命周期': '處理程序生命週期',
    '进程管理器': '處理程序管理器',
    '进程托管': '處理程序代管',
    '进程': '處理程序',
    '应用程序': '應用程式',
    '程序': '程式', # application / script / program
    '端口号': '連接埠號',
    '端口': '連接埠',
    '环境变量': '環境變數',
    '变量': '變數',
    '数组': '陣列',
    '缓存命中': '快取命中',
    '缓存': '快取',
    '消息队列': '訊息佇列',
    '队列': '佇列',
    '线程池': '執行緒池',
    '线程': '執行緒',
    '内存占用': '記憶體佔用',
    '内存泄漏': '記憶體流失',
    '内存': '記憶體',
    '磁盘空间': '硬碟空間',
    '磁盘': '硬碟',
    '外部调度器契约': '外部排程器契約',
    '外部调度器': '外部排程器',
    '调度器生命周期': '排程器生命週期',
    '调度器与任务编排': '排程器與任務編排',
    '调度器': '排程器',
    '调度': '排程',
    '性能优化': '效能最佳化',
    '优化': '最佳化',
    '游戏服务器': '遊戲伺服器',
    '服务器端口': '伺服器連接埠',
    '服务器': '伺服器',
    '数据库': '資料庫',
    '屏幕分辨率': '螢幕解析度',
    '屏幕旋转': '螢幕旋轉',
    '屏幕': '螢幕',
    '分辨率': '解析度',
    '模拟器与 ADB': '模擬器與 ADB',
    '模拟器': '模擬器',
    'WebUI 界面导览': 'WebUI 介面導覽',
    'WebUI 界面': 'WebUI 介面',
    '界面': '介面',
    '网络连接': '網路連線',
    '网络': '網路',
    '软件': '軟體',
    '硬件': '硬體',
    '视频': '影片',
    '日志文件': '日誌檔案',
    '日志': '日誌',
    '默认值': '預設值',
    '默认分支': '預設分支',
    '默认配置': '預設配置',
    '默认': '預設',
    '配置文件': '設定檔',
    '可执行文件': '可執行檔',
    '文件管理器': '檔案管理器',
    '文件名': '檔案名稱',
    '文件': '檔案',
    '游戏内设置': '遊戲內設定',
    '设置项': '設定項',
    '设置': '設定',
    '插件': '外掛',
    '搜索文档': '搜尋說明文件',
    '搜索': '搜尋',
    '备份': '備份',
    '支持': '支援',
    '创建': '建立',
    '点击': '點擊',
    '账号信息': '帳號資訊',
    '账号': '帳號',
    '导入导出': '匯入匯出',
    '导入': '匯入',
    '导出': '匯出',
    '信息': '資訊',
    '运行中': '執行中',
    '运行状态': '執行狀態',
    '运行方式': '執行方式',
    '运行步骤': '執行步驟',
    '运行': '執行',

    # Additional standard Taiwan tech terms
    '开发者文档': '開發者說明文件',
    '文档维护': '說明文件維護',
    '文档首页': '說明文件首頁',
    '文档站': '說明文件站',
    '文档': '說明文件',
    '接口参考': '介面參考',
    '接口总览': '介面總覽',
    '接口': '介面',
    '命令行': '命令列',
    '源码运行': '原始碼執行',
    '源码版本索引': '原始碼版本索引',
    '源码版本': '原始碼版本',
    '源码': '原始碼',
    '环境与兼容性': '環境與相容性',
    '兼容性': '相容性',
    '宿主架构与模块': '宿主架構與模組',
    '模块': '模組',
    '远程访问与设备配对': '遠端存取與裝置配對',
    '远程访问': '遠端存取',
    '远程客户端': '遠端客戶端',
    '远程': '遠端',
    '控制台、悬浮窗与屏保': '控制台、懸浮視窗與螢幕保護程式',
    '控制台': '控制台',
    '权限激活': '權限啟用',
    '激活': '啟用',
    '代码': '程式碼',
    '异步': '非同步',
    '同步盘': '同步雲端硬碟',
    '客户端': '客戶端',
    '用户手册': '使用者手冊',
    '用户': '使用者',
    '三个项目的关系': '三個專案的關係',
    '项目': '專案',
    '多实例与配置管理': '多實例與設定管理',
    '多实例': '多實例',
    '实例名': '實例名稱',
    '实例': '實例',
    '链接': '連結',
    '权限': '權限',
    '屏保': '螢幕保護程式',
    '悬浮窗': '懸浮視窗',
    '快捷键': '快速鍵',
    '菜单': '選單',
    '全屏': '全螢幕',
    '截图': '截圖',
    '托管': '代管',
    '发布检查清单': '發布檢查清單',
    '构建、签名与发布': '構建、簽名與發布',
    '构建与发布': '構建與發布',
    '发布与版本': '發布與版本',
    '发布': '發布',
    '快捷': '快速',
    '高清': '高畫質',
    '大世界导航': '大世界導航',
    '分层与边界': '分層與邊界',
    '初始化失败': '初始化失敗',
    '一键退役': '一鍵退役',
    '设备': '設備',
}

sorted_keys = sorted(DICT_SC2TW.keys(), key=len, reverse=True)
pattern = re.compile('|'.join(re.escape(k) for k in sorted_keys))

def translate_text(text):
    if not text:
        return text
    # Step 1: Single-pass dictionary substitution
    replaced = pattern.sub(lambda m: DICT_SC2TW[m.group(0)], text)
    # Step 2: OpenCC s2tw conversion for all other characters
    return c_s2tw.convert(replaced)

def translate_anchor(anchor):
    if not anchor:
        return anchor
    return translate_text(anchor)

def map_url(url):
    if not url:
        return url
    if url.startswith('http://') or url.startswith('https://') or url.startswith('mailto:') or url.startswith('git://'):
        return url
    if url.startswith('/img/') or url.startswith('/assets/'):
        return url
    
    parts = url.split('#', 1)
    base = parts[0]
    anchor = parts[1] if len(parts) > 1 else None

    new_base = base
    if base.startswith('/'):
        if not base.startswith('/zh-TW/'):
            new_base = '/zh-TW' + (base if base != '/' else '/')
            if new_base.endswith('index.md'):
                new_base = new_base[:-8]
    elif base == '':
        new_base = ''
    
    if anchor is not None:
        new_anchor = translate_anchor(anchor)
        return f"{new_base}#{new_anchor}"
    return new_base

def translate_mermaid(content):
    def rep_node_quote(m):
        prefix = m.group(1)
        text = m.group(2)
        suffix = m.group(3)
        return f"{prefix}{translate_text(text)}{suffix}"
    
    out = re.sub(r'([A-Za-z0-9_-]+\[")([^"]+)("\])', rep_node_quote, content)
    out = re.sub(r'(\|\s*")([^"]+)("\s*\|)', rep_node_quote, out)
    return out

def convert_markdown(md_content):
    # 1. Frontmatter
    fm_match = re.match(r'^---[\r\n]+(.*?)[\r\n]+---[\r\n]+', md_content, re.DOTALL)
    if fm_match:
        fm_raw = fm_match.group(1)
        body = md_content[fm_match.end():]
        try:
            fm_data = yaml.safe_load(fm_raw)
            if isinstance(fm_data, dict):
                def proc_fm(item):
                    if isinstance(item, str):
                        return translate_text(item)
                    elif isinstance(item, list):
                        return [proc_fm(x) for x in item]
                    elif isinstance(item, dict):
                        res = {}
                        for k, v in item.items():
                            if k == 'updated':
                                res[k] = v # KEEP EXACTLY AS IS
                            elif k in ('link', 'src'):
                                res[k] = map_url(v) if k == 'link' else v
                            else:
                                res[k] = proc_fm(v)
                        return res
                    return item
                
                fm_data_tw = proc_fm(fm_data)
                fm_str = yaml.dump(fm_data_tw, allow_unicode=True, sort_keys=False, default_flow_style=False)
                new_header = f"---\n{fm_str}---\n\n"
            else:
                new_header = fm_match.group(0)
        except Exception as e:
            print("YAML parse error:", e)
            new_header = fm_match.group(0)
    else:
        new_header = ""
        body = md_content

    protected_items = []
    def add_token(val):
        idx = len(protected_items)
        protected_items.append(val)
        return f"__PROT_{idx}__"

    # A. Code blocks
    def repl_fenced(m):
        full = m.group(0)
        lang = m.group(1) or ""
        inner = m.group(2)
        if lang.strip() == 'mermaid':
            return add_token(f"```mermaid\n{translate_mermaid(inner)}\n```")
        else:
            return add_token(full)

    body = re.sub(r'^```([a-zA-Z0-9_-]*)[\r\n]+(.*?)[\r\n]+```', repl_fenced, body, flags=re.MULTILINE | re.DOTALL)

    # B. Inline code
    body = re.sub(r'(`[^`\r\n]+`)', lambda m: add_token(m.group(1)), body)

    # C. DocIcon
    body = re.sub(r'(<DocIcon\s+name="[^"]*"\s*(\/?>|class="[^"]*"\s*\/?>))', lambda m: add_token(m.group(1)), body)

    # D. Step title
    def repl_step(m):
        title = m.group(1)
        rest = m.group(2)
        title_tw = translate_text(title)
        return f'<Step title="{title_tw}"{rest}>'
    body = re.sub(r'<Step\s+title="([^"]*)"([^>]*)>', repl_step, body)

    # E. Figure caption
    def repl_fig(m):
        caption = m.group(1)
        rest = m.group(2)
        caption_tw = translate_text(caption)
        return f'<Figure caption="{caption_tw}"{rest}>'
    body = re.sub(r'<Figure\s+caption="([^"]*)"([^>]*)>', repl_fig, body)

    # F. Void / specific Vue components
    for tag in ['TaskTable', 'ApiTable', 'CoreArchDiagram', 'AndroidStack', 'Confetti', 'SchedulerFlow', 'RemotePairing', 'OS', '/OS', 'Group', '/Group', 'Argument', '/Argument', 'Task', '/Task']:
        body = re.sub(rf'(<{tag}[\s/>][^>]*>)', lambda m: add_token(m.group(1)), body)

    # G. Markdown images: ![alt](url)
    def repl_img(m):
        alt = m.group(1)
        url = m.group(2)
        alt_tw = translate_text(alt)
        return add_token(f"![{alt_tw}]({url})")
    body = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', repl_img, body)

    # H. Markdown links: [text](url)
    def repl_link(m):
        text = m.group(1)
        url = m.group(2)
        text_tw = translate_text(text)
        url_tw = map_url(url)
        return add_token(f"[{text_tw}]({url_tw})")
    body = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', repl_link, body)

    # I. HTML hrefs
    def repl_href(m):
        url = m.group(1)
        return f'href="{map_url(url)}"'
    body = re.sub(r'href="([^"]+)"', repl_href, body)

    # 3. Translate all remaining text in body
    body = translate_text(body)

    # 4. Restore protected items
    for idx in range(len(protected_items) - 1, -1, -1):
        token = f"__PROT_{idx}__"
        body = body.replace(token, protected_items[idx])

    return new_header + body

def main():
    docs_root = 'docs'
    tw_root = os.path.join('docs', 'zh-TW')
    
    # Collect all source files
    source_files = []
    for root, dirs, files in os.walk(docs_root):
        rel_root = os.path.relpath(root, docs_root).replace('\\', '/')
        if rel_root == '.' or rel_root == '':
            pass
        elif rel_root.startswith('en') or rel_root.startswith('zh-TW') or rel_root.startswith('zh-HK') or rel_root.startswith('ja') or rel_root.startswith('.vitepress') or rel_root.startswith('public'):
            continue
        
        for file in files:
            if not file.endswith('.md'):
                continue
            full_path = os.path.join(root, file)
            rel_file = os.path.relpath(full_path, docs_root).replace('\\', '/')
            if rel_file.startswith('en/') or rel_file.startswith('zh-TW/') or rel_file.startswith('zh-HK/') or rel_file.startswith('ja/') or rel_file.startswith('.vitepress/') or rel_file.startswith('public/'):
                continue
            source_files.append((full_path, rel_file))

    print(f"Discovered {len(source_files)} source markdown files.")
    converted_count = 0
    for full_path, rel_file in sorted(source_files, key=lambda x: x[1]):
        target_path = os.path.join(tw_root, rel_file)
        os.makedirs(os.path.dirname(target_path), exist_ok=True)
        with open(full_path, 'r', encoding='utf-8') as f:
            src = f.read()
        out = convert_markdown(src)
        with open(target_path, 'w', encoding='utf-8') as f:
            f.write(out)
        converted_count += 1
        print(f"[{converted_count}/{len(source_files)}] {rel_file} -> zh-TW/{rel_file}")

    print(f"\nSuccessfully converted {converted_count} files into docs/zh-TW/")

if __name__ == '__main__':
    main()
