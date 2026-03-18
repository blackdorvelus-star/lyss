import type { FeedItem } from "./LiveActivityFeed";
import type { PriorityItem } from "./PriorityRadar";
import type { CallLog } from "./CallHistory";

const now = Date.now();
const day = 86400000;

export const demoInvoices = [
  {
    id: "demo-1", amount: 3200, amount_recovered: 3200, status: "recovered",
    invoice_number: "F-2024-018", created_at: new Date(now - 2 * day).toISOString(),
    due_date: new Date(now - 15 * day).toISOString(),
    clients: { name: "Transport Beauce Inc.", email: "info@transportbeauce.ca", phone: "+14185551234" },
  },
  {
    id: "demo-2", amount: 1850, amount_recovered: null, status: "in_progress",
    invoice_number: "F-2024-022", created_at: new Date(now - 5 * day).toISOString(),
    due_date: new Date(now - 8 * day).toISOString(),
    clients: { name: "Plomberie Lévis", email: "marc@plomberiel.ca", phone: "+14185559876" },
  },
  {
    id: "demo-3", amount: 4500, amount_recovered: 2000, status: "in_progress",
    invoice_number: "F-2024-025", created_at: new Date(now - 3 * day).toISOString(),
    due_date: new Date(now - 10 * day).toISOString(),
    clients: { name: "Construction Tremblay", email: "jtremblay@ctremb.ca", phone: "+15145553456" },
  },
  {
    id: "demo-4", amount: 750, amount_recovered: 750, status: "recovered",
    invoice_number: "F-2024-029", created_at: new Date(now - 1 * day).toISOString(),
    due_date: new Date(now - 3 * day).toISOString(),
    clients: { name: "Café Le Torréfié", email: "commandes@letorrefie.ca", phone: "+14185557890" },
  },
  {
    id: "demo-5", amount: 2100, amount_recovered: null, status: "disputed",
    invoice_number: "F-2024-014", created_at: new Date(now - 12 * day).toISOString(),
    due_date: new Date(now - 20 * day).toISOString(),
    clients: { name: "Garage Pelletier", email: "serge@garagepelletier.ca", phone: "+14185554321" },
  },
  {
    id: "demo-6", amount: 1250, amount_recovered: 1250, status: "recovered",
    invoice_number: "F-2024-031", created_at: new Date(now - 6 * day).toISOString(),
    due_date: new Date(now - 12 * day).toISOString(),
    clients: { name: "Électricité Dubois", email: "pdubois@elecdubois.ca", phone: "+14185558765" },
  },
  {
    id: "demo-7", amount: 980, amount_recovered: 980, status: "recovered",
    invoice_number: "F-2024-033", created_at: new Date(now - 8 * day).toISOString(),
    due_date: new Date(now - 14 * day).toISOString(),
    clients: { name: "Toiture Lapointe", email: "info@toiturelapointe.ca", phone: "+14185552345" },
  },
  {
    id: "demo-8", amount: 3800, amount_recovered: null, status: "in_progress",
    invoice_number: "F-2024-035", created_at: new Date(now - 4 * day).toISOString(),
    due_date: new Date(now - 7 * day).toISOString(),
    clients: { name: "Paysagement Fortin", email: "luc@fortinpaysage.ca", phone: "+15145556789" },
  },
  {
    id: "demo-9", amount: 2200, amount_recovered: 2200, status: "recovered",
    invoice_number: "F-2024-037", created_at: new Date(now - 9 * day).toISOString(),
    due_date: new Date(now - 16 * day).toISOString(),
    clients: { name: "Menuiserie St-Laurent", email: "commandes@menustl.ca", phone: "+14185551122" },
  },
  {
    id: "demo-10", amount: 1600, amount_recovered: null, status: "pending",
    invoice_number: "F-2024-039", created_at: new Date(now - 1 * day).toISOString(),
    due_date: new Date(now - 2 * day).toISOString(),
    clients: { name: "Nettoyage Prestige Qc", email: "info@nettoyageprestige.ca", phone: "+14185559988" },
  },
];

