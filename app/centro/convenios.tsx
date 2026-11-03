import { useState } from 'react';
import { Share } from 'react-native';

import { ConveniosList, useAgreements } from '@/components/ConveniosList';
import { Button, Card, H2, P } from '@/components/ui';
import { buildQbidCsv } from '@/lib/qbid';

function QbidExport() {
  const { data } = useAgreements();
  const [busy, setBusy] = useState(false);
  const ready = (data ?? []).filter((g) => g.student_signed_at && !g.qbid_exported_at);

  async function exportCsv() {
    setBusy(true);
    try {
      await Share.share({ title: 'Convenios para qBID', message: buildQbidCsv(ready) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <H2>Pasar a qBID</H2>
      <P muted>
        {ready.length
          ? `${ready.length} convenio(s) firmados listos. Exporta los datos y regístralos en qBID. Luego marca cada uno con su referencia.`
          : 'No hay convenios firmados pendientes de qBID.'}
      </P>
      {ready.length ? <Button title="Exportar datos (CSV)" onPress={exportCsv} loading={busy} /> : null}
    </Card>
  );
}

export default function ConveniosCentro() {
  return <ConveniosList role="centro" header={<QbidExport />} />;
}
