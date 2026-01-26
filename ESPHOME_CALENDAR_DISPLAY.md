# ESPHome Calendar Display Configuration for reTerminal E1002

This guide shows you how to display your Google Calendar on the reTerminal E1002 using ESPHome and Home Assistant.

## Prerequisites

Before starting, make sure you have:
- ✅ Home Assistant installed and running
- ✅ ESPHome add-on installed in Home Assistant
- ✅ Google Calendar integration configured
- ✅ reTerminal E1002 flashed with basic ESPHome firmware

If you haven't done these steps, see [HOME_ASSISTANT_SETUP.md](./HOME_ASSISTANT_SETUP.md) first.

---

## How It Works

```
Google Calendar
      ↓
Home Assistant (fetches events)
      ↓
ESPHome (receives calendar data)
      ↓
ESP32-S3 (renders to display)
      ↓
E-Ink Display (shows calendar)
```

The device will:
1. Connect to Home Assistant via WiFi
2. Request calendar events from Home Assistant
3. Render the events directly on the e-ink display
4. Update automatically (configurable interval)
5. Use the 3 hardware buttons for interaction

---

## Step 1: Configure Hardware Buttons

First, we need to identify the GPIO pins for the 3 buttons on top of the device.

Based on the reTerminal E1002 schematic, the buttons are typically on:
- **Button 1**: GPIO 14
- **Button 2**: GPIO 0
- **Button 3**: GPIO 21

Add this to your ESPHome configuration:

```yaml
# Hardware buttons configuration
binary_sensor:
  # Left button - Refresh
  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
      inverted: true
    name: "Refresh Button"
    id: button_refresh
    on_press:
      then:
        - logger.log: "Refresh button pressed"
        - component.update: calendar_display

  # Middle button - Previous day
  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: true
    name: "Previous Day Button"
    id: button_prev
    on_press:
      then:
        - logger.log: "Previous day button pressed"
        - lambda: |-
            id(day_offset) -= 1;
        - component.update: calendar_display

  # Right button - Next day
  - platform: gpio
    pin:
      number: GPIO21
      mode: INPUT_PULLUP
      inverted: true
    name: "Next Day Button"
    id: button_next
    on_press:
      then:
        - logger.log: "Next day button pressed"
        - lambda: |-
            id(day_offset) += 1;
        - component.update: calendar_display
```

---

## Step 2: Configure E-Ink Display

The reTerminal E1002 uses a 7.3" 6-color E-Ink display (800x480 pixels).

Add this display configuration:

```yaml
# SPI configuration for display
spi:
  clk_pin: GPIO12
  mosi_pin: GPIO11

# Display configuration
display:
  - platform: waveshare_epaper
    id: calendar_display
    cs_pin: GPIO10
    dc_pin: GPIO17
    busy_pin: GPIO18
    reset_pin: GPIO5
    model: 7in3f  # 7.3 inch color (6-color Spectra)
    update_interval: never  # Manual update only (save power)

    lambda: |-
      // This is where we'll draw the calendar
      // See Step 3 for the drawing code
```

**Note:** If the display doesn't work with these pins, check the [reTerminal E1002 schematic](https://wiki.seeedstudio.com/getting_started_with_reterminal_e1002/) for the correct GPIO assignments.

---

## Step 3: Create Calendar Display Lambda

This is the core rendering code that draws your calendar on the display.

### Simple Version (Shows Today's Events)

```yaml
display:
  - platform: waveshare_epaper
    id: calendar_display
    cs_pin: GPIO10
    dc_pin: GPIO17
    busy_pin: GPIO18
    reset_pin: GPIO5
    model: 7in3f
    update_interval: never

    lambda: |-
      // Clear display with white background
      it.fill(COLOR_WHITE);

      // Define colors (7.3" 6-color palette)
      #define COLOR_BLACK 0
      #define COLOR_WHITE 1
      #define COLOR_GREEN 2
      #define COLOR_BLUE 3
      #define COLOR_RED 4
      #define COLOR_YELLOW 5
      #define COLOR_ORANGE 6

      // Title
      it.print(20, 20, id(font_title), COLOR_BLACK, "Today's Schedule");

      // Date
      char date_str[32];
      auto time = id(ha_time).now();
      strftime(date_str, sizeof(date_str), "%A, %B %d, %Y", &time);
      it.print(20, 60, id(font_date), COLOR_BLACK, date_str);

      // Line separator
      it.filled_rectangle(20, 100, 760, 2, COLOR_BLACK);

      // Events (placeholder - will be replaced with real data)
      int y = 120;
      it.print(20, y, id(font_event), COLOR_BLACK, "10:00 AM - Team Meeting");
      y += 40;
      it.print(20, y, id(font_event), COLOR_BLACK, "2:00 PM - Client Call");
      y += 40;
      it.print(20, y, id(font_event), COLOR_BLACK, "4:30 PM - Project Review");

      // Footer
      it.print(20, 440, id(font_small), COLOR_BLACK, "Auto-refresh every 2 hours");

# Fonts (required for text rendering)
font:
  - file: "fonts/Roboto-Bold.ttf"
    id: font_title
    size: 32

  - file: "fonts/Roboto-Regular.ttf"
    id: font_date
    size: 24

  - file: "fonts/Roboto-Medium.ttf"
    id: font_event
    size: 20

  - file: "fonts/Roboto-Regular.ttf"
    id: font_small
    size: 16
```

