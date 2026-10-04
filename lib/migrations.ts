import { supabase } from './supabase';

export async function importarDadosClientes() {
  try {
    console.log('Buscando dados para importação...');
    const response = await fetch('/dados_clientes.json');
    const clientes = await response.json();

    console.log(`Importando ${clientes.length} clientes...`);

    // Dividir em chunks para não sobrecarregar
    const chunkSize = 10;
    for (let i = 0; i < clientes.length; i += chunkSize) {
      const chunk = clientes.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('carteira_clientes_v2')
        .upsert(chunk, { onConflict: 'cpf_cnpj' });

      if (error) {
        console.error(`Erro ao importar chunk ${i / chunkSize}:`, error);
        return { error };
      }
      console.log(`✅ Importados ${Math.min(i + chunkSize, clientes.length)}/${clientes.length}`);
    }

    console.log('✅ Importação concluída!');
    return { success: true, count: clientes.length };
  } catch (error) {
    console.error('Erro na importação:', error);
    return { error };
  }
}
