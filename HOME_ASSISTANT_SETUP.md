# Home Assistant Setup Guide for reTerminal E1002

This guide will help you set up Home Assistant to control your reTerminal E1002 display and integrate it with your Google Calendar.

## What is Home Assistant?

Home Assistant is an open-source home automation platform that runs on a separate server (not on the reTerminal device itself). It will:
- Act as a central hub for your smart home devices
- Run ESPHome to control your reTerminal E1002
- Fetch and display your calendar on the e-ink display
- Allow you to configure the 3 hardware buttons

## Architecture Overview

```
┌─────────────────────┐
│  Home Assistant     │
│  (Raspberry Pi/PC)  │
│                     │
│  ┌──────────────┐   │
│  │  ESPHome     │───┼────WiFi────> ┌─────────────────┐
│  │  Dashboard   │   │              │ reTerminal E1002│
│  └──────────────┘   │              │  (ESP32-S3)     │
│                     │              └─────────────────┘
│  ┌──────────────┐   │
│  │  Google Cal  │   │
│  │  Integration │   │
│  └──────────────┘   │
└─────────────────────┘
```

## Option 1: Raspberry Pi (Recommended for Beginners)

### Requirements
- Raspberry Pi 4 (4GB RAM minimum, 8GB recommended)
- MicroSD card (32GB minimum, Class 10 or better)
- Power supply for Raspberry Pi
- Ethernet cable (recommended) or WiFi

### Installation Steps

#### 1. Download Raspberry Pi Imager
- Go to https://www.raspberrypi.com/software/
- Download and install Raspberry Pi Imager for your computer

#### 2. Flash Home Assistant OS
1. Insert your microSD card into your computer
2. Open Raspberry Pi Imager
3. Click "Choose Device" → Select your Raspberry Pi model (e.g., Raspberry Pi 4)
4. Click "Choose OS" → **Other specific-purpose OS** → **Home assistants and home automation** → **Home Assistant**
5. Click "Choose Storage" → Select your microSD card
6. Click "Next" and confirm to write

#### 3. First Boot
1. Insert the microSD card into your Raspberry Pi
2. Connect ethernet cable (or use WiFi - see advanced setup)
3. Connect power supply
4. Wait 20 minutes for initial setup (Home Assistant will download and install)

#### 4. Access Home Assistant
1. Open a web browser on your computer
2. Go to: **http://homeassistant.local:8123**
3. If that doesn't work, try: **http://YOUR_PI_IP_ADDRESS:8123**
4. Create your account (username and password)
5. Complete the onboarding wizard

### Cost Estimate
- Raspberry Pi 4 (4GB): ~$55
- MicroSD card (32GB): ~$10
- Power supply: ~$10
- **Total: ~$75**

---

## Option 2: Old PC/Laptop (Best Performance)

If you have an old computer lying around, this is the most powerful option.

### Requirements
- x86-64 PC with at least 4GB RAM
- 32GB storage minimum
- Wired ethernet connection recommended

### Installation Methods

#### Method A: Home Assistant OS on Dedicated PC (Easiest)

1. **Download Home Assistant OS**
   - Go to https://www.home-assistant.io/installation/
   - Select "Generic x86-64"
   - Download the `.img.xz` file

