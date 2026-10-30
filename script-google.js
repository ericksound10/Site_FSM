
const SPREADSHEET_ID = '1K7nQ_Vd4HHBNCd1uxTajMMHQZQ4R4gFZLA8jOlVan9Q';

// IDs das abas (gid) informados no seu código atual.
const ABA_BANNERS_ID = 0;
const ABA_NOTICIAS_ID = 385839452;

function doGet(e) {
  const tipo = String(e.parameter.tipo || '').toLowerCase();
  //const callback = String(e.parameter.callback || '');

  let resultado;

  try {
    if (tipo !== 'banners' && tipo !== 'noticias') {
      resultado = {
        sucesso: false,
        erro: 'Tipo inválido. Use banners ou noticias.'
      };
    } else {
      resultado = {
        sucesso: true,
        tipo: tipo,
        dados: obterDados(tipo)
      };
    }
  } catch (erro) {
    resultado = {
      sucesso: false,
      erro: 'Não foi possível consultar a planilha.'
    };

    console.error(erro);
  }

  // Retorna diretamente o JSON puro com cabeçalhos limpos
  return ContentService
    .createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

function obterDados(tipo) {
  const cache = CacheService.getScriptCache();
  const chave = 'dados_' + tipo;
  const guardado = cache.get(chave);

  if (guardado) {
    return JSON.parse(guardado);
  }

  const planilha = SpreadsheetApp.openById(SPREADSHEET_ID);
  const gid = tipo === 'banners' ? ABA_BANNERS_ID : ABA_NOTICIAS_ID;
  const aba = planilha.getSheets().find(sheet => sheet.getSheetId() === gid);

  if (!aba) {
    throw new Error('Aba não encontrada: ' + gid);
  }

  const valores = aba.getDataRange().getDisplayValues();
  if (valores.length < 2) {
    return [];
  }

  const linhas = valores.slice(1);
  const agoraTimestamp = new Date().getTime(); // Momento atual para comparação

  let dados = linhas
    .filter(linha => linha.some(celula => celula.trim() !== ''))
    .map(colunas => {
      if (tipo === 'banners') {
        return {
          data: colunas[0] || '',
          data_expiracao: colunas[1] || '',
          somente_imagem: String(colunas[2] || '').trim().toLowerCase(), // Normaliza para facilitar o teste no JS
          titulo: colunas[3] || '',
          subtitulo: colunas[4] || '',
          botaoTexto: colunas[5] || '',
          linkDestino: colunas[6] || '',
          imagemUrl: colunas[7] || ''
        };
      }

      return {
        data: colunas[0] || '',
        categoria: colunas[1] || '',
        titulo: colunas[2] || '',
        textoCompleto: colunas[3] || '',
        linkDestino: colunas[4] || '',
        imagemUrl: colunas[5] || ''
      };
    });

  if (tipo === 'banners') {

    // FILTRO DE EXPIRAÇÃO
    dados = dados.filter(item => {

      if (!item.data_expiracao) return true;

      const expiraTimestamp = converterData(item.data_expiracao);

      // Se a data for inválida, não remove o banner
      if (expiraTimestamp === 0) return true;

      // Considera o último segundo do dia de expiração
      const fimDoDia = new Date(expiraTimestamp);

      fimDoDia.setHours(23, 59, 59, 999);

      // Mantém o banner até o último milissegundo do dia
      return fimDoDia.getTime() >= agoraTimestamp;
    });

    // Ordena do mais recente para o mais antigo
    dados.sort((a, b) => converterData(b.data) - converterData(a.data));

    // Retorna somente os cinco banners válidos mais recentes
    dados = dados.slice(0, 5);
  }

  cache.put(chave, JSON.stringify(dados), 60);
  return dados;
}


// Converte datas brasileiras e datas ISO em timestamps.
function converterData(valor) {
  if (!valor) return 0;

  const texto = String(valor).trim();

  // Formato brasileiro: DD/MM/AAAA, com horário opcional.
  const br = texto.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );

  if (br) {
    const dia = Number(br[1]);
    const mes = Number(br[2]);
    const ano = Number(br[3]);
    const hora = Number(br[4] || 0);
    const minuto = Number(br[5] || 0);
    const segundo = Number(br[6] || 0);

    const data = new Date(
      ano, mes - 1, dia, hora, minuto, segundo
    );

    // Evita aceitar datas inválidas.
    if (
      data.getFullYear() !== ano ||
      data.getMonth() !== mes - 1 ||
      data.getDate() !== dia
    ) {
      return 0;
    }

    return data.getTime();
  }

  // Formato ISO: AAAA-MM-DD ou data ISO com horário.
  if (/^\d{4}-\d{2}-\d{2}(?:$|T|\s)/.test(texto)) {
    const timestamp = Date.parse(texto);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  // Datas vazias ou em formato não reconhecido ficam no final.
  return 0;
}