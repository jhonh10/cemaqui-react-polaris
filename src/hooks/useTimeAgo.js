const DATE_UNITS = {
  day: 86400,
  hour: 3600,
  minute: 60,
  second: 1
};

const getSecondsDiff = (timestamp) => (Date.now() - timestamp) / 1000;

const getUnitAndValueDate = (secondsElapse) =>
  Object.entries(DATE_UNITS).forEach(([unit, secondsInUnit]) => {
    if (secondsElapse >= secondsInUnit || unit === 'second') {
      const value = Math.floor(secondsElapse / secondsInUnit) * -1;
      return { value, unit };
    }
  });
//   for (const [unit, secondsInUnit] of Object.entries(DATE_UNITS)) {
//     if (secondsElapse >= secondsInUnit || unit === 'second') {
//       const value = Math.floor(secondsElapse / secondsInUnit) * -1;
//       return { value, unit };
//     }
//   }

const getTimeAgo = (timestamp, locale) => {
  const rtf = new Intl.RelativeTimeFormat(locale);
  const secondsElapsed = getSecondsDiff(timestamp);
  const { value, unit } = getUnitAndValueDate(secondsElapsed);
  return rtf.format(value, unit);
};

export default function useTimeAgo({ timestamp }) {
  const locale = 'es';
  const timeAgo = getTimeAgo(timestamp, locale);

  const date = new Date(timestamp);
  const formattedDate = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric'
  }).format(date);
  return {
    dateTime: formattedDate,
    timeAgo
  };
}