export const demoReminders: Record<string, any[]> = {
  "demo-1": [
    { id: "r1", channel: "sms", message_content: "Bonjour M. Gagnon, c'est Lyss, adjointe chez votre fournisseur...", status: "delivered", sent_at: new Date(now - 5 * day).toISOString(), created_at: new Date(now - 5 * day).toISOString(), delivery_status: "delivered", sms_response: "Merci, je règle ça aujourd'hui!", sms_response_at: new Date(now - 4 * day).toISOString() },
    { id: "r2", channel: "email", message_content: "Objet: Suivi de courtoisie — Facture F-2024-018\n\nBonjour...", status: "sent", sent_at: new Date(now - 7 * day).toISOString(), created_at: new Date(now - 7 * day).toISOString(), delivery_status: "delivered" },
  ],
  "demo-2": [
    { id: "r3", channel: "sms", message_content: "Bonjour Marc, c'est Lyss de Plomberie Lévis...", status: "sent", sent_at: new Date(now - 2 * day).toISOString(), created_at: new Date(now - 2 * day).toISOString(), delivery_status: "delivered" },
  ],
  "demo-3": [
    { id: "r4", channel: "sms", message_content: "Bonjour Jean, un p'tit suivi pour la facture F-2024-025...", status: "sent", sent_at: new Date(now - 1 * day).toISOString(), created_at: new Date(now - 1 * day).toISOString(), delivery_status: "queued" },
    { id: "r5", channel: "email", message_content: "Objet: Suivi — Facture F-2024-025\n\nBonjour M. Tremblay...", status: "sent", sent_at: new Date(now - 2 * day).toISOString(), created_at: new Date(now - 2 * day).toISOString(), delivery_status: "delivered" },
  ],
  "demo-6": [
    { id: "r6", channel: "sms", message_content: "Bonjour Pierre, c'est Lyss pour un suivi de la facture F-2024-031...", status: "delivered", sent_at: new Date(now - 8 * day).toISOString(), created_at: new Date(now - 8 * day).toISOString(), delivery_status: "delivered", sms_response: "Parfait, le virement est fait!", sms_response_at: new Date(now - 7 * day).toISOString() },
  ],
  "demo-8": [
    { id: "r7", channel: "sms", message_content: "Bonjour Luc, juste un rappel amical pour la facture F-2024-035...", status: "sent", sent_at: new Date(now - 2 * day).toISOString(), created_at: new Date(now - 2 * day).toISOString(), delivery_status: "delivered" },
    { id: "r8", channel: "email", message_content: "Objet: Suivi — Facture F-2024-035\n\nBonjour M. Fortin...", status: "sent", sent_at: new Date(now - 3 * day).toISOString(), created_at: new Date(now - 3 * day).toISOString(), delivery_status: "delivered" },
  ],
  "demo-10": [
    { id: "r9", channel: "sms", message_content: "Bonjour, c'est Lyss. Petit suivi pour la facture F-2024-039...", status: "sent", sent_at: new Date(now - 0.5 * day).toISOString(), created_at: new Date(now - 0.5 * day).toISOString(), delivery_status: "delivered" },
  ],
};

export const demoCallLogs: CallLog[] = [
  {
    id: "c1", invoice_id: "demo-2", status: "completed",
    call_result: "payment_promised", client_sentiment: "positive",
    duration_seconds: 142, summary: "Le client s'est engagé à payer d'ici vendredi via Interac.",
    created_at: new Date(now - 1 * day).toISOString(), ended_at: new Date(now - 1 * day + 142000).toISOString(),
    vapi_call_id: null,
  },
  {
    id: "c2", invoice_id: "demo-5", status: "completed",
    call_result: "refused", client_sentiment: "negative",
    duration_seconds: 87, summary: "Le client conteste la qualité du service rendu.",
    created_at: new Date(now - 3 * day).toISOString(), ended_at: new Date(now - 3 * day + 87000).toISOString(),
    vapi_call_id: null,
  },
  {
    id: "c3", invoice_id: "demo-3", status: "completed",
    call_result: "callback_requested", client_sentiment: "neutral",
    duration_seconds: 63, summary: "Demande de rappel la semaine prochaine.",
    created_at: new Date(now - 2 * day).toISOString(), ended_at: new Date(now - 2 * day + 63000).toISOString(),
    vapi_call_id: null,
  },
  {
    id: "c4", invoice_id: "demo-8", status: "completed",
    call_result: "payment_promised", client_sentiment: "positive",
    duration_seconds: 198, summary: "Le client enverra un chèque d'ici lundi prochain. Très cordial.",
    created_at: new Date(now - 1.5 * day).toISOString(), ended_at: new Date(now - 1.5 * day + 198000).toISOString(),
    vapi_call_id: null,
  },
  {
    id: "c5", invoice_id: "demo-6", status: "completed",
    call_result: "payment_promised", client_sentiment: "positive",
    duration_seconds: 95, summary: "Paiement confirmé via virement Interac dans les 24h.",
    created_at: new Date(now - 7 * day).toISOString(), ended_at: new Date(now - 7 * day + 95000).toISOString(),
    vapi_call_id: null,
  },
];

