# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-01-13

### 🎨 Major UI/UX Improvements

#### Header & Navigation
- **Removed sidebar drawer** - Moved all navigation to header for easier access
- **Always-visible navigation** - Tasks, Calendar, Projects, Settings links in header
- **Theme toggle** - Added auto/light/dark theme switcher with system detection
- **Compact mobile header** - Optimized spacing and sizing for mobile devices

#### Task List Layout
- **New 3-tab system** - Added "All", "Today", and "Upcoming" tabs
  - **All**: Shows all non-completed tasks (new default)
  - **Today**: Tasks due today only
  - **Upcoming**: Tasks due in the future only
- **Unified mobile filters** - Consolidated Status and Sort into bottom drawer
- **Projects carousel** - Horizontal scrollable project selector on mobile
- **Improved card layout** - Tags moved below content on mobile for better readability
- **Responsive typography** - Smaller, optimized fonts for mobile screens

#### Day Calendar View (New Feature)
- **Daily agenda view** - New right sidebar showing day-by-day schedule
- **Day navigation** - Previous/Next day arrows with "Today" quick button
- **Recurring events support** - Properly expands and displays recurring meetings
- **Time ranges** - Shows start and end times for all meetings
- **Meetings only** - Focused view showing only calendar events
- **Project context** - Displays associated project names

#### Upcoming Events Reorganization
- **Moved to left sidebar** - Better workflow with calendar on right
- **Combined with projects** - Projects and upcoming events in one scrollable sidebar
- **Mobile drawer** - Accessible via button on mobile devices
- **Meeting times** - Now displays time for meetings in upcoming events

### 🔧 Technical Improvements

#### Architecture & Code Quality
- **Composable refactoring** - Extracted business logic from components
  - `useDayCalendar.ts` - Day calendar event processing
  - `useTaskFilters.ts` - Enhanced filtering logic
- **Single source of truth** - Unified data flow through composables
- **Separation of concerns** - Clear boundaries between data/logic/presentation
- **Type safety** - Improved TypeScript types throughout

#### Bug Fixes
- **Status filter** - Fixed status filtering not working on main task list
- **Today/Upcoming tabs** - Fixed tabs showing identical content
- **Recurring events time** - Fixed incorrect times for recurring meetings
- **Dark theme visibility** - Fixed invisible elements in dark mode
- **Card alignment** - Fixed tag alignment issues on mobile

### 🎯 Features

#### Theme System
- **Auto mode** (default) - Follows system preference
- **Manual override** - Force light or dark mode
- **Persistent** - Remembers user preference across sessions
- **SSR-safe** - No flash of unstyled content

#### Filtering & Sorting
- **Status filtering** - Filter by task status across all views
- **Sort options** - Sort by Created Date, Due Date, or Status
- **Project filtering** - Filter by specific project (header dropdown)
- **Date range filtering** - Filter by Today, Tomorrow, 7 days, 30 days

#### Mobile Optimizations
- **Touch-friendly controls** - Larger buttons (48px height)
- **Optimized spacing** - Reduced padding on mobile
- **Responsive text** - Scaled font sizes (10px-16px)
- **Better navigation** - Horizontal scroll for projects
- **Compact filters** - Bottom sheet for filter controls

### 📦 Dependencies

- **Added**: `@nuxtjs/color-mode@4.0.0` - Theme management
- **Removed**: `@clerk/nuxt` - Unused authentication library
- **Updated**: Various package optimizations

### 🗂️ File Structure

#### New Files
- `app/components/calendar/DayCalendarView.vue`
- `app/components/task-list/ProjectsCarousel.vue`
- `app/components/task-list/MobileFiltersDrawer.vue`
- `app/components/task-list/UpcomingEventsDrawer.vue`
- `app/components/ThemeToggle.vue`
- `app/composables/useDayCalendar.ts`

#### Removed Files
- `app/components/AppSidebar.vue`

#### Modified Files
- `app/components/TaskListView.vue` - Major layout restructure
- `app/components/DashboardLayoutContent.vue` - Header navigation redesign
- `app/components/task-list/TaskListBlock.vue` - Mobile-optimized cards
- `app/components/task-list/UpcomingSection.vue` - Responsive improvements
- `app/components/task-list/UpcomingEvents.vue` - Time display enhancements
- `app/composables/useTaskFilters.ts` - Enhanced filtering logic
- `app/layouts/default.vue` - Removed sidebar provider
- `nuxt.config.ts` - Added color mode configuration

### 📊 Metrics

- **Reduced component complexity** - TaskListView: 150+ lines of logic moved to composable
- **Improved mobile UX** - No drawer navigation required
- **Better performance** - Optimized rendering with proper reactivity
- **Enhanced maintainability** - Clear separation of concerns

---

## [0.1.0] - Previous Version

Initial release with basic task management and calendar features.
