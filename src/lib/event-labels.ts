export const EVENT_LABELS: Record<string, string> = {
  loan_created: "Prêt créé",
  loan_returned: "Prêt rendu",
  loan_cancelled: "Prêt annulé",
  loan_extended: "Prêt prolongé",
  asset_created: "Objet créé",
  asset_updated: "Objet modifié",
  asset_photo_updated: "Photo mise à jour",
  asset_condition_changed: "État constaté modifié",
  asset_archived: "Objet archivé",
  loan_request_created: "Demande de prêt reçue",
  loan_request_approved: "Demande approuvée",
  loan_request_rejected: "Demande refusée",
  loan_request_cancelled: "Demande annulée",
};

/**
 * Formatte une date/heure dans le fuseau de l'organisation (règle : toutes
 * les dates sont traitées avec le fuseau de l'organisation). `timeZone`
 * omis = fuseau du serveur, uniquement pour les écrans sans contexte
 * d'organisation.
 */
export function formatDateTime(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date);
}

export function formatDateOnly(date: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeZone }).format(date);
}
