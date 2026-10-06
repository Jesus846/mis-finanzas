// ======================================================
// DASHBOARD
// MIS FINANZAS
// ======================================================


// ======================================================
// INICIO
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    // Mostrar fecha
    mostrarFechaDashboard();


    // Comprobar conexión
    await comprobarConexionDashboard();


    // Cargar información del Dashboard
    await cargarDashboard();

});


// ======================================================
// CARGAR TODO EL DASHBOARD
// ======================================================

async function cargarDashboard() {

    try {

        console.log("Cargando dashboard...");

        const {
            data: {
                user
            },
            error: errorUsuario
        } = await supabaseClient.auth.getUser();


        if (errorUsuario || !user) {

            console.error(
                "No se pudo obtener el usuario:",
                errorUsuario
            );

            return;
        }


        const usuarioId = user.id;


        // --------------------------------------------------
        // Cargar información
        // --------------------------------------------------

        const cuentas =
            await obtenerCuentasDashboard(usuarioId);

        const ingresos =
            await obtenerIngresosDashboard(usuarioId);

        const gastos =
            await obtenerGastosDashboard(usuarioId);

        const tarjetas =
            await obtenerTarjetasDashboard(usuarioId);

        const comprasTarjeta =
            await obtenerComprasTarjetaDashboard(usuarioId);


        // --------------------------------------------------
        // Calcular totales
        // --------------------------------------------------

        const totalIngresos =
            calcularTotalIngresos(ingresos);


        const totalGastos =
            calcularTotalGastos(gastos);


        const dineroDisponible =
            calcularDineroDisponible(cuentas);


        const deudaTarjetas =
            calcularDeudaTarjetas(comprasTarjeta);


        const pagoTarjetas =
            calcularPagoTarjetas(
                comprasTarjeta
            );


        // --------------------------------------------------
        // Mostrar información
        // --------------------------------------------------

        mostrarDineroDisponible(
            dineroDisponible
        );


        mostrarTotalIngresos(
            totalIngresos
        );


        mostrarTotalGastos(
            totalGastos
        );


        mostrarTotalTarjetas(
            pagoTarjetas
        );


        mostrarProximosCompromisos(
            tarjetas,
            comprasTarjeta
        );


        mostrarRecomendaciones(
            cuentas,
            ingresos,
            gastos,
            comprasTarjeta
        );


        console.log(
            "Dashboard cargado correctamente.",
            {
                dineroDisponible,
                totalIngresos,
                totalGastos,
                deudaTarjetas,
                pagoTarjetas
            }
        );


    } catch (error) {

        console.error(
            "Error cargando dashboard:",
            error
        );

    }

}


// ======================================================
// CUENTAS
// ======================================================

async function obtenerCuentasDashboard(usuarioId) {

    const {
        data,
        error
    } = await supabaseClient
        .from("cuentas")
        .select(`
            id,
            usuario_id,
            nombre,
            tipo,
            saldo,
            activa
        `)
        .eq("usuario_id", usuarioId)
        .eq("activa", true);


    if (error) {

        console.error(
            "Error obteniendo cuentas:",
            error
        );

        return [];

    }


    return data || [];

}


// ======================================================
// INGRESOS
// ======================================================

async function obtenerIngresosDashboard(usuarioId) {

    const {
        data,
        error
    } = await supabaseClient
        .from("ingresos")
        .select(`
            id,
            usuario_id,
            concepto,
            importe,
            fecha,
            frecuencia,
            cuenta_id,
            activo
        `)
        .eq("usuario_id", usuarioId)
        .eq("activo", true)
        .order("fecha", {
            ascending: false
        });


    if (error) {

        console.error(
            "Error obteniendo ingresos para Dashboard:",
            error
        );

        return [];

    }


    console.log(
        "Ingresos encontrados para Dashboard:",
        data
    );


    return data || [];

}


// ======================================================
// GASTOS
// ======================================================

async function obtenerGastosDashboard(usuarioId) {

    const {
        data,
        error
    } = await supabaseClient
        .from("gastos")
        .select(`
            id,
            usuario_id,
            concepto,
            importe,
            fecha,
            tipo,
            activo
        `)
        .eq("usuario_id", usuarioId)
        .eq("activo", true);


    if (error) {

        console.error(
            "Error obteniendo gastos:",
            error
        );

        return [];

    }


    return data || [];

}


// ======================================================
// TARJETAS
// ======================================================

async function obtenerTarjetasDashboard(usuarioId) {

    const {
        data,
        error
    } = await supabaseClient
        .from("tarjetas")
        .select(`
            id,
            usuario_id,
            nombre,
            banco,
            limite,
            dia_corte,
            dia_pago,
            activa
        `)
        .eq("usuario_id", usuarioId)
        .eq("activa", true);


    if (error) {

        console.error(
            "Error obteniendo tarjetas:",
            error
        );

        return [];

    }


    return data || [];

}


// ======================================================
// COMPRAS DE TARJETAS
// ======================================================

