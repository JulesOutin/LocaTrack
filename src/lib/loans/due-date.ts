import { fromZonedTime } from "date-fns-tz";

/**
 * Interprète une date de calendrier (sans heure, ex. "2026-03-05") comme la
 * fin de journée dans le fuseau de l'organisation, puis la convertit en
 * instant UTC — conformément à la règle « toutes les dates sont traitées
 * avec le fuseau de l'organisation ».
 */
export function dueDateToUtc(dateOnly: string, timezone: string): Date {
  return fromZonedTime(`${dateOnly}T23:59:59`, timezone);
}
