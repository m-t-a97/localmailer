import { DateTime } from "luxon";

export class DateUtils {
  static format(date: Date): string {
    return DateTime.fromJSDate(date).toFormat("LLL dd yyyy, hh:mm a");
  }
}