2. **Create Bootable USB**
   - Download [balenaEtcher](https://etcher.balena.io/)
   - Insert USB drive (8GB minimum)
   - Flash the Home Assistant OS image to USB
   - Boot your PC from the USB drive
   - Home Assistant will automatically install

3. **Access Home Assistant**
   - Wait 20 minutes for installation
   - Go to http://homeassistant.local:8123
   - Complete setup

**Note:** This will wipe your PC and dedicate it entirely to Home Assistant.

#### Method B: Home Assistant in Docker (Advanced)

If you want to keep using your PC for other things:

```bash
# Install Docker first
# Then run Home Assistant container:
docker run -d \
  --name homeassistant \
  --privileged \
  --restart=unless-stopped \
  -e TZ=Asia/Kolkata \
  -v /PATH_TO_YOUR_CONFIG:/config \
  --network=host \
  ghcr.io/home-assistant/home-assistant:stable
```

Access at http://localhost:8123

#### Method C: Home Assistant in VirtualBox

1. Download Home Assistant OS `.vdi` image
2. Create new VM in VirtualBox
3. Attach the `.vdi` as hard disk
4. Start VM and wait for setup

---

## Option 3: macOS with VirtualBox

Perfect for testing and development on your Mac. Your Mac stays available for other work while Home Assistant runs in a VM.

### Requirements
- macOS (works on both Intel and Apple Silicon)
- 4GB+ RAM available for VM
- 32GB+ free disk space
- VirtualBox 7.0 or later

### Installation Steps

#### 1. Install VirtualBox

**Download and Install:**
```bash
# Visit https://www.virtualbox.org/wiki/Downloads
# Download "macOS / Intel hosts" or "macOS / Apple Silicon hosts"
# Open the .dmg file and run the installer
# Follow the installation wizard
```

**Important for Apple Silicon Macs:**
- You may need to allow the kernel extension in System Settings → Privacy & Security
- Restart your Mac after installation

#### 2. Download Home Assistant VM Image

**For Apple Silicon (M1/M2/M3/M4):**
```bash
# Download the ARM64 image
cd ~/Downloads
curl -LO https://github.com/home-assistant/operating-system/releases/latest/download/haos_ova-13.2.arm64.vmdk.zip

# Extract the image
unzip haos_ova-13.2.arm64.vmdk.zip
```

**For Intel Macs:**
```bash
# Download the x86-64 image
cd ~/Downloads
curl -LO https://github.com/home-assistant/operating-system/releases/latest/download/haos_ova-13.2.vdi.zip

# Extract the image
unzip haos_ova-13.2.vdi.zip
```

#### 3. Create Virtual Machine in VirtualBox

1. **Open VirtualBox** and click **New**

2. **Basic Settings:**
   - Name: `Home Assistant`
   - Type: `Linux`
   - Version: `Oracle Linux (64-bit)` for Intel OR `Oracle Linux (ARM64)` for Apple Silicon
   - Click **Continue**

3. **Memory (RAM):**
   - Allocate at least **4096 MB (4GB)**
   - More is better if you have it (8GB recommended)
   - Click **Continue**

4. **Hard Disk:**
   - Select **Use an existing virtual hard disk file**
   - Click the folder icon
   - Navigate to your Downloads folder
   - Select the `.vmdk` file (Apple Silicon) or `.vdi` file (Intel)
   - Click **Create**

#### 4. Configure VM Settings

Before starting, configure these settings:

1. **Right-click VM** → **Settings**

2. **System Tab:**
   - **Motherboard:**
     - ✅ Enable **Enable EFI (special OSes only)** ← CRITICAL!
     - Boot Order: Hard Disk first, then Network
   - **Processor:**
     - Allocate at least 2 CPUs (4+ recommended)

3. **Network Tab:**
   - **Adapter 1:**
     - Attached to: **Bridged Adapter**
     - Name: Select your active network interface (Wi-Fi or Ethernet)
     - This allows Home Assistant to get its own IP on your network

4. **Audio Tab:**
   - Audio Controller: **Intel HD Audio**
   - (Not critical for headless server)

5. **Storage Tab (Optional - for better disk performance):**
   - Click on your disk
   - Under "Hard Disk:", check **Solid-state Drive**

Click **OK** to save settings.

#### 5. Start Home Assistant

1. **Select your VM** and click **Start**
2. A console window will open showing the boot process
3. **Wait 20 minutes** for initial setup
   - Home Assistant will download and install updates
   - The VM may reboot once or twice
   - You'll eventually see a login prompt (don't log in here)

#### 6. Access Home Assistant Web Interface

Once the VM is running:

1. **Option A - Try hostname first:**
   - Open browser: `http://homeassistant.local:8123`

2. **Option B - Use IP address:**
   - In the VM console window, look for the IP address displayed
   - Or check your router's connected devices
   - Go to: `http://YOUR_VM_IP:8123`
   - Example: `http://192.168.1.100:8123`

3. **Create your account** and complete onboarding

### Managing the VM

