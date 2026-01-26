# SenseCraft HMI Setup Guide - Static Calendar

Now that your server-side rendered calendar is working, here's how to display it on your reTerminal E1002.

## ✅ What's Working Now

- **Static Calendar URL**: `https://reterminal.vercel.app/api/static-calendar`
- **Server-side rendering**: Events are fetched and rendered when SenseCraft requests the page
- **No JavaScript required**: Works perfectly with SenseCraft's screenshot-based approach
- **Optimized for e-ink**: Clean design with good contrast for 6-color display

---

## Step-by-Step: Configure SenseCraft HMI

### 1. Access SenseCraft HMI Dashboard

1. Open your browser and go to: **https://sensecraft.seeed.cc/hmi**
2. **Sign in** with your account (or create one if needed)
3. You should see your connected reTerminal E1002 device

### 2. Select Your Device

1. Click on your **reTerminal E1002** device from the list
2. If your device isn't showing:
   - Make sure it's powered on
   - Check that it's connected to WiFi
   - Verify it's registered to your account

### 3. Configure Web Function

1. In the device view, look for **Web Function** option
2. Click **Configure** or **Web Function** button
3. You'll see a URL input field

### 4. Enter the Calendar URL

1. In the URL field, enter:
   ```
   https://reterminal.vercel.app/api/static-calendar
   ```

2. **Important**: Make sure to include the full `https://` prefix

### 5. Preview the Calendar

1. Click the **Preview** button in the toolbar
2. Wait for the preview to load (10-30 seconds)
3. You should see your calendar with today's events
4. **Check the display**:
   - Title should show today's date
   - Events should be listed with times
   - Layout should fit the 800x480 screen

### 6. Adjust Settings (Optional)

Configure refresh interval:
- **Manual Refresh**: Update only when you click refresh
- **Periodic Refresh**: Auto-update every 1, 2, 4, or 6 hours
- **Scheduled Refresh**: Update at specific times (e.g., 6 AM, 12 PM, 6 PM)

**Recommended**: Set to refresh every **2 hours** for good balance between freshness and battery life.

### 7. Deploy to Device

1. Once the preview looks good, click **Deploy** or **Send to Device**
2. Confirm the deployment
3. Wait 30-60 seconds for the device to update
4. The calendar should now display on your reTerminal!

---

## Viewing Different Dates

To show a different date, add the `date` query parameter:

```
https://reterminal.vercel.app/api/static-calendar?date=2026-01-27
```

You could configure multiple "profiles" in SenseCraft with different dates, then switch between them using the device buttons (if SenseCraft supports this).

---

## Troubleshooting

### Calendar shows "No events scheduled" but you have events

**Cause**: The date might be wrong or calendar isn't syncing properly.

**Solution**:
1. Check that events exist for today: `https://reterminal.vercel.app/api/events?date=2026-01-26`
2. If events show in the API but not in static-calendar, check Vercel logs
3. Verify your Google Calendar integration is working

### Preview doesn't load or times out

**Cause**: SenseCraft server couldn't fetch your URL.

**Solution**:
1. Test the URL directly in your browser
2. Make sure the URL is publicly accessible (not localhost)
3. Check that Vercel deployment succeeded
4. Try again - SenseCraft servers might be slow

### Display is cut off or layout looks wrong

**Cause**: Screen size mismatch or too many events.

**Solution**:
1. The page is designed for 800x480 pixels
2. If you have many events, only the first few will show (by design)
3. You can edit the CSS in `api/static-calendar.ts` to adjust font sizes/spacing

### Colors look washed out on e-ink

**Cause**: The 6-color e-ink palette is limited.

**Solution**:
1. Use high contrast colors (black text on white background works best)
2. Avoid gradients and subtle color differences
3. Test with Preview to see how colors render on e-ink

### Device shows old data

**Cause**: SenseCraft hasn't refreshed yet.

**Solution**:
1. Manually trigger refresh from SenseCraft HMI
2. Check your refresh interval settings
3. The display updates only when SenseCraft fetches a new screenshot
4. Each refresh counts as a new page load on your server

---

## Customization

### Change the Date Format

Edit `api/static-calendar.ts`, find the `formatDateHeader` function:

```typescript
function formatDateHeader(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });
}
```

Change to your preferred format, e.g.:
```typescript
// Short format: "Mon, Jan 26"
return date.toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  timeZone: 'Asia/Kolkata',
});
```

### Adjust Font Sizes

In the `<style>` section of `api/static-calendar.ts`:

```css
.title {
  font-size: 28px;  /* Change this */
}

.event-title {
  font-size: 18px;  /* Change this */
}
```

### Show More Events

Change the max-height in the CSS:

```css
.events {
  max-height: 360px;  /* Increase this to show more events */
}
```

### Add Weather or Other Info

You can add additional sections to the HTML. For example, add weather at the top:

```html
<div class="weather">
  🌤️ 28°C Partly Cloudy
</div>
```

Then redeploy with `git push`.

---

## Battery Life Tips

The reTerminal E1002 is designed for low-power operation:

- **E-ink display**: Only uses power when updating
- **Refresh frequency**: Less frequent = longer battery life
- **Recommended**: Refresh every 2-4 hours for good balance

With 2-hour refresh interval:
- Expected battery life: **2-3 months** (manufacturer claim)
- Each refresh takes about 30-60 seconds

---

## Next Steps

Now that you have a working static calendar:

1. ✅ **Test it**: Make sure events show correctly on the device
2. ✅ **Set refresh schedule**: Configure auto-refresh in SenseCraft
3. ✅ **Customize**: Adjust fonts, colors, layout to your preference
4. 🔄 **Consider ESPHome**: For full control with hardware buttons (see [HOME_ASSISTANT_SETUP.md](./HOME_ASSISTANT_SETUP.md))

---

## Comparison: SenseCraft vs ESPHome

| Feature | SenseCraft HMI (Current) | ESPHome (Future) |
|---------|-------------------------|------------------|
| **Setup Time** | 5 minutes | 2-3 hours |
| **Hardware Buttons** | Limited/None | Full control |
| **Real-time Updates** | No (periodic screenshots) | Yes (device-controlled) |
| **Customization** | HTML/CSS | Display code (harder) |
| **Dependency** | SenseCraft cloud | Your own server only |
| **Battery Life** | Good (2-3 months) | Good (2-3 months) |
| **Refresh Control** | SenseCraft schedule | Any frequency you want |

---

## Support

If you encounter issues:

1. **Check Vercel deployment**: Visit https://vercel.com/meeth123s-projects/reterminal
2. **Test API directly**: `https://reterminal.vercel.app/api/events?date=2026-01-26`
3. **Check SenseCraft status**: https://sensecraft.seeed.cc/hmi
4. **View device logs**: In SenseCraft HMI device settings

---

## Resources

- [SenseCraft HMI Documentation](https://sensecraft-hmi-docs.seeed.cc/)
- [reTerminal E1002 Wiki](https://wiki.seeedstudio.com/getting_started_with_reterminal_e1002/)
- [Server-Side Rendered Calendar Guide](./SERVER_SIDE_RENDERED_CALENDAR.md)
- [Home Assistant Alternative](./HOME_ASSISTANT_SETUP.md)

---

## Success! 🎉

Your reTerminal E1002 should now be displaying your Google Calendar with:
- ✅ Today's date and events
- ✅ Clean, e-ink optimized design
- ✅ Automatic updates (based on your schedule)
- ✅ No touch interaction needed

Enjoy your personalized calendar display!
