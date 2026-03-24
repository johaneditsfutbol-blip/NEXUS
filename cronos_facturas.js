require('dotenv').config();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser'); // <-- AÑADE ESTA LÍNEA
const { createClient } = require('@supabase/supabase-js'); // El cañón de Supabase

(async () => {
    console.log("🚀 [CRONOS] Iniciando secuencia de infiltración...");

    // 1. Levantamos el navegador en modo "Headful" (visible) para ver qué hace
    // args: maximiza la ventana para evitar que elementos del menú se oculten por responsividad
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: null,
        args: ['--start-maximized'] 
    });

    const page = await browser.newPage();

    // 2. BRECHA DE ENTRADA: Login
    console.log("🔐 [CRONOS] Abriendo bóveda principal...");
    await page.goto('https://administrativo.icarosoft.com/Login/', { waitUntil: 'networkidle2' });

    // Escribimos credenciales simulando un humano
    await page.waitForSelector('#id_sc_field_login');
    await page.type('#id_sc_field_login', 'JOHANC', { delay: 50 });
    await page.type('#id_sc_field_pswd', '@VNjohanc16', { delay: 50 });
    
    // Disparamos el login y ESPERAMOS que la red se calme (Evita Race Condition)
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        page.keyboard.press('Enter')
    ]);

    console.log("✅ [CRONOS] Acceso concedido. Evaluando el perímetro (Pausa táctica de 5 segundos)...");
    
    // 🛑 FRICCIÓN HUMANA PESADA: 5 segundos enteros viendo la pantalla de inicio
    await new Promise(r => setTimeout(r, 5000)); 

    // 3. NAVEGACIÓN: Abrir menú Administrativo
    console.log("🖱️ [CRONOS] Moviendo la vista hacia el menú 'Administrativo'...");
    await page.waitForFunction(() => {
        const spans = Array.from(document.querySelectorAll('span.label'));
        return spans.some(span => span.textContent.trim() === 'Administrativo');
    });

    await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span.label'));
        const btnAdmin = spans.find(span => span.textContent.trim() === 'Administrativo');
        if (btnAdmin) btnAdmin.click();
    });

    console.log("👀 [CRONOS] Menú desplegado. Leyendo opciones tranquilamente (3 segundos)...");
    await new Promise(r => setTimeout(r, 3000)); 

    // 4. NAVEGACIÓN: Clic en Listado de facturas
    console.log("⚡ [CRONOS] Seleccionando 'Listado de facturas'...");
    const selectorFacturas = 'a[tab-title="Listado de facturas"]';
    await page.waitForSelector(selectorFacturas);
    await page.evaluate((selector) => {
        document.querySelector(selector).click();
    }, selectorFacturas);

    console.log("⏳ [CRONOS] Abriendo pestaña. Dándole tiempo al motor viejo (8 segundos completos)...");
    await new Promise(r => setTimeout(r, 8000)); 

    // 5. EL OBJETIVO DIRECTO: Iframe de Facturas (item_304)
    console.log("📡 [CRONOS] Apuntando mira láser al Iframe 'item_304'...");
    const frameCorrecto = page.frames().find(f => f.name() === 'item_304');

    if (!frameCorrecto) {
        console.log("❌ [ERROR CRÍTICO] El Iframe 'item_304' no apareció. El sistema está colapsado.");
        return; 
    }

    // 6. ATAQUE DIRECTO: Filtro Quirúrgico Manual (Lotes pequeños)
    console.log("⏱️ [CRONOS] Ajustando coordenadas temporales (Operación Lotes Pequeños)...");
    await frameCorrecto.waitForSelector('#SC_fecha_emision_dia', { visible: true, timeout: 20000 });
    
    // ⚠️ COMANDANTE: CAMBIA ESTAS FECHAS PARA CADA EXTRACCIÓN MANUAL
    const filtro = {
        diaDesde: '15', mesDesde: '03', anoDesde: '2026',
        diaHasta: '23', mesHasta: '03', anoHasta: '2026'
    };

    console.log(`🎯 [CRONOS] Rango objetivo: ${filtro.diaDesde}/${filtro.mesDesde}/${filtro.anoDesde} al ${filtro.diaHasta}/${filtro.mesHasta}/${filtro.anoHasta}`);

    // Inyectamos las fechas exactas en la Matrix y disparamos
    await frameCorrecto.evaluate((f) => {
        // Rellenamos "Desde"
        document.getElementById('SC_fecha_emision_dia').value = f.diaDesde;
        document.getElementById('SC_fecha_emision_mes').value = f.mesDesde;
        document.getElementById('SC_fecha_emision_ano').value = f.anoDesde;
        
        // Rellenamos "Hasta"
        document.getElementById('SC_fecha_emision_input_2_dia').value = f.diaHasta;
        document.getElementById('SC_fecha_emision_input_2_mes').value = f.mesHasta;
        document.getElementById('SC_fecha_emision_input_2_ano').value = f.anoHasta;
        
        // Disparamos la búsqueda
        document.getElementById('sc_b_pesq_bot').click();
    }, filtro);

    console.log("⏳ [CRONOS] Búsqueda en proceso. Icaro no debería colapsar con este pequeño lote (8 segundos)...");
    await new Promise(r => setTimeout(r, 8000));
    
    console.log("🎯 [CRONOS] Tabla de facturas lista para la extracción.");

    console.log("📂 [CRONOS] Configurando bóveda de intercepción de descargas...");
    
    // ---------------- SUTURA DE EMERGENCIA ----------------
    const downloadPath = path.resolve(__dirname, 'botin_xml');
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
    }

    // Hackeamos el protocolo del navegador para desviar la descarga a nuestra bóveda
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });
    // ------------------------------------------------------

    console.log("⚙️ [CRONOS] Abriendo menú de Exportación...");
    await frameCorrecto.waitForSelector('#sc_btgp_btn_group_1_top', { visible: true });
    await frameCorrecto.click('#sc_btgp_btn_group_1_top');

    // 🛑 FRICCIÓN HUMANA: 1 segundo para que despliegue el submenú
    await new Promise(r => setTimeout(r, 1000));

    console.log("🎯 [CRONOS] Aplicando la regla KISS. Clic directo al XML...");
    
    // Clic en "XML"
    await frameCorrecto.evaluate(() => {
        const enlaces = Array.from(document.querySelectorAll('a'));
        const btnXML = enlaces.find(el => {
            const texto = el.textContent || el.innerText || "";
            return texto.trim().toUpperCase() === 'XML';
        });
        
        if (btnXML) {
            btnXML.click();
        } else {
            console.log("❌ No encontré el botón XML en el DOM.");
        }
    });

    console.log("⏳ [CRONOS] Esperando que se abra la ventana de confirmación...");
    // 🛑 FRICCIÓN HUMANA: Icaro suele tardar en abrir estas ventanas
    await new Promise(r => setTimeout(r, 3000));


    // 5. RADAR ACTIVO: Buscamos dónde rayos abrió Icaro el botón de "Aceptar"
    let frameExportacion = null;
    for (const frame of page.frames()) {
        try {
            const btnAceptar = await frame.$('#bok');
            if (btnAceptar) {
                frameExportacion = frame;
                break;
            }
        } catch (e) {}
    }

    if (!frameExportacion) {
        console.log("❌ [ERROR] No se encontró la ventana con el botón Aceptar.");
        return;
    }

    console.log("🖱️ [CRONOS] Confirmando exportación (Clic en Aceptar)...");
    
    // Inyectamos el clic directo. Usamos catch por si Icaro destruye el Iframe instantáneamente
    await frameExportacion.evaluate(() => {
        document.getElementById('bok').click();
    }).catch(() => {}); 

    console.log("⏱️ [CRONOS] Icarosoft procesando miles de registros. Vigilando barra de progreso...");

    // 6. EL RADAR DINÁMICO REFORZADO (Detector de ilusiones)
    let btnDescargarFrame = null;
    let intentos = 0;
    
    // Le damos hasta 3 minutos (120 intentos de 1.5s) porque 3000 registros pesan
    while (!btnDescargarFrame && intentos < 120) {
        await new Promise(r => setTimeout(r, 1500));
        
        for (const f of page.frames()) {
            try {
                const estaListo = await f.evaluate(() => {
                    const btn = document.getElementById('idBtnDown');
                    // 1. Si el botón no existe o está oculto, no está listo
                    if (!btn || btn.offsetParent === null) return false;
                    
                    // 2. Verificamos si Icaro le puso una etiqueta de "deshabilitado"
                    const cssClasses = btn.className.toLowerCase();
                    if (cssClasses.includes('disabled')) return false;

                    // 3. Verificamos si visualmente está grisáceo (opacidad baja) o intocable
                    const styles = window.getComputedStyle(btn);
                    if (styles.pointerEvents === 'none' || styles.opacity < 1) return false;

                    // 4. PRUEBA DE FUEGO: Leemos todo el texto de la ventanita
                    const textoVentana = document.body.innerText;
                    // Si la pantalla sigue diciendo "Procesando" y NO dice "100%", lo frenamos
                    if (textoVentana.includes('Procesando') && !textoVentana.includes('100%')) {
                        return false;
                    }

                    return true; // Si sobrevivió a todas las validaciones, el botón es real y está cargado.
                });
                
                if (estaListo) {
                    btnDescargarFrame = f;
                    break;
                }
            } catch (e) {
                // Ignoramos frames muertos
            }
        }
        
        if (!btnDescargarFrame) {
            // Imprimimos un reporte táctico cada 5 intentos para que sepas que sigue vigilando
            if (intentos % 5 === 0) {
                console.log(`⏳ [CRONOS] Escaneando progreso pacientemente... (Intento ${intentos}/120)`);
            }
        }
        
        intentos++;
    }

    if (!btnDescargarFrame) {
        console.log("❌ [ERROR] La barra de progreso nunca terminó (Timeout de 3 minutos).");
        return;
    }

    console.log("✅ [CRONOS] ¡Progreso al 100%! Preparando protocolo de intercepción antibloqueo...");
    
    // 7. LA EXTRACCIÓN INTELIGENTE (Bucle de reintentos)
    let archivoDescargado = false;
    let intentosDescarga = 0;

    // Limpiamos la bóveda ANTES de descargar para no confundirnos con archivos viejos
    const archivosViejos = fs.readdirSync(downloadPath);
    for (const file of archivosViejos) {
        fs.unlinkSync(path.join(downloadPath, file));
    }

    // Le damos 3 intentos para robar el archivo si Icaro se cuelga
    while (!archivoDescargado && intentosDescarga < 3) {
        intentosDescarga++;
        console.log(`📥 [CRONOS] Disparando clic de descarga (Intento ${intentosDescarga}/3)...`);

        // Disparamos al botón
        await btnDescargarFrame.evaluate(() => {
            document.getElementById('idBtnDown').click();
        });

        // Radar de la bóveda: Escaneamos la carpeta local por 15 segundos
        let tiempoEspera = 0;
        while (tiempoEspera < 15) {
            await new Promise(r => setTimeout(r, 1000));
            tiempoEspera++;

            const archivosAhora = fs.readdirSync(downloadPath);
            // Buscamos un archivo que termine en .xml (y que no sea un .crdownload de descarga a medias)
            const xmlListo = archivosAhora.find(f => f.endsWith('.xml') && !f.endsWith('.crdownload'));

            if (xmlListo) {
                archivoDescargado = true;
                console.log(`🏆 [CRONOS] ¡Botín asegurado en ${tiempoEspera} segundos! El archivo está en la bóveda.`);
                break;
            }
        }

        // Si pasaron 15 segundos y la carpeta sigue vacía, actuamos como humanos
        if (!archivoDescargado) {
            console.log("⚠️ [CRONOS] Icarosoft se quedó colgado. Ejecutando protocolo de limpieza de pestañas...");

            // Protocolo de limpieza total: Destruimos CUALQUIER pestaña que no sea la nuestra principal
            const todasLasPaginas = await browser.pages();
            for (const p of todasLasPaginas) {
                // Si la pestaña 'p' no es nuestra 'page' original, le volamos la cabeza
                if (p !== page) { 
                    console.log("🔪 [CRONOS] Detectada pestaña parásita de Icarosoft. Aniquilando...");
                    await p.close();
                }
            }
            
            console.log("♻️ [CRONOS] Pestaña destruida. Recargando arma para reintento...");
            await new Promise(r => setTimeout(r, 2000)); // Breve pausa para respirar antes de volver a hacer clic
        }
    }

    if (!archivoDescargado) {
        console.log("❌ [ERROR CRÍTICO] La descarga falló 3 veces seguidas. El servidor enemigo está caído. Misión abortada.");
        return;
    }