**Starting Home Assistant:**
```bash
# Option 1: Use VirtualBox GUI
# Open VirtualBox → Select VM → Click Start

# Option 2: Use command line (headless mode)
VBoxManage startvm "Home Assistant" --type headless

# Option 3: Create an alias (add to ~/.zshrc or ~/.bashrc)
echo 'alias ha-start="VBoxManage startvm \"Home Assistant\" --type headless"' >> ~/.zshrc
echo 'alias ha-stop="VBoxManage controlvm \"Home Assistant\" acpipowerbutton"' >> ~/.zshrc
source ~/.zshrc
```

**Stopping Home Assistant:**
```bash
# Graceful shutdown (recommended)
VBoxManage controlvm "Home Assistant" acpipowerbutton

# Or use alias
ha-stop
```

**Auto-start on Mac Boot (Optional):**
```bash
# Create a Launch Agent
mkdir -p ~/Library/LaunchAgents

cat > ~/Library/LaunchAgents/com.homeassistant.vm.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.homeassistant.vm</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/VBoxManage</string>
        <string>startvm</string>
        <string>Home Assistant</string>
        <string>--type</string>
        <string>headless</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF

# Load it
launchctl load ~/Library/LaunchAgents/com.homeassistant.vm.plist
```

### Troubleshooting macOS Installation

**VirtualBox won't install:**
- Go to System Settings → Privacy & Security
- Allow software from Oracle
- Restart your Mac

**"Enable EFI" option is grayed out:**
- You must select it BEFORE attaching the disk
- Delete the VM and recreate it, checking EFI before adding the disk

**Can't access homeassistant.local:8123:**
- Make sure VM is using Bridged Adapter (not NAT)
- Try the VM's IP address directly
- Check your Mac's firewall settings (System Settings → Network → Firewall)
- Wait longer (initial setup takes 20+ minutes)

**VM is slow or laggy:**
- Allocate more RAM (8GB recommended)
- Allocate more CPU cores (4+ recommended)
- Enable "Solid-state Drive" option in Storage settings

**Apple Silicon specific issues:**
- Make sure you downloaded the ARM64 `.vmdk` image, not the x86-64 `.vdi`
- Update to latest VirtualBox version
- Some features may be experimental on Apple Silicon

### Resource Usage

With typical configuration:
- **RAM**: 4-8GB while running
- **Disk**: 32GB (grows as needed)
- **CPU**: Low when idle, spikes during updates/automation
- **Battery Impact**: Moderate on laptops

**Recommendation**: For development/testing on Mac, keep the VM stopped when not in use to save resources.

---

## Option 4: Cloud/VPS (Not Recommended)

You can run Home Assistant on a cloud server, but:
- ❌ More complex networking setup
- ❌ Monthly costs ($5-10/month)
- ❌ Latency issues
- ❌ Need to expose to internet (security concerns)

**Only use this if you're experienced with server management.**

---

## After Installing Home Assistant

Once you have Home Assistant running, follow these steps:

### 1. Install ESPHome Add-on

1. In Home Assistant, go to **Settings** → **Add-ons**
2. Click **Add-on Store** (bottom right)
3. Search for "ESPHome"
4. Click **Install**
5. Wait for installation to complete
6. Click **Start**
7. Enable "Start on boot" and "Watchdog"

### 2. Access ESPHome Dashboard

1. Click **Open Web UI** in the ESPHome add-on
2. You'll see the ESPHome dashboard

### 3. Prepare reTerminal E1002 for ESPHome

#### Option A: USB Cable Flash (Recommended)

1. Connect reTerminal E1002 to your Home Assistant device via USB-C
2. Put device in download mode:
   - Hold **BOOT** button (one of the 3 top buttons)
   - Press **RESET** button
   - Release **RESET**, then release **BOOT**

#### Option B: Over-the-Air (OTA) Flash

If your device already has ESPHome firmware, you can update wirelessly.

### 4. Create ESPHome Configuration

In the ESPHome dashboard:

1. Click **+ NEW DEVICE**
2. Enter name: `reterminal-calendar`
3. Select device type: **ESP32-S3**
4. Create configuration

### 5. Configure reTerminal E1002

Replace the generated configuration with this:

