require('dotenv').config();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser'); // <-- AÑADE ESTA LÍNEA
const { createClient } = require('@supabase/supabase-js'); // El cañón de Supabase
const cron = require('node-cron'); // <-- EL RELOJ MAESTRO

// Variable de control para evitar que un asalto se solape con otro si Icaro está lento
let misionEnProgreso = false; 

async function asaltoBovedaServicios() {
    if (misionEnProgreso) {
        console.log("⚠️ [CRONOS-CRON] El asalto anterior aún no termina. Omitiendo este ciclo...");
        return;
    }
    misionEnProgreso = true;
    let browser = null;

    try {
        console.log("🚀 [CRONOS] Iniciando secuencia de infiltración...");

        // 1. Levantamos el navegador en modo "Headless" para RAILWAY (invisible y ligero)
        browser = await puppeteer.launch({ 
            headless: true, // ⚠️ CRÍTICO PARA RAILWAY: Debe ser true en la nube
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage', // Evita cuelgues de RAM
                '--start-maximized'
            ] 
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

    // 3. NAVEGACIÓN: Abrir menú de Servicios
    console.log("🖱️ [CRONOS] Moviendo la vista hacia el menú de 'Servicios'...");
    await page.waitForFunction(() => {
        const spans = Array.from(document.querySelectorAll('span.label'));
        return spans.some(span => span.textContent.trim() === 'Servicios');
    });

    await page.evaluate(() => {
        const spans = Array.from(document.querySelectorAll('span.label'));
        const btnServicios = spans.find(span => span.textContent.trim() === 'Servicios');
        if (btnServicios) btnServicios.click();
    });

    console.log("👀 [CRONOS] Menú desplegado. Leyendo opciones tranquilamente (3 segundos)...");
    
    // 🛑 FRICCIÓN HUMANA PESADA: 3 segundos leyendo el menú antes de disparar
    await new Promise(r => setTimeout(r, 3000)); 

    // 4. NAVEGACIÓN: Clic en Listado (Bypass Nativo)
    console.log("⚡ [CRONOS] Seleccionando 'Listado de Servicios de Internet'...");
    const selectorListado = 'a[tab-title="Listado de Servicios de Internet"]';
    await page.waitForSelector(selectorListado);
    await page.evaluate((selector) => {
        document.querySelector(selector).click();
    }, selectorListado);

    console.log("⏳ [CRONOS] Abriendo pestaña. Dándole tiempo al motor viejo (8 segundos completos)...");
    // 🛑 FRICCIÓN HUMANA AUMENTADA: 8 segundos de paciencia absoluta para que cargue la tabla
    await new Promise(r => setTimeout(r, 8000));

    console.log("📡 [CRONOS] Apuntando mira láser al Iframe 'item_501'...");

    // 5. EL OBJETIVO DIRECTO
    const frameCorrecto = page.frames().find(f => f.name() === 'item_501');

    if (!frameCorrecto) {
        console.log("❌ [ERROR CRÍTICO] El Iframe 'item_501' no apareció. El sistema está colapsado.");
        return; 
    }

    // 6. FILTROS: Abrir el menú de columnas usando el Frame correcto
    console.log("⚙️ [CRONOS] Desplegando menú de Filtros (Bypass de clic activado)...");
    await frameCorrecto.waitForSelector('#sc_btgp_btn_group_2_top', { visible: true, timeout: 20000 });
    
    // ⚡ BYPASS: Hacemos el clic inyectando código en lugar de mover el ratón físico
    await frameCorrecto.evaluate(() => {
        document.getElementById('sc_btgp_btn_group_2_top').click();
    });

    console.log("🖱️ [CRONOS] Buscando botón 'Campos'...");
    
    // 🛑 FRICCIÓN HUMANA: Esperamos 1.5 segundos para que la animación del menú baje
    await new Promise(r => setTimeout(r, 1500)); 

    await frameCorrecto.waitForSelector('#selcmp_top', { visible: true });
    
    // ⚡ BYPASS: Clic nativo al botón Campos
    await frameCorrecto.evaluate(() => {
        document.getElementById('selcmp_top').click();
    });

    console.log("🛑 [CRONOS] ¡Punto de control alcanzado! Bóveda de campos abierta.");

    console.log("🧬 [CRONOS] Inyectando código en la Matrix para ordenar los campos...");

    // 🛑 FRICCIÓN HUMANA: Esperamos 1 segundo viendo la ventana de campos
    await new Promise(r => setTimeout(r, 1000));

    // Teletransportación de elementos DOM
    await frameCorrecto.evaluate(() => {
        // Esta es tu lista sagrada. Los IDs exactos extraídos de tu reporte de inteligencia.
        const camposDeseados = [
            'sc_id_itemsel_s_id_servicio_cliente',
            'sc_id_itemsel_c_cod_cliente',
            'sc_id_itemsel_datos',
            'sc_id_itemsel_desc_prod',
            'sc_id_itemsel_s_estado',
            'sc_id_itemsel_s_saldo',
            'sc_id_itemsel_s_fecha_corte_actual',
            'sc_id_itemsel_s_serial_onu',
            'sc_id_itemsel_s_ip_servicio',
            'sc_id_itemsel_s_usuario_pppoe',
            'sc_id_itemsel_s_clave_pppoe',
            'sc_id_itemsel_nodo_ant',
            'sc_id_itemsel_s_sector',
            'sc_id_itemsel_s_nap',
            'sc_id_itemsel_s_puerto',
            'sc_id_itemsel_servicio_vip',
            'sc_id_itemsel_s_sucursal',
            'sc_id_itemsel_s_coordenadas',
            'sc_id_itemsel_s_direccion_servicio',
            'sc_id_itemsel_s_fecha_instalacion',
            'sc_id_itemsel_s_id_instalador'
        ];

        const listaIzquierda = document.getElementById('sc_id_fldsel_available');
        const listaDerecha = document.getElementById('sc_id_fldsel_selected');

        // 1. Limpieza: Devolvemos TODO a la lista izquierda
        Array.from(listaDerecha.children).forEach(item => {
            listaIzquierda.appendChild(item);
        });

        // 2. Ordenamiento Perfecto: Movemos solo los deseados a la derecha
        camposDeseados.forEach(id => {
            const item = document.getElementById(id);
            if (item) {
                listaDerecha.appendChild(item);
            }
        });
    });

    console.log("✅ [CRONOS] Campos ordenados a la perfección. Preparando confirmación...");
    
    // 🛑 FRICCIÓN HUMANA: 1 segundo para admirar el trabajo antes de aplicar
    await new Promise(r => setTimeout(r, 1000));

    // 7. APLICAR: Bypass del botón bloqueado. Invocamos la función nativa del sistema.
    console.log("⚡ [CRONOS] Bypass activado: Saltando el botón físico y enviando orden directa al servidor...");
    
    await frameCorrecto.evaluate(() => {
        // En lugar de hacer clic, le decimos al cerebro de Icarosoft que ejecute el guardado
        scSubmitSelCampos('top');
    });

    console.log("⏳ [CRONOS] Filtros guardados. Esperando que la tabla principal se recargue...");
    
    // Le damos 5 segundos a Icarosoft para que vuelva a cargar la tabla gigante con los filtros aplicados
    await new Promise(r => setTimeout(r, 5000));
    console.log("🎯 [CRONOS] Tabla lista para la extracción final.");

    console.log("📂 [CRONOS] Configurando bóveda de intercepción de descargas...");

    // 1. Creamos una carpeta llamada 'botin_xml' en tu proyecto si no existe
    const downloadPath = path.resolve(__dirname, 'botin_xml');
    if (!fs.existsSync(downloadPath)) {
        fs.mkdirSync(downloadPath);
    }

    // 2. Escudo Global: Hackeamos la página principal y cualquier pestaña zombie
    const client = await page.target().createCDPSession();
    await client.send('Page.setDownloadBehavior', {
        behavior: 'allow',
        downloadPath: downloadPath
    });

    browser.on('targetcreated', async (target) => {
        if (target.type() === 'page') {
            try {
                const newPage = await target.page();
                const newClient = await newPage.target().createCDPSession();
                await newClient.send('Page.setDownloadBehavior', {
                    behavior: 'allow',
                    downloadPath: downloadPath
                });
            } catch (e) {}
        }
    });

    console.log("⚙️ [CRONOS] Abriendo menú de Exportación...");
    
    // 3. Clic en el botón principal de Exportar
    await frameCorrecto.waitForSelector('#sc_btgp_btn_group_1_top', { visible: true });
    await frameCorrecto.click('#sc_btgp_btn_group_1_top');

    // 🛑 FRICCIÓN HUMANA: 1 segundo para que despliegue el submenú
    await new Promise(r => setTimeout(r, 1000));
    
    console.log("🎯 [CRONOS] Aplicando la regla KISS. Clic directo al XML...");
    
    // 4. Clic en "XML" (Igual que con Campos, sin complicaciones)
    await frameCorrecto.evaluate(() => {
        // Buscamos todos los enlaces de la página
        const enlaces = Array.from(document.querySelectorAll('a'));
        // Filtramos el que dice exactamente "XML"
        const btnXML = enlaces.find(el => {
            const texto = el.textContent || el.innerText || "";
            return texto.trim().toUpperCase() === 'XML';
        });
        
        // Un clic limpio, natural y sin inyecciones raras
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
    
    // 7. LA EXTRACCIÓN INTELIGENTE (Bucle de reintentos con Radar Extendido)
    let archivoDescargado = false;
    let intentosDescarga = 0;

    const archivosViejos = fs.readdirSync(downloadPath);
    for (const file of archivosViejos) fs.unlinkSync(path.join(downloadPath, file));

    while (!archivoDescargado && intentosDescarga < 3) {
        intentosDescarga++;
        console.log(`📥 [CRONOS] Disparando clic de descarga (Intento ${intentosDescarga}/3)...`);

        await btnDescargarFrame.evaluate(() => document.getElementById('idBtnDown').click());

        // Radar extendido a 60 segundos
        let tiempoEspera = 0;
        while (tiempoEspera < 60) {
            await new Promise(r => setTimeout(r, 1000));
            tiempoEspera++;

            const archivosAhora = fs.readdirSync(downloadPath);
            const xmlListo = archivosAhora.find(f => f.endsWith('.xml') && !f.endsWith('.crdownload'));

            if (xmlListo) {
                archivoDescargado = true;
                console.log(`🏆 [CRONOS] ¡Botín detectado en ${tiempoEspera} segundos!`);
                break;
            }
        }

        // 🔪 Aniquilador Quirúrgico (solo mata about:blank, respeta las descargas activas)
        console.log("🔪 [CRONOS] Escaneando URL de pestañas parásitas...");
        const paginas = await browser.pages();
        for (const p of paginas) {
            const url = p.url();
            if (p !== page && (url === 'about:blank' || url === '')) { 
                console.log("💀 Aniquilando pestaña zombie...");
                await p.close().catch(() => {});
            }
        }

        if (!archivoDescargado) {
            console.log("⚠️ [CRONOS] El servidor se rindió. Recargando para reintento...");
            await new Promise(r => setTimeout(r, 3000)); 
        }
    }

    // 🛡️ PROTOCOLO LÁZARO (Guardia Pasiva 3 min)
    if (!archivoDescargado) {
        console.log("📡 [CRONOS] Los asaltos físicos fallaron. Iniciando 'Protocolo Lázaro' (Guardia Pasiva)...");
        let tiempoExtra = 0;
        while (tiempoExtra < 180) { 
            await new Promise(r => setTimeout(r, 1000));
            tiempoExtra++;
            const archivosAhora = fs.readdirSync(downloadPath);
            const xmlListo = archivosAhora.find(f => f.endsWith('.xml') && !f.endsWith('.crdownload')); 
            if (xmlListo) {
                archivoDescargado = true;
                console.log(`🏆 [CRONOS] ¡MILAGRO EN LA TRINCHERA! XML aterrizó tras ${tiempoExtra}s.`);
                break;
            }
        }
    }

    if (!archivoDescargado) {
        console.log("❌ [ERROR CRÍTICO] La descarga falló por completo. Misión abortada.");
        return;
    }

    // ==========================================================
    // 🧬 FASE 2: EL TRADUCTOR AUTOMÁTICO (Operación Censo Doble)
    // ==========================================================
    console.log("⚙️ [CRONOS] Iniciando procesamiento de datos crudos...");

    const archivos = fs.readdirSync(downloadPath);
    const archivoXML = archivos.find(file => file.endsWith('.xml'));
    
    if (!archivoXML) {
        console.log("❌ [ERROR CRÍTICO] No se encontró el botín XML en la bóveda.");
        return;
    }

    const rutaCompleta = path.join(downloadPath, archivoXML);

    // ⚖️ ESTABILIZADOR: Obligamos a Cronos a esperar que el archivo se llene de datos
    console.log("⚖️ [CRONOS] Verificando integridad del XML (Esperando escritura en disco)...");
    let tamanoAnterior = -1;
    let estabilizado = false;
    let intentosEstabilizacion = 0;

    while (!estabilizado && intentosEstabilizacion < 20) {
        try {
            const stats = fs.statSync(rutaCompleta);
            // El XML de servicios es pesado. Si pesa más de 500 bytes y no ha crecido, está listo.
            if (stats.size > 500 && stats.size === tamanoAnterior) {
                estabilizado = true;
            } else {
                tamanoAnterior = stats.size;
                await new Promise(r => setTimeout(r, 1000));
                intentosEstabilizacion++;
            }
        } catch (e) {
            await new Promise(r => setTimeout(r, 1000));
            intentosEstabilizacion++;
        }
    }

    if (!estabilizado) {
        console.log(`❌ [ERROR CRÍTICO] El archivo XML está vacío o corrupto (${tamanoAnterior} bytes). Icarosoft escupió basura.`);
        fs.unlinkSync(rutaCompleta); // Destruimos el archivo corrupto
        return;
    }

    console.log(`✅ [CRONOS] Archivo estable (${(tamanoAnterior / 1024).toFixed(2)} KB). Masticando XML...`);
    const xmlData = fs.readFileSync(rutaCompleta, 'utf8');

    const parser = new XMLParser();
    const jsonObj = parser.parse(xmlData);
    const arrayCrudo = jsonObj.root.grid_servicios;
    
    console.log(`🧹 [CRONOS] Separando y desinfectando ${arrayCrudo.length} registros...`);

    const serviciosLimpios = [];
    const mapaClientes = new Map(); // El radar para evitar registrar al mismo cliente dos veces

    arrayCrudo.forEach(cliente => {
        // 1. Limpieza extrema del Documento (Nuestra Llave Maestra)
        const docRaw = cliente.Documento ? cliente.Documento.toString() : '';
        const documentoLimpio = docRaw.toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (!documentoLimpio) return; // Si Icaro manda una fila fantasma sin cédula, la ignoramos

        // 2. EXTRAER CLIENTE: Lo guardamos en el mapa. Si ya existe, se sobrescribe con la info más fresca.
        if (!mapaClientes.has(documentoLimpio)) {
            mapaClientes.set(documentoLimpio, {
                documento_cliente: documentoLimpio,
                nombre_cliente: cliente.Datos_Cliente && cliente.Datos_Cliente.Nombre_Cliente ? cliente.Datos_Cliente.Nombre_Cliente.trim() : 'DESCONOCIDO',
                telefono_movil: cliente.Datos_Cliente ? cliente.Datos_Cliente.Telefono_Movil : null,
                telefono_fijo: cliente.Datos_Cliente ? cliente.Datos_Cliente.Telefono_Fijo : null,
                e_mail: cliente.Datos_Cliente ? cliente.Datos_Cliente.E_Mail : null
            });
        }

        // 3. EXTRAER SERVICIO: Mantenemos la estructura vieja para no romper tu App actual (Operación Silenciosa)
        serviciosLimpios.push({
            id_servicio_cliente: cliente.Id_Servicio_Cliente,
            documento: documentoLimpio, // <-- Inyectamos la cédula ya limpia
            
            // Mantenemos estos datos aquí temporalmente por si tu frontend los está leyendo directamente
            nombre_cliente: cliente.Datos_Cliente ? cliente.Datos_Cliente.Nombre_Cliente : null,
            telefono_movil: cliente.Datos_Cliente ? cliente.Datos_Cliente.Telefono_Movil : null,
            telefono_fijo: cliente.Datos_Cliente ? cliente.Datos_Cliente.Telefono_Fijo : null,
            e_mail: cliente.Datos_Cliente ? cliente.Datos_Cliente.E_Mail : null,
            
            plan: cliente.Plan,
            estado: cliente.Estado,
            saldo: cliente.Saldo ? cliente.Saldo.toString().trim() : '0,00', 
            fecha_corte_actual: cliente.Fecha_Corte_Actual,
            serial_onu: cliente.Serial_Onu,
            ip_servicio: cliente.Ip_Servicio,
            usuario_pppoe: cliente.Usuario_PP_Po_E,
            clave_pppoe: cliente.Clave_PP_Po_E,
            nodo: cliente.Nodo,
            puerto_pon: cliente.Puerto_PON_, 
            nap: cliente.NAP_,
            puerto: cliente.Puerto,
            servicio_vip: cliente.Servicio_Vip,
            sucursal: cliente.Sucursal,
            coordenadas: cliente.Coordenadas || null, 
            direccion_servicio: cliente.Direccion_Servicio,
            fecha_instalacion: cliente.Fecha_Instalacion,
            instalador: cliente.Instalador
        });
    });

    // Convertimos el mapa de clientes únicos de vuelta a un Array para Supabase
    const clientesUnicos = Array.from(mapaClientes.values());

    console.log(`🏆 [CRONOS] ¡TRADUCCIÓN COMPLETA!`);
    console.log(`👤 Clientes detectados: ${clientesUnicos.length}`);
    console.log(`📡 Servicios detectados: ${serviciosLimpios.length}`);

    // ==========================================================
    // 🚀 FASE 3: EL DOBLE MISIL A SUPABASE (Inyección en la nube)
    // ==========================================================
    console.log("🔌 [CRONOS] Conectando con el Cuartel General (Supabase)...");
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.log("❌ [ERROR CRÍTICO] Cronos no tiene las llaves de Supabase.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 💥 DISPARO 1: LA TABLA DE CLIENTES (Obligatorio disparar esto primero)
    console.log("🛰️ [CRONOS] Lanzando Misil 1: Actualizando padrón de clientes...");
    const { error: errorClientes } = await supabase
        .from('clientes')
        .upsert(clientesUnicos, { 
            onConflict: 'documento_cliente' // Llave Primaria de la tabla clientes
        });

    if (errorClientes) {
        console.error("❌ [ERROR CRÍTICO] Falló el censo de clientes:", errorClientes);
        // Si falla la creación de clientes, abortamos. Los servicios necesitan que el cliente exista.
        return; 
    } else {
        console.log("💥 [CRONOS] ¡Impacto 1 Confirmado! Padrón de clientes sincronizado.");
    }

    // 💥 DISPARO 2: LA TABLA DE SERVICIOS
    console.log("🛰️ [CRONOS] Lanzando Misil 2: Actualizando estado de los servicios...");
    const { error: errorServicios } = await supabase
        .from('servicios') 
        .upsert(serviciosLimpios, { 
            onConflict: 'id_servicio_cliente' 
        });

    if (errorServicios) {
        console.error("❌ [ERROR CRÍTICO] La inyección de servicios falló:", errorServicios);
    } else {
        console.log("💥 [CRONOS] ¡Impacto 2 Confirmado! Servicios actualizados con éxito absoluto.");
        
        // Protocolo de limpieza final
        fs.unlinkSync(rutaCompleta); 
        console.log("♻️ [CRONOS] Archivo XML local destruido. Bóveda limpia.");
    }

    console.log("🚪 [CRONOS] El fantasma se retira. Misión cumplida.");
        
    } catch (error) {
        console.error("❌ [CRONOS-CRON] Falla catastrófica durante el asalto:", error);
    } finally {
        // 🛑 CRÍTICO: Aniquilamos el navegador siempre, pase lo que pase, para liberar RAM
        if (browser) {
            console.log("🧹 [CRONOS] Destruyendo rastro del navegador...");
            await browser.close();
        }
        misionEnProgreso = false;
        console.log("⏳ [CRONOS] En espera del próximo ciclo...\n");
    }
}

// ==========================================================
// ⏱️ EL TEMPORIZADOR DE LA MUERTE (Ejecución cada 3 minutos)
// ==========================================================
console.log(`
=============================================
🤖 CRONOS V5: ARTILLERÍA EN LA NUBE INICIADA
⏳ Frecuencia de disparo: Cada 3 minutos
=============================================
`);

cron.schedule('*/3 * * * *', () => {
    const ahora = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.log(`\n[${ahora}] ⏰ Despertando a Cronos para el asalto triminutal...`);
    asaltoBovedaServicios();
});

// Disparamos el primer asalto de inmediato al prender el servidor
asaltoBovedaServicios();