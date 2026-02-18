# Manual Checkpoint - 2026-02-18
This file is created to trigger a manual checkpoint as requested by the user.

## Changes
- Created Backup folder with Home.tsx backup
- Fixed 401 Unauthorized error in NotificationContext.tsx by adding credentials: "same-origin" to all fetch calls
- Moved notification bell from BottomNav to top-right header corner
- Added red blinking dot on Profile icon in BottomNav when there are unread notifications
- Chat tab in BottomNav now only shows when user is connected to a manager
- Moved stats section outside tabs - now visible immediately on profile page
- Tab order: Admin/Manager (first), Stats (second), Info (last)
- Made ChatPage responsive with adaptive sizing for different screen ratios
- Fixed potential null/undefined errors in TournamentPage match display (team names, referee, court)
- Created FloatingChat component - draggable chat icon that opens a 90% width x 60% height chat window
- Removed chat tab from BottomNav, replaced with floating chat icon
- Added badge notification to FloatingChat icon
- Updated FloatingChat messages display: others on left with icon & name, current user on right
- Added credentials: "same-origin" to ALL fetch API calls across the app to fix 401 unauthorized errors