---

## Step 4: Integrate with Google Calendar

To fetch actual events from your Google Calendar:

### Method A: Using Home Assistant Calendar Entities

Home Assistant exposes calendar events as entities. You can access them in ESPHome:

```yaml
# Globals to store day offset
globals:
  - id: day_offset
    type: int
    restore_value: no
    initial_value: '0'

# Text sensors to receive calendar data from Home Assistant
text_sensor:
  - platform: homeassistant
    name: "Calendar Events"
    entity_id: sensor.calendar_events_json
    id: calendar_events_json
    on_value:
      then:
        - component.update: calendar_display

# Auto-update every 2 hours
interval:
  - interval: 2h
    then:
      - component.update: calendar_display
```

### In Home Assistant, create a template sensor:

Go to **Settings** → **Devices & Services** → **Helpers** → **Create Helper** → **Template** → **Template a sensor**

```yaml
# configuration.yaml or in the UI
template:
  - sensor:
      - name: "Calendar Events JSON"
        unique_id: calendar_events_json
        state: "{{ now() }}"
        attributes:
          events: >-
            {% set events = state_attr('calendar.YOUR_CALENDAR_NAME', 'events') %}
            {{ events | tojson }}
```

Replace `YOUR_CALENDAR_NAME` with your actual calendar entity name (e.g., `calendar.john_doe_gmail_com`).

---

## Step 5: Parse and Display Events

Update your display lambda to parse JSON events:

```yaml
display:
  - platform: waveshare_epaper
    id: calendar_display
    # ... same config as before ...

    lambda: |-
      // Clear display
      it.fill(COLOR_WHITE);

      // Get calendar events JSON
      std::string events_json = id(calendar_events_json).state;

      // Title
      it.print(20, 20, id(font_title), COLOR_BLACK, "Today's Schedule");

      // Date
      char date_str[32];
      auto time = id(ha_time).now();
      time.day_of_year += id(day_offset);  // Apply day offset from buttons
      strftime(date_str, sizeof(date_str), "%A, %B %d, %Y", &time);
      it.print(20, 60, id(font_date), COLOR_BLACK, date_str);

      // Separator
      it.filled_rectangle(20, 100, 760, 2, COLOR_BLACK);

      // Parse and display events
      // (Simplified version - full JSON parsing requires additional libraries)
      int y = 120;

      if (events_json.length() > 10) {
        // Events exist
        // For now, we'll use a simpler approach via Home Assistant automations
        it.printf(20, y, id(font_event), COLOR_BLACK, "Events loaded from Home Assistant");
      } else {
        it.printf(20, y, id(font_event), COLOR_BLACK, "No events scheduled");
      }

      // Footer with button instructions
      it.print(20, 420, id(font_small), COLOR_BLACK, "← Prev Day | ↻ Refresh | Next Day →");
      it.printf(20, 450, id(font_small), COLOR_BLACK, "Last update: %02d:%02d", time.hour, time.minute);
```

---

## Step 6: Alternative Approach - HTTP Request to Your API

Instead of using Home Assistant's calendar integration, you can have the ESP32 directly call your existing Vercel API:

```yaml
# HTTP request component
http_request:
  useragent: esphome/reTerminal-E1002
  timeout: 10s

# Fetch calendar from your Vercel API
interval:
  - interval: 2h
    then:
      - http_request.get:
          url: https://reterminal.vercel.app/api/events?date=2026-01-26
          headers:
            Accept: application/json
          on_response:
            then:
              - lambda: |-
                  ESP_LOGD("calendar", "Got response: %s", body.c_str());
                  // Parse JSON and store events
                  // Update display
                  id(calendar_display).update();
```

This approach lets you reuse your existing backend without Home Assistant's calendar integration.

---

## Complete Configuration Example

Here's a full working configuration combining everything:

```yaml
esphome:
  name: reterminal-calendar
  platformio_options:
    board_build.flash_mode: dio

esp32:
  board: esp32-s3-devkitc-1
  variant: esp32s3
  framework:
    type: arduino

logger:
  level: DEBUG

api:
  encryption:
    key: !secret api_key

ota:
  platform: esphome
  password: !secret ota_password

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password
  ap:
    ssid: "Reterminal-Calendar"
    password: "12345678"

captive_portal:

# Time (India timezone)
time:
  - platform: homeassistant
    id: ha_time
    timezone: Asia/Kolkata

# Day offset for navigation
globals:
  - id: day_offset
    type: int
    restore_value: no
    initial_value: '0'

# HTTP client for API calls
http_request:
  useragent: esphome/reTerminal
  timeout: 10s

# Hardware buttons
binary_sensor:
  - platform: gpio
    pin:
      number: GPIO14
      mode: INPUT_PULLUP
      inverted: true
    name: "Refresh"
    on_press:
      - component.update: calendar_display

  - platform: gpio
    pin:
      number: GPIO0
      mode: INPUT_PULLUP
      inverted: true
    name: "Previous Day"
    on_press:
      - lambda: 'id(day_offset) -= 1;'
      - component.update: calendar_display

  - platform: gpio
    pin:
      number: GPIO21
      mode: INPUT_PULLUP
      inverted: true
    name: "Next Day"
    on_press:
      - lambda: 'id(day_offset) += 1;'
      - component.update: calendar_display

# SPI for display
spi:
  clk_pin: GPIO12
  mosi_pin: GPIO11

# Font files (download these first)
font:
  - file: "fonts/Roboto-Bold.ttf"
    id: font_title
    size: 32
  - file: "fonts/Roboto-Regular.ttf"
    id: font_date
    size: 24
  - file: "fonts/Roboto-Medium.ttf"
    id: font_event
    size: 20
  - file: "fonts/Roboto-Regular.ttf"
    id: font_small
    size: 16

# Display
display:
  - platform: waveshare_epaper
    id: calendar_display
    cs_pin: GPIO10
    dc_pin: GPIO17
    busy_pin: GPIO18
    reset_pin: GPIO5
    model: 7in3f
    update_interval: never
    lambda: |-
      // See rendering code above
      it.fill(COLOR_WHITE);
      it.print(20, 20, id(font_title), COLOR_BLACK, "Calendar Loading...");

# Auto-refresh every 2 hours
interval:
  - interval: 2h
    then:
      - component.update: calendar_display
```

---

## Font Files

ESPHome needs font files. Download Roboto fonts:

1. Go to https://fonts.google.com/specimen/Roboto
2. Download the font family
3. Extract to `config/esphome/fonts/` in Home Assistant
4. Or use any TTF fonts you have available

---

## Testing Your Configuration

1. In ESPHome dashboard, click **Validate** to check for syntax errors
2. Click **Install** → **Wirelessly** (if already flashed) or **Plug into this computer**
3. Monitor the logs for errors
4. The display should update after installation completes
5. Test the 3 buttons to verify they work

---

## Troubleshooting

### Display stays white/doesn't update
- Check GPIO pin numbers match your hardware
- Verify SPI connections in logs
- Try updating display manually via Home Assistant service call

### Buttons don't respond
- Check GPIO pin assignments in logs
- Press and hold for 1-2 seconds
- Try different pin numbers if needed

### Can't fetch calendar events
- Verify Google Calendar integration is working in Home Assistant
- Check entity names match your configuration
- Review ESPHome logs for HTTP errors

### Display is slow to update
- This is normal for e-ink displays (can take 30-60 seconds)
- Full screen refresh with 6 colors is slower than monochrome
- Consider updating less frequently to save battery

---

## Next Steps

1. **Customize the UI**: Adjust fonts, colors, layout to your preference
2. **Add more widgets**: Weather, tasks, news headlines
3. **Configure button actions**: Make buttons do different things
4. **Optimize battery life**: Reduce update frequency, use deep sleep

---

## Alternative: Use Your Existing Web App

If ESPHome display rendering seems too complex, you can:

1. Keep your current React web app
2. Add a **server-side rendered (SSR) version** that renders HTML with events
3. Configure SenseCraft HMI to periodically screenshot this SSR page
4. This gives you the familiar HTML/CSS workflow

See **SERVER_SIDE_RENDERED_CALENDAR.md** for this approach (coming next).

---

## Resources

- [ESPHome Display Component Documentation](https://esphome.io/components/display/)
- [Waveshare E-Paper Displays](https://esphome.io/components/display/waveshare_epaper.html)
- [reTerminal E1002 ESPHome Examples](https://github.com/limengdu/office-esphome/blob/main/reterminal-e1002.yaml)
- [Home Assistant Calendar Integration](https://www.home-assistant.io/integrations/calendar.google/)
