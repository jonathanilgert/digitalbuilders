import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function printable(text: string): string {
  return text
    .replace(/[—–]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "");
}

function plainMarkdownLine(line: string): { text: string; heading: boolean } {
  const heading = /^#{1,3}\s/.test(line);
  return {
    heading,
    text: printable(line)
      .replace(/^#{1,3}\s+/, "")
      .replace(/\*\*/g, "")
      .replace(/`/g, "")
      .replace(/  $/, ""),
  };
}

function wrap(text: string, max: number): string[] {
  if (!text) return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= max) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Render concise Markdown as a deterministic, phone-readable, single-page PDF. */
export async function markdownToOnePagePdf(markdown: string, documentTitle: string): Promise<Buffer> {
  const document = await PDFDocument.create();
  document.setTitle(documentTitle);
  document.setProducer("Digital Builders voice package generator");
  const stableDate = new Date("2000-01-01T00:00:00.000Z");
  document.setCreationDate(stableDate);
  document.setModificationDate(stableDate);
  const page = document.addPage([612, 792]);
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const margin = 42;
  const maxWidth = page.getWidth() - margin * 2;
  const source = markdown.split("\n").map(plainMarkdownLine);

  let fontSize = 10;
  let laidOut: Array<{ text: string; heading: boolean }> = [];
  while (fontSize >= 7) {
    const chars = Math.max(35, Math.floor(maxWidth / (fontSize * 0.52)));
    laidOut = source.flatMap((line) => wrap(line.text, chars).map((text) => ({ text, heading: line.heading })));
    const lineHeight = fontSize * 1.32;
    if (laidOut.length * lineHeight <= page.getHeight() - margin * 2) break;
    fontSize -= 0.5;
  }
  const lineHeight = fontSize * 1.32;
  if (laidOut.length * lineHeight > page.getHeight() - margin * 2) {
    throw new Error(`${documentTitle} does not fit on one PDF page.`);
  }

  let y = page.getHeight() - margin;
  for (const line of laidOut) {
    if (line.text) {
      page.drawText(line.text, {
        x: margin,
        y,
        size: line.heading ? fontSize + 1 : fontSize,
        font: line.heading ? bold : regular,
        color: line.heading ? rgb(0.08, 0.12, 0.16) : rgb(0.16, 0.2, 0.24),
        maxWidth,
      });
    }
    y -= lineHeight;
  }
  return Buffer.from(await document.save({ useObjectStreams: false }));
}
