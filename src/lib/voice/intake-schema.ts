import { z } from "zod";

const short = z.string().max(500);
const long = z.string().max(20_000);
const stringList = z.union([z.array(z.string().max(500)).max(20), z.string().max(10_000)]);
const upToThree = z.union([z.array(z.string().max(500)).max(3), z.string().max(2_000)]).superRefine((value, ctx) => {
  const count = Array.isArray(value) ? value.filter((item) => item.trim()).length : value.split(",").filter((item) => item.trim()).length;
  if (count > 3) ctx.addIssue({ code: "custom", message: "Use no more than three destinations." });
});
const optionalUrl = z.union([z.literal(""), z.string().url().max(2_000)]).optional();
const hours = Object.fromEntries(
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].flatMap((day) => [
    [`${day}_open`, short.optional()], [`${day}_close`, short.optional()], [`${day}_closed`, z.boolean().optional()],
  ]),
);

const schemas: Record<number, z.ZodType> = {
  1: z.object({
    routing_mode: z.enum(["new_number_only", "forward_after_hours", "forward_no_answer", "forward_all"]).default("forward_no_answer"),
    existing_number: short.optional(),
    carrier: z.enum(["Telus", "Bell", "Rogers", "Shaw", "Fido", "Koodo", "Virgin", "RingCentral", "Other", "Not sure"]).default("Not sure"),
    rings_before_forward: z.coerce.number().int().min(1).max(10).default(4),
  }).passthrough(),
  2: z.object({
    ...hours,
    coverage: z.enum(["24_7", "after_hours_only", "overflow_only", "overflow_and_after_hours"]).default("overflow_and_after_hours"),
    holidays: z.boolean().default(true), seasonal_note: long.optional(), has_emergencies: z.boolean().default(false), emergency_definition: long.optional(),
    prefilled_from_website: z.boolean().optional(),
  }).passthrough(),
  3: z.object({
    primary_job: z.enum(["message", "message_book", "faq_message", "faq_book"]).default("message"),
    calendar_type: z.enum(["none", "Google", "Outlook", "Jobber", "Housecall Pro", "Calendly"]).optional(), appointment_length: short.optional(), buffer: short.optional(), book_out_days: short.optional(), bookable_services: stringList.optional(), assign_to: short.optional(),
    qualifying_questions: stringList.optional(),
    transfer_rules: z.enum(["never", "emergencies_only", "if_caller_asks", "always_try_first"]).default("never"),
    transfer_targets: z.array(z.object({ number: short, hours: short.optional() })).max(3).optional(),
    never_quote: z.boolean().default(true), never_arrival_promise: z.boolean().default(true), never_legal_insurance: z.boolean().default(true), never_competitors: z.boolean().optional(), never_do_other: long.optional(),
  }).passthrough().superRefine((data, ctx) => {
    const count = Array.isArray(data.qualifying_questions) ? data.qualifying_questions.filter(Boolean).length : (data.qualifying_questions || "").split("\n").filter((x) => x.trim()).length;
    if (count > 5) ctx.addIssue({ code: "custom", path: ["qualifying_questions"], message: "Use no more than five qualifying questions." });
  }),
  4: z.object({
    business_overview: long.optional(), voice_memo_id: short.optional(), services: stringList.optional(), services_not_offered: long.optional(), service_area: stringList.optional(), travel_limit: short.optional(),
    pricing_policy: z.enum(["never_quote", "starting_at_range", "free_estimate"]).default("never_quote"), pricing_wording: short.optional(), payment_methods: stringList.optional(), financing_offered: z.boolean().optional(),
    licence: short.optional(), insurance: short.optional(), wcb: short.optional(), warranty: short.optional(), faqs: long.optional(), voicemail_greeting_upload: short.optional(), prefilled_from_website: z.boolean().optional(),
  }).passthrough(),
  5: z.object({
    sms_to: upToThree.optional(), email_to: upToThree.optional(), delivery: z.enum(["immediate", "daily_digest", "both"]).default("immediate"), crm_webhook: optionalUrl,
    fallback_number: short.optional(), account_owner: short.optional(),
  }).passthrough(),
  6: z.object({
    agent_name: short.default("Alex"), voice_id: z.enum(["warm_clear", "calm_professional", "bright_friendly", "steady_confident"]).default("warm_clear"), greeting: long.optional(),
    name_pronunciation: short.optional(), pronunciation_memo_id: short.optional(), tone: z.coerce.number().min(0).max(100).default(50), recording_notice: z.boolean().default(true), ai_disclosure_acknowledged: z.boolean().default(false),
  }).passthrough(),
};

export function parseVoiceStep(step: number, value: unknown) {
  const schema = schemas[step as keyof typeof schemas];
  if (!schema) return { success: false as const, error: "Invalid step" };
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message || "Invalid step data", issues: parsed.error.issues };
  return { success: true as const, data: parsed.data as Record<string, unknown> };
}

export function hasLeadDestination(data: Record<string, unknown>) {
  const nonEmpty = (value: unknown) => Array.isArray(value) ? value.some((item) => String(item).trim()) : String(value || "").split(",").some((item) => item.trim());
  return nonEmpty(data.sms_to) || nonEmpty(data.email_to);
}
