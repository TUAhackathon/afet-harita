import requests

r = requests.get("http://localhost:8000/api/disasters/fire")
print(f"Status: {r.status_code}")
data = r.json()
print(f"Fire points: {len(data)}")
if len(data) > 0:
    print("First 3 points:")
    for p in data[:3]:
        print(f"  lat={p['lat']:.3f}, lon={p['lon']:.3f}, level={p['level']}, brightness={p['brightness']}, color={p['color']}")
else:
    print("No fire data returned")
