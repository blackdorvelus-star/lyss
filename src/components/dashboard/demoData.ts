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
    id: "demo-4", amount: 750, amount_recovered: null, status: "pending",
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
];

export const demoFeedItems: FeedItem[] = [
  { id: "f1", icon: "sms", text: "SMS de suivi envoyé à Construction Tremblay", time: "Aujourd'hui 10:32", isNew: true },
  { id: "f2", icon: "phone", text: "Appel à Plomberie Lévis — Paiement promis ✓", time: "Hier 14:15", isNew: false },
  { id: "f3", icon: "payment", text: "Paiement de 3 200 $ confirmé — Transport Beauce Inc.", time: "17 mars", isNew: false },
  { id: "f4", icon: "email", text: "Courriel de suivi envoyé à Construction Tremblay", time: "16 mars", isNew: false },
  { id: "f5", icon: "alert", text: "⚠️ Garage Pelletier a répondu négativement — intervention suggérée", time: "15 mars", isNew: true },
  { id: "f6", icon: "sms", text: "SMS de suivi envoyé à Plomberie Lévis", time: "15 mars", isNew: false },
  { id: "f7", icon: "phone", text: "Appel à Construction Tremblay — Rappel demandé", time: "14 mars", isNew: false },
  { id: "f8", icon: "sms", text: "SMS de suivi envoyé à Transport Beauce Inc.", time: "13 mars", isNew: false },
];

export const demoPriorityItems: PriorityItem[] = [
  { id: "demo-2", type: "promise", clientName: "Plomberie Lévis", detail: "A promis de payer 1 850 $", date: "Hier" },
  { id: "demo-5", type: "negative", clientName: "Garage Pelletier", detail: "Réponse négative — intervention suggérée", date: "15 mars" },
  { id: "demo-1", type: "response", clientName: "Transport Beauce Inc.", detail: "« Merci, je règle ça aujourd'hui! »", date: "16 mars" },
  { id: "demo-3", type: "promise", clientName: "Construction Tremblay", detail: "Rappel demandé pour la semaine prochaine", date: "14 mars" },
];

export const demoQuotes = [
  {
    id: "q-demo-1", amount: 5800, status: "sent", quote_number: "S-2024-003",
    sent_at: new Date(now - 6 * day).toISOString(), created_at: new Date(now - 7 * day).toISOString(),
    clients: { name: "Électricité Dubois" },
  },
];
