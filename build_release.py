#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
《大明国策》构建脚本：生成单文件 standalone + 完整源码 zip
- standalone：内联 style.css 与全部 <script src>，移除 manifest（单文件不可用 PWA）
- zip：保留目录结构（含 data/ 子目录），修复旧版 v67.zip 漏打包 data/ 的缺陷
"""
import re
import os
import pathlib
import zipfile
import datetime

WORK = pathlib.Path('/Coze/Drive/扣子/daming-guoce')
OUT_HTML = WORK / 'daming-guoce-standalone.html'
OUT_ZIP = WORK / 'daming-guoce-v68.zip'

# ---------- 1. 生成 standalone ----------
html = (WORK / 'index.html').read_text(encoding='utf-8')

# 移除 manifest（单文件无法承载 PWA/service worker）
html = html.replace('<link rel="manifest" href="manifest.json">\n', '')

# 内联 style.css
css = (WORK / 'style.css').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')

# 内联全部 <script src="...">
def _inline(m):
    src = m.group(1)
    code = (WORK / src).read_text(encoding='utf-8')
    # 防止脚本内出现 </script> 字面量截断（本项目游戏脚本无此情况，保险转义）
    code = code.replace('</script>', '<\\/script>')
    return '<script>\n' + code + '\n</script>'

html = re.sub(r'<script src="([^"]+)"></script>', _inline, html)
OUT_HTML.write_text(html, encoding='utf-8')
print(f'✓ standalone 生成：{OUT_HTML.name}（{OUT_HTML.stat().st_size:,} 字节，'
      f'内联 {len(re.findall(r"<script>", html))} 脚本 + 1 样式）')

# ---------- 2. 打包完整源码 zip（保留目录结构） ----------
EXCLUDE_DIRS = {'.git', '.deploy', 'node_modules', '__pycache__', '.skills', '.tmp', 'screenshots'}
EXCLUDE_FILES = {
    'daming-guoce-v68.zip',       # 自身
    'daming-guoce-v67.zip',       # 旧包
}

# 修复 zipfile 1980 时间戳问题
def _fixed_zipinfo(name, data):
    zi = zipfile.ZipInfo(name)
    zi.date_time = (2026, 10, 8, 12, 0, 0)  # 合法（>=1980）
    zi.compress_type = zipfile.ZIP_DEFLATED
    zi.external_attr = 0o644 << 16
    zi.file_size = len(data)
    zi.CRC = zipfile.crc32(data)
    return zi

added = 0
with zipfile.ZipFile(OUT_ZIP, 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk(WORK):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for f in files:
            if f in EXCLUDE_FILES:
                continue
            fp = pathlib.Path(root) / f
            rel = str(fp.relative_to(WORK))
            # 跳过 .zip 与临时文件
            if f.endswith('.zip') or f.endswith('.pyc'):
                continue
            data = fp.read_bytes()
            zf.writestr(_fixed_zipinfo(rel, data), data)
            added += 1

print(f'✓ zip 生成：{OUT_ZIP.name}（{OUT_ZIP.stat().st_size:,} 字节，共 {added} 个文件，保留 data/ 目录结构）')

# ---------- 3. 校验 ----------
with zipfile.ZipFile(OUT_ZIP) as zf:
    names = zf.namelist()
    has_data = any(n.startswith('data/') for n in names)
    has_standalone = 'daming-guoce-standalone.html' in names
    has_index = 'index.html' in names
print(f'✓ 校验：data/ 完整={"是" if has_data else "否"}，standalone={"是" if has_standalone else "否"}，index.html={"是" if has_index else "否"}')
assert has_data and has_standalone and has_index, '构建产物缺失关键文件'
print('✓ 构建完成，产物可用')