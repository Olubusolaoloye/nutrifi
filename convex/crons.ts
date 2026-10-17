import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Reminders are checked every 5 minutes; each one is sent within 15 minutes of its time.
crons.interval("send reminders", { minutes: 5 }, internal.notify.tick);

export default crons;
