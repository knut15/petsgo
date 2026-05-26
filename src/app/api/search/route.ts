import { NextResponse } from 'next/server';
import {
  searchByArea,
  searchByLocation,
  searchByKeyword,
} from '@/lib/api';
import { PAGE_SIZE } from '@/lib/constants';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const category = searchParams.get('category') || undefined;
  const numOfRows = Number(searchParams.get('numOfRows')) || PAGE_SIZE;

  try {
    if (type === 'area') {
      const area = searchParams.get('area');
      if (!area) return NextResponse.json({ error: 'area required' }, { status: 400 });
      const result = await searchByArea({
        areaCode: area,
        contentTypeId: category,
        numOfRows,
        pageNo: page,
      });
      return NextResponse.json(result);
    }

    if (type === 'location') {
      const mapX = searchParams.get('mapX');
      const mapY = searchParams.get('mapY');
      if (!mapX || !mapY) {
        return NextResponse.json({ error: 'mapX/mapY required' }, { status: 400 });
      }
      const result = await searchByLocation({
        mapX,
        mapY,
        radius: searchParams.get('radius') || '5000',
        contentTypeId: category,
        numOfRows,
        pageNo: page,
      });
      return NextResponse.json({
        ...result,
        items: result.items.map((item) => ({
          ...item,
          distance: item.dist ? Number(item.dist) : undefined,
        })),
      });
    }

    if (type === 'keyword') {
      const q = searchParams.get('q');
      if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 });
      const result = await searchByKeyword({
        keyword: q,
        contentTypeId: category,
        numOfRows,
        pageNo: page,
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'invalid type' }, { status: 400 });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'search failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
