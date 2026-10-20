import "server-only";
import { connection } from "next/server";

/** The time of the current request. Marks the render as dynamic, as Cache Components requires before reading the clock. */
export async function requestNow() {
  await connection();
  return Date.now();
}
