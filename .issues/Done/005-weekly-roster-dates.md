# ISSUE-005: Weekly Roster Date Indicators

## Description
The Weekly Roster currently only shows day names (Mon, Tue, etc.) in the column headers. To improve clarity, the actual calendar date (e.g., "05/02") should be displayed above or alongside the day name.

## Proposed Changes

### 1. UI Enhancements (`src/components/roster/RosterMatrix.tsx`)
- **Date Calculation:** Inside the `RosterMatrix` component, calculate the specific date for each of the 7 days starting from `weekStart`.
- **Header Update:** Modify the `<thead>` section to display the date.
    - Example:
      ```tsx
      <th key={day} className="text-center py-2 px-1 text-zinc-400 font-medium w-12">
          <div className="text-[10px] opacity-50 mb-0.5">{calculateDateForDay(i)}</div>
          <div>{day}</div>
      </th>
      ```
- **Formatting:** Use `date-fns` or native `Intl.DateTimeFormat` to format the date as "dd/MM" or similar.

### 2. Implementation Details
- Ensure the dates update correctly when the user changes the week using the chevron buttons.
- Match the "Cyber-Concierge" aesthetic by using subtle, smaller text for the dates compared to the day names.

## Success Criteria
- [ ] Each column in the Roster Matrix shows the correct numerical date for that week.
- [ ] Dates are clearly legible but secondary to the day names.
- [ ] Changing weeks correctly updates the date indicators.
