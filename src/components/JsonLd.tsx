type JsonValue =
  | Record<string, unknown>
  | Record<string, unknown>[]
  | { "@context": string; "@graph": Record<string, unknown>[] };

export function JsonLd({ data }: { data: JsonValue }) {
  return (
    <script
      type="application/ld+json"
      style={{ pointerEvents: "none" }}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
