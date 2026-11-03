import { router } from 'expo-router';
import { Text } from 'react-native';

import { Badge, Card, H2, P, Row } from '@/components/ui';
import { cicloName, fmtDate } from '@/lib/labels';
import { colors } from '@/lib/theme';
import type { Offer } from '@/lib/types';

export function OfferCard({ offer, extra }: { offer: Offer; extra?: React.ReactNode }) {
  return (
    <Card onPress={() => router.push({ pathname: '/oferta/[id]', params: { id: offer.id } })}>
      <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600' }}>
        {offer.companies?.name ?? 'Tu empresa'}
        {offer.city || offer.companies?.city ? ` · ${offer.city || offer.companies?.city}` : ''}
      </Text>
      <H2>{offer.title}</H2>
      <P muted>{cicloName(offer.ciclo)}</P>
      <Row>
        <Badge label={offer.modality} tone={offer.modality === 'Dual' ? 'accent' : 'silver'} />
        <Badge label={`${offer.hours} h`} tone="silver" />
        <Badge label={`${offer.vacancies} plaza${offer.vacancies > 1 ? 's' : ''}`} tone="silver" />
        {offer.stipend > 0 ? <Badge label={`${offer.stipend} €/mes`} tone="info" /> : null}
        {offer.start_date ? <Badge label={`Inicio ${fmtDate(offer.start_date)}`} tone="silver" /> : null}
        {!offer.is_open ? <Badge label="Cerrada" tone="bad" /> : null}
      </Row>
      {extra}
    </Card>
  );
}
