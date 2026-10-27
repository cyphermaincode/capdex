import base64, os
def save_b64(path, b64_str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    b64_str = b64_str.strip()
    pad = (4 - len(b64_str) % 4) % 4
    if pad > 0:
        b64_str += "=" * pad
    with open(path, "wb") as f:
        f.write(base64.b64decode(b64_str))
    print("Saved:", path)
