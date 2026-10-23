/* ============================================================
   CALENDARIO FINANCIERO
   Mis Finanzas
   ============================================================ */

let fechaCalendario = new Date();

let quincenaSeleccionada = null;

let datosCalendario = {
    ingresos: [],
    gastos: [],
    comprasTarjeta: [],
    tarjetas: []
};


/* ============================================================
   INICIO
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            mostrarFechaCalendario();

            configurarBotonesMes();

            configurarSelectorQuincena();

            establecerQuincenaInicial();

            await cargarCalendario();

        } catch (error) {

            console.error(
                "Error iniciando calendario:",
                error
            );

            mostrarErrorCalendario(
                obtenerMensajeError(error)
            );

        }

    }
);


/* ============================================================
   FECHA ACTUAL
   ============================================================ */

function mostrarFechaCalendario() {

    const elemento =
        document.getElementById(
            "fechaActual"
        );


    if (!elemento) return;


    const ahora =
        new Date();


    elemento.textContent =
        ahora.toLocaleDateString(
            "es-MX",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

}


/* ============================================================
   ESTABLECER QUINCENA INICIAL
   ============================================================

   Si hoy es del 1 al 15:
       1ª quincena

   Si hoy es del 16 al final:
       2ª quincena
*/


function actualizarIndicadorPeriodo() {

    const indicador =
        document.getElementById(
            "indicadorPeriodoActual"
        );

    if (!indicador) return;

    const hoy = new Date();

    const mismoMes =
        hoy.getFullYear() ===
            fechaCalendario.getFullYear() &&
        hoy.getMonth() ===
            fechaCalendario.getMonth();

    indicador.textContent =
        mismoMes
            ? "Periodo actual"
            : "Consulta";
}


function establecerQuincenaInicial() {

    const hoy =
        new Date();


    if (
        hoy.getDate() <= 15
    ) {

        quincenaSeleccionada = "1";

    } else {

        quincenaSeleccionada = "2";

    }


    const selector =
        document.getElementById(
            "selectorQuincena"
        );


    if (selector) {

        selector.value =
            quincenaSeleccionada;

    }

    actualizarIndicadorPeriodo();

}


/* ============================================================
   SELECTOR DE QUINCENA
   ============================================================ */

function configurarSelectorQuincena() {

    const selector =
        document.getElementById(
            "selectorQuincena"
        );


    if (!selector) return;


    selector.addEventListener(
        "change",
        () => {

            quincenaSeleccionada =
                selector.value;


            renderizarQuincenaSeleccionada();

        }
    );

}


/* ============================================================
   BOTONES DEL MES
   ============================================================ */

function configurarBotonesMes() {

    const anterior =
        document.getElementById(
            "btnMesAnterior"
        );


    const siguiente =
        document.getElementById(
            "btnMesSiguiente"
        );


    if (anterior) {

        anterior.addEventListener(
            "click",
            async () => {

                fechaCalendario.setMonth(
                    fechaCalendario.getMonth() - 1
                );


                /*
                 * Si cambiamos a otro mes:

                 * Si es el mes actual:
                 * usar la quincena actual.

                 * Si es otro mes:
                 * comenzar en primera quincena.
                 */

                establecerQuincenaParaMes();


                await cargarCalendario();

            }
        );

    }


    if (siguiente) {

        siguiente.addEventListener(
            "click",
            async () => {

                fechaCalendario.setMonth(
                    fechaCalendario.getMonth() + 1
                );


                establecerQuincenaParaMes();


                await cargarCalendario();

            }
        );

    }

}


/* ============================================================
   QUINCENA SEGÚN MES CONSULTADO
   ============================================================ */

function establecerQuincenaParaMes() {

    const hoy =
        new Date();


    const mismoMes =
        hoy.getFullYear() ===
            fechaCalendario.getFullYear() &&

        hoy.getMonth() ===
            fechaCalendario.getMonth();


    if (mismoMes) {

        if (
            hoy.getDate() <= 15
        ) {

            quincenaSeleccionada = "1";

        } else {

            quincenaSeleccionada = "2";

        }

    } else {

        quincenaSeleccionada = "1";

    }


    const selector =
        document.getElementById(
            "selectorQuincena"
        );


    if (selector) {

        selector.value =
            quincenaSeleccionada;

    }

    actualizarIndicadorPeriodo();

}


/* ============================================================
   CARGAR CALENDARIO
   ============================================================ */

async function cargarCalendario() {

    limpiarErrorCalendario();


    const contenedor =
        document.getElementById(
            "contenedorQuincenaSeleccionada"
        );


    if (contenedor) {

        contenedor.innerHTML = `

            <div class="dashboard-vacio">

                <div class="dashboard-vacio-icono">
                    📅
                </div>

                <h3>
                    Calculando calendario...
                </h3>

                <p>
                    Estamos preparando tus ingresos,
                    gastos y pagos pendientes.
                </p>

            </div>

        `;

    }


    try {

        if (
            typeof supabaseClient === "undefined" ||
            !supabaseClient
        ) {

            throw new Error(
                "No existe la conexión con Supabase."
            );

        }


        const {
            data: usuarioData,
            error: usuarioError
        } =
            await supabaseClient.auth.getUser();


        if (usuarioError) {

            throw usuarioError;

        }


        const usuario =
            usuarioData?.user;


        if (!usuario) {

            throw new Error(
                "No hay un usuario autenticado."
            );

        }


        /* ----------------------------------------------------
           USUARIO
        ---------------------------------------------------- */

        const usuarioNombre =
            document.getElementById(
                "usuarioNombre"
            );


        if (usuarioNombre) {

            usuarioNombre.textContent =
                usuario.user_metadata?.nombre ||
                usuario.user_metadata?.name ||
                usuario.email ||
                "Usuario";

        }


        /* ----------------------------------------------------
           FECHAS DEL MES
        ---------------------------------------------------- */

        const primerDia =
            obtenerPrimerDiaMes(
                fechaCalendario
            );


        const ultimoDia =
            obtenerUltimoDiaMes(
                fechaCalendario
            );


        const fechaInicio =
            formatearFechaDB(
                primerDia
            );


        const fechaFin =
            formatearFechaDB(
                ultimoDia
            );


        /* ----------------------------------------------------
           CONSULTAR SUPABASE
        ---------------------------------------------------- */

        const [
            ingresosResult,
            gastosResult,
            comprasResult,
            tarjetasResult
        ] = await Promise.all([

            supabaseClient
                .from("ingresos")
                .select("*")
                .eq(
                    "usuario_id",
                    usuario.id
                ),

            supabaseClient
                .from("gastos")
                .select("*")
                .eq(
                    "usuario_id",
                    usuario.id
                ),

            supabaseClient
                .from("compras_tarjeta")
                .select(`
                    *,
                    tarjetas (
                        id,
                        nombre,
                        banco,
                        dia_corte,
                        dia_pago,
                        dia_limite,
                        activa
                    )
                `)
                .eq(
                    "usuario_id",
                    usuario.id
                )
                .eq(
                    "activa",
                    true
                ),

            supabaseClient
                .from("tarjetas")
                .select("*")
                .eq(
                    "usuario_id",
                    usuario.id
                )

        ]);


        if (ingresosResult.error) {

            throw ingresosResult.error;

        }


        if (gastosResult.error) {

            throw gastosResult.error;

        }


        if (comprasResult.error) {

            throw comprasResult.error;

        }


        if (tarjetasResult.error) {

            throw tarjetasResult.error;

        }


        /* ----------------------------------------------------
           GUARDAR DATOS
        ---------------------------------------------------- */

        datosCalendario.ingresos =
            ingresosResult.data || [];


        datosCalendario.gastos =
            gastosResult.data || [];


        datosCalendario.comprasTarjeta =
            comprasResult.data || [];


        datosCalendario.tarjetas =
            tarjetasResult.data || [];


        /* ----------------------------------------------------
           TÍTULO
        ---------------------------------------------------- */

        actualizarTituloMes();


        /* ----------------------------------------------------
           PREPARAR MOVIMIENTOS
        ---------------------------------------------------- */

        const movimientos =
            prepararMovimientosMes(
                primerDia,
                ultimoDia
            );


        /* ----------------------------------------------------
           RESUMEN DEL MES
        ---------------------------------------------------- */

        actualizarResumenMensual(
            movimientos
        );


        /* ----------------------------------------------------
           MOSTRAR QUINCENA
        ---------------------------------------------------- */

        renderizarQuincenaSeleccionada();


    } catch (error) {

        console.error(
            "Error cargando calendario:",
            error
        );


        mostrarErrorCalendario(
            obtenerMensajeError(error)
        );


        if (contenedor) {

            contenedor.innerHTML = `

                <div class="dashboard-vacio">

                    <div class="dashboard-vacio-icono">
                        ⚠️
                    </div>

                    <h3>
                        No se pudo cargar el calendario
                    </h3>

                    <p>
                        Revisa el mensaje de error.
                    </p>

                </div>

            `;

        }

    }

}


/* ============================================================
   PREPARAR MOVIMIENTOS
   ============================================================ */

function prepararMovimientosMes(
    primerDia,
    ultimoDia
) {

    const movimientos = [];


    /* ========================================================
       INGRESOS
       ======================================================== */

    for (
        const ingreso
        of datosCalendario.ingresos
    ) {

        const fechas =
            obtenerFechasIngresoEnMes(
                ingreso,
                primerDia,
                ultimoDia
            );


        for (
            const fecha
            of fechas
        ) {

            movimientos.push({

                fecha: fecha,

                tipo: "ingreso",

                concepto:
                    ingreso.concepto ||
                    ingreso.nombre ||
                    "Ingreso",

                importe:
                    convertirNumero(
                        ingreso.importe ??
                        ingreso.monto ??
                        ingreso.cantidad
                    ),

                origen: ingreso

            });

        }

    }


    /* ========================================================
       GASTOS
       --------------------------------------------------------
       Normales: fecha real.
       Fijos/recurrentes: se proyectan cada mes usando
       el mismo día del registro original.
       ======================================================== */

    for (
        const gasto
        of datosCalendario.gastos
    ) {

        if (
            gasto.activo === false ||
            !gasto.fecha
        ) {
            continue;
        }

        const fechaOriginal =
            convertirFechaLocal(
                gasto.fecha
            );

        if (!fechaOriginal) {
            continue;
        }

        const tipoGasto =
            String(
                gasto.tipo || ""
            ).toLowerCase();

        const esFijo =
            tipoGasto === "fijo" ||
            tipoGasto === "gasto fijo" ||
            gasto.recurrente === true;

        const fechaMovimiento =
            esFijo
                ? crearFechaSegura(
                    primerDia.getFullYear(),
                    primerDia.getMonth(),
                    fechaOriginal.getDate()
                )
                : fechaOriginal;

        if (
            !estaDentroDelMes(
                fechaMovimiento,
                primerDia,
                ultimoDia
            )
        ) {
            continue;
        }

        movimientos.push({
            fecha: fechaMovimiento,
            tipo: "gasto",
            concepto:
                gasto.concepto ||
                gasto.descripcion ||
                "Gasto",
            importe:
                convertirNumero(
                    gasto.importe ??
                    gasto.monto
                ),
            origen: gasto,
            gastoFijo: esFijo
        });
    }


    /* ========================================================
       TARJETAS
       ======================================================== */

    for (
        const compra
        of datosCalendario.comprasTarjeta
    ) {

        agregarPagosPendientesCompra(
            compra,
            primerDia,
            ultimoDia,
            movimientos
        );

    }


    /* ========================================================
       ORDENAR POR FECHA
    ======================================================== */

    movimientos.sort(
        (a, b) => {

            const diferencia =
                a.fecha.getTime() -
                b.fecha.getTime();


            if (
                diferencia !== 0
            ) {

                return diferencia;

            }


            const orden = {

                ingreso: 1,

                gasto: 2,

                tarjeta: 3

            };


            return (
                (orden[a.tipo] || 99) -
                (orden[b.tipo] || 99)
            );

        }
    );


    return movimientos;

}


/* ============================================================
   PAGOS PENDIENTES DE TARJETA
   ============================================================ */


function agregarPagosPendientesCompra(
    compra,
    primerDia,
    ultimoDia,
    movimientos
) {
    if (!compra) return;

    const mesesTotales = parseInt(
        compra.meses_totales || 1,
        10
    );

    const mesesPagados = parseInt(
        compra.meses_pagados || 0,
        10
    );

    const saldoPendiente = convertirNumero(
        compra.saldo_pendiente
    );

    const mensualidad = convertirNumero(
        compra.mensualidad
    );

    if (
        saldoPendiente <= 0 ||
        mesesPagados >= mesesTotales
    ) {
        return;
    }

    const tarjeta = compra.tarjetas || {};

    if (!compra.fecha_compra) return;

    const fechaCompra = convertirFechaLocal(
        compra.fecha_compra
    );

    if (!fechaCompra) return;

    // Calcular el primer pago igual que en tarjetas.js.
    const diaCorte = parseInt(
        tarjeta.dia_corte,
        10
    );

    const diaPago = parseInt(
        tarjeta.dia_pago,
        10
    );

    if (
        !Number.isInteger(diaCorte) ||
        diaCorte < 1 ||
        diaCorte > 31 ||
        !Number.isInteger(diaPago) ||
        diaPago < 1 ||
        diaPago > 31
    ) {
        console.warn(
            "No se pudo calcular el calendario de la compra:",
            compra.concepto,
            "Faltan los días de corte o pago de la tarjeta."
        );
        return;
    }

    let anioCorte = fechaCompra.getFullYear();
    let mesCorte = fechaCompra.getMonth();

    const ultimoDiaCorte = new Date(
        anioCorte,
        mesCorte + 1,
        0
    ).getDate();

    const corteValido = Math.min(
        diaCorte,
        ultimoDiaCorte
    );

    // Si la compra cae el día de corte o después,
    // pertenece al siguiente periodo.
    if (fechaCompra.getDate() >= corteValido) {
        mesCorte++;

        if (mesCorte > 11) {
            mesCorte = 0;
            anioCorte++;
        }
    }

    const fechaCorte = crearFechaSegura(
        anioCorte,
        mesCorte,
        diaCorte
    );

    let anioPago = fechaCorte.getFullYear();
    let mesPago = fechaCorte.getMonth();

    if (diaPago <= fechaCorte.getDate()) {
        mesPago++;

        if (mesPago > 11) {
            mesPago = 0;
            anioPago++;
        }
    }

    const primerPago = crearFechaSegura(
        anioPago,
        mesPago,
        diaPago
    );

    const nombreTarjeta =
        tarjeta.nombre || "Tarjeta";

    const conceptoCompra =
        compra.concepto || "Compra con tarjeta";

    let saldoRestante = saldoPendiente;

    const pagosRestantes = Math.max(
        mesesTotales - mesesPagados,
        0
    );

    for (let i = 0; i < pagosRestantes; i++) {
        const numeroPago = mesesPagados + i + 1;

        // La fecha se calcula desde el primer pago original
        // y los pagos ya realizados, no desde fecha_primer_pago.
        const fechaMesPago = sumarMeses(
            primerPago,
            mesesPagados + i
        );

        const anio = fechaMesPago.getFullYear();
        const mes = fechaMesPago.getMonth();

        const ultimoDiaMes = new Date(
            anio,
            mes + 1,
            0
        ).getDate();

        const fechaPago = new Date(
            anio,
            mes,
            Math.min(diaPago, ultimoDiaMes)
        );

        const importePago = Math.min(
            mensualidad,
            saldoRestante
        );

        if (importePago <= 0) break;

        if (
            estaDentroDelMes(
                fechaPago,
                primerDia,
                ultimoDia
            )
        ) {
            movimientos.push({
                fecha: fechaPago,
                tipo: "tarjeta",
                concepto:
                    `${nombreTarjeta} - ${conceptoCompra}`,
                importe: importePago,
                compraId: compra.id,
                tarjetaId: compra.tarjeta_id,
                numeroPago,
                mesesTotales,
                mesesPagados,
                origen: compra
            });
        }

        saldoRestante = Math.max(
            saldoRestante - importePago,
            0
        );
    }
}


/* ============================================================
   RESUMEN MENSUAL
   ============================================================ */

function actualizarResumenMensual(
    movimientos
) {

    let ingresos = 0;

    let gastos = 0;

    let tarjetas = 0;


    for (
        const movimiento
        of movimientos
    ) {

        const importe =
            convertirNumero(
                movimiento.importe
            );


        if (
            movimiento.tipo === "ingreso"
        ) {

            ingresos += importe;

        }


        if (
            movimiento.tipo === "gasto"
        ) {

            gastos += importe;

        }


        if (
            movimiento.tipo === "tarjeta"
        ) {

            tarjetas += importe;

        }

    }


    const compromisos =
        gastos +
        tarjetas;


    const resultado =
        ingresos -
        compromisos;


    colocarTexto(
        "resumenIngresos",
        formatearMoneda(
            ingresos
        )
    );


    colocarTexto(
        "resumenGastos",
        formatearMoneda(
            gastos
        )
    );


    colocarTexto(
        "resumenTarjetas",
        formatearMoneda(
            tarjetas
        )
    );


    colocarTexto(
        "resumenNecesitas",
        formatearMoneda(
            compromisos
        )
    );


    colocarTexto(
        "resumenIngresosDetalle",
        formatearMoneda(
            ingresos
        )
    );


    colocarTexto(
        "resumenCompromisos",
        formatearMoneda(
            compromisos
        )
    );


    colocarTexto(
        "resumenResultado",
        formatearMoneda(
            resultado
        )
    );

}


/* ============================================================
   MOSTRAR QUINCENA SELECCIONADA
   ============================================================ */

function renderizarQuincenaSeleccionada() {

    const contenedor =
        document.getElementById(
            "contenedorQuincenaSeleccionada"
        );


    if (!contenedor) return;


    const primerDia =
        obtenerPrimerDiaMes(
            fechaCalendario
        );


    const ultimoDia =
        obtenerUltimoDiaMes(
            fechaCalendario
        );


    const dia15 =
        new Date(
            fechaCalendario.getFullYear(),
            fechaCalendario.getMonth(),
            15
        );


    let inicio;

    let fin;

    let titulo;

    let periodo;


    if (
        quincenaSeleccionada === "2"
    ) {

        inicio =
            new Date(
                fechaCalendario.getFullYear(),
                fechaCalendario.getMonth(),
                16
            );

        fin =
            ultimoDia;

        titulo =
            "Segunda quincena";

        periodo =
            `16 al ${ultimoDia.getDate()} de ${obtenerNombreMes(fechaCalendario)}`;

    } else {

        inicio =
            primerDia;

        fin =
            dia15;

        titulo =
            "Primera quincena";

        periodo =
            `01 al 15 de ${obtenerNombreMes(fechaCalendario)}`;

    }


    /*
     * Volvemos a preparar los movimientos
     * del mes para que siempre estén
     * actualizados.
     */

    const movimientos =
        prepararMovimientosMes(
            primerDia,
            ultimoDia
        );


    const movimientosQuincena =
        movimientos.filter(
            movimiento =>
                movimiento.fecha >= inicio &&
                movimiento.fecha <= fin
        );


    contenedor.innerHTML =
        crearHTMLQuincena(
            titulo,
            periodo,
            movimientosQuincena
        );

}


/* ============================================================
   HTML QUINCENA
   ============================================================ */

function crearHTMLQuincena(
    titulo,
    periodo,
    movimientos
) {

    let ingresos = 0;

    let gastos = 0;

    let tarjetas = 0;


    for (
        const movimiento
        of movimientos
    ) {

        const importe =
            convertirNumero(
                movimiento.importe
            );


        if (
            movimiento.tipo === "ingreso"
        ) {

            ingresos += importe;

        }


        if (
            movimiento.tipo === "gasto"
        ) {

            gastos += importe;

        }


        if (
            movimiento.tipo === "tarjeta"
        ) {

            tarjetas += importe;

        }

    }


    const necesitas =
        gastos +
        tarjetas;


    const resultado =
        ingresos -
        necesitas;


    const grupos =
        agruparMovimientosPorFecha(
            movimientos
        );


    const fechas =
        Object.keys(
            grupos
        ).sort();


    let contenido = "";


    if (
        fechas.length === 0
    ) {

        contenido = `

            <div class="dashboard-vacio">

                <div class="dashboard-vacio-icono">
                    📅
                </div>

                <h3>
                    No hay movimientos
                </h3>

                <p>
                    No hay ingresos, gastos ni pagos
                    de tarjetas registrados para esta quincena.
                </p>

            </div>

        `;

    } else {

        for (
            const fecha
            of fechas
        ) {

            contenido +=
                crearHTMLFecha(
                    grupos[fecha]
                );

        }

    }


    return `

        <div class="panel-dashboard">

            <div class="panel-dashboard-titulo">

                <div>

                    <h2>
                        ${titulo}
                    </h2>

                    <p>
                        ${periodo}
                    </p>

                </div>

            </div>


            <!-- =============================================
                 RESUMEN DE LA QUINCENA
            ============================================== -->

            <div class="resumen-grid">


                <div class="tarjeta-resumen">

                    <div class="tarjeta-resumen-icono">
                        💰
                    </div>

                    <div>

                        <span>
                            Ingresos
                        </span>

                        <strong>
                            ${formatearMoneda(ingresos)}
                        </strong>

                    </div>

                </div>


                <div class="tarjeta-resumen">

                    <div class="tarjeta-resumen-icono">
                        💸
                    </div>

                    <div>

                        <span>
                            Gastos
                        </span>

                        <strong>
                            ${formatearMoneda(gastos)}
                        </strong>

                    </div>

                </div>


                <div class="tarjeta-resumen">

                    <div class="tarjeta-resumen-icono">
                        💳
                    </div>

                    <div>

                        <span>
                            Tarjetas
                        </span>

                        <strong>
                            ${formatearMoneda(tarjetas)}
                        </strong>

                    </div>

                </div>

            </div>


            <!-- =============================================
                 MOVIMIENTOS POR FECHA
            ============================================== -->

            <div class="seccion">

                <div class="encabezado">

                    <div>

                        <h2>
                            📅 Movimientos
                        </h2>

                        <p class="texto-gris">
                            Pagos y movimientos de esta quincena
                        </p>

                    </div>

                    ${
                        movimientos.some(
                            movimiento =>
                                movimiento.tipo === "tarjeta" &&
                                movimiento.compraId
                        )
                            ? `
                                <button
                                    type="button"
                                    class="btn-principal"
                                    onclick="marcarTodosLosPagosQuincena()">

                                    ✓ Marcar pagos de tarjetas como pagados

                                </button>
                              `
                            : `
                                <span class="texto-gris">
                                    ✓ Pagos de tarjetas al corriente
                                </span>
                              `
                    }

                </div>


                ${contenido}

            </div>


            <div class="calendario-acciones">
                <button
                    type="button"
                    id="btnHistorialPagos"
                    class="btn-secundario btn-historial"
                    onclick="abrirHistorialPagosCalendario()">
                    📋 Ver historial de pagos
                </button>
            </div>

            <!-- =============================================
                 TOTALES
            ============================================== -->

            <div class="lista">


                <div class="item">

                    <div>

                        <strong>
                            Total que necesitas cubrir
                        </strong>

                        <small>
                            Gastos + pagos de tarjetas
                        </small>

                    </div>

                    <strong>
                        ${formatearMoneda(necesitas)}
                    </strong>

                </div>


                <div class="item">

                    <div>

                        <strong>
                            Ingresos esperados
                        </strong>

                        <small>
                            Dinero que entra durante esta quincena
                        </small>

                    </div>

                    <strong>
                        ${formatearMoneda(ingresos)}
                    </strong>

                </div>


                <div class="item">

                    <div>

                        <strong>
                            Resultado de la quincena
                        </strong>

                        <small>
                            Ingresos menos compromisos
                        </small>

                    </div>

                    <strong>
                        ${formatearMoneda(resultado)}
                    </strong>

                </div>

            </div>

        </div>

    `;

}


/* ============================================================
   HTML POR FECHA
   ============================================================ */

/* ============================================================
   HTML POR FECHA
   AGRUPADO VISUALMENTE POR TARJETA
   ============================================================ */

function crearHTMLFecha(
    movimientos
) {

    if (
        !movimientos ||
        movimientos.length === 0
    ) {
        return "";
    }


    const fecha =
        movimientos[0].fecha;


    const tituloFecha =
        formatearFechaCompleta(
            fecha
        );


    /*
     * ========================================================
     * MOVIMIENTOS QUE NO SON TARJETA
     * ========================================================
     */

    const movimientosNormales =
        movimientos.filter(
            movimiento =>
                movimiento.tipo !== "tarjeta"
        );


    /*
     * ========================================================
     * PAGOS DE TARJETA
     * ========================================================
     */

    const movimientosTarjeta =
        movimientos.filter(
            movimiento =>
                movimiento.tipo === "tarjeta"
        );


    /*
     * ========================================================
     * AGRUPAR PAGOS POR TARJETA
     * ========================================================
     */

    const gruposTarjetas = {};


    for (
        const movimiento
        of movimientosTarjeta
    ) {

        let nombreTarjeta =
            movimiento.origen?.tarjetas?.nombre;


        /*
         * Respaldo por si algún movimiento antiguo
         * no tiene la relación tarjetas cargada.
         */

        if (
            !nombreTarjeta
        ) {

            const concepto =
                String(
                    movimiento.concepto ||
                    ""
                );

            const posicionSeparador =
                concepto.indexOf(
                    " - "
                );


            if (
                posicionSeparador !== -1
            ) {

                nombreTarjeta =
                    concepto.substring(
                        0,
                        posicionSeparador
                    );

            } else {

                nombreTarjeta =
                    "Tarjeta";

            }

        }


        if (
            !gruposTarjetas[nombreTarjeta]
        ) {

            gruposTarjetas[nombreTarjeta] = [];

        }


        gruposTarjetas[nombreTarjeta].push(
            movimiento
        );

    }


    /*
     * ========================================================
     * CREAR HTML DE MOVIMIENTOS NORMALES
     * ========================================================
     */

    let contenidoNormal = "";


    if (
        movimientosNormales.length > 0
    ) {

        let filasNormales = "";


        for (
            const movimiento
            of movimientosNormales
        ) {

            filasNormales +=
                crearHTMLMovimiento(
                    movimiento
                );

        }


        contenidoNormal = `
            <div class="calendario-grupo-movimientos">

                <div class="tabla-contenedor">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Tipo
                                </th>

                                <th>
                                    Concepto
                                </th>

                                <th class="texto-derecha">
                                    Importe
                                </th>

                                <th>
                                    Acción
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            ${filasNormales}

                        </tbody>

                    </table>

                </div>

            </div>
        `;

    }


    /*
     * ========================================================
     * CREAR HTML AGRUPADO POR TARJETA
     * ========================================================
     */

    let contenidoTarjetas = "";


    for (
        const nombreTarjeta
        of Object.keys(
            gruposTarjetas
        )
    ) {

        const pagos =
            gruposTarjetas[
                nombreTarjeta
            ];


        let totalTarjeta = 0;


        for (
            const pago
            of pagos
        ) {

            totalTarjeta +=
                convertirNumero(
                    pago.importe
                );

        }


        let filas = "";


        for (
            const pago
            of pagos
        ) {

            filas +=
                crearHTMLMovimiento(
                    pago
                );

        }


        contenidoTarjetas += `

            <div class="calendario-grupo-tarjeta">

                <div class="calendario-grupo-tarjeta-encabezado">

                    <div class="calendario-grupo-tarjeta-nombre">

                        <span class="calendario-grupo-tarjeta-icono">
                            💳
                        </span>

                        <div>

                            <strong>
                                ${escaparHTML(
                                    nombreTarjeta
                                )}
                            </strong>

                            <small>
                                ${pagos.length}
                                ${
                                    pagos.length === 1
                                        ? "pago programado"
                                        : "pagos programados"
                                }
                            </small>

                        </div>

                    </div>


                    <strong class="calendario-grupo-tarjeta-total">

                        ${formatearMoneda(
                            totalTarjeta
                        )}

                    </strong>

                </div>


                <div class="tabla-contenedor">

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Tipo
                                </th>

                                <th>
                                    Concepto
                                </th>

                                <th class="texto-derecha">
                                    Importe
                                </th>

                                <th>
                                    Acción
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            ${filas}

                        </tbody>

                    </table>

                </div>

            </div>

        `;

    }


    /*
     * ========================================================
     * RESULTADO FINAL
     * ========================================================
     */

    return `

        <div class="seccion">

            <div class="encabezado">

                <div>

                    <h2>
                        📅 ${tituloFecha}
                    </h2>

                </div>

            </div>


            ${contenidoNormal}


            ${contenidoTarjetas}

        </div>

    `;

}


/* ============================================================
   HTML MOVIMIENTO
   ============================================================ */

function crearHTMLMovimiento(
    movimiento
) {

    let icono = "";

    let tipo = "";

    let claseImporte = "";

    let signo = "";


    if (
        movimiento.tipo === "ingreso"
    ) {

        icono = "💰";

        tipo = "Ingreso";

        claseImporte =
            "texto-verde";

        signo = "+";

    }


    else if (
        movimiento.tipo === "gasto"
    ) {

        icono = "💸";

        tipo = "Gasto";

        claseImporte =
            "texto-rojo";

        signo = "-";

    }


    else if (
        movimiento.tipo === "tarjeta"
    ) {

        icono = "💳";

        tipo = "Tarjeta";

        /*
         * Visualmente el pago de tarjeta se muestra
         * como una cantidad positiva.
         *
         * La lógica financiera del calendario NO cambia:
         * el importe sigue sumándose a los compromisos.
         */
        claseImporte =
            "texto-rojo";

        signo = "";

    }


    const importe =
        convertirNumero(
            movimiento.importe
        );


    let concepto =
        escaparHTML(
            movimiento.concepto
        );


    /*
     * Si es tarjeta:
     * mostrar número de pago.
     */

    if (
        movimiento.tipo === "tarjeta"
    ) {

        concepto += `

            <br>

            <small>
                Pago ${movimiento.numeroPago}
                de ${movimiento.mesesTotales}
            </small>

        `;

    }


    let accion = "";


    if (
        movimiento.tipo === "tarjeta" &&
        movimiento.compraId
    ) {

        accion = `

            <button
                type="button"
                class="btn-principal"
                onclick="marcarPagoTarjetaCalendario('${movimiento.compraId}')">

                ✓ Marcar pagado

            </button>

        `;

    } else {

        accion = `

            <span class="texto-gris">
                —
            </span>

        `;

    }


    return `

        <tr>

            <td>

                ${icono}

                ${tipo}

            </td>


            <td>

                <strong>
                    ${concepto}
                </strong>

            </td>


            <td
                class="texto-derecha ${claseImporte}">

                <strong>
    ${signo}${formatearMoneda(
    movimiento.tipo === "tarjeta"
        ? Math.abs(importe)
        : importe
)}
</strong>

            </td>


            <td>

                ${accion}

            </td>

        </tr>

    `;

}


/* ============================================================
   AGRUPAR POR FECHA
   ============================================================ */

function agruparMovimientosPorFecha(
    movimientos
) {

    const grupos = {};


    for (
        const movimiento
        of movimientos
    ) {

        const clave =
            formatearFechaDB(
                movimiento.fecha
            );


        if (
            !grupos[clave]
        ) {

            grupos[clave] = [];

        }


        grupos[clave].push(
            movimiento
        );

    }


    return grupos;

}


/* ============================================================
   MARCAR PAGO DE TARJETA
   ============================================================ */

async function marcarPagoTarjetaCalendario(
    compraId,
    opciones = {}
) {

    const silencioso =
        opciones.silencioso === true;

    const recargar =
        opciones.recargar !== false;

    if (!compraId) return;


    if (!silencioso) {

        const confirmar =
            window.confirm(
                "¿Confirmas que este pago de tarjeta ya fue realizado?"
            );


        if (!confirmar) {

            return false;

        }

    }


    try {

        const {
            data: usuarioData,
            error: usuarioError
        } =
            await supabaseClient.auth.getUser();


        if (usuarioError) {

            throw usuarioError;

        }


        const usuario =
            usuarioData?.user;


        if (!usuario) {

            throw new Error(
                "No hay un usuario autenticado."
            );

        }


        const {
            data: compra,
            error: compraError
        } =
            await supabaseClient
                .from("compras_tarjeta")
                .select("*")
                .eq(
                    "id",
                    compraId
                )
                .eq(
                    "usuario_id",
                    usuario.id
                )
                .single();


        if (compraError) {

            throw compraError;

        }


        if (!compra) {

            throw new Error(
                "No se encontró la compra."
            );

        }


        const mesesTotales =
            parseInt(
                compra.meses_totales || 1,
                10
            );


        const mesesPagados =
            parseInt(
                compra.meses_pagados || 0,
                10
            );


        const saldo =
            convertirNumero(
                compra.saldo_pendiente
            );


        const mensualidad =
            convertirNumero(
                compra.mensualidad
            );


        if (
            saldo <= 0 ||
            mesesPagados >= mesesTotales
        ) {

            throw new Error(
                "Esta compra ya está liquidada."
            );

        }


        const numeroPago =
            mesesPagados + 1;


        const importe =
            Math.min(
                mensualidad,
                saldo
            );


        /*
         * Registrar el pago real.
         */

        const {
            error: pagoError
        } =
            await supabaseClient
                .from("pagos_tarjeta")
                .insert({

                    usuario_id:
                        usuario.id,

                    tarjeta_id:
                        compra.tarjeta_id,

                    cuenta_id:
                        null,

                    importe:
                        importe,

                    fecha:
                        formatearFechaDB(
                            new Date()
                        ),

                    concepto:
                        `${compra.concepto || "Compra"} - Pago ${numeroPago} de ${mesesTotales}`

                });


        if (pagoError) {

            throw pagoError;

        }


        const nuevosMesesPagados =
            mesesPagados + 1;


        const nuevoSaldo =
            Math.max(
                saldo - importe,
                0
            );


        let nuevaFecha =
            compra.fecha_primer_pago;


        let activa = true;


        /*
         * Avanzar al siguiente pago.
         */

        if (
            nuevosMesesPagados <
                mesesTotales &&
            nuevaFecha
        ) {

            nuevaFecha =
                formatearFechaDB(
                    sumarMeses(
                        convertirFechaLocal(
                            nuevaFecha
                        ),
                        1
                    )
                );

        }


        /*
         * Compra terminada.
         */

        if (
            nuevosMesesPagados >=
                mesesTotales ||
            nuevoSaldo <= 0
        ) {

            activa = false;

            nuevaFecha = null;

        }


        const {
            error: updateError
        } =
            await supabaseClient
                .from("compras_tarjeta")
                .update({

                    meses_pagados:
                        nuevosMesesPagados,

                    saldo_pendiente:
                        nuevoSaldo,

                    fecha_primer_pago:
                        nuevaFecha,

                    activa:
                        activa

                })
                .eq(
                    "id",
                    compraId
                )
                .eq(
                    "usuario_id",
                    usuario.id
                );


        if (updateError) {

            throw updateError;

        }


        if (!silencioso) {

            alert(
                `Pago ${numeroPago} de ${mesesTotales} registrado correctamente.`
            );

        }


        if (recargar) {

            await cargarCalendario();

        }


        return true;


    } catch (error) {

        console.error(
            "Error registrando pago:",
            error
        );


        if (!silencioso) {

            alert(
                "No fue posible registrar el pago.\n\n" +
                obtenerMensajeError(error)
            );

        }

        return false;

    }

}



/* ============================================================
   MARCAR TODOS LOS PAGOS DE TARJETA DE LA QUINCENA
   ============================================================ */

async function marcarTodosLosPagosQuincena() {

    const primerDia =
        obtenerPrimerDiaMes(
            fechaCalendario
        );

    const ultimoDia =
        obtenerUltimoDiaMes(
            fechaCalendario
        );

    const dia15 =
        new Date(
            fechaCalendario.getFullYear(),
            fechaCalendario.getMonth(),
            15
        );

    let inicio;
    let fin;

    if (
        quincenaSeleccionada === "2"
    ) {

        inicio =
            new Date(
                fechaCalendario.getFullYear(),
                fechaCalendario.getMonth(),
                16
            );

        fin =
            ultimoDia;

    } else {

        inicio =
            primerDia;

        fin =
            dia15;

    }

    const movimientos =
        prepararMovimientosMes(
            primerDia,
            ultimoDia
        );

    const pagos =
        movimientos.filter(
            movimiento =>
                movimiento.tipo === "tarjeta" &&
                movimiento.compraId &&
                movimiento.fecha >= inicio &&
                movimiento.fecha <= fin
        );

    const compraIds = [
        ...new Set(
            pagos.map(
                movimiento =>
                    String(movimiento.compraId)
            )
        )
    ];

    if (compraIds.length === 0) {

        alert(
            "No hay pagos de tarjeta pendientes en esta quincena."
        );

        return;

    }

    const confirmar =
        window.confirm(
            `Se marcarán como pagados ${compraIds.length} pago(s) de tarjeta de esta quincena.\n\n` +
            `La fecha del pago será hoy y cada compra avanzará a su siguiente mensualidad.\n\n` +
            `¿Deseas continuar?`
        );

    if (!confirmar) {
        return;
    }

    let pagosRealizados = 0;

    for (const compraId of compraIds) {

        const resultado =
            await marcarPagoTarjetaCalendario(
                compraId,
                {
                    silencioso: true,
                    recargar: false
                }
            );

        if (!resultado) {
            alert(
                `Se procesaron ${pagosRealizados} de ${compraIds.length} pagos.`
            );
            await cargarCalendario();
            return;
        }

        pagosRealizados++;
    }

    alert(
        pagosRealizados === 1
            ? "Pago marcado como pagado correctamente."
            : `${pagosRealizados} pagos marcados como pagados correctamente.`
    );

    /*
     * Al recargar, los pagos realizados desaparecen
     * de esta quincena porque la fecha de su siguiente
     * mensualidad ya fue desplazada al siguiente periodo
     * que corresponda.
     */
    await cargarCalendario();

}




/* ============================================================
   TÍTULO DEL MES
   ============================================================ */

function actualizarTituloMes() {

    const elemento =
        document.getElementById(
            "mesActual"
        );


    if (!elemento) return;


    elemento.textContent =
        obtenerNombreMes(
            fechaCalendario,
            true
        );

}


/* ============================================================
   NOMBRE DEL MES
   ============================================================ */

function obtenerNombreMes(
    fecha,
    completo = false
) {

    let nombre =
        fecha.toLocaleDateString(
            "es-MX",
            {
                month: "long"
            }
        );


    if (completo) {

        nombre =
            nombre.charAt(0).toUpperCase() +
            nombre.slice(1) +
            " " +
            fecha.getFullYear();

    }


    return nombre;

}


/* ============================================================
   FECHAS DE INGRESOS
   ============================================================ */

function obtenerFechasIngresoEnMes(
    ingreso,
    primerDia,
    ultimoDia
) {

    const resultado = [];


    const fechaBaseTexto =
        ingreso.fecha ||
        ingreso.fecha_inicio ||
        ingreso.fecha_pago;


    if (!fechaBaseTexto) {

        return resultado;

    }


    const fechaBase =
        convertirFechaLocal(
            fechaBaseTexto
        );


    if (!fechaBase) {

        return resultado;

    }


    const frecuencia =
        String(
            ingreso.frecuencia ||
            ingreso.periodicidad ||
            ingreso.tipo_frecuencia ||
            "unico"
        ).toLowerCase();


    /* --------------------------------------------------------
       ÚNICO
    -------------------------------------------------------- */

    if (
        frecuencia.includes("unico") ||
        frecuencia.includes("único") ||
        frecuencia.includes("una")
    ) {

        if (
            estaDentroDelMes(
                fechaBase,
                primerDia,
                ultimoDia
            )
        ) {

            resultado.push(
                fechaBase
            );

        }


        return resultado;

    }


    /* --------------------------------------------------------
       QUINCENAL
    -------------------------------------------------------- */

    if (
        frecuencia.includes("quinc")
    ) {

        let fecha =
            new Date(
                fechaBase
            );


        while (
            fecha <= ultimoDia
        ) {

            if (
                fecha >= primerDia
            ) {

                resultado.push(
                    new Date(
                        fecha
                    )
                );

            }


            fecha =
                sumarDias(
                    fecha,
                    15
                );

        }


        return resultado;

    }


    /* --------------------------------------------------------
       SEMANAL
    -------------------------------------------------------- */

    if (
        frecuencia.includes("seman")
    ) {

        let fecha =
            new Date(
                fechaBase
            );


        while (
            fecha <= ultimoDia
        ) {

            if (
                fecha >= primerDia
            ) {

                resultado.push(
                    new Date(
                        fecha
                    )
                );

            }


            fecha =
                sumarDias(
                    fecha,
                    7
                );

        }


        return resultado;

    }


    /* --------------------------------------------------------
       MENSUAL
    -------------------------------------------------------- */

    if (
        frecuencia.includes("mens")
    ) {

        const fecha =
            crearFechaSegura(
                primerDia.getFullYear(),
                primerDia.getMonth(),
                fechaBase.getDate()
            );


        if (
            fecha >= primerDia &&
            fecha <= ultimoDia
        ) {

            resultado.push(
                fecha
            );

        }


        return resultado;

    }


    /* --------------------------------------------------------
       BIMESTRAL
    -------------------------------------------------------- */

    if (
        frecuencia.includes("bimes")
    ) {

        const diferencia =
            diferenciaMeses(
                fechaBase,
                primerDia
            );


        if (
            diferencia >= 0 &&
            diferencia % 2 === 0
        ) {

            const fecha =
                crearFechaSegura(
                    primerDia.getFullYear(),
                    primerDia.getMonth(),
                    fechaBase.getDate()
                );


            if (
                fecha >= primerDia &&
                fecha <= ultimoDia
            ) {

                resultado.push(
                    fecha
                );

            }

        }


        return resultado;

    }


    /* --------------------------------------------------------
       TRIMESTRAL
    -------------------------------------------------------- */

    if (
        frecuencia.includes("trim")
    ) {

        const diferencia =
            diferenciaMeses(
                fechaBase,
                primerDia
            );


        if (
            diferencia >= 0 &&
            diferencia % 3 === 0
        ) {

            const fecha =
                crearFechaSegura(
                    primerDia.getFullYear(),
                    primerDia.getMonth(),
                    fechaBase.getDate()
                );


            if (
                fecha >= primerDia &&
                fecha <= ultimoDia
            ) {

                resultado.push(
                    fecha
                );

            }

        }


        return resultado;

    }


    /* --------------------------------------------------------
       SEMESTRAL
    -------------------------------------------------------- */

    if (
        frecuencia.includes("semest")
    ) {

        const diferencia =
            diferenciaMeses(
                fechaBase,
                primerDia
            );


        if (
            diferencia >= 0 &&
            diferencia % 6 === 0
        ) {

            const fecha =
                crearFechaSegura(
                    primerDia.getFullYear(),
                    primerDia.getMonth(),
                    fechaBase.getDate()
                );


            if (
                fecha >= primerDia &&
                fecha <= ultimoDia
            ) {

                resultado.push(
                    fecha
                );

            }

        }


        return resultado;

    }


    /* --------------------------------------------------------
       ANUAL
    -------------------------------------------------------- */

    if (
        frecuencia.includes("anual")
    ) {

        if (
            fechaBase.getMonth() ===
            primerDia.getMonth()
        ) {

            const fecha =
                crearFechaSegura(
                    primerDia.getFullYear(),
                    primerDia.getMonth(),
                    fechaBase.getDate()
                );


            if (
                fecha >= primerDia &&
                fecha <= ultimoDia
            ) {

                resultado.push(
                    fecha
                );

            }

        }


        return resultado;

    }


    /* --------------------------------------------------------
       DESCONOCIDO = ÚNICO
    -------------------------------------------------------- */

    if (
        estaDentroDelMes(
            fechaBase,
            primerDia,
            ultimoDia
        )
    ) {

        resultado.push(
            fechaBase
        );

    }


    return resultado;

}


/* ============================================================
   FECHA INICIO DEL MES
   ============================================================ */

function obtenerPrimerDiaMes(
    fecha
) {

    return new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        1
    );

}


