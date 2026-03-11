/**
 * Calculates the number of milliseconds until the next 6-hour interval
 * aligned to 08:00 AM, 14:00 (2 PM), 20:00 (8 PM), 02:00 (2 AM) local time.
 */
export function calculateMsUntilNextRefresh() {
  const now = new Date();
  const currentHour = now.getHours();
  // We want to trigger at 2, 8, 14, 20
  let targetHour = 8;
  
  if (currentHour < 2) targetHour = 2;
  else if (currentHour < 8) targetHour = 8;
  else if (currentHour < 14) targetHour = 14;
  else if (currentHour < 20) targetHour = 20;
  else targetHour = 26; // 2 AM next day

  const target = new Date(now);
  if (targetHour >= 24) {
    target.setDate(target.getDate() + 1);
    target.setHours(targetHour - 24, 0, 0, 0);
  } else {
    target.setHours(targetHour, 0, 0, 0);
  }

  return target.getTime() - now.getTime();
}

/**
 * Starts a repeating timeout that executes onRefresh exactly at the 6-hour boundaries.
 * @param {Function} onRefresh 
 * @returns {Function} cleanup function to clear the timeout
 */
export function startScheduler(onRefresh) {
  let timerId;

  function schedule() {
    const msUntil = calculateMsUntilNextRefresh();
    console.log(`Next background refresh scheduled in ${Math.round(msUntil / 1000 / 60)} minutes.`);
    
    timerId = setTimeout(() => {
      onRefresh();
      // Reschedule for the next 6-hour block
      schedule(); 
    }, msUntil);
  }

  schedule();
  return () => {
    if (timerId) clearTimeout(timerId);
  };
}
