import { NextResponse } from 'next/server';
import {
  getDetailCommon,
  getDetailPetTour,
  getDetailImages,
  getDetailIntro,
} from '@/lib/api';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [common, pet, imageList] = await Promise.all([
      getDetailCommon(id),
      getDetailPetTour(id),
      getDetailImages(id),
    ]);

    if (!common) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }

    const intro = await getDetailIntro(id, common.contenttypeid).catch(() => null);

    return NextResponse.json({ common, pet, imageList, intro });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'detail failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
