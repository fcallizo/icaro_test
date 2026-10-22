
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

  const folder = configuredFolder.replace(/^\/+|\/+$/g, '');
  const root = folder;

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

  try {
    const folderPath = root
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    const url = new URL(
      `https://api.cloudinary.com/v1_1/${cloud}/folders/${folderPath}`
    );

    const response = await fetch(url, {
      headers,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      const details = await response.text();

      console.error(
        'Cloudinary folders API error:',
        response.status,
        details
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

        try {
          const searchUrl = new URL(
            `https://api.cloudinary.com/v1_1/${cloud}/resources/search`
          );

          searchUrl.searchParams.set(
            'expression',
            `resource_type:image AND type:upload AND asset_folder="${folder.path}"`
          );
          searchUrl.searchParams.set('max_results', '1');

          const searchResponse = await fetch(searchUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              expression: `resource_type:image AND type:upload AND asset_folder="${folder.path}"`,
              max_results: 1,
            }),
            next: { revalidate: 300 },
          });

          if (searchResponse.ok) {
            const searchData =
              (await searchResponse.json()) as CloudinarySearchResponse;

            cover = searchData.resources?.[0]?.secure_url ?? null;
          } else {
            console.error(
              'Cloudinary cover search error:',
              searchResponse.status,
              await searchResponse.text()
            );
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
