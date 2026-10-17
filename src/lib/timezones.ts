export const IANA_TIMEZONES: string[] = Intl.supportedValuesOf("timeZone");

export const DEFAULT_TIMEZONE = "Europe/Paris";

export function isValidTimezone(value: string): boolean {
  return IANA_TIMEZONES.includes(value);
}
