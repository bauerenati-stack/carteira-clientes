import { NextResponse } from 'next/server';
import clientesNovos from '@/public/clientes_novos.json';
import alertas from '@/public/alertas_clientes.json';
import calendario from '@/public/calendario_comissoes.json';
import analise from '@/public/analise_corrigida.json';
import projecao from '@/public/projecao_outubro.json';

export async function GET() {
  return NextResponse.json({
    clientes: clientesNovos,
    alertas,
    calendario,
    analise,
    projecao,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