```yaml
# Basic ESPHome configuration for reTerminal E1002
esphome:
  name: reterminal-calendar
  platformio_options:
    board_build.flash_mode: dio

esp32:
  board: esp32-s3-devkitc-1
  variant: esp32s3
  framework:
    type: arduino

# Enable logging
logger:

# Enable Home Assistant API
api:
  encryption:
    key: "YOUR_GENERATED_KEY"

ota:
  platform: esphome
  password: "YOUR_GENERATED_PASSWORD"

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

  # Enable fallback hotspot (captive portal) in case wifi connection fails
  ap:
    ssid: "Reterminal-Calendar"
    password: "12345678"

captive_portal:

# Time component (India timezone)
time:
  - platform: homeassistant
    id: ha_time
    timezone: Asia/Kolkata

# Display configuration will be added in next steps
# (See ESPHOME_CALENDAR_DISPLAY.md for full configuration)
```

6. Click **Install** → **Plug into this computer**
7. Select the serial port of your reTerminal
8. Wait for flash to complete

### 6. Install Google Calendar Integration in Home Assistant

1. Go to **Settings** → **Devices & Services**
2. Click **+ ADD INTEGRATION**
3. Search for "Google Calendar"
4. Follow the OAuth setup:
   - You'll be redirected to Google
   - Sign in and authorize Home Assistant
   - Your calendars will be imported

### 7. Create Calendar Display

This requires creating ESPHome display code. See the next guide: **ESPHOME_CALENDAR_DISPLAY.md** (I'll create this next).

---

## Which Option Should You Choose?

### Choose Raspberry Pi if:
- ✅ You want a dedicated, always-on solution
- ✅ You're a beginner to Home Assistant
- ✅ You want low power consumption
- ✅ You don't have an old PC available

### Choose Old PC if:
- ✅ You have an old laptop/desktop lying around
- ✅ You want better performance
- ✅ You might run other services alongside Home Assistant
- ✅ You're comfortable with PC hardware

### Choose Cloud/VPS if:
- ✅ You're experienced with Linux server administration
- ✅ You want remote access from anywhere
- ✅ You don't mind monthly costs
- ⚠️ **Not recommended for beginners**

---

## Troubleshooting

### Can't access http://homeassistant.local:8123

Try these alternatives:
1. Find your device's IP address on your router
2. Use http://YOUR_IP:8123
3. Wait longer (first boot can take 20+ minutes)

### ESPHome won't detect reTerminal

1. Make sure device is in download mode (BOOT + RESET)
2. Try different USB cable (must support data, not just charging)
3. Install USB serial drivers:
   - **Windows**: CH340/CP2102 drivers
   - **Mac**: Already included
   - **Linux**: Already included

### WiFi not connecting

1. Check SSID and password in configuration
2. Make sure your WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
3. Try moving device closer to router

---

## Next Steps

After completing this setup:

1. ✅ Home Assistant is running
2. ✅ ESPHome add-on is installed
3. ✅ reTerminal E1002 is flashed with ESPHome
4. ✅ Google Calendar is integrated

**Next:** Create the calendar display configuration
**See:** ESPHOME_CALENDAR_DISPLAY.md (coming next)

---

## Quick Start Comparison

| Method | Setup Time | Difficulty | Cost | Performance |
|--------|------------|------------|------|-------------|
| **Raspberry Pi** | 30 min | Easy | $75 | Good |
| **Old PC (Dedicated)** | 30 min | Easy | $0 | Excellent |
| **Old PC (Docker)** | 1 hour | Medium | $0 | Excellent |
| **Cloud VPS** | 2+ hours | Hard | $5-10/mo | Variable |

---

## Additional Resources

- [Official Home Assistant Installation Guide](https://www.home-assistant.io/installation/)
- [ESPHome Documentation](https://esphome.io/)
- [reTerminal E1002 Wiki](https://wiki.seeedstudio.com/getting_started_with_reterminal_e1002/)
- [Home Assistant Community Forum](https://community.home-assistant.io/)

---

## Support

If you need help:
1. Check Home Assistant logs: **Settings** → **System** → **Logs**
2. Check ESPHome logs in the ESPHome dashboard
3. Ask in Home Assistant community forums
4. Check the reTerminal E1002 wiki