async function obtenerComprasTarjetaDashboard(usuarioId) {

    const {
        data,
        error
    } = await supabaseClient
        .from("compras_tarjeta")
        .select(`
            id,
            usuario_id,
            tarjeta_id,
            concepto,
            monto_original,
            tipo,
            meses_totales,
            meses_pagados,
            mensualidad,
            saldo_pendiente,
            fecha_compra,
            fecha_primer_pago,
            fecha_fin,
            activa
        `)
        .eq("usuario_id", usuarioId)
        .eq("activa", true);


    if (error) {

        console.error(
            "Error obteniendo compras de tarjetas:",
            error
        );

        return [];

    }


    return data || [];

}


// ======================================================
// CALCULAR INGRESOS
// ======================================================

function calcularTotalIngresos(ingresos) {

    return ingresos.reduce(
        (total, ingreso) => {

            return total +
                Number(
                    ingreso.importe || 0
                );

        },
        0
    );

}


// ======================================================
// CALCULAR GASTOS
// ======================================================

function calcularTotalGastos(gastos) {

    return gastos.reduce(
        (total, gasto) => {

            return total +
                Number(
                    gasto.importe || 0
                );

        },
        0
    );

}


// ======================================================
// DINERO DISPONIBLE
// ======================================================

function calcularDineroDisponible(cuentas) {

    return cuentas.reduce(
        (total, cuenta) => {

            return total +
                Number(
                    cuenta.saldo || 0
                );

        },
        0
    );

}


// ======================================================
// DEUDA TOTAL DE TARJETAS
// ======================================================

function calcularDeudaTarjetas(compras) {

    return compras.reduce(
        (total, compra) => {

            return total +
                Number(
                    compra.saldo_pendiente || 0
                );

        },
        0
    );

}


// ======================================================
// PAGO DEL PERIODO DE TARJETAS
// ======================================================
//
// Normal:
// Se considera pendiente todo el saldo.
//
// MSI:
// Se considera una mensualidad.
//
// IMPORTANTE:
// Esto es una estimación de la aplicación.
// Todavía no representa el estado de cuenta real
// del banco.
//

function calcularPagoTarjetas(compras) {

    return compras.reduce(
        (total, compra) => {

            const saldo =
                Number(
                    compra.saldo_pendiente || 0
                );


            if (
                compra.tipo === "meses"
            ) {

                const mensualidad =
                    Number(
                        compra.mensualidad || 0
                    );


                return total +
                    Math.min(
                        mensualidad,
                        saldo
                    );

            }


            return total + saldo;

        },
        0
    );

}


// ======================================================
// MOSTRAR DINERO DISPONIBLE
// ======================================================

