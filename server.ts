import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Inicialización de la API de Gemini (en el servidor de forma segura)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Endpoint: Convertidor Inteligente de Facturas e Imágenes de Inventario con Gemini
app.post('/api/gemini/convert-invoice', async (req: Request, res: Response) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', profitMargin = 30 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere la imagen en base64 para procesar' });
    }

    // Limpiar prefijo data:image/... si viene incluido
    const cleanBase64 = imageBase64.replace(/^data:[a-zA-Z0-9/+-]+;base64,/, '');

    const systemInstruction = `Eres un convertidor experto de facturas o imágenes de inventario; facturas o recibos, los cuales vas a desglosar en código JSON.
El código JSON SOLO va a extraer:
1. El código o SKU de cada producto (si no está explícito, genera uno corto y claro como PROD-01).
2. Nombre del producto.
3. Especificaciones o para qué sirve o qué es (detalles, variantes, peso o uso).
4. Precio que indique la factura para la fila o ítem.
5. Las unidades que vengan en la factura. En tal caso que venga por cajas o bultos, SEPARAR por unidades dentro de la caja (ejemplo: si la factura dice 'caja de 12 unidades', vas a poner 12 unidades en vez de 1 caja).
6. Precio unitario de costo real por cada unidad individual (si la factura da el precio de la caja, calcula el costo por cada unidad).
7. Precio sugerido de venta (calculado con un margen comercial aproximado del ${profitMargin}% sobre el costo unitario).
8. Categoría sugerida del producto (ej: Alimentos, Electrónica, Moda, Hogar, etc.).

IGNORA completamente datos fiscales de la empresa (RUC, NIT, dirección, teléfono), datos del cliente, totales generales, IVA y subtotales. Extrae ÚNICAMENTE los productos reales comprados o inventariados.`;

    // Modelos en orden de menor latencia y menor demanda a mayor capacidad
    const CANDIDATE_MODELS = [
      'gemini-3.1-flash-lite',
      'gemini-flash-latest',
      'gemini-3.8-flash'
    ];

    let lastError: any = null;
    let products: any[] = [];
    let successfulModel = '';

    for (const model of CANDIDATE_MODELS) {
      try {
        console.log(`Intentando conversión con modelo: ${model}...`);
        const response = await ai.models.generateContent({
          model: model,
          contents: [
            {
              inlineData: {
                mimeType: mimeType,
                data: cleanBase64
              }
            },
            {
              text: 'Analiza esta factura o imagen de inventario y extrae la lista completa de productos desglosados en unidades individuales según las instrucciones.'
            }
          ],
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              description: 'Lista de productos individuales extraídos de la factura o comprobante',
              items: {
                type: Type.OBJECT,
                properties: {
                  sku: {
                    type: Type.STRING,
                    description: 'Código o SKU del producto'
                  },
                  name: {
                    type: Type.STRING,
                    description: 'Nombre claro del producto'
                  },
                  specifications: {
                    type: Type.STRING,
                    description: 'Especificaciones o para qué sirve o qué es'
                  },
                  units: {
                    type: Type.INTEGER,
                    description: 'Unidades que vengan en la factura (si viene en cajas, total de unidades dentro de la caja)'
                  },
                  invoicePrice: {
                    type: Type.NUMBER,
                    description: 'Precio total indicado en la factura para esta línea'
                  },
                  unitPrice: {
                    type: Type.NUMBER,
                    description: 'Precio unitario de costo de cada unidad'
                  },
                  suggestedSalePrice: {
                    type: Type.NUMBER,
                    description: 'Precio sugerido de venta al público'
                  },
                  category: {
                    type: Type.STRING,
                    description: 'Categoría sugerida'
                  }
                },
                required: ['sku', 'name', 'units', 'unitPrice']
              }
            }
          }
        });

        const rawText = (response.text || '[]').trim();
        // Limpiar posibles bloques markdown ```json ... ``` si el modelo los incluye
        const cleanedJson = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
        
        try {
          products = JSON.parse(cleanedJson);
          if (Array.isArray(products)) {
            successfulModel = model;
            break; // Éxito, salir del bucle de modelos
          }
        } catch (jsonErr) {
          console.warn(`Error al parsear JSON con ${model}:`, jsonErr);
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Error con modelo ${model} (${err?.status || err?.message}), probando siguiente modelo de respaldo...`);
        // Pequeña pausa de 400ms antes del siguiente intento si fue 503 o 429
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    if (products.length === 0 && lastError) {
      throw lastError;
    }

    return res.json({ success: true, products, modelUsed: successfulModel });
  } catch (error: any) {
    console.error('Error procesando factura con Gemini:', error);
    const isHighDemand = error?.status === 503 || error?.message?.includes('high demand') || error?.message?.includes('503');
    return res.status(isHighDemand ? 503 : 500).json({
      error: isHighDemand
        ? 'Los servidores de Gemini están experimentando alta demanda momentánea. Por favor intenta de nuevo en unos segundos.'
        : error?.message || 'Error al procesar la factura con Gemini AI'
    });
  }
});

// En desarrollo montamos el middleware de Vite; en producción servimos dist
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'spa'
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AdminLocalSimple server listening on http://0.0.0.0:${PORT}`);
});
