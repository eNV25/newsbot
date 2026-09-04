import { rehype } from "npm:rehype";
import rehypeSanitize, { defaultSchema } from "npm:rehype-sanitize";

const customRequired = { ...defaultSchema.required };
delete customRequired.input;
const customSchema = {
  ...defaultSchema,
  tagNames: [
    "a",
    "b",
    "strong",
    "i",
    "em",
    "s",
    "strike",
    "del",
    "u",
    "ins",
    "span",
    "tg-spoiler",
    "pre",
    "code",
    "details",
    "summary",
    "br",
    "hr",
    "wbr",
    "ul",
    "ol",
    "li",
    "div",
    "p",
    "q",
    "blockquote",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "noscript",
    "cite",
    "var",
    "progress",
    "meter",
    "kbd",
    "samp",
    "img",
    "tt",
    "input",
    "footer",
    "header",
    "main",
    "nav",
    "section",
    "html",
    "body",
    "output",
    "data",
    "time",
  ],
  attributes: {
    ...defaultSchema.attributes,
    input: ["type", "value", "name", "checked", "disabled", "placeholder"],
    progress: ["value", "max"],
    meter: ["value", "min", "max", "low", "high", "optimum"],
    details: ["open"],
    time: ["datetime"],
    data: ["value"],
    blockquote: [
      ...(defaultSchema.attributes.blockquote || []),
      "expandable",
    ],
    ol: [...(defaultSchema.attributes.ol || []), "reversed", "type"],
    span: [...(defaultSchema.attributes.span || []), "className"],
    pre: [...(defaultSchema.attributes.pre || []), "className"],
  },
  required: customRequired,
  strip: ["head", "link", "meta", "script", "style", "template", "title"],
};

try {
  const input = await new Response(Deno.stdin.readable).text();
  const output = await rehype()
    .use(rehypeSanitize, customSchema)
    .process(input);
  console.log(output.toString());
} catch (error) {
  console.error("Failed to process HTML:", error);
  Deno.exit(1);
}
