# Class Management

This document provides information on managing external exam classes.

## Adding a New Class

To add a new external exam class, create a JSON object following the schema defined in `/schemas/exam-class.json`.

### Example

```json
{
  "classId": "EXT-EXAM-SUBJ-XXX",
  "examType": "IGCSE",
  "examBoard": "Cambridge",
  "subject": "Your Subject",
  "level": "Intermediate",
  "classType": "Regular",
  "schedule": {
    "startDate": "YYYY-MM-DD",
    "endDate": "YYYY-MM-DD",
    "dayOfWeek": ["Monday", "Wednesday"],
    "timeSlot": "HH:MM-HH:MM",
    "duration": 120
  },
  "tutor": {
    "tutorId": "TUT-XXX",
    "name": "Tutor Name"
  },
  "capacity": {
    "maxStudents": 15,
    "currentEnrollment": 0
  },
  "fees": {
    "currency": "USD",
    "amount": 300,
    "frequency": "per month"
  },
  "status": "Open"
}
```

## Updating Class Information

Classes should be updated regularly to reflect:

- Current enrollment numbers
- Status changes (Open → Full → In Progress → Completed)
- Schedule modifications
- Fee adjustments

## Class Status Lifecycle

1. **Open**: Accepting new enrollments
2. **Full**: Maximum capacity reached, accepting waitlist
3. **In Progress**: Class has started, enrollment closed
4. **Completed**: Class has finished
5. **Cancelled**: Class was cancelled

## Best Practices

- Update enrollment numbers weekly
- Notify students of schedule changes at least 2 weeks in advance
- Maintain waitlist when classes are full
- Archive completed classes for record-keeping
- Monitor tutor performance and student feedback
