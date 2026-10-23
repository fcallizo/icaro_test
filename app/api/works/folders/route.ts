
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 300;

type CloudinaryFolder = {
  name: string;
  path: string;
};

type CloudinaryFoldersResponse = {
  folders?: CloudinaryFolder[];
  error?: { message?: string };
};

type CloudinarySearchResponse = {
  resources?: {
    public_id: string;
    secure_url: string;
  }[];
};

export async function GET(request: NextRequest) {
  const kind = request.nextUrl.searchParams.get('kind');

  const configuredFolder =
    kind === 'cinema'
      ? process.env.CLOUDINARY_CINEMA_FOLDER || 'Proyectos'
      : kind === 'wedding'
        ? process.env.CLOUDINARY_WEDDING_FOLDER || 'Bodas'
        : null;

  if (!configuredFolder) {
    return NextResponse.json(
      { error: 'Tipo de galería no válido.' },
      { status: 400 }
    );
  }

  const root = configuredFolder.replace(/^\/+|\/+$/g, '');

  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud || !key || !secret) {
    return NextResponse.json(
      { error: 'Falta configurar Cloudinary en el servidor.' },
      { status: 503 }
    );
  }

  const headers = {
    Authorization: `Basic ${Buffer.from(
      `${key}:${secret}`
    ).toString('base64')}`,
    'Content-Type': 'application/json',
  };

  // Busca una imagen que cumpla la expresión indicada.
  async function searchImage(
    expression: string
  ): Promise<string | null> {
    const searchUrl = new URL(
      `https://api.cloudinary.com/v1_1/${cloud}/resources/search`
    );

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        expression,
        max_results: 1,
      }),
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(
        'Cloudinary cover search error:',
        response.status,
        await response.text()
      );
      return null;
    }

    const data =
      (await response.json()) as CloudinarySearchResponse;

    return data.resources?.[0]?.secure_url ?? null;
  }

  try {
    const folderPath = root
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    const foldersUrl = new URL(
      `https://api.cloudinary.com/v1_1/${cloud}/folders/${folderPath}`
    );

    const response = await fetch(foldersUrl, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(
        'Cloudinary folders API error:',
        response.status,
        await response.text()
      );

      return NextResponse.json(
        { error: 'No se pudieron consultar las carpetas de Cloudinary.' },
        { status: 502 }
      );
    }

    const data =
      (await response.json()) as CloudinaryFoldersResponse;

    const folders = await Promise.all(
      (data.folders ?? []).map(async (folder) => {
        let cover: string | null = null;

        const baseExpression =
          `resource_type:image AND type:upload AND asset_folder="${folder.path}"`;

        try {
          // 1. Prioridad: imagen con la etiqueta "Portada".
          cover = await searchImage(
            `${baseExpression} AND tags=Portada`
          );

          // 2. Si no existe, utiliza la primera imagen disponible.
          if (!cover) {
            cover = await searchImage(baseExpression);
          }
        } catch (error) {
          console.error(
            `Could not load cover for ${folder.path}:`,
            error
          );
        }

        return {
          id: folder.path,
          name: folder.name,
          cover,
        };
      })
    );

    folders.sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { numeric: true })
    );

    return NextResponse.json(
      { folders },
      {
        headers: {
          'Cache-Control':
            'public, s-maxage=300, stale-while-revalidate=600',
        },
      }
    );
  } catch (error) {
    console.error('Could not load Cloudinary folders:', error);

    return NextResponse.json(
      { error: 'No se pudieron cargar las carpetas.' },
      { status: 500 }
    );
  }
}
