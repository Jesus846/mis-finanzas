// ======================================================
// TARJETAS
// MIS FINANZAS
// ======================================================

let tarjetaEditandoId = null;

let tarjetasCargadas = [];
let comprasCargadas = [];
let tarjetaSeleccionadaId = "";



// ======================================================
// FECHA
// ======================================================

function mostrarFechaTarjetas() {

    const elemento =
        document.getElementById("fechaActual");

    if (!elemento) {
        return;
    }

    const ahora = new Date();

    const fecha =
        ahora.toLocaleDateString(
            "es-MX",
            {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    elemento.textContent =
        fecha.charAt(0).toUpperCase() +
        fecha.slice(1);
}


// ======================================================
// USUARIO
// ======================================================

async function obtenerUsuarioTarjeta() {

    const {
        data: {
            user
        },
        error
    } =
        await supabaseClient.auth.getUser();

    if (error || !user) {

        console.error(
            "No se pudo obtener el usuario:",
            error
        );

        return null;
    }

    return user;
}


// ======================================================
// FECHA LOCAL
// ======================================================

function obtenerFechaLocal() {

    const fecha = new Date();

    return (
        fecha.getFullYear() +
        "-" +
        String(
            fecha.getMonth() + 1
        ).padStart(2, "0") +
        "-" +
        String(
            fecha.getDate()
        ).padStart(2, "0")
    );
}


function crearFechaLocalTarjeta(fecha) {

    if (!fecha) {
        return null;
    }

    if (fecha instanceof Date) {

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

    const partes =
        String(fecha)
            .slice(0, 10)
            .split("-")
            .map(Number);

    if (
        partes.length !== 3 ||
        partes.some(
            numero =>
                Number.isNaN(numero)
        )
    ) {
        return null;
    }

    return new Date(
        partes[0],
        partes[1] - 1,
        partes[2]
    );
}


// ======================================================
// CALENDARIO
// ======================================================

function obtenerDiaValidoMesTarjeta(
    anio,
    mes,
    dia
) {

    const ultimoDia =
        new Date(
            anio,
            mes + 1,
            0
        ).getDate();

    return Math.min(
        Math.max(
            Number(dia) || 1,
            1
        ),
        ultimoDia
    );
}


function sumarMesesFechaTarjeta(
    fecha,
    meses
) {

    const original =
        crearFechaLocalTarjeta(
            fecha
        );

    if (!original) {
        return null;
    }

    const cantidad =
        Number(meses || 0);

    const resultado =
        new Date(
            original.getFullYear(),
            original.getMonth() + cantidad,
            1
        );

    resultado.setDate(
        obtenerDiaValidoMesTarjeta(
            resultado.getFullYear(),
            resultado.getMonth(),
            original.getDate()
        )
    );

    return resultado;
}


function obtenerFechaCorteTarjeta(
    fechaCompra,
    diaCorte
) {

    const fecha =
        crearFechaLocalTarjeta(
            fechaCompra
        );

    if (!fecha) {
        return null;
    }

    let anio =
        fecha.getFullYear();

    let mes =
        fecha.getMonth();

    const corte =
        obtenerDiaValidoMesTarjeta(
            anio,
            mes,
            diaCorte
        );

    /*
       Una compra realizada exactamente
       el día de corte pertenece al
       siguiente periodo.
    */

    if (
        fecha.getDate() >= corte
    ) {

        mes++;

        if (mes > 11) {

            mes = 0;
            anio++;

        }
    }

    return new Date(
        anio,
        mes,
        obtenerDiaValidoMesTarjeta(
            anio,
            mes,
            diaCorte
        )
    );
}


function obtenerFechaPagoTarjeta(
    fechaCorte,
    tarjeta
) {

    const corte =
        crearFechaLocalTarjeta(
            fechaCorte
        );

    if (!corte) {
        return null;
    }

    const diaPago =
        Number(
            tarjeta.dia_pago || 0
        );

    const diaLimite =
        Number(
            tarjeta.dia_limite || 0
        );

    const dia =
        diaPago > 0
            ? diaPago
            : (
                diaLimite > 0
                    ? diaLimite
                    : 30
            );

    let anio =
        corte.getFullYear();

    let mes =
        corte.getMonth();

    if (
        dia <= corte.getDate()
    ) {

        mes++;

        if (mes > 11) {

            mes = 0;
            anio++;

        }
    }

    return new Date(
        anio,
        mes,
        obtenerDiaValidoMesTarjeta(
            anio,
            mes,
            dia
        )
    );
}


// ======================================================
// PRIMER PAGO
// ======================================================

function obtenerPrimerPagoTarjeta(
    compra,
    tarjeta
) {

    /*
       La fecha base se calcula siempre
       desde la fecha original de compra.

       Esto permite que meses_pagados
       determine cuál es el siguiente pago.

       Ejemplo:

       9 MSI
       3 pagos realizados

       siguiente pago =
       primer pago + 3 meses
    */

    const fechaCompra =
        crearFechaLocalTarjeta(
            compra.fecha_compra
        );

    if (!fechaCompra) {
        return null;
    }

    const corte =
        obtenerFechaCorteTarjeta(
            fechaCompra,
            tarjeta.dia_corte
        );

    return obtenerFechaPagoTarjeta(
        corte,
        tarjeta
    );
}


function obtenerFechaPagoCompraTarjeta(
    compra,
    tarjeta
) {

    const primerPago =
        obtenerPrimerPagoTarjeta(
            compra,
            tarjeta
        );

    if (!primerPago) {
        return null;
    }

    if (
        compra.tipo === "meses"
    ) {

        const pagosRealizados =
            Number(
                compra.meses_pagados || 0
            );

        return sumarMesesFechaTarjeta(
            primerPago,
            pagosRealizados
        );
    }

    return primerPago;
}


// ======================================================
// PERIODO ACTUAL
// ======================================================

function compraEsDelPeriodoActual(
    compra,
    tarjeta,
    fechaReferencia = new Date()
) {

    const fechaPago =
        obtenerFechaPagoCompraTarjeta(
            compra,
            tarjeta
        );

    if (!fechaPago) {
        return false;
    }

    const referencia =
        crearFechaLocalTarjeta(
            fechaReferencia
        );

    return (
        fechaPago.getFullYear() ===
        referencia.getFullYear() &&

        fechaPago.getMonth() ===
        referencia.getMonth()
    );
}


// ======================================================
// MONTO DEL PAGO DE UNA COMPRA
// ======================================================

function obtenerMontoPagoCompraTarjeta(
    compra
) {

    const saldo =
        Number(
            compra.saldo_pendiente || 0
        );

    if (saldo <= 0) {
        return 0;
    }

    if (
        compra.tipo === "normal"
    ) {

        return saldo;
    }

    return Math.min(
        Number(
            compra.mensualidad || 0
        ),
        saldo
    );
}


// ======================================================
// OBTENER COMPRAS DEL PERIODO
// ======================================================

function obtenerComprasPeriodoTarjeta(
    tarjeta,
    compras
) {

    return compras.filter(
        compra => {

            if (
                String(
                    compra.tarjeta_id
                ) !==
                String(
                    tarjeta.id
                )
            ) {
                return false;
            }

            if (
                Number(
                    compra.saldo_pendiente || 0
                ) <= 0
            ) {
                return false;
            }

            return compraEsDelPeriodoActual(
                compra,
                tarjeta
            );

        }
    );
}


// ======================================================
// ORDENAR COMPRAS
// ======================================================

function ordenarComprasTarjeta(
    compras
) {

    return [...compras].sort(
        (a, b) => {

            const aNormal =
                a.tipo === "normal";

            const bNormal =
                b.tipo === "normal";

            /*
               CONTADO SIEMPRE ARRIBA
            */

            if (
                aNormal &&
                !bNormal
            ) {
                return -1;
            }

            if (
                !aNormal &&
                bNormal
            ) {
                return 1;
            }

            /*
               ENTRE MSI:
               MENOS MESES PRIMERO
            */

            if (
                !aNormal &&
                !bNormal
            ) {

                const mesesA =
                    Number(
                        a.meses_totales || 0
                    );

                const mesesB =
                    Number(
                        b.meses_totales || 0
                    );

                if (
                    mesesA !== mesesB
                ) {

                    return (
                        mesesA -
                        mesesB
                    );

                }

                const pagadosA =
                    Number(
                        a.meses_pagados || 0
                    );

                const pagadosB =
                    Number(
                        b.meses_pagados || 0
                    );

                if (
                    pagadosA !== pagadosB
                ) {

                    return (
                        pagadosA -
                        pagadosB
                    );

                }
            }

            const fechaA =
                crearFechaLocalTarjeta(
                    a.fecha_compra
                );

            const fechaB =
                crearFechaLocalTarjeta(
                    b.fecha_compra
                );

            return (
                (
                    fechaA?.getTime() || 0
                ) -
                (
                    fechaB?.getTime() || 0
                )
            );
        }
    );
}


// ======================================================
// CARGAR TARJETAS
// ======================================================

async function cargarTarjetas() {

    const contenedor =
        document.getElementById(
            "listaTarjetas"
        );

    if (!contenedor) {
        return;
    }

    const usuario =
        await obtenerUsuarioTarjeta();

    if (!usuario) {

        contenedor.innerHTML =
            "<p>No hay sesión activa.</p>";

        return;
    }

    contenedor.innerHTML =
        '<div class="loading">Cargando tarjetas...</div>';


    const {
        data: tarjetas,
        error: errorTarjetas
    } =
        await supabaseClient
            .from("tarjetas")
            .select(`
                id,
                usuario_id,
                nombre,
                banco,
                limite,
                dia_corte,
                dia_limite,
                dia_pago,
                activa,
                notas
            `)
            .eq(
                "usuario_id",
                usuario.id
            )
            .eq(
                "activa",
                true
            )
            .order(
                "nombre",
                {
                    ascending: true
                }
            );


    if (errorTarjetas) {

        console.error(
            "Error cargando tarjetas:",
            errorTarjetas
        );

        contenedor.innerHTML =
            "<p>Error al cargar las tarjetas.</p>";

        return;
    }


    const listaTarjetas =
        tarjetas || [];


    const {
        data: compras,
        error: errorCompras
    } =
        await supabaseClient
            .from("compras_tarjeta")
            .select(`
                id,
                usuario_id,
                tarjeta_id,
                concepto,
                descripcion,
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
            .eq(
                "usuario_id",
                usuario.id
            )
            .eq(
                "activa",
                true
            );


    if (errorCompras) {

        console.error(
            "Error cargando compras:",
            errorCompras
        );

        contenedor.innerHTML =
            "<p>Error al cargar las compras de tarjetas.</p>";

        return;
    }


    const listaCompras =
        compras || [];


    let deudaGeneral = 0;

    let creditoDisponibleGeneral = 0;

    let pagoPeriodoGeneral = 0;


    listaTarjetas.forEach(
        tarjeta => {

            const comprasTarjeta =
                listaCompras.filter(
                    compra =>
                        String(
                            compra.tarjeta_id
                        ) ===
                        String(
                            tarjeta.id
                        )
                );


            const deuda =
                comprasTarjeta.reduce(
                    (
                        total,
                        compra
                    ) =>
                        total +
                        Number(
                            compra.saldo_pendiente || 0
                        ),
                    0
                );


            deudaGeneral +=
                deuda;


            // Crédito disponible total:
            // límite de cada tarjeta menos su deuda actual.
            const limiteTarjeta =
                Number(
                    tarjeta.limite || 0
                );

            const disponibleTarjeta =
                Math.max(
                    0,
                    limiteTarjeta - deuda
                );

            creditoDisponibleGeneral +=
                disponibleTarjeta;


            const comprasPeriodo =
                obtenerComprasPeriodoTarjeta(
                    tarjeta,
                    listaCompras
                );


            pagoPeriodoGeneral +=
                comprasPeriodo.reduce(
                    (
                        total,
                        compra
                    ) =>
                        total +
                        obtenerMontoPagoCompraTarjeta(
                            compra
                        ),
                    0
                );

        }
    );


    const totalDeuda =
        document.getElementById(
            "totalDeudaTarjetas"
        );

    if (totalDeuda) {

        totalDeuda.textContent =
            formatearMonedaTarjeta(
                deudaGeneral
            );

    }


    const totalPeriodo =
        document.getElementById(
            "totalPagoPeriodoTarjetas"
        );

    if (totalPeriodo) {

        totalPeriodo.textContent =
            formatearMonedaTarjeta(
                pagoPeriodoGeneral
            );

    }


    const cantidad =
        document.getElementById(
            "cantidadTarjetas"
        );

    if (cantidad) {

        cantidad.textContent =
            listaTarjetas.length;

    }


    const creditoDisponible =
        document.getElementById(
            "creditoDisponibleTarjetas"
        );

    if (creditoDisponible) {

        creditoDisponible.textContent =
            formatearMonedaTarjeta(
                creditoDisponibleGeneral
            );

    }


    prepararSelectorTarjetas(
        listaTarjetas
    );


    mostrarDetallePagoPeriodo(
        listaTarjetas,
        listaCompras
    );


    mostrarTarjetas(
        listaTarjetas,
        listaCompras
    );

    aplicarFiltroTarjetaUI();
}


// ======================================================
// DETALLE PAGO DEL PERIODO
// ======================================================

function mostrarDetallePagoPeriodo(
    tarjetas,
    compras
) {

    const contenedor =
        document.getElementById(
            "detallePagoPeriodo"
        );

    if (!contenedor) {
        return;
    }


    let totalGeneral = 0;

    const bloques = [];


    tarjetas.forEach(
        tarjeta => {

            const comprasPeriodo =
                obtenerComprasPeriodoTarjeta(
                    tarjeta,
                    compras
                );


            if (
                !comprasPeriodo.length
            ) {
                return;
            }


            const ordenadas =
                ordenarComprasTarjeta(
                    comprasPeriodo
                );


            let totalTarjeta = 0;


            const filas =
                ordenadas.map(
                    compra => {

                        const monto =
                            obtenerMontoPagoCompraTarjeta(
                                compra
                            );

                        totalTarjeta +=
                            monto;

                        const esMSI =
                            compra.tipo === "meses";

                        const detalle =
                            esMSI
                                ? `MSI · ${Number(
                                    compra.meses_pagados || 0
                                  ) + 1}/${Number(
                                    compra.meses_totales || 0
                                  )}`
                                : "Compra de contado";


                        return `
                            <div class="periodo-compra">

                                <div class="periodo-compra-info">

                                    <strong>
                                        ${
                                            esMSI
                                                ? "📆 "
                                                : "🛒 "
                                        }
                                        ${escaparHTMLTarjeta(
                                            compra.concepto
                                        )}
                                    </strong>

                                    <small>
                                        ${escaparHTMLTarjeta(
                                            detalle
                                        )}

                                        ${
                                            compra.descripcion
                                                ? " · " +
                                                  escaparHTMLTarjeta(
                                                      compra.descripcion
                                                  )
                                                : ""
                                        }
                                    </small>

                                </div>

                                <div class="periodo-compra-monto">

                                    ${formatearMonedaTarjeta(
                                        monto
                                    )}

                                </div>

                            </div>
                        `;
                    }
                )
                .join("");


            totalGeneral +=
                totalTarjeta;


            bloques.push(`
    <div
        class="periodo-tarjeta"
        data-tarjeta-id="${tarjeta.id}">

                    <div class="periodo-tarjeta-header">

                        <strong>
                            💳 ${escaparHTMLTarjeta(
                                tarjeta.nombre
                            )}
                        </strong>

                        <strong>
                            ${formatearMonedaTarjeta(
                                totalTarjeta
                            )}
                        </strong>

                    </div>

                    ${filas}

                    <div class="periodo-total">

                        <span>
                            Total de esta tarjeta
                        </span>

                        <strong>
                            ${formatearMonedaTarjeta(
                                totalTarjeta
                            )}
                        </strong>

                    </div>

                </div>
            `);

        }
    );


    if (!bloques.length) {

        contenedor.innerHTML = `

            <div class="periodo-vacio">

                ✅ No tienes pagos pendientes
                de tarjetas para el periodo actual.

            </div>

        `;

        return;
    }


    contenedor.innerHTML = `

        ${bloques.join("")}

        <div class="periodo-total">

            <span>
                TOTAL DEL PERIODO
            </span>

            <strong>
                ${formatearMonedaTarjeta(
                    totalGeneral
                )}
            </strong>

        </div>

    `;
}


// ======================================================
// MOSTRAR TARJETAS
// ======================================================

function mostrarTarjetas(
    tarjetas,
    compras = []
) {

    const contenedor =
        document.getElementById(
            "listaTarjetas"
        );

    if (!contenedor) {
        return;
    }


    if (!tarjetas.length) {

        contenedor.innerHTML = `

            <div class="sin-datos">

                <p>
                    No tienes tarjetas registradas.
                </p>

                <button
                    class="btn-primary"
                    type="button"
                    onclick="nuevaTarjeta()"
                >
                    + Nueva tarjeta
                </button>

            </div>

        `;

        return;
    }


    contenedor.innerHTML = "";


    tarjetas.forEach(
        tarjeta => {

            const comprasTarjeta =
                compras.filter(
                    compra =>
                        String(
                            compra.tarjeta_id
                        ) ===
                        String(
                            tarjeta.id
                        )
                );


            const deuda =
                comprasTarjeta.reduce(
                    (
                        total,
                        compra
                    ) =>
                        total +
                        Number(
                            compra.saldo_pendiente || 0
                        ),
                    0
                );


            const limite =
                Number(
                    tarjeta.limite || 0
                );


            const disponible =
                Math.max(
                    0,
                    limite - deuda
                );


            const comprasPeriodo =
                obtenerComprasPeriodoTarjeta(
                    tarjeta,
                    compras
                );


            const pagoPeriodo =
                comprasPeriodo.reduce(
                    (
                        total,
                        compra
                    ) =>
                        total +
                        obtenerMontoPagoCompraTarjeta(
                            compra
                        ),
                    0
                );


            const tarjetaHTML =
                document.createElement(
                    "div"
                );


            tarjetaHTML.className =
                "tarjeta-bloque";


            tarjetaHTML.innerHTML = `

                <div class="tarjeta-card">


                    <div class="tarjeta-icono">
                        💳
                    </div>


                    <div class="tarjeta-info">

                        <h3>
                            ${escaparHTMLTarjeta(
                                tarjeta.nombre
                            )}
                        </h3>

                        <span>
                            ${escaparHTMLTarjeta(
                                tarjeta.banco ||
                                "Sin banco"
                            )}
                        </span>

                        <small>

                            Corte:
                            día ${tarjeta.dia_corte}

                            ${
                                tarjeta.dia_limite
                                    ? ` · Límite:
                                       día ${tarjeta.dia_limite}`
                                    : ""
                            }

                            ${
                                tarjeta.dia_pago
                                    ? ` · Yo pago:
                                       día ${tarjeta.dia_pago}`
                                    : ""
                            }

                        </small>

                    </div>


                    <div class="tarjeta-derecha">


                        <div class="tarjeta-metrica">

                            <strong>
                                Límite de crédito
                            </strong>

                            <span>
                                ${formatearMonedaTarjeta(
                                    limite
                                )}
                            </span>

                        </div>


                        <div class="tarjeta-metrica">

                            <strong>
                                Debe
                            </strong>

                            <span>
                                ${formatearMonedaTarjeta(
                                    deuda
                                )}
                            </span>

                        </div>


                        <div class="tarjeta-metrica">

                            <strong>
                                Disponible
                            </strong>

                            <span>
                                ${formatearMonedaTarjeta(
                                    disponible
                                )}
                            </span>

                        </div>


                        <div class="tarjeta-metrica">

                            <strong>
                                Pago del periodo
                            </strong>

                            <span>
                                ${formatearMonedaTarjeta(
                                    pagoPeriodo
                                )}
                            </span>

                        </div>


                        <div class="tarjeta-acciones">

                            <button
                                type="button"
                                title="Editar"
                                onclick="editarTarjeta('${tarjeta.id}')"
                            >
                                ✏️
                            </button>


                            <button
                                type="button"
                                title="Desactivar"
                                onclick="desactivarTarjeta('${tarjeta.id}')"
                            >
                                🗑️
                            </button>

                        </div>


                    </div>

                </div>


                <div class="compras-tarjeta">


                    <div class="compras-tarjeta-titulo">

                        <strong>
                            Compras de esta tarjeta
                        </strong>


                        <button
                            class="btn-primary btn-small"
                            type="button"
                            onclick="nuevaCompraTarjeta('${tarjeta.id}')"
                        >
                            + Nueva compra
                        </button>

                    </div>


                    <div
                        id="comprasTarjeta_${tarjeta.id}"
                        class="lista-compras-tarjeta"
                        data-tarjeta-id="${tarjeta.id}"
                    >

                        <div class="loading">
                            Cargando compras...
                        </div>

                    </div>


                </div>

            `;


            contenedor.appendChild(
                tarjetaHTML
            );


            if (
                typeof cargarComprasTarjeta ===
                "function"
            ) {

                cargarComprasTarjeta(
                    tarjeta.id
                );

            }

        }
    );
}


// ======================================================
// NUEVA TARJETA
// ======================================================

function nuevaTarjeta() {

    tarjetaEditandoId = null;


    const titulo =
        document.getElementById(
            "modalTarjetaTitulo"
        );

    const nombre =
        document.getElementById(
            "tarjetaNombre"
        );

    const banco =
        document.getElementById(
            "tarjetaBanco"
        );

    const limite =
        document.getElementById(
            "tarjetaLimite"
        );

    const diaCorte =
        document.getElementById(
            "tarjetaDiaCorte"
        );

    const diaLimite =
        document.getElementById(
            "tarjetaDiaLimite"
        );

    const diaPago =
        document.getElementById(
            "tarjetaDiaPago"
        );

    const notas =
        document.getElementById(
            "tarjetaNotas"
        );

    const modal =
        document.getElementById(
            "modalTarjeta"
        );


    if (
        !titulo ||
        !nombre ||
        !banco ||
        !limite ||
        !diaCorte ||
        !diaLimite ||
        !diaPago ||
        !notas ||
        !modal
    ) {
        return;
    }


    titulo.textContent =
        "Nueva tarjeta";

    nombre.value = "";
    banco.value = "";
    limite.value = "";
    diaCorte.value = "";
    diaLimite.value = "";
    diaPago.value = "";
    notas.value = "";


    mostrarMensajeTarjeta("");


    modal.style.display =
        "flex";

    modal.setAttribute(
        "aria-hidden",
        "false"
    );
}


// ======================================================
// CERRAR MODAL
// ======================================================

function cerrarModalTarjeta() {

    const modal =
        document.getElementById(
            "modalTarjeta"
        );

    if (modal) {

        modal.style.display =
            "none";

        modal.setAttribute(
            "aria-hidden",
            "true"
        );
    }

    tarjetaEditandoId = null;
}


// ======================================================
// GUARDAR TARJETA
// ======================================================

async function guardarTarjeta() {

    const usuario =
        await obtenerUsuarioTarjeta();

    if (!usuario) {

        mostrarMensajeTarjeta(
            "No se encontró la sesión."
        );

        return;
    }


    const nombre =
        document.getElementById(
            "tarjetaNombre"
        )?.value.trim();


    const banco =
        document.getElementById(
            "tarjetaBanco"
        )?.value.trim();


    const limite =
        parseFloat(
            document.getElementById(
                "tarjetaLimite"
            )?.value
        );


    const diaCorte =
        parseInt(
            document.getElementById(
                "tarjetaDiaCorte"
            )?.value
        );


    const diaLimiteValor =
        document.getElementById(
            "tarjetaDiaLimite"
        )?.value;


    const diaLimite =
        diaLimiteValor
            ? parseInt(
                diaLimiteValor
            )
            : null;


    const diaPagoValor =
        document.getElementById(
            "tarjetaDiaPago"
        )?.value;


    const diaPago =
        diaPagoValor
            ? parseInt(
                diaPagoValor
            )
            : null;


    const notas =
        document.getElementById(
            "tarjetaNotas"
        )?.value.trim();


    if (!nombre) {

        mostrarMensajeTarjeta(
            "Escribe el nombre de la tarjeta."
        );

        return;
    }


    if (!banco) {

        mostrarMensajeTarjeta(
            "Escribe el banco."
        );

        return;
    }


    if (
        !Number.isFinite(limite) ||
        limite <= 0
    ) {

        mostrarMensajeTarjeta(
            "El límite debe ser mayor a $0."
        );

        return;
    }


    if (
        !Number.isInteger(diaCorte) ||
        diaCorte < 1 ||
        diaCorte > 31
    ) {

        mostrarMensajeTarjeta(
            "El día de corte debe estar entre 1 y 31."
        );

        return;
    }


    if (
        diaLimite !== null &&
        (
            diaLimite < 1 ||
            diaLimite > 31
        )
    ) {

        mostrarMensajeTarjeta(
            "El día límite debe estar entre 1 y 31."
        );

        return;
    }


    if (
        diaPago !== null &&
        (
            diaPago < 1 ||
            diaPago > 31
        )
    ) {

        mostrarMensajeTarjeta(
            "El día de pago debe estar entre 1 y 31."
        );

        return;
    }


    const datos = {

        usuario_id:
            usuario.id,

        nombre,

        banco,

        limite,

        dia_corte:
            diaCorte,

        dia_limite:
            diaLimite,

        dia_pago:
            diaPago,

        activa:
            true,

        notas:
            notas || null
    };


    const boton =
        document.getElementById(
            "btnGuardarTarjeta"
        );


    if (boton) {

        boton.disabled = true;

        boton.textContent =
            "Guardando...";

    }


    try {

        if (tarjetaEditandoId) {

            const resultado =
                await supabaseClient
                    .from("tarjetas")
                    .update(datos)
                    .eq(
                        "id",
                        tarjetaEditandoId
                    )
                    .eq(
                        "usuario_id",
                        usuario.id
                    );

            if (resultado.error) {
                throw resultado.error;
            }

        } else {

            const resultado =
                await supabaseClient
                    .from("tarjetas")
                    .insert(datos);

            if (resultado.error) {
                throw resultado.error;
            }

        }


        cerrarModalTarjeta();

        await cargarTarjetas();


    } catch (error) {

        console.error(
            "Error guardando tarjeta:",
            error
        );

        mostrarMensajeTarjeta(
            error.message ||
            "Ocurrió un error al guardar."
        );


    } finally {

        if (boton) {

            boton.disabled = false;

            boton.textContent =
                "Guardar tarjeta";

        }
    }
}


// ======================================================
// EDITAR TARJETA
// ======================================================

async function editarTarjeta(id) {

    const usuario =
        await obtenerUsuarioTarjeta();

    if (!usuario) {
        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("tarjetas")
            .select(`
                id,
                nombre,
                banco,
                limite,
                dia_corte,
                dia_limite,
                dia_pago,
                notas
            `)
            .eq(
                "id",
                id
            )
            .eq(
                "usuario_id",
                usuario.id
            )
            .single();


    if (
        error ||
        !data
    ) {

        console.error(
            "Error obteniendo tarjeta:",
            error
        );

        alert(
            "No se pudo cargar la tarjeta."
        );

        return;
    }


    tarjetaEditandoId =
        data.id;


    document.getElementById(
        "modalTarjetaTitulo"
    ).textContent =
        "Editar tarjeta";


    document.getElementById(
        "tarjetaNombre"
    ).value =
        data.nombre || "";


    document.getElementById(
        "tarjetaBanco"
    ).value =
        data.banco || "";


    document.getElementById(
        "tarjetaLimite"
    ).value =
        data.limite || "";


    document.getElementById(
        "tarjetaDiaCorte"
    ).value =
        data.dia_corte || "";


    document.getElementById(
        "tarjetaDiaLimite"
    ).value =
        data.dia_limite || "";


    document.getElementById(
        "tarjetaDiaPago"
    ).value =
        data.dia_pago || "";


    document.getElementById(
        "tarjetaNotas"
    ).value =
        data.notas || "";


    mostrarMensajeTarjeta("");


    const modal =
        document.getElementById(
            "modalTarjeta"
        );


    if (modal) {

        modal.style.display =
            "flex";

        modal.setAttribute(
            "aria-hidden",
            "false"
        );

    }
}


// ======================================================
// DESACTIVAR TARJETA
// ======================================================

async function desactivarTarjeta(id) {

    if (
        !confirm(
            "¿Deseas desactivar esta tarjeta?"
        )
    ) {
        return;
    }


    const usuario =
        await obtenerUsuarioTarjeta();

    if (!usuario) {
        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from("tarjetas")
            .update({
                activa: false
            })
            .eq(
                "id",
                id
            )
            .eq(
                "usuario_id",
                usuario.id
            );


    if (error) {

        console.error(
            "Error desactivando tarjeta:",
            error
        );

        alert(
            "No se pudo desactivar la tarjeta."
        );

        return;
    }


    await cargarTarjetas();
}


// ======================================================
// REGISTRAR PAGOS DEL PERIODO
// ======================================================

async function registrarTodosLosPagosTarjetas() {

    const usuario =
        await obtenerUsuarioTarjeta();

    if (!usuario) {

        alert(
            "No se encontró la sesión."
        );

        return;
    }


    const {
        data: tarjetas,
        error: errorTarjetas
    } =
        await supabaseClient
            .from("tarjetas")
            .select(`
                id,
                nombre,
                dia_corte,
                dia_limite,
                dia_pago,
                activa
            `)
            .eq(
                "usuario_id",
                usuario.id
            )
            .eq(
                "activa",
                true
            );


    if (errorTarjetas) {

        console.error(
            errorTarjetas
        );

        alert(
            "No fue posible obtener las tarjetas."
        );

        return;
    }


    const {
        data: compras,
        error: errorCompras
    } =
        await supabaseClient
            .from("compras_tarjeta")
            .select(`
                id,
                tarjeta_id,
                concepto,
                tipo,
                meses_totales,
                meses_pagados,
                mensualidad,
                saldo_pendiente,
                activa,
                fecha_compra,
                fecha_primer_pago,
                fecha_fin
            `)
            .eq(
                "usuario_id",
                usuario.id
            )
            .eq(
                "activa",
                true
            );


    if (errorCompras) {

        console.error(
            errorCompras
        );

        alert(
            "No fue posible obtener las compras."
        );

        return;
    }


    const pagos = [];


    (tarjetas || []).forEach(
        tarjeta => {

            const comprasPeriodo =
                obtenerComprasPeriodoTarjeta(
                    tarjeta,
                    compras || []
                );


            const ordenadas =
                ordenarComprasTarjeta(
                    comprasPeriodo
                );


            if (!ordenadas.length) {
                return;
            }


            const monto =
                ordenadas.reduce(
                    (
                        total,
                        compra
                    ) =>
                        total +
                        obtenerMontoPagoCompraTarjeta(
                            compra
                        ),
                    0
                );


            if (monto > 0) {

                pagos.push({

                    tarjeta,

                    compras:
                        ordenadas,

                    monto:
                        Number(
                            monto.toFixed(2)
                        )

                });

            }

        }
    );


    if (!pagos.length) {

        alert(
            "No hay pagos pendientes para el periodo actual."
        );

        return;
    }


    let mensaje =
        "Se registrarán los siguientes pagos del periodo actual:\n\n";


    let total = 0;


    pagos.forEach(
        item => {

            mensaje +=
                `\n${item.tarjeta.nombre}\n`;

            item.compras.forEach(
                compra => {

                    const monto =
                        obtenerMontoPagoCompraTarjeta(
                            compra
                        );

                    const tipo =
                        compra.tipo === "meses"
                            ? `MSI ${
                                Number(
                                    compra.meses_pagados || 0
                                ) + 1
                              }/${
                                Number(
                                    compra.meses_totales || 0
                                )
                              }`
                            : "Contado";

                    mensaje +=
                        `  • ${compra.concepto} (${tipo}): ` +
                        `${formatearMonedaTarjeta(monto)}\n`;

                }
            );


            mensaje +=
                `  Total tarjeta: ` +
                `${formatearMonedaTarjeta(item.monto)}\n`;

            total +=
                item.monto;

        }
    );


    mensaje +=
        `\nTOTAL: ${formatearMonedaTarjeta(total)}`;

    mensaje +=
        "\n\n¿Confirmas que ya realizaste estos pagos?";


    if (!confirm(mensaje)) {
        return;
    }


    try {

        for (
            const item
            of pagos
        ) {

            const resultadoPago =
                await supabaseClient
                    .from("pagos_tarjeta")
                    .insert({

                        usuario_id:
                            usuario.id,

                        tarjeta_id:
                            item.tarjeta.id,

                        cuenta_id:
                            null,

                        importe:
                            item.monto,

                        fecha:
                            obtenerFechaLocal(),

                        concepto:
                            "Pago de tarjeta - periodo"

                    });


            if (resultadoPago.error) {
                throw resultadoPago.error;
            }


            for (
                const compra
                of item.compras
            ) {

                const saldo =
                    Number(
                        compra.saldo_pendiente || 0
                    );


                if (
                    compra.tipo === "normal"
                ) {

                    const resultado =
                        await supabaseClient
                            .from("compras_tarjeta")
                            .update({

                                saldo_pendiente:
                                    0,

                                activa:
                                    false

                            })
                            .eq(
                                "id",
                                compra.id
                            )
                            .eq(
                                "usuario_id",
                                usuario.id
                            );


                    if (resultado.error) {
                        throw resultado.error;
                    }

                    continue;
                }


                const mensualidad =
                    Number(
                        compra.mensualidad || 0
                    );


                const pago =
                    Math.min(
                        mensualidad,
                        saldo
                    );


                const nuevoSaldo =
                    Math.max(
                        0,
                        Number(
                            (
                                saldo -
                                pago
                            ).toFixed(2)
                        )
                    );


                const nuevosMeses =
                    Number(
                        compra.meses_pagados || 0
                    ) + 1;


                const totalMeses =
                    Number(
                        compra.meses_totales || 0
                    );


                const activa =
                    nuevoSaldo > 0 &&
                    nuevosMeses < totalMeses;


                const resultado =
                    await supabaseClient
                        .from("compras_tarjeta")
                        .update({

                            saldo_pendiente:
                                nuevoSaldo,

                            meses_pagados:
                                nuevosMeses,

                            activa

                        })
                        .eq(
                            "id",
                            compra.id
                        )
                        .eq(
                            "usuario_id",
                            usuario.id
                        );


                if (resultado.error) {
                    throw resultado.error;
                }

            }

        }


        alert(
            "✅ Los pagos del periodo se registraron correctamente."
        );


        await cargarTarjetas();


    } catch (error) {

        console.error(
            "Error registrando pagos:",
            error
        );

        alert(
            "Ocurrió un problema al registrar los pagos:\n\n" +
            error.message
        );

    }
}


// ======================================================
// MENSAJE
// ======================================================

function mostrarMensajeTarjeta(
    mensaje
) {

    const elemento =
        document.getElementById(
            "mensajeTarjetaModal"
        );

    if (!elemento) {
        return;
    }

    elemento.textContent =
        mensaje || "";

    elemento.style.display =
        mensaje
            ? "block"
            : "none";
}


// ======================================================
// MONEDA
// ======================================================

function formatearMonedaTarjeta(
    valor
) {

    return Number(
        valor || 0
    ).toLocaleString(
        "es-MX",
        {
            style: "currency",
            currency: "MXN",
            minimumFractionDigits: 2
        }
    );
}


// ======================================================
// ESCAPAR HTML
// ======================================================

function escaparHTMLTarjeta(
    texto
) {

    return String(
        texto ?? ""
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
// SELECTOR DE TARJETA Y VISTA DETALLADA
// ======================================================

function prepararSelectorTarjetas(tarjetas) {

    const selector =
        document.getElementById("filtroTarjeta");

    if (!selector) {
        return;
    }

    const valorAnterior =
        tarjetaSeleccionadaId;

    selector.innerHTML =
        `<option value="">Selecciona una tarjeta...</option>`;

    (tarjetas || []).forEach(tarjeta => {

        const option =
            document.createElement("option");

        option.value =
            String(tarjeta.id);

        option.textContent =
            `${tarjeta.nombre}${tarjeta.banco ? " · " + tarjeta.banco : ""}`;

        selector.appendChild(option);

    });

    if (
        valorAnterior &&
        (tarjetas || []).some(
            tarjeta =>
                String(tarjeta.id) ===
                String(valorAnterior)
        )
    ) {
        selector.value =
            String(valorAnterior);
    } else {
        selector.value = "";
        tarjetaSeleccionadaId = "";
    }

    aplicarFiltroTarjetaUI();
}


function seleccionarTarjeta(id) {

    tarjetaSeleccionadaId =
        id
            ? String(id)
            : "";

    aplicarFiltroTarjetaUI();
}


function aplicarFiltroTarjetaUI() {

    const contenedor =
        document.getElementById("listaTarjetas");

    const mensaje =
        document.getElementById(
            "mensajeSeleccionTarjeta"
        );

    if (!contenedor) {
        return;
    }

    const bloques =
        contenedor.querySelectorAll(
            ".tarjeta-bloque"
        );

    if (!tarjetaSeleccionadaId) {

        contenedor.style.display =
            "none";

        if (mensaje) {
            mensaje.style.display =
                "block";
        }

        return;
    }

    let encontrado = false;

    bloques.forEach(bloque => {

        const botones =
            bloque.querySelectorAll(
                "[onclick]"
            );

        let coincide = false;

        botones.forEach(boton => {

            const texto =
                boton.getAttribute("onclick") ||
                "";

            if (
                texto.includes(
                    tarjetaSeleccionadaId
                )
            ) {
                coincide = true;
            }

        });

        // El bloque se identifica también por su contenido
        // de compras, que usa data-tarjeta-id.
        const compras =
            bloque.querySelector(
                `[data-tarjeta-id="${CSS.escape(tarjetaSeleccionadaId)}"]`
            );

        if (compras) {
            coincide = true;
        }

        bloque.style.display =
            coincide
                ? ""
                : "none";

        if (coincide) {
            encontrado = true;
        }

    });

    // Si el ID no apareció en los atributos, usamos la posición
    // de las tarjetas cargadas como respaldo.
    if (!encontrado) {

        bloques.forEach((bloque, indice) => {

            const tarjeta =
                tarjetasCargadas[indice];

            const coincide =
                tarjeta &&
                String(tarjeta.id) ===
                String(tarjetaSeleccionadaId);

            bloque.style.display =
                coincide
                    ? ""
                    : "none";

            if (coincide) {
                encontrado = true;
            }

        });

    }

    contenedor.style.display =
        encontrado
            ? "block"
            : "none";

    if (mensaje) {
        mensaje.style.display =
            encontrado
                ? "none"
                : "block";
    }

}


function registrarGastoTarjetaSeleccionada() {

    if (!tarjetaSeleccionadaId) {

        alert(
            "Primero selecciona una tarjeta."
        );

        const selector =
            document.getElementById(
                "filtroTarjeta"
            );

        if (selector) {
            selector.focus();
        }

        return;
    }

    const compraSelector =
        document.getElementById(
            "compraTarjetaSeleccion"
        );

    if (compraSelector) {
        compraSelector.value =
            tarjetaSeleccionadaId;

        compraSelector.dispatchEvent(
            new Event("change")
        );
    }

    if (
        typeof nuevaCompraTarjeta ===
        "function"
    ) {
        nuevaCompraTarjeta(
            tarjetaSeleccionadaId
        );
    }

}

// ======================================================
// MODAL
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const modal =
            document.getElementById(
                "modalTarjeta"
            );


        if (modal) {

            modal.style.display =
                "none";

            modal.setAttribute(
                "aria-hidden",
                "true"
            );


            modal.addEventListener(
                "click",
                function (evento) {

                    if (
                        evento.target ===
                        modal
                    ) {

                        cerrarModalTarjeta();

                    }

                }
            );

        }

    }
);


// ======================================================
// INICIALIZAR
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        mostrarFechaTarjetas();

        await cargarTarjetas();

    }
);