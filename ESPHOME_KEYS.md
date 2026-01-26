# ESPHome Device Keys

Store your ESPHome device encryption keys here for reference.

## reTerminal-TE (reterminal-te.yaml)

**Device Name:** reterminal-te
**API Encryption Key:**
```
6NTG8bijkPFVuAc7ZswZ+W/FRNH8quskdCtoUHtJJvU=
```

**When you need this key:**
- Adding the device to Home Assistant for the first time
- If you ever need to manually configure the integration

**How to use:**
1. In Home Assistant, go to **Settings** → **Devices & Services**
2. Click **+ Add Integration**
3. Search for "ESPHome"
4. Enter device hostname or IP address
5. When prompted, paste this encryption key

---

## Important Notes

- Keep these keys private and secure
- Each ESPHome device has a unique encryption key
- You can also find the key in ESPHome dashboard: Device → Edit → Look for `api:` section
- If you lose the key, you can find it in the device's YAML configuration file
