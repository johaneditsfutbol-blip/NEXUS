require('dotenv').config();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron'); // <-- EL RELOJ MAESTRO
const SUCURSAL_ACTUAL = 'PRINCIPAL'; // CAMBIAR A 'TOCUYITO' CUANDO DUPLIQUES EL BOT

let misionEnProgreso = false;
let ultimaVictoria = Date.now(); // ⏱️ El reloj del Interruptor de Hombre Muerto

async function asaltoBovedaFacturas() {
    if (misionEnProgreso) {
        console.log("⚠️ [CRONOS-FACT] Asalto anterior en curso. Omitiendo ciclo...");
        return;
    }
    misionEnProgreso = true;
    
    let asaltoExitoso = false;
    let intentosAsalto = 0; // <-- Bautizada con nuevo nombre

    // 🔄 BUCLE DE ASALTO INMEDIATO (Máximo 3 intentos por ciclo)
    while (!asaltoExitoso && intentosAsalto < 3) {
        intentosAsalto++;
        let browser = null;

        try {
            console.log(`\n🚀 [CRONOS-FACT] Iniciando infiltración (Intento ${intentosAsalto}/3)...`);

            // 1. Navegador en "Modo Supervivencia" para RAILWAY (Bajo consumo de RAM/CPU)
            browser = await puppeteer.launch({ 
                headless: true, 
                args: [
                    '--no-sandbox', 
                    '--disable-setuid-sandbox', 
                    '--disable-dev-shm-usage', // Evita que use la memoria compartida del OS
                    '--disable-gpu',           // Apaga el motor gráfico (no lo necesitamos en headless)
                    '--no-zygote',             // Reduce drásticamente la creación de subprocesos (evita el error 11)
                    '--disable-features=IsolateOrigins,site-per-process', // Ahorra muchísima memoria RAM
                    '--start-maximized'
                ] 
            });

            const page = await browser.newPage();
            // ⏱️ ESCUDO ANTI-CUELGUE: 30 segundos exactos y aborta
            page.setDefaultNavigationTimeout(30000);

            // 2. BRECHA DE ENTRADA: Login
            console.log("🔐 [CRONOS] Abriendo bóveda principal...");
            // ⚡ TÁCTICA DE VELOCIDAD: 'domcontentloaded'
            await page.goto('https://administrativo.icarosoft.com/Login/', { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('#id_sc_field_login');
            await page.type('#id_sc_field_login', 'Agente 1 VIVIAN - Sede Principal', { delay: 50 });
            await page.type('#id_sc_field_pswd', '@VN2026', { delay: 50 });
            
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
                page.keyboard.press('Enter')
            ]);

        console.log("✅ [CRONOS] Acceso concedido (Pausa 5s)...");
        await new Promise(r => setTimeout(r, 5000)); 

        // 3. NAVEGACIÓN: Menú Administrativo
        console.log("🖱️ [CRONOS] Moviendo la vista hacia 'Administrativo'...");
        await page.waitForFunction(() => Array.from(document.querySelectorAll('span.label')).some(s => s.textContent.trim() === 'Administrativo'));
        await page.evaluate(() => {
            const btnAdmin = Array.from(document.querySelectorAll('span.label')).find(s => s.textContent.trim() === 'Administrativo');
            if (btnAdmin) btnAdmin.click();
        });

        await new Promise(r => setTimeout(r, 3000)); 

        // 4. NAVEGACIÓN: Listado de facturas
        console.log("⚡ [CRONOS] Seleccionando 'Listado de facturas'...");
        await page.waitForSelector('a[tab-title="Listado de facturas"]');
        await page.evaluate(() => document.querySelector('a[tab-title="Listado de facturas"]').click());

        console.log("⏳ [CRONOS] Abriendo pestaña (8s)...");
        await new Promise(r => setTimeout(r, 8000)); 

        // 5. EL OBJETIVO DIRECTO
        const frameCorrecto = page.frames().find(f => f.name() === 'item_304');
        if (!frameCorrecto) throw new Error("El Iframe 'item_304' no apareció.");

        // 6. ATAQUE DIRECTO: Radar Dinámico por Quincenas
        console.log("⏱️ [CRONOS] Calculando coordenadas temporales dinámicas...");
        await frameCorrecto.waitForSelector('#SC_fecha_emision_dia', { visible: true, timeout: 20000 });
        
        const fechaFin = new Date();
        const fechaInicio = new Date();
        
        // 🎯 Lógica Inteligente de Ciclo de Facturación
        if (fechaFin.getDate() >= 15) {
            fechaInicio.setDate(15); // Si es la segunda mitad del mes, miramos desde el 15
        } else {
            fechaInicio.setDate(1);  // Si es la primera mitad del mes, miramos desde el día 1
        }

        const pad = (n) => n.toString().padStart(2, '0');
        const filtro = {
            diaDesde: pad(fechaInicio.getDate()), mesDesde: pad(fechaInicio.getMonth() + 1), anoDesde: fechaInicio.getFullYear().toString(),
            diaHasta: pad(fechaFin.getDate()), mesHasta: pad(fechaFin.getMonth() + 1), anoHasta: fechaFin.getFullYear().toString()
        };

        console.log(`🎯 [CRONOS] Rango dinámico establecido: ${filtro.diaDesde}/${filtro.mesDesde}/${filtro.anoDesde} al ${filtro.diaHasta}/${filtro.mesHasta}/${filtro.anoHasta}`);

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
    
    // ---------------- EL ESCUDO GLOBAL DE DESCARGAS ----------------
        const downloadPath = path.resolve(__dirname, 'botin_xml');
        if (!fs.existsSync(downloadPath)) fs.mkdirSync(downloadPath);

        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath });

        browser.on('targetcreated', async (target) => {
            if (target.type() === 'page') {
                try {
                    const newPage = await target.page();
                    const newClient = await newPage.target().createCDPSession();
                    await newClient.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: downloadPath });
                } catch (e) {}
            }
        });
        // ------------------------------------------------------

        console.log("⚙️ [CRONOS] Abriendo menú de Exportación...");
        await frameCorrecto.waitForSelector('#sc_btgp_btn_group_1_top', { visible: true });
        await frameCorrecto.click('#sc_btgp_btn_group_1_top');

        await new Promise(r => setTimeout(r, 1000));

        console.log("🎯 [CRONOS] Aplicando la regla KISS. Clic directo al XML...");
        await frameCorrecto.evaluate(() => {
            const btnXML = Array.from(document.querySelectorAll('a')).find(el => (el.textContent || el.innerText || "").trim().toUpperCase() === 'XML');
            if (btnXML) btnXML.click();
        });

        await new Promise(r => setTimeout(r, 3000));

        let frameExportacion = page.frames().find(async f => { try { return await f.$('#bok'); } catch(e) { return false; } });
        for (const frame of page.frames()) {
            try { if (await frame.$('#bok')) { frameExportacion = frame; break; } } catch (e) {}
        }

        if (!frameExportacion) throw new Error("No se encontró la ventana con el botón Aceptar.");

        console.log("🖱️ [CRONOS] Confirmando exportación...");
        await frameExportacion.evaluate(() => document.getElementById('bok').click()).catch(() => {}); 

        console.log("⏱️ [CRONOS] Vigilando barra de progreso...");
        let btnDescargarFrame = null;
        let intentosProgreso = 0;
        
        while (!btnDescargarFrame && intentosProgreso < 120) {
            await new Promise(r => setTimeout(r, 1500));
            for (const f of page.frames()) {
                try {
                    const estaListo = await f.evaluate(() => {
                        const btn = document.getElementById('idBtnDown');
                        if (!btn || btn.offsetParent === null || btn.className.toLowerCase().includes('disabled')) return false;
                        const styles = window.getComputedStyle(btn);
                        if (styles.pointerEvents === 'none' || styles.opacity < 1) return false;
                        const texto = document.body.innerText;
                        if (texto.includes('Procesando') && !texto.includes('100%')) return false;
                        return true;
                    });
                    if (estaListo) { btnDescargarFrame = f; break; }
                } catch (e) {}
            }
            if (!btnDescargarFrame && intentosProgreso % 5 === 0) console.log(`⏳ [CRONOS] Escaneando progreso... (Intento ${intentosProgreso}/120)`);
            intentosProgreso++;
        }

        if (!btnDescargarFrame) throw new Error("La barra de progreso nunca terminó.");

        console.log("✅ [CRONOS] ¡Progreso al 100%! Ejecutando extracción...");
        
        // 7. LA EXTRACCIÓN CON RADAR DE 60s
        let archivoDescargado = false;
        let intentosDescarga = 0;

        for (const file of fs.readdirSync(downloadPath)) fs.unlinkSync(path.join(downloadPath, file));

        while (!archivoDescargado && intentosDescarga < 3) {
            intentosDescarga++;
            console.log(`📥 [CRONOS] Disparando clic de descarga (Intento ${intentosDescarga}/3)...`);
            await btnDescargarFrame.evaluate(() => document.getElementById('idBtnDown').click());

            let tiempoEspera = 0;
            while (tiempoEspera < 60) {
                await new Promise(r => setTimeout(r, 1000));
                tiempoEspera++;
                if (fs.readdirSync(downloadPath).find(f => f.endsWith('.xml') && !f.endsWith('.crdownload'))) {
                    archivoDescargado = true;
                    console.log(`🏆 [CRONOS] ¡Botín detectado en ${tiempoEspera}s!`);
                    break;
                }
            }

            console.log("🔪 [CRONOS] Aniquilando pestañas zombie...");
            const paginas = await browser.pages();
            for (const p of paginas) {
                if (p !== page && (p.url() === 'about:blank' || p.url() === '')) await p.close().catch(() => {});
            }

            if (!archivoDescargado) {
                console.log("⚠️ [CRONOS] El servidor se rindió. Recargando...");
                await new Promise(r => setTimeout(r, 3000)); 
            }
        }

        if (!archivoDescargado) throw new Error("La descarga falló los 3 intentos.");

        // ==========================================================
        // 🧬 FASE 2: EL ESTABILIZADOR Y TRADUCTOR
        // ==========================================================
        const archivoXML = fs.readdirSync(downloadPath).find(file => file.endsWith('.xml') && !file.endsWith('.crdownload'));
        const rutaCompleta = path.join(downloadPath, archivoXML);

        console.log("⚖️ [CRONOS] Verificando integridad del XML...");
        let tamanoAnterior = -1;
        let estabilizado = false;
        let intentosEstab = 0;

        while (!estabilizado && intentosEstab < 20) {
            try {
                const stats = fs.statSync(rutaCompleta);
                if (stats.size > 500 && stats.size === tamanoAnterior) estabilizado = true;
                else { tamanoAnterior = stats.size; await new Promise(r => setTimeout(r, 1000)); intentosEstab++; }
            } catch (e) { await new Promise(r => setTimeout(r, 1000)); intentosEstab++; }
        }

        if (!estabilizado) {
            fs.unlinkSync(rutaCompleta);
            throw new Error("Archivo XML corrupto o vacío.");
        }

        console.log(`✅ [CRONOS] Archivo estable. Masticando datos...`);
        const xmlData = fs.readFileSync(rutaCompleta, 'utf8');
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlData);

        let arrayCrudo = jsonObj.root.facturacion_ventas_resumen_grid;
        if (!Array.isArray(arrayCrudo)) arrayCrudo = [arrayCrudo];
        
        const facturasLimpias = arrayCrudo.map(f => ({
            id_ventas: (f.Id_Ventas ? f.Id_Ventas.toString().trim() : '0') + '-' + SUCURSAL_ACTUAL,
            nro_notificacion: f.Nro_Notificacion,
            nro_fiscal: f.Nro_Fiscal || null,
            nro_control: f.Nro__Control || null,
            f_emision: f.F__Emision,
            cod_cliente: f.Cod__Cliente,
            nombre: f.Nombre,
            descripcion: f.Descripcion,
            status: f.Status,
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
            rif_fiscal: f.Rif_Fiscal,
            sucursal: SUCURSAL_ACTUAL
        }));

        console.log("🔌 [CRONOS] Conectando con Supabase...");
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

        const { error } = await supabase.from('facturas').upsert(facturasLimpias, { onConflict: 'id_ventas' });

        if (error) throw new Error(`Fallo inyección DB: ${error.message}`);
        
        console.log(`💥 [CRONOS] ¡IMPACTO CONFIRMADO! ${facturasLimpias.length} facturas actualizadas.`);
        fs.unlinkSync(rutaCompleta); 

        console.log("🚪 [CRONOS] Misión cumplida.");
        asaltoExitoso = true; // 🎯 Éxito: Rompe el bucle de reintentos
        ultimaVictoria = Date.now(); // ⏱️ MISIÓN EXITOSA: Reseteamos el reloj de la bomba a cero

    } catch (error) {
        // 🛡️ MANEJO TÁCTICO DEL ERROR (Reintento Inmediato)
        if (error.message.includes('timeout') || (error.name && error.name === 'TimeoutError')) {
            console.log("⚠️ [CRONOS] Icarosoft se quedó en blanco (Timeout de 30s).");
        } else {
            console.log(`⚠️ [CRONOS] Falla en la matrix: ${error.message}`);
        }

        if (intentosAsalto < 3) {
            console.log("♻️ [CRONOS] Reagrupando tropas para reintento inmediato...");
        } else {
            console.log("❌ [ERROR] Los 3 intentos rápidos fallaron. Icarosoft colapsado. Abortando misión.");
        }
        
    } finally {
        if (browser) {
            console.log(`🧹 [CRONOS] Destruyendo navegador del Intento ${intentosAsalto}...`);
            await browser.close().catch(() => {});
        }
    }
  } // <-- FIN DEL BUCLE WHILE DE REINTENTOS

  misionEnProgreso = false;
  console.log("⏳ [CRONOS] En espera del próximo ciclo triminutal...\n");
}

