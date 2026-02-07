
import { Coordinate } from '../types';

/**
 * Calculates the area of a polygon defined by lat/lng coordinates in square meters
 * using the Shoelace formula projected on a flat plane (approximation for small areas).
 */
export function calculateArea(coords: Coordinate[]): number {
  if (coords.length < 3) return 0;

  const radius = 6378137; // Earth's radius in meters
  let area = 0;

  for (let i = 0; i < coords.length; i++) {
    const p1 = coords[i];
    const p2 = coords[(i + 1) % coords.length];

    const x1 = p1.lng * Math.PI / 180 * radius * Math.cos(p1.lat * Math.PI / 180);
    const y1 = p1.lat * Math.PI / 180 * radius;

    const x2 = p2.lng * Math.PI / 180 * radius * Math.cos(p2.lat * Math.PI / 180);
    const y2 = p2.lat * Math.PI / 180 * radius;

    area += (x1 * y2) - (x2 * y1);
  }

  return Math.abs(area) / 2;
}

export function formatThaiArea(sqm: number) {
  const rai = Math.floor(sqm / 1600);
  const remainingAfterRai = sqm % 1600;
  const ngan = Math.floor(remainingAfterRai / 400);
  const remainingAfterNgan = remainingAfterRai % 400;
  const wa = (remainingAfterNgan / 4).toFixed(2);

  return `${rai} ไร่ ${ngan} งาน ${wa} ตร.ว.`;
}
