import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import {
  getDetailCommon,
  getDetailPetTour,
  getDetailImages,
  getDetailIntro,
} from '@/lib/api';
import { placeQueryKey } from '@/lib/queries';
import PlaceDetailView from './PlaceDetailView';

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const queryClient = new QueryClient();

  try {
    const [common, pet, imageList] = await Promise.all([
      getDetailCommon(id),
      getDetailPetTour(id),
      getDetailImages(id),
    ]);
    if (!common) notFound();
    const intro = await getDetailIntro(id, common.contenttypeid).catch(() => null);
    queryClient.setQueryData(placeQueryKey(id), { common, pet, imageList, intro });
  } catch {
    // Client will retry via useQuery
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlaceDetailView id={id} />
    </HydrationBoundary>
  );
}