/* ============================================================
   FECHA FIN DEL MES
   ============================================================ */

function obtenerUltimoDiaMes(
    fecha
) {

    return new Date(
        fecha.getFullYear(),
        fecha.getMonth() + 1,
        0
    );

}


/* ============================================================
   VALIDAR MES
   ============================================================ */

function estaDentroDelMes(
    fecha,
    primerDia,
    ultimoDia
) {

    return (
        fecha >= primerDia &&
        fecha <= ultimoDia
    );

}


/* ============================================================
   CONVERTIR FECHA
   ============================================================ */

function convertirFechaLocal(
    valor
) {

    if (!valor) {

        return null;

    }


    if (
        valor instanceof Date
    ) {

        return new Date(
            valor.getFullYear(),
            valor.getMonth(),
            valor.getDate()
        );

    }


    const texto =
        String(
            valor
        );


    const coincidencia =
        texto.match(
            /^(\d{4})-(\d{2})-(\d{2})/
        );


    if (
        coincidencia
    ) {

        return new Date(
            parseInt(
                coincidencia[1],
                10
            ),
            parseInt(
                coincidencia[2],
                10
            ) - 1,
            parseInt(
                coincidencia[3],
                10
            )
        );

    }


    const fecha =
        new Date(
            valor
        );


    if (
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return null;

    }


    return new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate()
    );

}


