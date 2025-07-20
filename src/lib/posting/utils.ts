import dayjs from "dayjs";

let lastPostHour = 0;
let postIndex = 0; // 0 = user, 1 = cartoon, 2 = user

export function shouldPostNow(): boolean {
  const now = dayjs();
  const hour = now.hour();

  // Allow posts only at 9am, 1pm, 6pm (example)
  const validHours = [9, 13, 18];
  if (!validHours.includes(hour) || hour === lastPostHour) return false;

  lastPostHour = hour;
  return true;
}

export async function getNextPostType(): Promise<"user" | "cartoon"> {
  const result = postIndex % 2 === 0 ? "user" : "cartoon";
  postIndex = (postIndex + 1) % 3;
  return result;
} 