export function getTimeAsDayMonthYear(date: string) {
  const dateObj = new Date(date);
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  return `${day.toString().padStart(2, "0")}.${month.toString().padStart(2, "0")}.${year}`;
}

export function getTimeAsHoursMinutes(date: string) {
  const dateObj = new Date(date);
  const hours = dateObj.getHours();
  const minutes = dateObj.getMinutes();
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
