import { generateAgentBriefMarkdown } from "./brief";
import { generateForwardingInstructions } from "./forwarding";
import { generateKnowledgeMarkdown } from "./knowledge";
import { markdownToOnePagePdf } from "./pdf";
import { generateVapiAssistant } from "./prompt";
import { assertNoTemplateTokens } from "./safety";
import type { VoiceAgentPackage, VoicePackageInput } from "./types";

export * from "./brief";
export * from "./forwarding";
export * from "./knowledge";
export * from "./pdf";
export * from "./prompt";
export * from "./safety";
export type * from "./types";

/** Pure package assembly: no store, network, routes, notifications, or file I/O. */
export async function generateVoiceAgentPackage(input: VoicePackageInput): Promise<VoiceAgentPackage> {
  const assistant = generateVapiAssistant(input);
  const assistantJson = `${JSON.stringify(assistant, null, 2)}\n`;
  const knowledgeMarkdown = generateKnowledgeMarkdown(input);
  const forwarding = generateForwardingInstructions(input);
  const briefMarkdown = generateAgentBriefMarkdown(input);

  assertNoTemplateTokens(
    { assistantJson, knowledgeMarkdown, forwardingMarkdown: forwarding.markdown, briefMarkdown },
    "voice agent package",
  );

  const [forwardingPdf, briefPdf] = await Promise.all([
    markdownToOnePagePdf(forwarding.markdown, `${input.businessName} forwarding card`),
    markdownToOnePagePdf(briefMarkdown, `${input.businessName} agent brief`),
  ]);

  return {
    assistant,
    assistantJson,
    knowledgeMarkdown,
    forwardingMarkdown: forwarding.markdown,
    forwardingPdf,
    briefMarkdown,
    briefPdf,
  };
}