export const demoFeedItems: FeedItem[] = [
  { id: "f1", icon: "payment", text: "💰 Paiement Interac de 750 $ reçu — Café Le Torréfié", time: "Aujourd'hui 11:04", isNew: true },
  { id: "f2", icon: "sms", text: "SMS de suivi envoyé à Nettoyage Prestige Qc", time: "Aujourd'hui 10:32", isNew: true },
  { id: "f3", icon: "phone", text: "Appel à Paysagement Fortin — Paiement promis ✓", time: "Aujourd'hui 09:15", isNew: true },
  { id: "f4", icon: "phone", text: "Appel à Plomberie Lévis — Paiement promis ✓", time: "Hier 14:15", isNew: false },
  { id: "f5", icon: "payment", text: "💰 Paiement de 3 200 $ confirmé — Transport Beauce Inc.", time: "17 mars", isNew: false },
  { id: "f6", icon: "email", text: "Courriel de suivi envoyé à Construction Tremblay", time: "16 mars", isNew: false },
  { id: "f7", icon: "alert", text: "⚠️ Garage Pelletier a répondu négativement — intervention suggérée", time: "15 mars", isNew: true },
  { id: "f8", icon: "sms", text: "SMS de suivi envoyé à Plomberie Lévis", time: "15 mars", isNew: false },
  { id: "f9", icon: "payment", text: "💰 Paiement Interac de 1 250 $ reçu — Électricité Dubois", time: "14 mars", isNew: false },
  { id: "f10", icon: "phone", text: "Appel à Construction Tremblay — Rappel demandé", time: "14 mars", isNew: false },
  { id: "f11", icon: "sms", text: "SMS de suivi envoyé à Transport Beauce Inc.", time: "13 mars", isNew: false },
  { id: "f12", icon: "payment", text: "💰 Paiement de 980 $ confirmé — Toiture Lapointe", time: "12 mars", isNew: false },
];

export const demoPriorityItems: PriorityItem[] = [
  { id: "demo-5", type: "negative", clientName: "Garage Pelletier", detail: "Réponse négative — intervention humaine suggérée", date: "15 mars" },
  { id: "demo-2", type: "promise", clientName: "Plomberie Lévis", detail: "A promis de payer 1 850 $ d'ici vendredi", date: "Hier" },
  { id: "demo-8", type: "promise", clientName: "Paysagement Fortin", detail: "Chèque de 3 800 $ promis pour lundi", date: "Aujourd'hui" },
  { id: "demo-1", type: "response", clientName: "Transport Beauce Inc.", detail: "« Merci, je règle ça aujourd'hui! »", date: "16 mars" },
  { id: "demo-3", type: "promise", clientName: "Construction Tremblay", detail: "Rappel demandé pour la semaine prochaine", date: "14 mars" },
  { id: "demo-10", type: "response", clientName: "Nettoyage Prestige Qc", detail: "SMS reçu — en attente de confirmation", date: "Aujourd'hui" },
];

export const demoQuotes = [
  {
    id: "q-demo-1", amount: 5800, status: "sent", quote_number: "S-2024-003",
    sent_at: new Date(now - 6 * day).toISOString(), created_at: new Date(now - 7 * day).toISOString(),
    clients: { name: "Électricité Dubois" },
  },
  {
    id: "q-demo-2", amount: 2400, status: "sent", quote_number: "S-2024-005",
    sent_at: new Date(now - 4 * day).toISOString(), created_at: new Date(now - 5 * day).toISOString(),
    clients: { name: "Paysagement Fortin" },
  },
];
