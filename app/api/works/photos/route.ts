
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300;

type Resource = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
};

type SearchResponse = {
  resources?: Resource[];
};

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get("kind");
  const folder = request.nextUrl.searchParams.get("folder");

  const configuredFolder =
    kind === "cinema"
      ? process.env.CLOUDINARY_CINEMA_FOLDER || "Proyectos"
      : kind === "wedding"
        ? process.env.CLOUDINARY_WEDDING_FOLDER || "Bodas"
        : null;

  if (!configuredFolder || !folder) {
    return NextResponse.json(
      { error: "Galería o carpeta no válida." },
      { status: 400 }
    );
  }

  const normalized = configuredFolder.replace(/^\/+|\/+$/g, "");

  const possibleRoots = [
    normalized,
    `Inicio/${normalized}`,
  ];

  const folderPath = folder.replace(/^\/+|\/+$/g, "");

  if (
    folderPath.includes('"') ||
    folderPath.includes("\\") ||
    folderPath.split("/").some((part) => !part || part === "." || part === "..")
  ) {
    return NextResponse.json(
      { error: "La carpeta solicitada no es válida." },
      { status: 400 }
    );
  }

  const root = possibleRoots.find(
    (candidate) => folderPath.startsWith(`${candidate}/`)
  );

  if (!root) {
    console.error("Carpeta recibida:", folderPath);
    console.error("Raíces permitidas:", possibleRoots);

    return NextResponse.json(
      { error: "La carpeta no pertenece a esta galería." },
      { status: 400 }
    );
  }

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !key || !secret) {
    return NextResponse.json(
      { error: "Falta configurar Cloudinary en el servidor." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloud}/resources/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${key}:${secret}`
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expression: `resource_type:image AND type:upload AND asset_folder="${folder}"`,
          max_results: 500,
        }),
        next: { revalidate: 300 },
      }
    );

    if (!response.ok) {
      const details = await response.text();
      console.error("Cloudinary search error:", response.status, details);

      return NextResponse.json(
        { error: "No se pudieron consultar las fotografías de Cloudinary." },
        { status: 502 }
      );
    }

    const data = (await response.json()) as SearchResponse;

    const photos = (data.resources ?? [])
      .sort((a, b) =>
        a.public_id.localeCompare(b.public_id, "es", {
          numeric: true,
        })
      )
      .map((photo) => ({
        id: photo.public_id,
        src: photo.secure_url,
        width: photo.width,
        height: photo.height,
      }));

    return NextResponse.json(
      { photos },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Could not load Cloudinary photos:", error);

    return NextResponse.json(
      { error: "No se pudieron cargar las fotografías." },
      { status: 500 }
    );
  }
}
