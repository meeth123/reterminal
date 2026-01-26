# Hardware Button Configuration for reTerminal E1002

The reTerminal E1002 has **3 physical buttons** on the top edge. This guide explains how to configure them to interact with your web dashboard.

## Current Setup

The web dashboard is designed to work **without any button interaction**:
- Auto-refreshes every 2 minutes
- Auto-retries on errors
- No manual input required

However, you can configure the hardware buttons to trigger specific actions.

## Configuration Options

### Option 1: SenseCraft HMI Web Function (Easiest)

If you're using SenseCraft HMI's web function to display the dashboard:

1. **Access Device Settings**:
   - Connect to https://sensecraft.seeed.cc/hmi
   - Select your reTerminal E1002 device
   - Navigate to Web Function settings

2. **Limited Button Control**:
   - Standard web function has basic button support
   - Buttons might be pre-configured for navigation
   - Check documentation for available actions

**Note**: The standard SenseCraft HMI web function may not support custom button actions for web pages. The buttons are typically used for:
- Screenshot capture
- Display refresh
- Mode switching

### Option 2: ESPHome Custom Firmware (Advanced)

For full control over button behavior, use ESPHome:

#### Step 1: Install ESPHome

Follow the [reTerminal E1002 ESPHome guide](https://wiki.seeedstudio.com/getting_started_with_reterminal_e1002/)

#### Step 2: Configure Buttons

You'll need to find the GPIO pins for the 3 buttons. Based on the reTerminal E1002 schematic:

```yaml
# esphome-config.yaml
esphome:
  name: reterminal-calendar
  platform: ESP32
  board: esp32-s3-devkitc-1

wifi:
  ssid: "YourSSID"
  password: "YourPassword"

# Button configuration (adjust GPIO pins based on schematic)
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO_XX  # Check schematic for actual pin
      mode: INPUT_PULLUP
      inverted: true
    name: "Refresh Button"
    on_press:
      then:
        - logger.log: "Refresh button pressed"
        # Trigger page reload or specific action

  - platform: gpio
    pin:
      number: GPIO_YY
      mode: INPUT_PULLUP
      inverted: true
    name: "Next Day Button"

  - platform: gpio
    pin:
      number: GPIO_ZZ
      mode: INPUT_PULLUP
      inverted: true
    name: "Previous Day Button"
```

#### Step 3: Implement Button Actions

For web page refresh, you have several options:

**Option A: Reload Entire Page**
```yaml
on_press:
  - lambda: |-
      // Send HTTP request to reload
      // Or trigger display update
```

**Option B: JavaScript Communication**
Create a message passing system between firmware and web page.

### Option 3: URL Parameters (Workaround)

Instead of configuring buttons, you could:

1. **Set different URLs for different buttons**:
   - Button 1: `https://reterminal.vercel.app/?refresh=true`
   - Button 2: `https://reterminal.vercel.app/?view=tomorrow`
   - Button 3: `https://reterminal.vercel.app/?view=yesterday`

2. **Modify web app to read URL parameters**:
   The app would check URL params and adjust behavior accordingly.

## Recommended Approach

Given the complexity of hardware button configuration, we recommend:

### ✅ Current Auto-Refresh Approach (Recommended)

The dashboard already refreshes automatically every 2 minutes:
- No button configuration needed
- Always shows current data
- Works out of the box
- Reliable and maintenance-free

### Want Faster Refresh?

You can adjust the refresh interval in the code:

1. Edit `src/components/Widgets/CalendarWidgetNoTouch.tsx`
2. Change `REFRESH_INTERVAL_MS`:
   ```typescript
   const REFRESH_INTERVAL_MS = 1 * 60 * 1000; // 1 minute
   ```
3. Redeploy to Vercel

## Finding GPIO Pin Numbers

To configure buttons in ESPHome, you need the GPIO pin numbers:

1. **Check Schematic**:
   - Download from [Seeed Studio Wiki](https://wiki.seeedstudio.com/getting_started_with_reterminal_e1002/)
   - Look for "Button" or "SW" labels
   - Note the GPIO numbers

2. **Common ESP32-S3 Button Pins**:
   - Often use GPIO 0, GPIO 9, or GPIO 14
   - Check your specific model's schematic

3. **Test with ESPHome**:
   - Configure one pin at a time
   - Test with LED or log output
   - Verify correct pin assignment

## Troubleshooting

### Buttons Don't Respond
- Verify GPIO pin numbers in schematic
- Check pull-up/pull-down configuration
- Ensure `inverted: true` if button is active-low
- Check ESPHome logs for button state changes

### Page Doesn't Reload
- Hardware buttons in SenseCraft HMI may not support page reload
- Consider using ESPHome with custom HTTP requests
- Or rely on auto-refresh functionality

### Need More Control?
- Consider creating a backend endpoint that the button triggers
- Example: `GET /api/refresh` that the button calls
- Web page polls or listens for changes

## Alternative: Use Physical Buttons for Display Modes

Instead of refreshing, configure buttons to:
1. **Button 1**: Toggle between different views (day/week/month)
2. **Button 2**: Switch between calendar and other widgets
3. **Button 3**: Cycle through different calendars (if you have multiple)

This would require:
- URL parameter support
- Multiple deployment URLs
- Or ESPHome with deep integration

## Support Resources

- [SenseCraft HMI Documentation](https://sensecraft-hmi-docs.seeed.cc/)
- [reTerminal E1002 Wiki](https://wiki.seeedstudio.com/getting_started_with_reterminal_e1002/)
- [ESPHome Documentation](https://esphome.io/)
- [Home Assistant Integration](https://community.home-assistant.io/t/seeed-studio-reterminal-e1002-color-epaper-display-home-assistant-dashboard/970545)

## Summary

**Current Status**: ✅ Works without any button configuration
- Auto-refreshes every 2 minutes
- No manual intervention needed
- Reliable and simple

**For Button Configuration**: Requires ESPHome custom firmware or specific SenseCraft HMI features that may not be fully documented yet.

**Recommendation**: Use the auto-refresh approach unless you have specific requirements that need button interaction.