// ==========================================================
    // 🧬 FASE 2: EL TRADUCTOR FINANCIERO (XML a JSON)
    // ==========================================================
    console.log("⚙️ [CRONOS] Iniciando procesamiento de datos financieros...");

    const archivos = fs.readdirSync(downloadPath);
    const archivoXML = archivos.find(file => file.endsWith('.xml') && !file.endsWith('.crdownload'));
    
    if (!archivoXML) {
        console.log("❌ [ERROR CRÍTICO] No se encontró el botín XML en la bóveda.");
        return;
    }

    const rutaCompleta = path.join(downloadPath, archivoXML);
    const xmlData = fs.readFileSync(rutaCompleta, 'utf8');

    console.log(`📄 [CRONOS] Archivo '${archivoXML}' leído. Masticando XML...`);

    const parser = new XMLParser();
    const jsonObj = parser.parse(xmlData);

    // Extraemos la matriz (Si hay solo 1 factura, la librería no crea array, así que lo forzamos)
    let arrayCrudo = jsonObj.root.facturacion_ventas_resumen_grid;
    if (!Array.isArray(arrayCrudo)) {
        arrayCrudo = [arrayCrudo];
    }
    
    console.log(`🧹 [CRONOS] Limpiando anomalías de ${arrayCrudo.length} facturas...`);

    const facturasLimpias = arrayCrudo.map(f => {
        return {
            id_ventas: f.Id_Ventas ? f.Id_Ventas.toString().trim() : null, // Llave Primaria
            nro_notificacion: f.Nro_Notificacion,
            nro_fiscal: f.Nro_Fiscal || null,
            nro_control: f.Nro__Control || null, // Icaro y sus dobles guiones bajos
            f_emision: f.F__Emision,
            cod_cliente: f.Cod__Cliente,
            nombre: f.Nombre,
            descripcion: f.Descripcion,
            status: f.Status,
            // Limpiamos todos los espacios vacíos que Icaro deja en los montos
            exento: f.Exento ? f.Exento.toString().trim() : '0,00',
            base_imp: f.Base_Imp ? f.Base_Imp.toString().trim() : '0,00',
            iva: f.Iva ? f.Iva.toString().trim() : '0,00',
            sub_total: f.Sub_Total ? f.Sub_Total.toString().trim() : '0,00',
            total_factura: f.Total_Factura ? f.Total_Factura.toString().trim() : '0,00',
            saldo: f.Saldo ? f.Saldo.toString().trim() : '0,00',
            exento_bs: f.Exento_Bs ? f.Exento_Bs.toString().trim() : '0,00',
            base_imp_bs: f.Base_Imp_Bs ? f.Base_Imp_Bs.toString().trim() : '0,00',
            iva_bs: f.Iva_Bs ? f.Iva_Bs.toString().trim() : '0,00',
            total_fact_bsd: f.Total_Fact_Bsd ? f.Total_Fact_Bsd.toString().trim() : '0,00',
            pago: f.Pago,
            fact_aut: f.Fact__Aut_,
            razon_social: f.Razon_Social,
            rif_fiscal: f.Rif_Fiscal
        };
    });

    console.log(`🏆 [CRONOS] ¡TRADUCCIÓN COMPLETA! Array de ${facturasLimpias.length} facturas listo en memoria.`);

    // ==========================================================
    // 🚀 FASE 3: EL MISIL A SUPABASE (Inyección Financiera)
    // ==========================================================
    console.log("🔌 [CRONOS] Conectando con el Cuartel General (Supabase)...");
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.log("❌ [ERROR CRÍTICO] Cronos no tiene las llaves de Supabase.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🛰️ [CRONOS] ¡Fuego a discreción! Inyectando facturas en la bóveda de la nube...");

    const { data, error } = await supabase
        .from('facturas') 
        .upsert(facturasLimpias, { 
            onConflict: 'id_ventas' 
        });

    if (error) {
        console.error("❌ [ERROR CRÍTICO] La inyección falló. Reporte de daños:", error);
    } else {
        console.log("💥 [CRONOS] ¡IMPACTO CONFIRMADO! Lote de facturas guardado en Supabase con éxito.");
        
        // Limpiamos la evidencia local para dejar la bóveda lista para el siguiente lote
        fs.unlinkSync(rutaCompleta); 
        console.log("♻️ [CRONOS] Archivo XML local destruido. Bóveda limpia para la próxima extracción.");
    }

    console.log("🚪 [CRONOS] El fantasma se retira. Misión cumplida...");
    
    await browser.close(); 
})();