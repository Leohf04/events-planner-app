import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { PdfData, generarFacturaPdfBase64 } from '../utils/pdfGenerator';

const getFileName = (codigoFactura: string): string => {
  return `Factura_${codigoFactura}.pdf`;
};

export const guardarPdf = async (data: PdfData): Promise<string> => {
  const base64 = await generarFacturaPdfBase64(data);

  const fileName = getFileName(data.factura.codigoFactura);
  const fileUri = (documentDirectory || '') + fileName;

  await writeAsStringAsync(fileUri, base64, {
    encoding: EncodingType.Base64,
  });

  return fileUri;
};

export const compartirPdf = async (data: PdfData): Promise<void> => {
  const uri = await guardarPdf(data);

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) {
    throw new Error('La función de compartir no está disponible');
  }

  await Promise.race([
    Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Compartir Factura',
    }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('La operación tomó demasiado tiempo')), 15000)
    ),
  ]);
};