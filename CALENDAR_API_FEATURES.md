# Google Calendar API - Available Features & Ideas

This document explores what the Google Calendar API provides and creative features we can build for your reTerminal display.

## 🔍 What the Google Calendar API Provides

The `calendar.events.list()` endpoint returns rich event data. Currently we're only using a few fields, but here's **everything available**:

### Basic Event Information
```typescript
{
  id: string                    // Unique event ID
  summary: string               // Event title/name
  description: string           // Full event description (can be long text, HTML, etc.)
  location: string              // Physical or virtual location
  start: {
    dateTime: string           // ISO timestamp (for timed events)
    date: string               // Date only (for all-day events)
    timeZone: string           // Event timezone
  }
  end: { ... }                  // Same structure as start
  created: string               // When event was created
  updated: string               // Last modification time
  status: string                // "confirmed", "tentative", "cancelled"
  transparency: string          // "opaque" (busy) or "transparent" (free)
}
```

### People & Collaboration
```typescript
{
  creator: {
    email: string
    displayName: string
    self: boolean              // If you're the creator
  }
  organizer: {
    email: string
    displayName: string
    self: boolean              // If you're the organizer
  }
  attendees: [{
    email: string
    displayName: string
    optional: boolean          // Optional vs required
    responseStatus: string     // "accepted", "declined", "tentative", "needsAction"
    self: boolean             // If this is you
    organizer: boolean
    comment: string           // Attendee's comment
  }]
}
```

### Meeting Details
```typescript
{
  conferenceData: {
    conferenceId: string
    conferenceSolution: {
      name: string             // "Google Meet", "Zoom", etc.
      iconUri: string
    }
    entryPoints: [{
      entryPointType: string   // "video", "phone", "sip"
      uri: string              // Meeting link
      label: string
      pin: string              // Meeting PIN/password
    }]
  }
  hangoutLink: string          // Google Meet link (legacy)
}
```

### Recurrence & Reminders
```typescript
{
  recurringEventId: string     // ID of recurring event series
  recurrence: string[]         // RRULE format ["RRULE:FREQ=DAILY;COUNT=5"]
  reminders: {
    useDefault: boolean
    overrides: [{
      method: string           // "email", "popup"
      minutes: number          // Minutes before event
    }]
  }
}
```

### Visual & Metadata
```typescript
{
  colorId: string              // Calendar color (1-11)
  visibility: string           // "default", "public", "private", "confidential"
  iCalUID: string             // Standard iCal identifier
  htmlLink: string            // Link to event in Google Calendar
  attachments: [{
    fileUrl: string
    title: string
    mimeType: string
    iconLink: string
  }]
  eventType: string           // "default", "outOfOffice", "focusTime", "workingLocation"
  source: {
    url: string               // External source URL
    title: string
  }
}
```

---

## 🎨 Creative Display Ideas for reTerminal

Based on what's available, here are features we can add:

### 1. **Meeting Type Indicators** 🎯

Show different icons/colors for different types of meetings:

```
📞 Phone calls (conferenceData with phone entry point)
🎥 Video calls (Google Meet, Zoom links)
🚗 In-person meetings (has physical location)
🎯 Focus time (eventType: "focusTime")
🏝️ Out of office (eventType: "outOfOffice")
📍 Working location (eventType: "workingLocation")
🔒 Private events (visibility: "private")
```

### 2. **Attendee Response Status** 👥

Show RSVP status for meetings:

```
✅ All accepted (everyone said yes)
⏳ Pending (waiting for responses)
❌ Some declined (conflicts)
👤 Solo event (no attendees)
🤝 Optional attendee (you're optional)
```

### 3. **Time-Based Insights** ⏰

**Focus Time Blocks:**
- Identify gaps between meetings for focused work
- Highlight longest free block of the day

**Meeting Density Heatmap:**
- Show busy vs free hours as a visual bar
- Example: `▓▓░░▓▓▓░░░` (busy, free, busy, free)

**Time Until Next Meeting:**
- Countdown timer: "Next meeting in 15 minutes"
- "You have 2 hours of free time"

### 4. **Travel Time Alerts** 🚗

If consecutive meetings have different locations:
- Calculate travel time between locations
- Show alert: "⚠️ 20min travel time needed between meetings"

### 5. **Conference Links Quick Access** 🎥

Extract and display prominently:
```
🎥 Meet: meet.google.com/abc-defg-hij
📞 Zoom: zoom.us/j/123456789
📱 Dial-in: +1-555-0100
```

### 6. **Day Summary Stats** 📊

More detailed statistics:
- **Meeting load**: "Heavy day: 6 hours of meetings"
- **Focus time**: "2 hours available for deep work"
- **External meetings**: "3 meetings with external attendees"
- **Organizer vs attendee**: "You're organizing 2 of 5 meetings"
- **Accepted vs pending**: "Waiting on 3 RSVPs"

### 7. **Color-Coded Events** 🎨

Use Google Calendar colors:
- Purple for personal
- Blue for work
- Green for health/fitness
- Red for important/urgent

