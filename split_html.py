import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract CSS
style_match = re.search(r'(?s)<style>(.*?)</style>', content)
if style_match:
    css_content = style_match.group(1).strip()
    with open('style.css', 'w', encoding='utf-8') as f:
        f.write(css_content)
    # Replace style block with link
    content = content[:style_match.start()] + '  <link rel="stylesheet" href="style.css">\n' + content[style_match.end():]
    print("CSS extracted")

# Extract JS
# We want the script block after the body content. We can search for the last <script> tag before </body>
script_match = re.search(r'(?s)<script>(.*?)</script>\n</body>', content)
if script_match:
    js_content = script_match.group(1).strip()
    with open('app.js', 'w', encoding='utf-8') as f:
        f.write(js_content)
    content = content[:script_match.start()] + '  <script src="app.js"></script>\n</body>' + content[script_match.end(0):]
    print("JS extracted")
else:
    # Try finding any script tag that contains "const WP =" or "document.addEventListener"
    script_matches = list(re.finditer(r'(?s)<script>(.*?)</script>', content))
    # the main script is usually the last one, or the largest one.
    if script_matches:
        largest_script = max(script_matches, key=lambda m: len(m.group(1)))
        js_content = largest_script.group(1).strip()
        with open('app.js', 'w', encoding='utf-8') as f:
            f.write(js_content)
        content = content[:largest_script.start()] + '  <script src="app.js"></script>' + content[largest_script.end():]
        print("JS (largest) extracted")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("index.html updated")

