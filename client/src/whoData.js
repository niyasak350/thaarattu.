// WHO Child Growth Standards: median (50th percentile) weight and length/height.
// Values for 0-24 months are monthly; after that 3, 4 and 5 years.
// Typed in for this project: check against the official WHO tables before real use.
const MONTHS = [...Array(25).keys(), 36, 48, 60];

const MEDIANS = {
  male: {
    weight: [3.3, 4.5, 5.6, 6.4, 7.0, 7.5, 7.9, 8.3, 8.6, 8.9, 9.2, 9.4, 9.6, 9.9, 10.1, 10.3, 10.5, 10.7, 10.9, 11.1, 11.3, 11.5, 11.8, 12.0, 12.2, 14.3, 16.3, 18.3],
    height: [49.9, 54.7, 58.4, 61.4, 63.9, 65.9, 67.6, 69.2, 70.6, 72.0, 73.3, 74.5, 75.7, 76.9, 78.0, 79.1, 80.2, 81.2, 82.3, 83.2, 84.2, 85.1, 86.0, 86.9, 87.8, 96.1, 103.3, 110.0],
  },
  female: {
    weight: [3.2, 4.2, 5.1, 5.8, 6.4, 6.9, 7.3, 7.6, 7.9, 8.2, 8.5, 8.7, 8.9, 9.2, 9.4, 9.6, 9.8, 10.0, 10.2, 10.4, 10.6, 10.9, 11.1, 11.3, 11.5, 13.9, 16.1, 18.2],
    height: [49.1, 53.7, 57.1, 59.8, 62.1, 64.0, 65.7, 67.3, 68.7, 70.1, 71.5, 72.8, 74.0, 75.2, 76.4, 77.5, 78.6, 79.7, 80.7, 81.7, 82.7, 83.7, 84.6, 85.5, 86.4, 95.1, 102.7, 109.4],
  },
};

// Median for a gender ('male' / 'female'), kind ('weight' / 'height') and age in months.
// Returns null when there is no data (other gender, or older than 5 years).
export function whoMedian(gender, kind, months) {
  const values = MEDIANS[gender]?.[kind];
  if (!values || months < 0 || months > 60) return null;
  for (let i = 1; i < MONTHS.length; i++) {
    if (months <= MONTHS[i]) {
      // straight line between the two nearest points
      const share = (months - MONTHS[i - 1]) / (MONTHS[i] - MONTHS[i - 1]);
      return Number((values[i - 1] + share * (values[i] - values[i - 1])).toFixed(1));
    }
  }
  return null;
}
