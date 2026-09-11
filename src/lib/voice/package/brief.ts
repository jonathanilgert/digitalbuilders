import { assertNoTemplateTokens } from "./safety";
import type { VoicePackageInput } from "./types";

const JOBS: Record<string, string> = {
  message: "Takes a message and asks relevant qualifying questions",
  message_book: "Takes a message and attempts appointment booking",
  faq_message: "Answers supported FAQs and takes a message",
  faq_book: "Answers supported FAQs and attempts appointment booking",
};

function clean(value: string | undefined): string {
  return value?.trim() || "";
}

function list(values: string[] | undefined): string[] {
  return (values ?? []).map(clean).filter(Boolean);
}

export function generateAgentBriefMarkdown(input: VoicePackageInput): string {
  const business = clean(input.businessName);
  if (!business) throw new Error("businessName is required to generate an agent brief.");
  const agent = clean(input.agentName) || "Alex";
  const lines = [
    `# ${business} — Voice Agent Brief`,
    "",
    `**Agent:** ${agent}  `,
    `**Coverage:** ${(input.coverage ?? "overflow_and_after_hours").replaceAll("_", " ")}  `,
    `**Call routing:** ${(input.routingMode ?? "forward_no_answer").replaceAll("_", " ")}`,
    "",
    "## What it will do",
    "",
    `- ${JOBS[input.primaryJob ?? "message"]}`,
  ];

  const services = list(input.services);
  if (services.length) lines.push(`- Discuss supported services: ${services.join(", ")}`);
  const questions = list(input.qualifyingQuestions).slice(0, 5);
  if (questions.length) lines.push(`- Qualify callers with up to ${questions.length} approved questions`);
  if (input.recordingNotice !== false) lines.push("- Tell callers the call may be recorded");
  lines.push("- Disclose that it is an AI assistant whenever asked");

  lines.push("", "## What it will not do", "");
  const boundaries = list(input.neverDo);
  if (boundaries.length) boundaries.forEach((item) => lines.push(`- ${item}`));
  else {
    lines.push("- Quote prices");
    lines.push("- Promise a specific arrival date or time");
    lines.push("- Answer warranty, legal, or insurance-coverage questions");
  }
  const exclusions = list(input.servicesNotOffered);
  if (exclusions.length) lines.push(`- Offer excluded services: ${exclusions.join(", ")}`);
  lines.push("- Guess when the supplied business knowledge does not contain an answer");

  lines.push("", "## Human transfer", "");
  lines.push(`- Rule: ${(input.transferRule ?? (input.hasEmergencies ? "emergencies_only" : "never")).replaceAll("_", " ")}`);
  for (const target of (input.transferTargets ?? []).filter((item) => clean(item.number)).slice(0, 3)) {
    lines.push(`- ${clean(target.name) || "Team member"}: ${clean(target.number)}${clean(target.availability) ? ` (${clean(target.availability)})` : ""}`);
  }
  if (input.hasEmergencies && clean(input.emergencyDefinition)) lines.push(`- Emergency means: ${clean(input.emergencyDefinition)}`);

  lines.push("", "## Lead delivery", "");
  const sms = list(input.smsTo);
  const email = list(input.emailTo);
  if (sms.length) lines.push(`- SMS: ${sms.join(", ")}`);
  if (email.length) lines.push(`- Email: ${email.join(", ")}`);
  lines.push(`- Delivery: ${(input.delivery ?? "immediate").replaceAll("_", " ")}`);
  if (clean(input.crmWebhook)) lines.push(`- CRM webhook: ${clean(input.crmWebhook)}`);
  if (clean(input.fallbackNumber)) lines.push(`- Failure fallback: ${clean(input.fallbackNumber)}`);
  if (clean(input.accountOwner)) lines.push(`- Account owner: ${clean(input.accountOwner)}`);

  const markdown = `${lines.join("\n").trim()}\n`;
  assertNoTemplateTokens(markdown, "agent brief Markdown");
  return markdown;
}
