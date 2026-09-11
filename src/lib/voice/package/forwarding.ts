import { assertNoTemplateTokens } from "./safety";
import type { Carrier, ForwardingInstructions, RoutingMode, VoicePackageInput } from "./types";

const MOBILE_CODE_CARRIERS = new Set<Carrier>(["Telus", "Bell", "Rogers", "Fido", "Koodo", "Virgin"]);

function clean(value: string | undefined): string {
  return value?.trim() || "";
}

function digits(value: string): string {
  return value.replace(/[^\d+]/g, "");
}

function gsmCodes(mode: RoutingMode, target: string, rings: number) {
  if (mode === "forward_no_answer") {
    const seconds = Math.max(5, Math.min(30, Math.round(rings) * 5));
    return { activationCode: `*61*${target}**${seconds}#`, deactivationCode: "##61#" };
  }
  return { activationCode: `*21*${target}#`, deactivationCode: "##21#" };
}

export function generateForwardingInstructions(input: VoicePackageInput): ForwardingInstructions {
  const business = clean(input.businessName);
  if (!business) throw new Error("businessName is required to generate forwarding instructions.");
  const carrier = input.carrier ?? "Not sure";
  const mode = input.routingMode ?? "forward_no_answer";
  const number = digits(clean(input.provisionedNumber));
  const rings = Number.isFinite(input.ringsBeforeForward) ? Math.max(1, input.ringsBeforeForward ?? 4) : 4;
  const heading = `# ${business} — Call Forwarding Card\n\n**Do this only after you approve your agent's test call.**\n`;

  if (mode === "new_number_only") {
    const markdown = `${heading}\n## No forwarding needed\n\nUse your new agent number on your website, ads, and business listings. Your current phone line stays untouched.${number ? `\n\nAgent number: **${clean(input.provisionedNumber)}**` : ""}\n\nNeed a hand? Book a free five-minute setup call with Digital Builders.\n`;
    assertNoTemplateTokens(markdown, "forwarding instructions");
    return { markdown };
  }

  if (carrier === "Not sure") {
    const targetLine = number ? `Your agent number is **${clean(input.provisionedNumber)}**.` : "Call Digital Builders before enabling forwarding so we can confirm your agent number.";
    const common = number
      ? ["Telus", "Bell", "Rogers"].map((name) => {
          const codes = gsmCodes(mode, number, rings);
          return `- **${name} mobile:** dial \`${codes.activationCode}\`; turn it off with \`${codes.deactivationCode}\`.`;
        })
      : [];
    const markdown = `${heading}\n## Carrier not sure\n\n${targetLine}${common.length ? `\n\nCommon Alberta mobile-carrier codes:\n${common.join("\n")}` : ""}\n\nCarrier plans and landlines can differ. Call us and we'll identify the carrier and do this with you in five minutes.\n`;
    assertNoTemplateTokens(markdown, "forwarding instructions");
    return { markdown };
  }

  if (!number) {
    const markdown = `${heading}\n## ${carrier}\n\nYour routing choice is **${mode.replaceAll("_", " ")}**. Call Digital Builders before enabling forwarding so we can confirm the destination number and exact carrier steps.\n`;
    assertNoTemplateTokens(markdown, "forwarding instructions");
    return { markdown };
  }

  if (MOBILE_CODE_CARRIERS.has(carrier)) {
    const codes = gsmCodes(mode, number, rings);
    const explanation = mode === "forward_no_answer"
      ? `This sends unanswered calls to the agent after about ${Math.round(rings)} rings.`
      : mode === "forward_after_hours"
        ? "At closing time, dial the activation code. At opening time, dial the deactivation code. Standard mobile forwarding codes do not read your opening-hours schedule automatically."
        : "This sends all calls to the agent until you turn forwarding off.";
    const markdown = `${heading}\n## ${carrier} mobile\n\n${explanation}\n\n1. From the business phone, dial \`${codes.activationCode}\`.\n2. Place a test call from another phone.\n3. To turn forwarding off, dial \`${codes.deactivationCode}\`.\n\nAgent number: **${clean(input.provisionedNumber)}**\n\nIf the code is rejected, your line may use landline or business-account instructions. Call us and we'll do it together in five minutes.\n`;
    assertNoTemplateTokens(markdown, "forwarding instructions");
    return { markdown, ...codes };
  }

  const providerDirection = carrier === "RingCentral"
    ? "Open the RingCentral admin portal, select the business number, and set its call-handling/forwarding rule to the agent number."
    : carrier === "Shaw"
      ? "Use the Rogers/Shaw Business call-forwarding settings for your specific phone product, or contact business support."
      : "Ask your carrier to configure the selected forwarding rule to the agent number.";
  const markdown = `${heading}\n## ${carrier}\n\n${providerDirection}\n\nRouting choice: **${mode.replaceAll("_", " ")}**  \nAgent number: **${clean(input.provisionedNumber)}**\n\nCarrier products differ, so we do not guess a star code. Call us and we'll do it together in five minutes.\n`;
  assertNoTemplateTokens(markdown, "forwarding instructions");
  return { markdown };
}
