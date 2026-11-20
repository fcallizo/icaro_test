
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 300;

type ImageResource = {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
};

type VideoResource = {
  secure_url: string;
};

type SearchResponse<T> = {
  resources?: T[];
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
    const headers = {
      Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    };
    const searchUrl = `https://api.cloudinary.com/v1_1/${cloud}/resources/search`;
    const [response, trailerResponse] = await Promise.all([
      fetch(searchUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          expression: `resource_type:image AND type:upload AND asset_folder="${folder}"`,
          max_results: 500,
        }),
        next: { revalidate: 300 },
      }),
      fetch(searchUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          expression: `resource_type:video AND type:upload AND asset_folder="${folder}/Video" AND tags=trailer`,
          max_results: 1,
        }),
        next: { revalidate: 300 },
      }).catch((error: unknown) => {
        console.error("Could not check Cloudinary trailer:", error);
        return null;
      }),
    ]);

    if (!response.ok) {
      const details = await response.text();
      console.error("Cloudinary search error:", response.status, details);

      return NextResponse.json(
        { error: "No se pudieron consultar las fotografías de Cloudinary." },
        { status: 502 }
      );
    }

    const data = (await response.json()) as SearchResponse<ImageResource>;

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

    let trailer: string | null = null;
    let trailerError: string | null = null;

    if (!trailerResponse) {
      trailerError = "No se pudo comprobar si este proyecto tiene tráiler.";
    } else if (!trailerResponse.ok) {
      console.error(
        "Cloudinary trailer search error:",
        trailerResponse.status,
        await trailerResponse.text()
      );
      trailerError = "No se pudo comprobar si este proyecto tiene tráiler.";
    } else {
      try {
        const trailerData = (await trailerResponse.json()) as SearchResponse<
          VideoResource
        >;
        trailer = trailerData.resources?.[0]?.secure_url ?? null;
      } catch (error) {
        console.error("Could not parse Cloudinary trailer search:", error);
        trailerError = "No se pudo comprobar si este proyecto tiene tráiler.";
      }
    }

    return NextResponse.json(
      { photos, trailer, trailerError },
      {
        headers: {
          "Cache-Control":
            trailerError
              ? "no-store"
              : "public, s-maxage=300, stale-while-revalidate=600",
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
