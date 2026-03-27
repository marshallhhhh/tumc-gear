export const formatDate = (d) => new Date(d).toLocaleDateString("en-GB");

export const formatDateTime = (d) => {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} at ${hours}:${minutes}`;
};

export const formatDayOfWeekDate = (d) => {
  const date = new Date(d);
  const dayOfWeek = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${dayOfWeek} ${day}/${month}`;
};
