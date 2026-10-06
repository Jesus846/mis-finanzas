// ======================================================
// COMPRAS CON TARJETA
// MIS FINANZAS
// ======================================================

let compraTarjetaEditandoId = null;


// ======================================================
// USUARIO
// ======================================================

async function obtenerUsuarioCompraTarjeta() {

    const {
        data,
        error
    } =
        await supabaseClient.auth.getUser();

    if (
        error ||
        !data ||
        !data.user
    ) {

        throw new Error(
            "No se pudo obtener el usuario."
        );

    }

    return data.user;
}


// ======================================================
// FECHAS
// ======================================================

function obtenerFechaLocalCompra(
    fecha = new Date()
) {

    return new Date(
        fecha.getFullYear(),
        fecha.getMonth(),
        fecha.getDate()
    );
}


function crearFechaLocalCompra(
    fecha
) {

    if (!fecha) {
        return null;
    }

    if (
        fecha instanceof Date
    ) {

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


    const texto =
        String(fecha)
            .slice(0, 10);


    const partes =
        texto
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


function fechaLocalAStringCompra(
    fecha
) {

    if (
        !(fecha instanceof Date) ||
        Number.isNaN(
            fecha.getTime()
        )
    ) {

        return "";

    }


    return [

        fecha.getFullYear(),

        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");
}


function formatearFechaCompra(
    fecha
) {

    const fechaLocal =
        fecha instanceof Date
            ? fecha
            : crearFechaLocalCompra(
                fecha
            );


    if (
        !fechaLocal ||
        Number.isNaN(
            fechaLocal.getTime()
        )
    ) {

        return "-";

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


// ======================================================
// MONEDA
// ======================================================

function formatearMonedaCompra(
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
// HTML
// ======================================================

function escaparHTMLCompra(
    valor
) {

    const elemento =
        document.createElement(
            "div"
        );

    elemento.textContent =
        String(
            valor ?? ""
        );

    return elemento.innerHTML;
}


// ======================================================
// MENSAJE
// ======================================================

function mostrarMensajeCompraTarjeta(
    mensaje,
    tipo = "error"
) {

    const elemento =
        document.getElementById(
            "mensajeCompraTarjetaModal"
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


    elemento.className =
        tipo === "ok"
            ? "mensaje-exito"
            : "mensaje-error";
}


// ======================================================
// TARJETA
// ======================================================

async function obtenerDatosTarjetaCompra(
    tarjetaId
) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("tarjetas")
            .select(
                "id,nombre,banco,limite,dia_corte,dia_pago,dia_limite,activa"
            )
            .eq(
                "id",
                tarjetaId
            )
            .maybeSingle();


    if (error) {
        throw error;
    }


    if (!data) {

        throw new Error(
            "No se encontró la tarjeta seleccionada."
        );

    }


    return data;
}


// ======================================================
// CALENDARIO
// ======================================================

function obtenerDiaValidoMesCompra(
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


function obtenerFechaCorteCompra(
    fechaCompra,
    diaCorte
) {

    const fecha =
        obtenerFechaLocalCompra(
            fechaCompra
        );


    let anio =
        fecha.getFullYear();

    let mes =
        fecha.getMonth();


    const corteMes =
        obtenerDiaValidoMesCompra(
            anio,
            mes,
            diaCorte
        );


    /*
       Compra el día de corte:
       pasa al siguiente periodo.
    */

    if (
        fecha.getDate() >=
        corteMes
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
        obtenerDiaValidoMesCompra(
            anio,
            mes,
            diaCorte
        )
    );
}


function obtenerFechaPagoDesdeCorte(
    fechaCorte,
    tarjeta
) {

    const corte =
        obtenerFechaLocalCompra(
            fechaCorte
        );


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
        dia <=
        corte.getDate()
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
        obtenerDiaValidoMesCompra(
            anio,
            mes,
            dia
        )
    );
}


function calcularCalendarioPagoCompra(
    fechaCompra,
    tarjeta
) {

    const fechaCompraLocal =
        obtenerFechaLocalCompra(
            fechaCompra
        );


    const fechaCorte =
        obtenerFechaCorteCompra(
            fechaCompraLocal,
            tarjeta.dia_corte
        );


    const fechaPlaneadaPago =
        obtenerFechaPagoDesdeCorte(
            fechaCorte,
            tarjeta
        );


    return {

        fechaCompra:
            fechaCompraLocal,

        fechaCorte,

        fechaLimite:
            fechaPlaneadaPago,

        fechaPlaneadaPago

    };
}


function sumarMesesFechaCompra(
    fecha,
    meses
) {

    const original =
        obtenerFechaLocalCompra(
            fecha
        );


    const cantidad =
        Number(
            meses || 0
        );


    const resultado =
        new Date(
            original.getFullYear(),
            original.getMonth() + cantidad,
            1
        );


    resultado.setDate(
        obtenerDiaValidoMesCompra(
            resultado.getFullYear(),
            resultado.getMonth(),
            original.getDate()
        )
    );


    return resultado;
}


// ======================================================
// PRIMER PAGO
// ======================================================

function obtenerPrimerPagoCompra(
    fechaCompra,
    tarjeta
) {

    const calendario =
        calcularCalendarioPagoCompra(
            fechaCompra,
            tarjeta
        );


    return calendario.fechaPlaneadaPago;
}


// ======================================================
// FECHA PAGO ACTUAL MSI
// ======================================================

function obtenerFechaPagoActualCompra(
    compra,
    tarjeta
) {

    if (
        !compra ||
        compra.tipo !== "meses"
    ) {

        return null;

    }


    const fechaCompra =
        crearFechaLocalCompra(
            compra.fecha_compra
        );


    if (!fechaCompra) {
        return null;
    }


    const primerPago =
        obtenerPrimerPagoCompra(
            fechaCompra,
            tarjeta
        );


    const pagosRealizados =
        Number(
            compra.meses_pagados || 0
        );


    /*
       Ejemplo:

       Primer pago: 30/06
       Pagados: 3

       Siguiente:
       30/09

       Es decir:
       primer pago + pagos realizados.
    */

    return sumarMesesFechaCompra(
        primerPago,
        pagosRealizados
    );
}


// ======================================================
// PAGO NORMAL
// ======================================================

function obtenerFechaPagoCompraNormal(
    compra,
    tarjeta
) {

    const fechaCompra =
        crearFechaLocalCompra(
            compra.fecha_compra
        );


    if (!fechaCompra) {
        return null;
    }


    return obtenerPrimerPagoCompra(
        fechaCompra,
        tarjeta
    );
}


// ======================================================
// PAGO DE CUALQUIER COMPRA
// ======================================================

function obtenerFechaPagoCompra(
    compra,
    tarjeta
) {

    if (
        compra.tipo ===
        "meses"
    ) {

        return obtenerFechaPagoActualCompra(
            compra,
            tarjeta
        );

    }


    return obtenerFechaPagoCompraNormal(
        compra,
        tarjeta
    );
}


// ======================================================
// TARJETAS PARA COMPRA
// ======================================================

async function cargarTarjetasParaCompra(
    tarjetaSeleccionadaId = null
) {

    const selector =
        document.getElementById(
            "compraTarjetaSeleccion"
        );


    if (!selector) {
        return;
    }


    try {

        const usuario =
            await obtenerUsuarioCompraTarjeta();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("tarjetas")
                .select(
                    "id,nombre,banco,activa"
                )
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


        if (error) {
            throw error;
        }


        selector.innerHTML = `
            <option value="">
                Selecciona una tarjeta
            </option>
        `;


        (data || []).forEach(
            tarjeta => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    tarjeta.id;


                option.textContent =
                    tarjeta.banco
                        ? `${tarjeta.nombre} · ${tarjeta.banco}`
                        : tarjeta.nombre;


                selector.appendChild(
                    option
                );

            }
        );


        if (
            tarjetaSeleccionadaId
        ) {

            selector.value =
                tarjetaSeleccionadaId;

        }


    } catch (error) {

        console.error(
            "Error cargando tarjetas:",
            error
        );

        mostrarMensajeCompraTarjeta(
            "No se pudieron cargar las tarjetas."
        );

    }
}


// ======================================================
// PAGOS REALIZADOS
// ======================================================

function asegurarCampoPagosRealizadosCompra() {

    let input =
        document.getElementById(
            "compraPagosRealizados"
        );


    if (input) {
        return input;
    }


    const inputMeses =
        document.getElementById(
            "compraMeses"
        );


    if (!inputMeses) {
        return null;
    }


    const grupo =
        document.createElement(
            "div"
        );


    grupo.id =
        "grupoPagosRealizadosCompra";


    grupo.className =
        "campo";


    const label =
        document.createElement(
            "label"
        );


    label.htmlFor =
        "compraPagosRealizados";


    label.textContent =
        "Pagos ya realizados";


    input =
        document.createElement(
            "input"
        );


    input.type =
        "number";


    input.id =
        "compraPagosRealizados";


    input.name =
        "compraPagosRealizados";


    input.min =
        "0";


    input.step =
        "1";


    input.value =
        "0";


    input.inputMode =
        "numeric";


    grupo.appendChild(
        label
    );


    grupo.appendChild(
        input
    );


    const grupoMeses =
        inputMeses.parentElement;


    if (
        grupoMeses &&
        grupoMeses.parentElement
    ) {

        grupoMeses.parentElement.insertBefore(
            grupo,
            grupoMeses.nextSibling
        );

    }


    return input;
}


// ======================================================
// TIPO DE COMPRA
// ======================================================

function actualizarTipoCompraTarjeta() {

    const tipo =
        document.getElementById(
            "compraTipo"
        );


    const contenedorMeses =
        document.getElementById(
            "contenedorMesesCompra"
        );


    const inputMeses =
        document.getElementById(
            "compraMeses"
        );


    const inputPagos =
        asegurarCampoPagosRealizadosCompra();


    const grupoPagos =
        document.getElementById(
            "grupoPagosRealizadosCompra"
        );


    if (!tipo) {
        return;
    }


    const esMeses =
        tipo.value === "meses";


    if (contenedorMeses) {

        contenedorMeses.style.display =
            esMeses
                ? "block"
                : "none";

    }


    if (inputMeses) {

        inputMeses.required =
            esMeses;


        if (!esMeses) {

            inputMeses.value =
                "";

        }

    }


    if (grupoPagos) {

        grupoPagos.style.display =
            esMeses
                ? "block"
                : "none";

    }


    if (inputPagos) {

        inputPagos.disabled =
            !esMeses;


        if (!esMeses) {

            inputPagos.value =
                "0";

        }

    }
}


// ======================================================
// CONTENEDOR
// ======================================================

function obtenerContenedorComprasTarjeta(
    tarjetaId
) {

    if (!tarjetaId) {
        return null;
    }


    return document.getElementById(
        `comprasTarjeta_${tarjetaId}`
    );
}


// ======================================================
// ORDENAR
// ======================================================

function ordenarListaComprasTarjeta(
    compras
) {

    return [...compras].sort(
        (a, b) => {

            const aNormal =
                a.tipo === "normal";


            const bNormal =
                b.tipo === "normal";


            /*
               CONTADO ARRIBA
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
               MSI:
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
                    mesesA !==
                    mesesB
                ) {

                    return (
                        mesesA -
                        mesesB
                    );

                }

            }


            const fechaA =
                crearFechaLocalCompra(
                    a.fecha_compra
                );


            const fechaB =
                crearFechaLocalCompra(
                    b.fecha_compra
                );


            return (
                (
                    fechaA?.getTime() ||
                    0
                ) -
                (
                    fechaB?.getTime() ||
                    0
                )
            );

        }
    );
}


// ======================================================
// CARGAR COMPRAS
// ======================================================

async function cargarComprasTarjeta(
    tarjetaId = null
) {

    let contenedores;


    if (tarjetaId) {

        const contenedor =
            obtenerContenedorComprasTarjeta(
                tarjetaId
            );


        if (!contenedor) {
            return;
        }


        contenedores =
            [contenedor];

    } else {

        contenedores =
            Array.from(
                document.querySelectorAll(
                    ".lista-compras-tarjeta"
                )
            );

    }


    if (
        contenedores.length === 0
    ) {
        return;
    }


    try {

        const usuario =
            await obtenerUsuarioCompraTarjeta();


        let consulta =
            supabaseClient
                .from("compras_tarjeta")
                .select(`
                    id,
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


        if (tarjetaId) {

            consulta =
                consulta.eq(
                    "tarjeta_id",
                    tarjetaId
                );

        }


        const {
            data: compras,
            error
        } =
            await consulta;


        if (error) {
            throw error;
        }


        const listaCompras =
            Array.isArray(compras)
                ? compras
                : [];


        for (
            const contenedor
            of contenedores
        ) {

            let idTarjeta =
                contenedor.getAttribute(
                    "data-tarjeta-id"
                );


            if (!idTarjeta) {

                const id =
                    contenedor.id ||
                    "";


                if (
                    id.startsWith(
                        "comprasTarjeta_"
                    )
                ) {

                    idTarjeta =
                        id.substring(
                            "comprasTarjeta_".length
                        );

                }

            }


            const comprasDeTarjeta =
                listaCompras.filter(
                    compra =>
                        String(
                            compra.tarjeta_id
                        ) ===
                        String(
                            idTarjeta
                        )
                );


            if (
                comprasDeTarjeta.length === 0
            ) {

                contenedor.innerHTML = `

                    <div class="sin-compras-tarjeta">

                        <span>🧾</span>

                        <div>

                            <strong>
                                No hay compras registradas
                            </strong>

                            <small>
                                Las compras de esta tarjeta aparecerán aquí.
                            </small>

                        </div>

                    </div>

                `;

                continue;

            }


            const tarjeta =
                await obtenerDatosTarjetaCompra(
                    idTarjeta
                );


            const comprasOrdenadas =
                ordenarListaComprasTarjeta(
                    comprasDeTarjeta
                );


            /*
               Separación visual:
               CONTADO
               MSI
            */

            const comprasContado =
                comprasOrdenadas.filter(
                    compra =>
                        compra.tipo ===
                        "normal"
                );


            const comprasMSI =
                comprasOrdenadas.filter(
                    compra =>
                        compra.tipo ===
                        "meses"
                );


            const renderCompra =
                compra => {

                    const esMeses =
                        compra.tipo ===
                        "meses";


                    const mesesTotales =
                        Number(
                            compra.meses_totales || 0
                        );


                    const mesesPagados =
                        Number(
                            compra.meses_pagados || 0
                        );


                    const siguienteNumero =
                        Math.min(
                            mesesPagados + 1,
                            mesesTotales
                        );


                    const tipoTexto =
                        esMeses
                            ? `MSI · ${mesesTotales} meses`
                            : "Compra de contado";


                    const pagosTexto =
                        esMeses
                            ? `Pago ${siguienteNumero} de ${mesesTotales}`
                            : "Pago completo";


                    const fechaPago =
                        obtenerFechaPagoCompra(
                            compra,
                            tarjeta
                        );


                    const saldo =
                        Number(
                            compra.saldo_pendiente || 0
                        );


                    const montoPago =
                        esMeses
                            ? Math.min(
                                Number(
                                    compra.mensualidad || 0
                                ),
                                saldo
                            )
                            : saldo;


                    return `

                        <div class="compra-tarjeta-item">


                            <div class="compra-tarjeta-info">


                                <div class="compra-tarjeta-concepto">

                                    ${
                                        esMeses
                                            ? "📆 "
                                            : "🛒 "
                                    }

                                    ${escaparHTMLCompra(
                                        compra.concepto
                                    )}

                                </div>


                                ${
                                    compra.descripcion
                                        ? `
                                            <div class="compra-tarjeta-descripcion">
                                                📝
                                                ${escaparHTMLCompra(
                                                    compra.descripcion
                                                )}
                                            </div>
                                          `
                                        : ""
                                }


                                <div class="compra-tarjeta-detalles">

                                    <span>
                                        📅
                                        ${formatearFechaCompra(
                                            compra.fecha_compra
                                        )}
                                    </span>


                                    <span>
                                        ${escaparHTMLCompra(
                                            tipoTexto
                                        )}
                                    </span>


                                    <span>
                                        ${pagosTexto}
                                    </span>

                                </div>

                            </div>


                            <div class="compra-tarjeta-montos">


                                <div class="compra-monto-principal">

                                    ${formatearMonedaCompra(
                                        compra.monto_original
                                    )}

                                </div>


                                ${
                                    esMeses
                                        ? `

                                            <div>

                                                <span>
                                                    Mensualidad
                                                </span>

                                                <strong>
                                                    ${formatearMonedaCompra(
                                                        montoPago
                                                    )}
                                                </strong>

                                            </div>


                                            <div>

                                                <span>
                                                    Pagados
                                                </span>

                                                <strong>
                                                    ${mesesPagados}
                                                    /
                                                    ${mesesTotales}
                                                </strong>

                                            </div>


                                            <div>

                                                <span>
                                                    Saldo pendiente
                                                </span>

                                                <strong>
                                                    ${formatearMonedaCompra(
                                                        saldo
                                                    )}
                                                </strong>

                                            </div>

                                        `
                                        : `

                                            <div>

                                                <span>
                                                    Pendiente
                                                </span>

                                                <strong>
                                                    ${formatearMonedaCompra(
                                                        saldo
                                                    )}
                                                </strong>

                                            </div>

                                        `
                                }


                                <div>

                                    <span>
                                        Próximo pago
                                    </span>

                                    <strong>
                                        ${formatearFechaCompra(
                                            fechaPago
                                        )}
                                    </strong>

                                </div>

                            </div>


                            <div class="compra-tarjeta-acciones">


                                <button
                                    type="button"
                                    class="btn-secundario"
                                    onclick="editarCompraTarjeta('${compra.id}')"
                                >
                                    ✏️ Editar
                                </button>


                                <button
                                    type="button"
                                    class="btn-peligro"
                                    onclick="desactivarCompraTarjeta('${compra.id}')"
                                >
                                    🗑️
                                </button>

                            </div>

                        </div>

                    `;
                };


            let html = "";


            /*
               CONTADO
            */

            if (
                comprasContado.length
            ) {

                html += `

                    <div class="grupo-compras-tarjeta">

                        <div class="grupo-compras-tarjeta-titulo">

                            <strong>
                                🛒 Compras de contado
                            </strong>

                            <span>
                                ${comprasContado.length}
                                ${
                                    comprasContado.length === 1
                                        ? "compra"
                                        : "compras"
                                }
                            </span>

                        </div>

                        ${comprasContado
                            .map(renderCompra)
                            .join("")}

                    </div>

                `;

            }


            /*
               MSI
            */

            if (
                comprasMSI.length
            ) {

                html += `

                    <div class="grupo-compras-tarjeta">

                        <div class="grupo-compras-tarjeta-titulo">

                            <strong>
                                📆 Compras a meses sin intereses
                            </strong>

                            <span>
                                ${comprasMSI.length}
                                ${
                                    comprasMSI.length === 1
                                        ? "compra"
                                        : "compras"
                                }
                            </span>

                        </div>

                        ${comprasMSI
                            .map(renderCompra)
                            .join("")}

                    </div>

                `;

            }


            contenedor.innerHTML =
                html;

        }


    } catch (error) {

        console.error(
            "Error cargando compras:",
            error
        );


        contenedores.forEach(
            contenedor => {

                contenedor.innerHTML = `

                    <div class="sin-compras-tarjeta error">

                        <span>⚠️</span>

                        <div>

                            <strong>
                                No se pudieron cargar las compras
                            </strong>

                            <small>
                                Revisa la consola para ver el detalle.
                            </small>

                        </div>

                    </div>

                `;

            }
        );

    }
}


// ======================================================
// LIMPIAR FORMULARIO
// ======================================================

function limpiarFormularioCompraTarjeta() {

    const tarjeta =
        document.getElementById(
            "compraTarjetaSeleccion"
        );

    const concepto =
        document.getElementById(
            "compraConcepto"
        );

    const descripcion =
        document.getElementById(
            "compraDescripcion"
        );

    const monto =
        document.getElementById(
            "compraMonto"
        );

    const tipo =
        document.getElementById(
            "compraTipo"
        );

    const meses =
        document.getElementById(
            "compraMeses"
        );

    const fecha =
        document.getElementById(
            "compraFecha"
        );


    if (tarjeta) {
        tarjeta.value = "";
    }


    if (concepto) {
        concepto.value = "";
    }


    if (descripcion) {
        descripcion.value = "";
    }


    if (monto) {
        monto.value = "";
    }


    if (tipo) {
        tipo.value = "normal";
    }


    if (meses) {
        meses.value = "";
    }


    if (fecha) {

        const hoy =
            new Date();


        fecha.value =
            [
                hoy.getFullYear(),
                String(
                    hoy.getMonth() + 1
                ).padStart(2, "0"),
                String(
                    hoy.getDate()
                ).padStart(2, "0")
            ].join("-");

    }


    const pagos =
        asegurarCampoPagosRealizadosCompra();


    if (pagos) {
        pagos.value = "0";
    }


    actualizarTipoCompraTarjeta();


    mostrarMensajeCompraTarjeta("");
}


// ======================================================
// NUEVA COMPRA
// ======================================================

async function nuevaCompraTarjeta(
    tarjetaId = null
) {

    compraTarjetaEditandoId =
        null;


    limpiarFormularioCompraTarjeta();


    const titulo =
        document.getElementById(
            "modalCompraTarjetaTitulo"
        );


    if (titulo) {

        titulo.textContent =
            "Nueva compra con tarjeta";

    }


    await cargarTarjetasParaCompra(
        tarjetaId
    );


    const selector =
        document.getElementById(
            "compraTarjetaSeleccion"
        );


    if (
        selector &&
        tarjetaId
    ) {

        selector.value =
            tarjetaId;

    }


    const modal =
        document.getElementById(
            "modalCompraTarjeta"
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
// CERRAR MODAL
// ======================================================

function cerrarModalCompraTarjeta() {

    const modal =
        document.getElementById(
            "modalCompraTarjeta"
        );


    if (modal) {

        modal.style.display =
            "none";

        modal.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    compraTarjetaEditandoId =
        null;


    mostrarMensajeCompraTarjeta("");
}


// ======================================================
// GUARDAR COMPRA
// ======================================================

async function guardarCompraTarjeta(
    evento
) {

    if (evento) {
        evento.preventDefault();
    }


    const boton =
        document.getElementById(
            "btnGuardarCompraTarjeta"
        );


    try {

        const usuario =
            await obtenerUsuarioCompraTarjeta();


        const tarjetaId =
            document.getElementById(
                "compraTarjetaSeleccion"
            )?.value;


        const concepto =
            document.getElementById(
                "compraConcepto"
            )?.value.trim();


        const descripcion =
            document.getElementById(
                "compraDescripcion"
            )?.value.trim() ||
            "";


        const monto =
            Number(
                document.getElementById(
                    "compraMonto"
                )?.value ||
                0
            );


        const tipo =
            document.getElementById(
                "compraTipo"
            )?.value ||
            "normal";


        const meses =
            Number(
                document.getElementById(
                    "compraMeses"
                )?.value ||
                0
            );


        const fechaTexto =
            document.getElementById(
                "compraFecha"
            )?.value;


        const pagosElemento =
            document.getElementById(
                "compraPagosRealizados"
            );


        const pagosRealizados =
            pagosElemento
                ? Number(
                    pagosElemento.value ||
                    0
                )
                : 0;


        if (!tarjetaId) {
            throw new Error(
                "Selecciona una tarjeta."
            );
        }


        if (!concepto) {
            throw new Error(
                "Escribe el concepto de la compra."
            );
        }


        if (
            !Number.isFinite(monto) ||
            monto <= 0
        ) {
            throw new Error(
                "El monto debe ser mayor que cero."
            );
        }


        if (!fechaTexto) {
            throw new Error(
                "Selecciona la fecha de compra."
            );
        }


        const fechaCompra =
            crearFechaLocalCompra(
                fechaTexto
            );


        const tarjeta =
            await obtenerDatosTarjetaCompra(
                tarjetaId
            );


        let mesesTotales = 1;

        let mesesPagados = 0;

        let mensualidad =
            monto;

        let saldoPendiente =
            monto;


        const primerPagoReal =
            obtenerPrimerPagoCompra(
                fechaCompra,
                tarjeta
            );


        let fechaPrimerPago =
            primerPagoReal;


        let fechaFin =
            primerPagoReal;


        if (
            tipo === "meses"
        ) {

            if (
                !Number.isInteger(meses) ||
                meses < 2
            ) {

                throw new Error(
                    "Indica correctamente el número de meses."
                );

            }


            if (
                !Number.isInteger(
                    pagosRealizados
                ) ||
                pagosRealizados < 0 ||
                pagosRealizados > meses
            ) {

                throw new Error(
                    "Los pagos ya realizados deben estar entre 0 y el total de meses."
                );

            }


            mesesTotales =
                meses;


            mesesPagados =
                pagosRealizados;


            mensualidad =
                Number(
                    (
                        monto /
                        mesesTotales
                    ).toFixed(2)
                );


            saldoPendiente =
                mesesPagados >=
                mesesTotales

                    ? 0

                    : Math.max(
                        0,
                        Number(
                            (
                                monto -
                                (
                                    mensualidad *
                                    mesesPagados
                                )
                            ).toFixed(2)
                        )
                    );


            /*
               fecha_primer_pago conserva
               el PRIMER pago real.

               meses_pagados determina
               cuál es el siguiente.
            */

            fechaPrimerPago =
                primerPagoReal;


            fechaFin =
                sumarMesesFechaCompra(
                    primerPagoReal,
                    mesesTotales - 1
                );

        }


        const datos = {

            usuario_id:
                usuario.id,

            tarjeta_id:
                tarjetaId,

            concepto,

            descripcion,

            monto_original:
                Number(
                    monto.toFixed(2)
                ),

            tipo,

            meses_totales:
                mesesTotales,

            meses_pagados:
                mesesPagados,

            mensualidad:
                Number(
                    mensualidad.toFixed(2)
                ),

            saldo_pendiente:
                Number(
                    saldoPendiente.toFixed(2)
                ),

            fecha_compra:
                fechaTexto,

            fecha_primer_pago:
                fechaLocalAStringCompra(
                    fechaPrimerPago
                ),

            fecha_fin:
                fechaLocalAStringCompra(
                    fechaFin
                ),

            activa:
                saldoPendiente > 0

        };


        if (boton) {

            boton.disabled =
                true;

            boton.textContent =
                "Guardando...";

        }


        if (
            compraTarjetaEditandoId
        ) {

            const resultado =
                await supabaseClient
                    .from("compras_tarjeta")
                    .update(datos)
                    .eq(
                        "id",
                        compraTarjetaEditandoId
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
                    .from("compras_tarjeta")
                    .insert(datos);


            if (resultado.error) {
                throw resultado.error;
            }

        }


        mostrarMensajeCompraTarjeta(
            "Compra guardada correctamente.",
            "ok"
        );


        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    300
                )
        );


        cerrarModalCompraTarjeta();


        await cargarTarjetas();


    } catch (error) {

        console.error(
            "Error guardando compra:",
            error
        );


        mostrarMensajeCompraTarjeta(
            error.message ||
            "No se pudo guardar la compra."
        );

    } finally {

        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                "Guardar compra";

        }

    }
}


// ======================================================
// EDITAR COMPRA
// ======================================================

async function editarCompraTarjeta(
    id
) {

    try {

        const usuario =
            await obtenerUsuarioCompraTarjeta();


        const {
            data,
            error
        } =
            await supabaseClient
                .from("compras_tarjeta")
                .select(`
                    id,
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
                    fecha_fin
                `)
                .eq(
                    "id",
                    id
                )
                .eq(
                    "usuario_id",
                    usuario.id
                )
                .maybeSingle();


        if (error) {
            throw error;
        }


        if (!data) {

            throw new Error(
                "No se encontró la compra."
            );

        }


        compraTarjetaEditandoId =
            id;


        await cargarTarjetasParaCompra(
            data.tarjeta_id
        );


        document.getElementById(
            "compraTarjetaSeleccion"
        ).value =
            data.tarjeta_id || "";


        document.getElementById(
            "compraConcepto"
        ).value =
            data.concepto || "";


        document.getElementById(
            "compraDescripcion"
        ).value =
            data.descripcion || "";


        document.getElementById(
            "compraMonto"
        ).value =
            Number(
                data.monto_original || 0
            ).toFixed(2);


        document.getElementById(
            "compraTipo"
        ).value =
            data.tipo ||
            "normal";


        document.getElementById(
            "compraMeses"
        ).value =
            data.tipo === "meses"
                ? data.meses_totales || ""
                : "";


        document.getElementById(
            "compraFecha"
        ).value =
            String(
                data.fecha_compra || ""
            ).slice(
                0,
                10
            );


        const pagos =
            asegurarCampoPagosRealizadosCompra();


        if (pagos) {

            pagos.value =
                data.tipo === "meses"
                    ? Number(
                        data.meses_pagados || 0
                    )
                    : 0;

        }


        const titulo =
            document.getElementById(
                "modalCompraTarjetaTitulo"
            );


        if (titulo) {

            titulo.textContent =
                "Editar compra con tarjeta";

        }


        mostrarMensajeCompraTarjeta("");


        actualizarTipoCompraTarjeta();


        const modal =
            document.getElementById(
                "modalCompraTarjeta"
            );


        if (modal) {

            modal.style.display =
                "flex";

            modal.setAttribute(
                "aria-hidden",
                "false"
            );

        }


    } catch (error) {

        console.error(
            "Error editando compra:",
            error
        );


        alert(
            error.message ||
            "No se pudo cargar la compra."
        );

    }
}


// ======================================================
// ELIMINAR COMPRA
// ======================================================

async function desactivarCompraTarjeta(
    id
) {

    if (
        !confirm(
            "¿Deseas eliminar esta compra?"
        )
    ) {
        return;
    }


    try {

        const usuario =
            await obtenerUsuarioCompraTarjeta();


        const resultado =
            await supabaseClient
                .from("compras_tarjeta")
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


        if (resultado.error) {
            throw resultado.error;
        }


        await cargarTarjetas();


    } catch (error) {

        console.error(
            "Error eliminando compra:",
            error
        );


        alert(
            error.message ||
            "No se pudo eliminar la compra."
        );

    }
}


// ======================================================
// INICIALIZACIÓN
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const tipo =
            document.getElementById(
                "compraTipo"
            );


        if (tipo) {

            tipo.addEventListener(
                "change",
                actualizarTipoCompraTarjeta
            );

        }


        asegurarCampoPagosRealizadosCompra();

        actualizarTipoCompraTarjeta();


        const modal =
            document.getElementById(
                "modalCompraTarjeta"
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

                        cerrarModalCompraTarjeta();

                    }

                }
            );

        }


        cargarTarjetasParaCompra();

    }
);