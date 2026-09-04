const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const APP_TZ = process.env.TZ || 'Asia/Makassar';

// This app stores/serializes timestamps as "local wall-clock time in APP_TZ,
// labeled as UTC" (raw ISO output already shows local time with no further
// conversion needed downstream). These helpers reproduce that same encoding,
// just driven by the configurable APP_TZ instead of a hardcoded offset.
function appTzOffsetMillis() {
  return dayjs().tz(APP_TZ).utcOffset() * 60 * 1000;
}

function nowInAppTz() {
  return new Date(Date.now() + appTzOffsetMillis());
}

function todayInAppTz() {
  const today = nowInAppTz();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

module.exports = {
  APP_TZ,
  nowInAppTz,
  todayInAppTz,
};
