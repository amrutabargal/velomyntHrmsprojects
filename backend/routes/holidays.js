const express = require('express');
const ical = require('node-ical');

const router = express.Router();

const INDIA_HOLIDAY_ICS_URL =
  'https://calendar.google.com/calendar/ical/en.indian%23holiday%40group.v.calendar.google.com/public/basic.ics';

const toDateKey = (dateObj) => {
  const y = dateObj.getUTCFullYear();
  const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

router.get('/', async (req, res) => {
  try {
    const requestedYear = Number(req.query.year) || new Date().getFullYear();
    const requestedMonth = req.query.month ? Number(req.query.month) : null;
    const events = await ical.async.fromURL(INDIA_HOLIDAY_ICS_URL);

    const holidays = Object.values(events)
      .filter((event) => event.type === 'VEVENT' && event.start)
      .map((event) => {
        const startDate = new Date(event.start);
        return {
          id: `${event.uid || event.summary}-${toDateKey(startDate)}`,
          date: toDateKey(startDate),
          title: event.summary || 'Holiday',
        };
      })
      .filter((item) => {
        const [y, m] = item.date.split('-').map(Number);
        if (y !== requestedYear) return false;
        if (requestedMonth && m !== requestedMonth) return false;
        return true;
      });

    // Remove exact duplicates from ICS data
    const unique = [];
    const seen = new Set();
    holidays.forEach((item) => {
      const key = `${item.date}::${String(item.title).trim().toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    });

    unique.sort((a, b) => a.date.localeCompare(b.date));
    return res.json(unique);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch holiday calendar',
      error: error.message,
    });
  }
});

module.exports = router;
