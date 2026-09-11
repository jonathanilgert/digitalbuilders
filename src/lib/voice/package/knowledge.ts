import { assertNoTemplateTokens } from "./safety";
import type { VoicePackageInput } from "./types";

function clean(value: string | undefined): string {
  return value?.trim() || "";
}

function values(items: string[] | undefined): string[] {
  return (items ?? []).map(clean).filter(Boolean);
}

function section(title: string, lines: string[]): string {
  return lines.length ? `\n## ${title}\n\n${lines.join("\n")}\n` : "";
}

export function generateKnowledgeMarkdown(input: VoicePackageInput): string {
  const business = clean(input.businessName);
  if (!business) throw new Error("businessName is required to generate knowledge.");
  const services = values(input.services);
  const exclusions = values(input.servicesNotOffered);
  const areas = values(input.serviceAreas);
  const credentials = values(input.credentials);
  const payment = values(input.paymentMethods);
  const faqs = (input.faqs ?? []).filter((faq) => clean(faq.question) && clean(faq.answer));
  const hours = (input.hours ?? []).filter((entry) => clean(entry.day));

  let markdown = `# ${business} — Agent Knowledge\n`;
  if (clean(input.businessOverview)) markdown += `\n${clean(input.businessOverview)}\n`;
  markdown += section("Services", services.map((item) => `- ${item}`));
  markdown += section("Services not offered", exclusions.map((item) => `- ${item}`));

  const areaLines = areas.map((item) => `- ${item}`);
  if (clean(input.travelLimit)) areaLines.push(`- Travel limit: ${clean(input.travelLimit)}`);
  markdown += section("Service area", areaLines);

  const pricingLines: string[] = [];
  switch (input.pricingPolicy ?? "never_quote") {
    case "never_quote":
      pricingLines.push("Do not quote prices. Collect the caller's details so the team can provide a quote.");
      break;
    case "starting_at_range":
      if (clean(input.pricingWording)) pricingLines.push(clean(input.pricingWording));
      else pricingLines.push("Do not invent a price; ask the team to confirm the applicable starting price or range.");
      break;
    case "free_estimate":
      pricingLines.push(clean(input.pricingWording) || "Estimates are free; collect the details needed for the team to follow up.");
      break;
  }
  markdown += section("Pricing policy", pricingLines);

  const paymentLines = payment.map((item) => `- ${item}`);
  if (clean(input.financingOffered)) paymentLines.push(`- Financing: ${clean(input.financingOffered)}`);
  markdown += section("Payment", paymentLines);
  markdown += section("Credentials", credentials.map((item) => `- ${item}`));

  markdown += section(
    "Hours",
    hours.map((entry) =>
      entry.closed
        ? `- ${clean(entry.day)}: Closed`
        : `- ${clean(entry.day)}: ${clean(entry.open)}${clean(entry.close) ? `–${clean(entry.close)}` : ""}`,
    ),
  );
  if (clean(input.seasonalNote)) markdown += section("Seasonal note", [clean(input.seasonalNote)]);
  if (input.hasEmergencies && clean(input.emergencyDefinition)) {
    markdown += section("Emergency definition", [clean(input.emergencyDefinition)]);
  }
  markdown += section(
    "Frequently asked questions",
    faqs.flatMap((faq) => [`### ${clean(faq.question)}`, clean(faq.answer), ""]),
  );

  markdown = `${markdown.trim()}\n`;
  assertNoTemplateTokens(markdown, "knowledge Markdown");
  return markdown;
}