function mostrarDineroDisponible(
    importe
) {

    const elemento =
        document.getElementById(
            "dineroDisponible"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        formatearMonedaDashboard(
            importe
        );

}


// ======================================================
// MOSTRAR INGRESOS
// ======================================================

function mostrarTotalIngresos(
    importe
) {

    const elemento =
        document.getElementById(
            "totalIngresos"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        formatearMonedaDashboard(
            importe
        );

}


// ======================================================
// MOSTRAR GASTOS
// ======================================================

function mostrarTotalGastos(
    importe
) {

    const elemento =
        document.getElementById(
            "totalGastosResumen"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        formatearMonedaDashboard(
            importe
        );

}


// ======================================================
// MOSTRAR TARJETAS
// ======================================================

function mostrarTotalTarjetas(
    importe
) {

    const elemento =
        document.getElementById(
            "totalPagoTarjetas"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        formatearMonedaDashboard(
            importe
        );

}


// ======================================================
// PRÓXIMOS COMPROMISOS
// ======================================================

function mostrarProximosCompromisos(
    tarjetas,
    compras
) {

    const contenedor =
        document.getElementById(
            "proximosCompromisos"
        );


    if (!contenedor) {
        return;
    }


    const compromisos = [];


    // --------------------------------------------------
    // Pagos de tarjetas
    // --------------------------------------------------

    tarjetas.forEach(
        tarjeta => {

            if (
                tarjeta.dia_pago
            ) {

                compromisos.push({

                    tipo: "tarjeta",

                    fecha:
                        crearFechaProximoPago(
                            tarjeta.dia_pago
                        ),

                    nombre:
                        tarjeta.nombre,

                    importe:
                        calcularPagoTarjetaIndividual(
                            tarjeta.id,
                            compras
                        )

                });

            }

        }
    );


    // --------------------------------------------------
    // Ordenar por fecha
    // --------------------------------------------------

    compromisos.sort(
        (a, b) =>
            a.fecha - b.fecha
    );


    // --------------------------------------------------
    // Mostrar máximo 5
    // --------------------------------------------------

    const proximos =
        compromisos.slice(0, 5);


    if (proximos.length === 0) {

        contenedor.innerHTML = `

            <div class="dashboard-vacio">

                <span>📅</span>

                <p>
                    No hay próximos pagos registrados.
                </p>

            </div>

        `;

        return;

    }


    contenedor.innerHTML =
        proximos.map(
            compromiso => {

                return `

                    <div class="compromiso-dashboard">

                        <div>

                            <strong>
                                💳
                                ${escaparHTMLDashboard(
                                    compromiso.nombre
                                )}
                            </strong>

                            <small>
                                Pago
                                ${formatearFechaDashboard(
                                    compromiso.fecha
                                )}
                            </small>

                        </div>

                        <strong>
                            ${formatearMonedaDashboard(
                                compromiso.importe
                            )}
                        </strong>

                    </div>

                `;

            }
        ).join("");

}


// ======================================================
// CALCULAR PAGO INDIVIDUAL
// ======================================================

function calcularPagoTarjetaIndividual(
    tarjetaId,
    compras
) {

    const comprasTarjeta =
        compras.filter(
            compra =>
                compra.tarjeta_id === tarjetaId
        );


    return calcularPagoTarjetas(
        comprasTarjeta
    );

}


// ======================================================
// CREAR PRÓXIMA FECHA DE PAGO
// ======================================================

function crearFechaProximoPago(
    dia
) {

    const hoy =
        new Date();


    let anio =
        hoy.getFullYear();


    let mes =
        hoy.getMonth();


    let fecha =
        new Date(
            anio,
            mes,
            Number(dia)
        );


    if (
        fecha < hoy
    ) {

        fecha =
            new Date(
                anio,
                mes + 1,
                Number(dia)
            );

    }


    return fecha;

}


// ======================================================
// RECOMENDACIONES
// ======================================================

function mostrarRecomendaciones(
    cuentas,
    ingresos,
    gastos,
    compras
) {

    const contenedor =
        document.getElementById(
            "recomendaciones"
        );


    if (!contenedor) {
        return;
    }


    const dineroDisponible =
        calcularDineroDisponible(
            cuentas
        );


    const deudaTarjetas =
        calcularDeudaTarjetas(
            compras
        );


    const recomendaciones = [];


    // --------------------------------------------------
    // Dinero disponible
    // --------------------------------------------------

    if (
        dineroDisponible <= 0
    ) {

        recomendaciones.push({

            icono: "⚠️",

            texto:
                "Actualmente no tienes dinero disponible registrado en tus cuentas."

        });

    }
    else {

        recomendaciones.push({

            icono: "💰",

            texto:
                `Tienes ${formatearMonedaDashboard(
                    dineroDisponible
                )} disponible en tus cuentas.`

        });

    }


    // --------------------------------------------------
    // Tarjetas
    // --------------------------------------------------

    if (
        deudaTarjetas > 0
    ) {

        recomendaciones.push({

            icono: "💳",

            texto:
                `Tu deuda registrada en tarjetas es de ${formatearMonedaDashboard(
                    deudaTarjetas
                )}.`

        });

    }


    // --------------------------------------------------
    // Compras sin deuda
    // --------------------------------------------------

    if (
        compras.length === 0
    ) {

        recomendaciones.push({

            icono: "✅",

            texto:
                "No tienes compras de tarjeta pendientes registradas."

        });

    }


    // --------------------------------------------------
    // Mostrar
    // --------------------------------------------------

    contenedor.innerHTML =
        recomendaciones.map(
            recomendacion => {

                return `

                    <div class="recomendacion-dashboard">

                        <span>
                            ${recomendacion.icono}
                        </span>

                        <p>
                            ${escaparHTMLDashboard(
                                recomendacion.texto
                            )}
                        </p>

                    </div>

                `;

            }
        ).join("");

}


// ======================================================
// FORMATEAR MONEDA
// ======================================================

function formatearMonedaDashboard(
    importe
) {

    return Number(
        importe || 0
    ).toLocaleString(
        "es-MX",
        {
            style: "currency",
            currency: "MXN"
        }
    );

}


// ======================================================
// FORMATEAR FECHA
// ======================================================

function formatearFechaDashboard(
    fecha
) {

    return fecha.toLocaleDateString(
        "es-MX",
        {
            day: "numeric",
            month: "short"
        }
    );

}


// ======================================================
// ESCAPAR HTML
// ======================================================

function escaparHTMLDashboard(
    texto
) {

    return String(
        texto || ""
    )
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

// ======================================================
// FECHA DEL DASHBOARD
// ======================================================

function mostrarFechaDashboard() {

    const elemento =
        document.getElementById("fechaActual");

    if (!elemento) {
        return;
    }

    const fecha =
        new Date();

    elemento.textContent =
        fecha.toLocaleDateString(
            "es-MX",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );

}


// ======================================================
// COMPROBAR CONEXIÓN CON SUPABASE
// ======================================================

async function comprobarConexionDashboard() {

    const elemento =
        document.getElementById("estadoConexion");

    if (!elemento) {
        return;
    }


    try {

        elemento.textContent =
            "Comprobando conexión...";


        const {
            data,
            error
        } = await supabaseClient
            .from("profiles")
            .select("id")
            .limit(1);


        if (error) {

            console.error(
                "Error comprobando Supabase:",
                error
            );

            elemento.textContent =
                "⚠️ Supabase respondió, pero hubo un problema al consultar.";

            return;

        }


        elemento.textContent =
            "✅ Conexión con Supabase funcionando correctamente.";


    } catch (error) {

        console.error(
            "Error de conexión:",
            error
        );

        elemento.textContent =
            "❌ No fue posible conectar con Supabase.";

    }

}