# -*- coding: utf-8 -*-
# 从 index.html + 外部js/css 重建离线内联版 index_standalone.html
import re, io, os
ROOT = '/Coze/Drive/扣子/daming-guoce'
html = io.open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()

# 1) 内联 CSS：把 <link rel="stylesheet" href="style.css"> 替换为 <style>内容</style>
link_re = re.compile(r'<link[^>]*rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)["\'][^>]*>', re.I)
def inline_css(m):
    rel = m.group(1)
    # 相对路径处理
    p = os.path.join(ROOT, *rel.split('/'))
    try:
        css = io.open(p, encoding='utf-8').read()
    except Exception as e:
        css = '/* missing ' + rel + ' */'
    return '<style>\n' + css + '\n</style>'
html = link_re.sub(inline_css, html)

# 2) 内联 JS：把 <script src="X"></script> 替换为 <script>内容</script>
script_re = re.compile(r'<script\s+src=["\']([^"\']+)["\']\s*>(.*?)</script>', re.S)
def inline_js(m):
    rel = m.group(1)
    p = os.path.join(ROOT, *rel.split('/'))
    try:
        js = io.open(p, encoding='utf-8').read()
    except Exception as e:
        js = '/* missing ' + rel + ' */'
    return '<script>\n' + js + '\n</script>'
html = script_re.sub(inline_js, html)

# 确认无残留 external 引用
leftover_js = re.findall(r'<script[^>]*src=\s*["\']', html)
leftover_css = re.findall(r'rel=["\']stylesheet["\']', html)
assert not leftover_js, '残留 external script src: ' + str(leftover_js)
assert not leftover_css, '残留 external stylesheet'

io.open(os.path.join(ROOT, 'index_standalone.html'), 'w', encoding='utf-8').write(html)
import sys
sys.stderr.write('standalone rebuilt: %d bytes, scripts=%d, styles=1\n' % (
    len(html.encode('utf-8')), html.count('<script>')))