/* ============================================================
   FECHA PARA DB
   ============================================================ */

function formatearFechaDB(
    fecha
) {

    const year =
        fecha.getFullYear();


    const month =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/* ============================================================
   FECHA COMPLETA
   ============================================================ */

function formatearFechaCompleta(
    fecha
) {

    const fechaLocal =
        fecha instanceof Date
            ? fecha
            : convertirFechaLocal(
                fecha
            );

    if (!fechaLocal) {
        return "Fecha no disponible";
    }

    const texto =
        fechaLocal.toLocaleDateString(
            "es-MX",
            {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric"
            }
        );

    return texto.charAt(0).toUpperCase() +
        texto.slice(1);

}


/* ============================================================
   SUMAR MESES
   ============================================================ */

function sumarMeses(
    fecha,
    cantidad
) {

    const resultado =
        new Date(
            fecha.getFullYear(),
            fecha.getMonth(),
            1
        );


    resultado.setMonth(
        resultado.getMonth() +
        cantidad
    );


    const ultimoDia =
        new Date(
            resultado.getFullYear(),
            resultado.getMonth() + 1,
            0
        ).getDate();


    resultado.setDate(
        Math.min(
            fecha.getDate(),
            ultimoDia
        )
    );


    return resultado;

}


/* ============================================================
   SUMAR DÍAS
   ============================================================ */

function sumarDias(
    fecha,
    cantidad
) {

    const resultado =
        new Date(
            fecha
        );


    resultado.setDate(
        resultado.getDate() +
        cantidad
    );


    return resultado;

}


/* ============================================================
   FECHA SEGURA
   ============================================================ */

function crearFechaSegura(
    year,
    month,
    day
) {

    const ultimoDia =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    return new Date(
        year,
        month,
        Math.min(
            day,
            ultimoDia
        )
    );

}


/* ============================================================
   DIFERENCIA DE MESES
   ============================================================ */

function diferenciaMeses(
    fecha1,
    fecha2
) {

    return (
        (
            fecha2.getFullYear() -
            fecha1.getFullYear()
        ) * 12
    ) +
    (
        fecha2.getMonth() -
        fecha1.getMonth()
    );

}


/* ============================================================
   NÚMERO
   ============================================================ */

function convertirNumero(
    valor
) {

    if (
        valor === null ||
        valor === undefined ||
        valor === ""
    ) {

        return 0;

    }


    const numero =
        Number(
            valor
        );


    return Number.isFinite(
        numero
    )
        ? numero
        : 0;

}


/* ============================================================
   MONEDA
   ============================================================ */

function formatearMoneda(
    importe
) {

    return new Intl.NumberFormat(
        "es-MX",
        {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    ).format(
        convertirNumero(
            importe
        )
    );

}


/* ============================================================
   COLOCAR TEXTO
   ============================================================ */

function colocarTexto(
    id,
    texto
) {

    const elemento =
        document.getElementById(
            id
        );


    if (elemento) {

        elemento.textContent =
            texto;

    }

}


/* ============================================================
   ESCAPAR HTML
   ============================================================ */

function escaparHTML(
    texto
) {

    if (
        texto === null ||
        texto === undefined
    ) {

        return "";

    }


    return String(texto)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* ============================================================
   ERROR
   ============================================================ */

function mostrarErrorCalendario(
    mensaje
) {

    const elemento =
        document.getElementById(
            "errorCalendario"
        );


    if (!elemento) return;


    elemento.textContent =
        mensaje;


    elemento.classList.remove(
        "oculto"
    );

}


/* ============================================================
   LIMPIAR ERROR
   ============================================================ */

function limpiarErrorCalendario() {

    const elemento =
        document.getElementById(
            "errorCalendario"
        );


    if (!elemento) return;


    elemento.textContent = "";


    elemento.classList.add(
        "oculto"
    );

}


/* ============================================================
   MENSAJE ERROR
   ============================================================ */

function obtenerMensajeError(
    error
) {

    if (!error) {

        return "Error desconocido.";

    }


    if (
        error.message
    ) {

        return error.message;

    }


    if (
        typeof error === "string"
    ) {

        return error;

    }


    return "Ocurrió un error inesperado.";

}


/* ============================================================
   HISTORIAL Y REVERSIÓN DE PAGOS
   ============================================================ */

async function obtenerPagosHistorialQuincena() {

    const contenedor =
        document.getElementById(
            "historialPagosCalendario"
        );

    if (!contenedor) return [];

    const {
        data: usuarioData,
        error: usuarioError
    } = await supabaseClient.auth.getUser();

    if (usuarioError) throw usuarioError;

    const usuario = usuarioData?.user;

    if (!usuario) {
        throw new Error("No hay un usuario autenticado.");
    }

    const { inicio, fin } = obtenerRangoQuincenaActual();

    const fechaInicio = formatearFechaDB(inicio);
    const fechaFin = formatearFechaDB(fin);

    const {
        data,
        error
    } = await supabaseClient
        .from("pagos_tarjeta")
        .select("id, tarjeta_id, importe, fecha, concepto, creado_en")
        .eq("usuario_id", usuario.id)
        .gte("fecha", fechaInicio)
        .lte("fecha", fechaFin)
        .order("fecha", { ascending: false })
        .order("creado_en", { ascending: false });

    if (error) throw error;

    return data || [];
}

function extraerNumeroPagoHistorial(concepto) {

    const texto = String(concepto || "");

    const coincidencia = texto.match(/-\s*Pago\s+(\d+)\s+de\s+(\d+)\s*$/i);

    if (!coincidencia) return null;

    return {
        numero: Number(coincidencia[1]),
        total: Number(coincidencia[2])
    };
}

function obtenerConceptoBaseHistorial(concepto) {

    const texto = String(concepto || "");

    return texto.replace(/\s*-\s*Pago\s+\d+\s+de\s+\d+\s*$/i, "").trim();
}

function escaparAtributoHTML(valor) {

    return escaparHTML(String(valor ?? ""))
        .replace(/'/g, "&#39;")
        .replace(/"/g, "&quot;");
}

async function renderizarHistorialPagosCalendario() {

    const contenedor =
        document.getElementById(
            "historialPagosCalendario"
        );

    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="dashboard-vacio">
            <div class="dashboard-vacio-icono">📋</div>
            <h3>Consultando historial...</h3>
            <p>Estamos buscando los pagos realizados en esta quincena.</p>
        </div>
    `;

    try {

        const pagos = await obtenerPagosHistorialQuincena();

        if (!pagos.length) {
            contenedor.innerHTML = `
                <div class="panel-dashboard">
                    <div class="panel-dashboard-titulo">
                        <div>
                            <h2>📋 Historial de pagos realizados</h2>
                            <p>No hay pagos de tarjetas registrados en esta quincena.</p>
                        </div>
                    </div>
                </div>
            `;
            return;
        }

        const filas = pagos.map(pago => {

            const info = extraerNumeroPagoHistorial(pago.concepto);
            const conceptoBase = obtenerConceptoBaseHistorial(pago.concepto);

            const detalle = info
                ? `Pago ${info.numero} de ${info.total}`
                : "Pago registrado";

            return `
                <tr>
                    <td>${formatearFechaCompleta(pago.fecha)}</td>
                    <td>
                        <strong>${escaparHTML(conceptoBase)}</strong><br>
                        <small>${escaparHTML(detalle)}</small>
                    </td>
                    <td class="texto-derecha texto-rojo">
                        <strong>${formatearMoneda(convertirNumero(pago.importe))}</strong>
                    </td>
                    <td>
                        <button
                            type="button"
                            class="btn-secundario"
                            onclick="revertirPagoTarjetaCalendario('${escaparAtributoHTML(pago.id)}')">
                            ↩️ Revertir
                        </button>
                    </td>
                </tr>
            `;
        }).join("");

        contenedor.innerHTML = `
            <div class="panel-dashboard">
                <div class="panel-dashboard-titulo">
                    <div>
                        <h2>📋 Historial de pagos realizados</h2>
                        <p>Pagos registrados durante esta quincena. Puedes revertir un pago si fue registrado por error.</p>
                    </div>
                </div>

                <div class="tabla-contenedor">
                    <table>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Concepto</th>
                                <th class="texto-derecha">Importe</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filas}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

    } catch (error) {

        console.error(
            "Error cargando historial de pagos:",
            error
        );

        contenedor.innerHTML = `
            <div class="mensaje mensaje-error">
                No fue posible cargar el historial de pagos.<br>
                ${escaparHTML(obtenerMensajeError(error))}
            </div>
        `;
    }
}

async function revertirPagoTarjetaCalendario(pagoId) {

    if (!pagoId) return;

    const confirmar = window.confirm(
        "¿Confirmas que quieres revertir este pago?\n\n" +
        "El registro del pago se eliminará y la mensualidad volverá a aparecer como pendiente en el calendario."
    );

    if (!confirmar) return;

    try {

        const {
            data: usuarioData,
            error: usuarioError
        } = await supabaseClient.auth.getUser();

        if (usuarioError) throw usuarioError;

        const usuario = usuarioData?.user;

        if (!usuario) {
            throw new Error("No hay un usuario autenticado.");
        }

        const {
            data: pago,
            error: pagoError
        } = await supabaseClient
            .from("pagos_tarjeta")
            .select("*")
            .eq("id", pagoId)
            .eq("usuario_id", usuario.id)
            .single();

        if (pagoError) throw pagoError;

        if (!pago) {
            throw new Error("No se encontró el pago que quieres revertir.");
        }

        const info = extraerNumeroPagoHistorial(pago.concepto);

        if (!info) {
            throw new Error(
                "No se pudo identificar el número de pago de este registro."
            );
        }

        const conceptoBase = obtenerConceptoBaseHistorial(pago.concepto);

        const {
            data: compras,
            error: comprasError
        } = await supabaseClient
            .from("compras_tarjeta")
            .select("*")
            .eq("usuario_id", usuario.id)
            .eq("tarjeta_id", pago.tarjeta_id)
            .eq("concepto", conceptoBase);

        if (comprasError) throw comprasError;

        if (!compras || compras.length === 0) {
            throw new Error(
                "No se encontró la compra de tarjeta asociada a este pago."
            );
        }

        /*
         * Solo permitimos revertir el último pago registrado de esa compra.
         * Esto evita dejar una compra con pagos posteriores sin respaldo.
         */
        const candidatos = compras.filter(compra =>
            Number(compra.meses_pagados || 0) === info.numero
        );

        if (candidatos.length !== 1) {
            throw new Error(
                candidatos.length === 0
                    ? "Este pago ya no corresponde al último pago de la compra. Si existen pagos posteriores, revierte primero el más reciente."
                    : "Hay más de una compra con el mismo concepto y no es seguro determinar cuál corresponde al pago."
            );
        }

        const compra = candidatos[0];

        const mesesPagadosActuales = Number(compra.meses_pagados || 0);
        const mesesTotales = Number(compra.meses_totales || 1);
        const importePago = convertirNumero(pago.importe);
        const saldoActual = convertirNumero(compra.saldo_pendiente);

        const nuevosMesesPagados = Math.max(
            mesesPagadosActuales - 1,
            0
        );

        const nuevoSaldo =
            Math.max(saldoActual + importePago, 0);

        /*
         * La fecha del registro en pagos_tarjeta es la fecha programada
         * que queremos recuperar al revertir el pago.
         */
        const fechaRestaurada =
            formatearFechaDB(
                convertirFechaLocal(pago.fecha)
            );

        const nuevaActiva =
            nuevosMesesPagados < mesesTotales &&
            nuevoSaldo > 0;

        const { error: updateError } =
            await supabaseClient
                .from("compras_tarjeta")
                .update({
                    meses_pagados: nuevosMesesPagados,
                    saldo_pendiente: nuevoSaldo,
                    fecha_primer_pago: fechaRestaurada,
                    activa: nuevaActiva
                })
                .eq("id", compra.id)
                .eq("usuario_id", usuario.id);

        if (updateError) throw updateError;

        const { error: deleteError } =
            await supabaseClient
                .from("pagos_tarjeta")
                .delete()
                .eq("id", pago.id)
                .eq("usuario_id", usuario.id);

        if (deleteError) {
            /*
             * Si por alguna razón no se pudo borrar el pago, intentamos
             * devolver la compra a su estado anterior para no dejar datos
             * inconsistentes.
             */
            await supabaseClient
                .from("compras_tarjeta")
                .update({
                    meses_pagados: mesesPagadosActuales,
                    saldo_pendiente: saldoActual,
                    fecha_primer_pago: compra.fecha_primer_pago,
                    activa: compra.activa
                })
                .eq("id", compra.id)
                .eq("usuario_id", usuario.id);

            throw deleteError;
        }

        alert(
            `Pago ${info.numero} de ${info.total} revertido correctamente.`
        );

        await cargarCalendario();

    } catch (error) {

        console.error(
            "Error revirtiendo pago:",
            error
        );

        alert(
            "No fue posible revertir el pago.\n\n" +
            obtenerMensajeError(error)
        );
    }
}

function crearHTMLPagoHistorial(pago) {

    const info = extraerNumeroPagoHistorial(pago.concepto);
    const conceptoBase = obtenerConceptoBaseHistorial(pago.concepto);
    const detalle = info
        ? `Pago ${info.numero} de ${info.total}`
        : "Pago registrado";

    return `
        <div class="historial-pago-item">
            <div class="historial-pago-info">
                <span class="historial-pago-concepto">${escaparHTML(conceptoBase || "Pago de tarjeta")}</span>
                <span class="historial-pago-fecha">${escaparHTML(formatearFechaCompleta(pago.fecha))} · ${escaparHTML(detalle)}</span>
            </div>
            <div class="historial-pago-importe">${formatearMoneda(convertirNumero(pago.importe))}</div>
            <button
                type="button"
                class="btn-secundario"
                onclick="revertirPagoTarjetaCalendario('${escaparAtributoHTML(pago.id)}')">
                ↩️ Revertir
            </button>
        </div>
    `;
}


async function abrirHistorialPagosCalendario() {

    const modal =
        document.getElementById(
            "modalHistorialPagos"
        );

    const contenedor =
        document.getElementById(
            "listaHistorialPagos"
        );

    const periodo =
        document.getElementById(
            "historialPeriodo"
        );

    if (!modal || !contenedor) {

        console.error(
            "No se encontró el modal del historial."
        );

        return;

    }


    modal.classList.add(
        "visible"
    );

    modal.setAttribute(
        "aria-hidden",
        "false"
    );


    contenedor.innerHTML = `

        <div class="historial-vacio">

            ⏳ Cargando pagos realizados...

        </div>

    `;


    const rango =
        obtenerRangoQuincenaActual();


    if (periodo) {

        periodo.textContent =
            `${formatearFechaCorta(rango.inicio)} al ${formatearFechaCorta(rango.fin)}`;

    }


    try {

        const {
            data: usuarioData,
            error: usuarioError
        } =
            await supabaseClient.auth.getUser();


        if (usuarioError) {

            throw usuarioError;

        }


        const usuario =
            usuarioData?.user;


        if (!usuario) {

            throw new Error(
                "No hay un usuario autenticado."
            );

        }


        const fechaInicio =
            formatearFechaDB(
                rango.inicio
            );


        const fechaFin =
            formatearFechaDB(
                rango.fin
            );


        const {
            data,
            error
        } =
            await supabaseClient
                .from("pagos_tarjeta")
                .select(
                    "id,importe,fecha,concepto,tarjeta_id"
                )
                .eq(
                    "usuario_id",
                    usuario.id
                )
                .gte(
                    "fecha",
                    fechaInicio
                )
                .lte(
                    "fecha",
                    fechaFin
                )
                .order(
                    "fecha",
                    {
                        ascending: false
                    }
                );


        if (error) {

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            contenedor.innerHTML = `

                <div class="historial-vacio">

                    <div style="font-size:40px;">
                        📋
                    </div>

                    <h3>
                        No hay pagos realizados
                    </h3>

                    <p>
                        Todavía no has registrado
                        pagos en esta quincena.
                    </p>

                </div>

            `;

            return;

        }


        let html = "";


        for (
            const pago
            of data
        ) {

            html +=
                crearHTMLPagoHistorial(
                    pago
                );

        }


        contenedor.innerHTML =
            html;


    } catch (error) {

        console.error(
            "Error cargando historial:",
            error
        );


        contenedor.innerHTML = `

            <div class="historial-vacio">

                ❌ No fue posible cargar
                el historial.

                <br><br>

                ${escaparHTML(
                    obtenerMensajeError(error)
                )}

            </div>

        `;

    }

}

function configurarBotonHistorialPagos() {

    const boton =
        document.getElementById(
            "btnHistorialPagos"
        );


    if (!boton) {

        console.warn(
            "No se encontró el botón de historial."
        );

        return;

    }


    /*
     * Evitar registrar el evento
     * más de una vez.
     */

    if (
        boton.dataset.historialConfigurado ===
        "true"
    ) {

        return;

    }


    boton.dataset.historialConfigurado =
        "true";


    boton.addEventListener(
        "click",
        async function () {

            await abrirHistorialPagosCalendario();

        }
    );

}

function configurarCerrarHistorialPagos() {

    const modal =
        document.getElementById(
            "modalHistorialPagos"
        );


    const boton =
        document.getElementById(
            "btnCerrarHistorialPagos"
        );


    if (!modal || !boton) {

        return;

    }


    if (
        boton.dataset.cierreConfigurado ===
        "true"
    ) {

        return;

    }


    boton.dataset.cierreConfigurado =
        "true";


    boton.addEventListener(
        "click",
        function () {

            modal.classList.remove(
                "visible"
            );

            modal.setAttribute(
                "aria-hidden",
                "true"
            );

        }
    );


    modal.addEventListener(
        "click",
        function (evento) {

            if (
                evento.target ===
                modal
            ) {

                modal.classList.remove(
                    "visible"
                );

                modal.setAttribute(
                    "aria-hidden",
                    "true"
                );

            }

        }
    );

}

function formatearFechaCorta(
    fecha
) {

    if (!fecha) {

        return "";

    }


    const fechaLocal =
        fecha instanceof Date
            ? fecha
            : convertirFechaLocal(
                fecha
            );


    if (!fechaLocal) {

        return "";

    }


    return fechaLocal.toLocaleDateString(
        "es-MX",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}

function obtenerRangoQuincenaActual() {

    const anio =
        fechaCalendario.getFullYear();

    const mes =
        fechaCalendario.getMonth();

    if (quincenaSeleccionada === "2") {
        return {
            inicio: new Date(anio, mes, 16),
            fin: new Date(anio, mes + 1, 0)
        };
    }

    return {
        inicio: new Date(anio, mes, 1),
        fin: new Date(anio, mes, 15)
    };
}

document.addEventListener(
    "DOMContentLoaded",
    function () {
        configurarBotonHistorialPagos();
        configurarCerrarHistorialPagos();
    }
);