// ==========================================================
// ⏱️ EL TEMPORIZADOR FINANCIERO (Ejecución cada 3 minutos)
// ==========================================================
cron.schedule('*/3 * * * *', () => {
    const ahora = new Date().toLocaleTimeString('en-US', { hour12: false });
    console.log(`\n[${ahora}] ⏰ Despertando escuadrón financiero...`);
    asaltoBovedaFacturas();
});

asaltoBovedaFacturas();

// ==========================================================
// 🫀 EL MARCAPASOS TÁCTICO (Interruptor de Hombre Muerto)
// ==========================================================
const http = require('http');
const PORT = process.env.PORT || 8080;

http.createServer((req, res) => {
    // ☠️ EL GATILLO DEL DISTRIBUIDOR
    if (req.url === '/kill') {
        console.log("💀 [CRONOS] Orden recibida del Distribuidor. Apagando sistemas. Railway me resucitará...");
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('CRONOS DESTRUIDO\n');
        setTimeout(() => { process.exit(1); }, 1000);
        return;
    }

    const minutosSinExito = (Date.now() - ultimaVictoria) / 60000;
    if (minutosSinExito > 15) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('HOMBRE MUERTO DETECTADO\n');
    } else {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(`CRONOS OPERATIVO (Ultima victoria: ${minutosSinExito.toFixed(1)} min)\n`);
    }
}).listen(PORT, () => {
    console.log(`📡 [LATIDO] Transmitiendo señal en el puerto ${PORT}...`);
});