Map colors to e-ink display:
```
colorId mapping:
1 (Lavender) → Blue on e-ink
2 (Sage) → Green on e-ink
3 (Grape) → Black (bold)
11 (Tomato) → Red on e-ink
```

### 8. **Event Descriptions** 📝

Show truncated descriptions for context:
```
10:00 AM - Team Standup
📝 "Discuss sprint progress, blockers..."
```

### 9. **Recurring Event Indicators** 🔄

Show which events repeat:
```
🔄 Daily standup (repeats every day)
📅 Weekly review (repeats every Monday)
```

### 10. **Out of Office / Focus Time Banner** 🛑

If you have focus time or OOO blocks:
```
┌─────────────────────────────┐
│ 🎯 FOCUS TIME: 2pm - 4pm    │
│ Deep work - Do not disturb  │
└─────────────────────────────┘
```

### 11. **Multi-Day View** 📆

Show upcoming days:
```
TODAY     TOMORROW    WED
6 events  3 events    2 events
Busy      Light       Free
```

### 12. **Meeting Duration Warnings** ⚠️

Highlight long meetings:
```
2:00 PM - 5:00 PM (3 hours!)
⚠️ Long meeting - Plan breaks
```

### 13. **Response Status for Your Events** 📧

If you're organizing:
```
Team Meeting (10:00 AM)
✅ 8/10 accepted  ⏳ 2 pending
```

### 14. **Smart Event Grouping** 🗂️

Group by type:
```
🎥 VIDEO CALLS (3)
├─ Morning standup
├─ Client demo
└─ 1:1 with manager

📍 IN-PERSON (2)
├─ Lunch meeting
└─ Office hours
```

### 15. **Weather Integration** 🌤️

For events with physical locations, show weather:
```
3:00 PM - Site visit
📍 Downtown Office
🌤️ 28°C, Partly cloudy
```

*(Requires separate weather API)*

### 16. **Conflict Detection** ⚠️

Show overlapping events:
```
⚠️ CONFLICT DETECTED
2:00 PM - Meeting A
2:30 PM - Meeting B (overlap!)
```

### 17. **Attachments Display** 📎

If event has attachments:
```
Project Review
📎 2 attachments:
   • Presentation.pdf
   • Budget.xlsx
```

### 18. **Time Zone Awareness** 🌍

For multi-timezone teams:
```
Client Call
🇺🇸 3:00 PM EST (you)
🇬🇧 8:00 PM GMT (client)
```

---

## 🚀 Recommended Enhancements (Priority Order)

### **Tier 1: Easy Wins** (30 minutes each)

1. ✅ **Meeting type icons** - Already partially done
2. **Conference link extraction** - Show Meet/Zoom links prominently
3. **Focus time highlighting** - Different color for focus blocks
4. **Event descriptions** - Show first 50 chars
5. **Recurring indicators** - Add 🔄 icon

### **Tier 2: Medium Complexity** (1-2 hours)

6. **Attendee RSVP status** - Show acceptance rate
7. **Time-based insights** - Free time calculations
8. **Multi-day view** - Show tomorrow + day after
9. **Meeting density heatmap** - Visual busy/free indicator
10. **Color-coded events** - Use Calendar colors

### **Tier 3: Advanced** (3+ hours)

11. **Travel time alerts** - Between location changes
12. **Conflict detection** - Overlapping events
13. **Weather integration** - Requires external API
14. **Smart grouping** - By meeting type
15. **Time zone display** - For remote teams

---

## 📋 Implementation Example: Enhanced Calendar v2

Here's what an ultra-enhanced version could look like:

```
┌─────────────────────────────────────────────────────────────┐
│ Monday, January 26, 2026                                    │
│ 6 meetings • 4h 30m busy • 3h 30m free                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 🎯 FOCUS TIME: 9am - 11am                                   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━                                  │
│                                                              │
│ 🎥 11:00 AM  Team Standup (30min)          ✅ 8/10 accepted│
│    🔗 meet.google.com/abc-defg                    🔄 Daily  │
│    📝 Sprint progress & blockers                             │
│                                                              │
│ 🚗 12:00 PM  Lunch w/ Client (1h)                In-person │
│    📍 Downtown Cafe                         🌤️ 28°C Sunny  │
│    ⚠️ 20min travel from last location                       │
│                                                              │
│ 🎥 2:00 PM   Client Demo (1h)              ⏳ 3/5 pending │
│    🔗 zoom.us/j/123456                                      │
│    📎 Demo_slides.pdf                                       │
│                                                              │
│ ⏰ NEXT: Team Standup in 45 minutes                         │
│                                                              │
│ ▓▓░░░░▓░▓▓▓░░░░░  (busy █ / free ░)                       │
│ 9a  12p  3p  6p                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Which Features Would You Like?

I can implement any combination of these! The most impactful for your use case would be:

1. **Conference links** - Quick access to meeting URLs
2. **Meeting type icons** - Visual differentiation
3. **Focus time blocks** - Highlight deep work time
4. **Time density bar** - See busy/free at a glance
5. **Multi-day preview** - See tomorrow's schedule

**What interests you most?** I can create an enhanced version with your preferred features!
