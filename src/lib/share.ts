import { normalize, strokePath, verdict, type Stroke } from "./scoring";

export async function resultImage(
  country: { name: string; path: string },
  strokes: Stroke[],
  score: number,
): Promise<Blob> {
  const { title } = verdict(score, !strokes.length);
  const escape = (text: string) =>
    text.replace(
      /[&<>"']/g,
      (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&apos;",
        })[char]!,
    );
  const drawing = normalize(strokes)
    .map((s) => `<path d="${strokePath(s)}"/>`)
    .join("");
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900"><rect width="1200" height="900" fill="#f6f7fb"/><text x="70" y="96" font-family="Arial,sans-serif" font-weight="bold" font-size="36" fill="#6346ed">borderline.</text><text x="70" y="175" font-family="Arial,sans-serif" font-weight="bold" font-size="52" fill="#20202b">I drew ${escape(country.name)}.</text><rect x="65" y="226" width="520" height="380" rx="25" fill="white"/><rect x="615" y="226" width="520" height="380" rx="25" fill="white"/><g transform="translate(65 237) scale(.86)" fill="none" stroke="#6346ed" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${drawing}</g><g transform="translate(615 237) scale(.86)"><path d="${country.path}" fill="#ede8ff" stroke="#6346ed" stroke-width="3"/></g><g font-family="Arial,sans-serif" font-size="21" fill="#737380"><text x="90" y="650">MY VERSION</text><text x="640" y="650">THE REALITY CHECK</text></g><text x="70" y="737" font-family="Arial,sans-serif" font-weight="bold" font-size="48" fill="#20202b">${escape(title)}</text><text x="70" y="790" font-family="Arial,sans-serif" font-size="26" fill="#6346ed">${score}% shape match · Your turn?</text><text x="70" y="852" font-family="Arial,sans-serif" font-size="20" fill="#737380">Borderline · Simplified outlines from Natural Earth</text></svg>`;
  const url = URL.createObjectURL(
    new Blob([markup], { type: "image/svg+xml" }),
  );
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 900;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image export unavailable");
    context.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Image export failed")),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
