
// ============================================================
// MIS FINANZAS - MÓDULO DE DEUDAS
// ============================================================

console.log("Deudas: iniciando módulo...");

let usuarioActualDeudas = null;
let deudasActuales = [];
let abonosActuales = [];

// ============================================================
// INICIO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
    console.log("Deudas: DOM cargado");

    configurarBotonesDeudas();
    establecerFechasDeudas();
    configurarFechaLimite();

    // Iniciar después de configurar los botones
    setTimeout(() => {
        iniciarModuloDeudas();
    }, 100);
});


// ============================================================
// CONFIGURAR BOTONES
// ============================================================

function configurarBotonesDeudas() {

    console.log("Deudas: configurando botones...");

    const btnNuevaDeuda = document.getElementById("btnNuevaDeuda");

    if (btnNuevaDeuda) {
        btnNuevaDeuda.addEventListener("click", () => {
            console.log("Deudas: abrir nueva deuda");
            abrirNuevaDeuda();
        });
    } else {
        console.warn("No existe btnNuevaDeuda");
    }

    const btnCancelarDeuda = document.getElementById("btnCancelarDeuda");

    if (btnCancelarDeuda) {
        btnCancelarDeuda.addEventListener("click", cerrarModalDeuda);
    }

    const btnGuardarDeuda = document.getElementById("btnGuardarDeuda");

    if (btnGuardarDeuda) {
        btnGuardarDeuda.addEventListener("click", guardarDeuda);
    }

    const btnCancelarAbono = document.getElementById("btnCancelarAbono");

    if (btnCancelarAbono) {
        btnCancelarAbono.addEventListener("click", cerrarModalAbono);
    }

    const btnRegistrarAbono = document.getElementById("btnRegistrarAbono");

    if (btnRegistrarAbono) {
        btnRegistrarAbono.addEventListener("click", registrarAbono);
    }

    // Cerrar modal haciendo clic fuera
    const modalDeuda = document.getElementById("modalDeuda");

    if (modalDeuda) {
        modalDeuda.addEventListener("click", (e) => {
            if (e.target === modalDeuda) {
                cerrarModalDeuda();
            }
        });
    }

    const modalAbono = document.getElementById("modalAbono");

    if (modalAbono) {
        modalAbono.addEventListener("click", (e) => {
            if (e.target === modalAbono) {
                cerrarModalAbono();
            }
        });
    }

    // Tecla ESC
    document.addEventListener("keydown", (e) => {

        if (e.key !== "Escape") {
            return;
        }

        cerrarModalDeuda();
        cerrarModalAbono();
    });

    console.log("Deudas: botones configurados.");
}


// ============================================================
// INICIAR MÓDULO
// ============================================================

async function iniciarModuloDeudas() {

    console.log("Deudas: iniciando módulo...");

    try {

        if (typeof supabaseClient === "undefined") {
            console.error("Deudas: supabaseClient no existe.");
            mostrarMensajeDeuda(
                "No se pudo conectar con Supabase.",
                "error"
            );
            actualizarEstadoConexion(false);
            return;
        }

        const usuario = await obtenerUsuarioDeudas();

        if (!usuario) {
            console.warn("Deudas: no hay usuario autenticado.");
            actualizarEstadoConexion(false);
            return;
        }

        usuarioActualDeudas = usuario;

        console.log(
            "Deudas: usuario autenticado:",
            usuarioActualDeudas.id
        );

        actualizarEstadoConexion(true);

        await cargarDeudas();

    } catch (error) {

        console.error("Deudas: error al iniciar:", error);

        actualizarEstadoConexion(false);

        mostrarMensajeDeuda(
            "Ocurrió un error al cargar el módulo de deudas.",
            "error"
        );
    }
}


// ============================================================
// USUARIO
// ============================================================

async function obtenerUsuarioDeudas() {

    const { data, error } = await supabaseClient.auth.getUser();

    if (error) {

        console.error(
            "Deudas: error obteniendo usuario:",
            error
        );

        return null;
    }

    return data?.user || null;
}


// ============================================================
// CARGAR DEUDAS
// ============================================================

async function cargarDeudas() {

    console.log("Deudas: cargando deudas...");

    const contenedor = document.getElementById("contenedorDeudas");

    if (contenedor) {
        contenedor.innerHTML = `
            <div class="mensaje">
                Cargando deudas...
            </div>
        `;
    }

    const { data, error } = await supabaseClient
        .from("deudas")
        .select("*")
        .eq("usuario_id", usuarioActualDeudas.id)
        .order("activa", { ascending: false })
        .order("fecha_limite", { ascending: true });

    if (error) {

        console.error(
            "Deudas: error cargando deudas:",
            error
        );

        mostrarMensajeDeuda(
            "No se pudieron cargar las deudas: " + error.message,
            "error"
        );

        return;
    }

    deudasActuales = data || [];

    console.log(
        "Deudas: deudas encontradas:",
        deudasActuales.length
    );

    await cargarAbonosYMostrar();
}


// ============================================================
// CARGAR ABONOS
// ============================================================

async function cargarAbonosYMostrar() {

    const { data, error } = await supabaseClient
        .from("abonos_deuda")
        .select("*")
        .eq("usuario_id", usuarioActualDeudas.id)
        .order("fecha", { ascending: false });

    if (error) {

        console.error(
            "Deudas: error cargando abonos:",
            error
        );

        abonosActuales = [];

    } else {

        abonosActuales = data || [];
    }

    actualizarResumenDeudas();
    renderizarDeudas();
}


// ============================================================
// RESUMEN
// ============================================================

function actualizarResumenDeudas() {

    const totalDeudas = deudasActuales.reduce(
        (total, deuda) => {
            return total + Number(deuda.monto_original || 0);
        },
        0
    );

    const saldoPendiente = deudasActuales.reduce(
        (total, deuda) => {
            return total + Number(deuda.saldo_pendiente || 0);
        },
        0
    );

    const totalAbonado = abonosActuales.reduce(
        (total, abono) => {
            return total + Number(abono.importe || 0);
        },
        0
    );

    const deudasActivas = deudasActuales.filter(
        deuda => deuda.activa
    ).length;


    const elementoTotal = document.getElementById("totalDeudas");

    if (elementoTotal) {
        elementoTotal.textContent =
            formatearMoneda(totalDeudas);
    }


    const elementoSaldo =
        document.getElementById("saldoPendiente");

    if (elementoSaldo) {
        elementoSaldo.textContent =
            formatearMoneda(saldoPendiente);
    }


    const elementoAbonado =
        document.getElementById("totalAbonado");

    if (elementoAbonado) {
        elementoAbonado.textContent =
            formatearMoneda(totalAbonado);
    }


    const elementoActivas =
        document.getElementById("deudasActivas");

    if (elementoActivas) {
        elementoActivas.textContent =
            deudasActivas;
    }
}


// ============================================================
// MOSTRAR DEUDAS
// ============================================================

function renderizarDeudas() {

    const contenedor =
        document.getElementById("contenedorDeudas");

    if (!contenedor) {
        console.error(
            "No existe contenedorDeudas"
        );
        return;
    }

    if (deudasActuales.length === 0) {

        contenedor.innerHTML = `
            <div class="mensaje">
                <strong>No tienes deudas registradas.</strong>
                <br>
                Puedes registrar una deuda con el botón
                "Nueva deuda".
            </div>
        `;

        return;
    }


    contenedor.innerHTML = deudasActuales
        .map(deuda => crearTarjetaDeuda(deuda))
        .join("");


    // Configurar botones generados dinámicamente

    contenedor
        .querySelectorAll("[data-accion]")
        .forEach(boton => {

            boton.addEventListener("click", () => {

                const accion =
                    boton.dataset.accion;

                const id =
                    boton.dataset.id;

                if (accion === "abono") {
                    abrirAbono(id);
                }

                if (accion === "editar") {
                    editarDeuda(id);
                }

                if (accion === "historial") {
                    verHistorialDeuda(id);
                }

                if (accion === "eliminar") {
                    eliminarDeuda(id);
                }
            });
        });
}


// ============================================================
// CREAR TARJETA DE DEUDA
// ============================================================

function crearTarjetaDeuda(deuda) {

    const original =
        Number(deuda.monto_original || 0);

    const saldo =
        Number(deuda.saldo_pendiente || 0);

    const abonado =
        Math.max(0, original - saldo);

    let porcentaje = 0;

    if (original > 0) {
        porcentaje =
            (abonado / original) * 100;
    }

    porcentaje =
        Math.min(100, Math.max(0, porcentaje));


    const tipoTexto =
        obtenerTextoTipoDeuda(deuda.tipo);


    let fechaLimiteHTML = "";

    if (deuda.tiene_fecha_limite && deuda.fecha_limite) {

        const fecha =
            formatearFecha(deuda.fecha_limite);

        const vencida =
            deuda.activa &&
            fechaEsPasada(deuda.fecha_limite);

        fechaLimiteHTML = `
            <div>
                <strong>Fecha límite:</strong>
                <span ${
                    vencida
                        ? 'style="color:#dc3545;font-weight:bold;"'
                        : ""
                }>
                    ${fecha}
                    ${vencida ? " — VENCIDA" : ""}
                </span>
            </div>
        `;
    }


    let estadoHTML = "";

    if (!deuda.activa || saldo <= 0) {

        estadoHTML = `
            <span class="badge"
                style="
                    display:inline-block;
                    padding:5px 10px;
                    border-radius:20px;
                    background:#eaf7ef;
                    color:#198754;
                    font-size:13px;
                    font-weight:bold;
                ">
                LIQUIDADA
            </span>
        `;

    } else {

        estadoHTML = `
            <span class="badge"
                style="
                    display:inline-block;
                    padding:5px 10px;
                    border-radius:20px;
                    background:#f8eaea;
                    color:#8b0000;
                    font-size:13px;
                    font-weight:bold;
                ">
                ACTIVA
            </span>
        `;
    }


    const botonAbono =
        deuda.activa && saldo > 0
            ? `
                <button
                    class="btn-principal"
                    type="button"
                    data-accion="abono"
                    data-id="${deuda.id}">
                    + Registrar abono
                </button>
            `
            : "";


    return `
        <div class="panel-dashboard"
            style="margin-bottom:20px;">

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:flex-start;
                gap:15px;
                flex-wrap:wrap;
            ">

                <div style="flex:1;min-width:220px;">

                    <div style="
                        display:flex;
                        align-items:center;
                        gap:10px;
                        flex-wrap:wrap;
                        margin-bottom:6px;
                    ">

                        <h3 style="
                            margin:0;
                            font-size:20px;
                        ">
                            ${escaparHTML(deuda.nombre)}
                        </h3>

                        ${estadoHTML}

                    </div>


                    ${
                        deuda.descripcion
                            ? `
                                <div style="
                                    color:#707070;
                                    margin-bottom:10px;
                                ">
                                    ${escaparHTML(
                                        deuda.descripcion
                                    )}
                                </div>
                            `
                            : ""
                    }


                    <div style="
                        display:grid;
                        grid-template-columns:
                            repeat(auto-fit,minmax(160px,1fr));
                        gap:10px;
                        margin-top:12px;
                    ">

                        <div>
                            <strong>Tipo:</strong>
                            ${tipoTexto}
                        </div>

                        <div>
                            <strong>Original:</strong>
                            ${formatearMoneda(original)}
                        </div>

                        <div>
                            <strong>Abonado:</strong>
                            ${formatearMoneda(abonado)}
                        </div>

                        <div>
                            <strong>Saldo:</strong>
                            <span style="
                                font-weight:bold;
                                color:#8b0000;
                            ">
                                ${formatearMoneda(saldo)}
                            </span>
                        </div>

                        ${fechaLimiteHTML}

                    </div>

                </div>


                <div style="
                    min-width:130px;
                    text-align:right;
                ">

                    <div style="
                        font-size:12px;
                        color:#707070;
                        margin-bottom:4px;
                    ">
                        Progreso
                    </div>

                    <div style="
                        font-size:24px;
                        font-weight:bold;
                    ">
                        ${porcentaje.toFixed(0)}%
                    </div>

                </div>

            </div>


            <div style="
                margin-top:15px;
                height:10px;
                background:#e6e6e6;
                border-radius:10px;
                overflow:hidden;
            ">

                <div style="
                    width:${porcentaje}%;
                    height:100%;
                    background:#198754;
                    border-radius:10px;
                "></div>

            </div>


            ${
                deuda.notas
                    ? `
                        <div style="
                            margin-top:12px;
                            padding:10px;
                            background:#f5f6f8;
                            border-radius:8px;
                            color:#555;
                        ">
                            <strong>Notas:</strong>
                            ${escaparHTML(deuda.notas)}
                        </div>
                    `
                    : ""
            }


            <div class="acciones"
                style="
                    margin-top:18px;
                    display:flex;
                    gap:8px;
                    flex-wrap:wrap;
                ">

                ${botonAbono}

                <button
                    class="btn-secundario"
                    type="button"
                    data-accion="historial"
                    data-id="${deuda.id}">
                    Historial
                </button>

                <button
                    class="btn-secundario"
                    type="button"
                    data-accion="editar"
                    data-id="${deuda.id}">
                    Editar
                </button>

                <button
                    class="btn-peligro"
                    type="button"
                    data-accion="eliminar"
                    data-id="${deuda.id}">
                    Eliminar
                </button>

            </div>

        </div>
    `;
}


// ============================================================
// NUEVA DEUDA
// ============================================================

function abrirNuevaDeuda() {

    console.log("Deudas: abrir nueva deuda");

    limpiarFormularioDeuda();

    const titulo =
        document.getElementById("tituloModalDeuda");

    if (titulo) {
        titulo.textContent = "Nueva deuda";
    }

    abrirModal("modalDeuda");
}


// ============================================================
// EDITAR DEUDA
// ============================================================

function editarDeuda(id) {

    const deuda =
        deudasActuales.find(
            item => item.id === id
        );

    if (!deuda) {
        console.error(
            "No se encontró la deuda:",
            id
        );
        return;
    }


    const titulo =
        document.getElementById("tituloModalDeuda");

    if (titulo) {
        titulo.textContent = "Editar deuda";
    }


    establecerValor("deudaId", deuda.id);
    establecerValor("nombreDeuda", deuda.nombre);
    establecerValor(
        "descripcionDeuda",
        deuda.descripcion || ""
    );
    establecerValor(
        "tipoDeuda",
        deuda.tipo || "prestamo"
    );
    establecerValor(
        "montoDeuda",
        deuda.monto_original
    );
    establecerValor(
        "fechaInicioDeuda",
        deuda.fecha_inicio || ""
    );
    establecerValor(
        "fechaLimiteDeuda",
        deuda.fecha_limite || ""
    );
    establecerValor(
        "notasDeuda",
        deuda.notas || ""
    );


    const tieneFecha =
        document.getElementById("tieneFechaLimite");

    if (tieneFecha) {
        tieneFecha.checked =
            Boolean(deuda.tiene_fecha_limite);
    }

    cambiarFechaLimite();


    abrirModal("modalDeuda");
}


// ============================================================
// GUARDAR DEUDA
// ============================================================

async function guardarDeuda() {

    if (!usuarioActualDeudas) {

        mostrarMensajeDeuda(
            "No hay un usuario autenticado.",
            "error"
        );

        return;
    }


    const id =
        obtenerValor("deudaId");

    const nombre =
        obtenerValor("nombreDeuda").trim();

    const descripcion =
        obtenerValor("descripcionDeuda").trim();

    const tipo =
        obtenerValor("tipoDeuda") || "prestamo";

    const monto =
        Number(obtenerValor("montoDeuda"));

    const fechaInicio =
        obtenerValor("fechaInicioDeuda") || null;

    const tieneFechaLimite =
        document.getElementById(
            "tieneFechaLimite"
        )?.checked || false;

    const fechaLimite =
        tieneFechaLimite
            ? obtenerValor("fechaLimiteDeuda") || null
            : null;

    const notas =
        obtenerValor("notasDeuda").trim();


    // Validaciones

    if (!nombre) {

        mostrarMensajeDeuda(
            "Escribe el nombre o concepto de la deuda.",
            "error"
        );

        return;
    }


    if (!Number.isFinite(monto) || monto <= 0) {

        mostrarMensajeDeuda(
            "El monto debe ser mayor que cero.",
            "error"
        );

        return;
    }


    const boton =
        document.getElementById("btnGuardarDeuda");

    const textoOriginal =
        boton ? boton.textContent : "";


    if (boton) {
        boton.disabled = true;
        boton.textContent = "Guardando...";
    }


    try {

        if (id) {

            // ==================================================
            // ACTUALIZAR
            // ==================================================

            const deudaExistente =
                deudasActuales.find(
                    item => item.id === id
                );

            if (!deudaExistente) {
                throw new Error(
                    "No se encontró la deuda que deseas editar."
                );
            }


            // El saldo pendiente no se vuelve a calcular
            // desde el monto original. Se conserva el saldo
            // actual para no borrar los abonos existentes.

            const datos = {
                nombre,
                descripcion: descripcion || null,
                tipo,
                monto_original: monto,
                fecha_inicio: fechaInicio,
                fecha_limite: fechaLimite,
                tiene_fecha_limite: tieneFechaLimite,
                notas: notas || null,
                actualizado_en: new Date().toISOString()
            };


            const { error } =
                await supabaseClient
                    .from("deudas")
                    .update(datos)
                    .eq("id", id)
                    .eq(
                        "usuario_id",
                        usuarioActualDeudas.id
                    );


            if (error) {
                throw error;
            }


            mostrarMensajeDeuda(
                "Deuda actualizada correctamente.",
                "exito"
            );


        } else {

            // ==================================================
            // CREAR
            // ==================================================

            const datos = {

                usuario_id:
                    usuarioActualDeudas.id,

                nombre,

                descripcion:
                    descripcion || null,

                tipo,

                monto_original:
                    monto,

                saldo_pendiente:
                    monto,

                fecha_inicio:
                    fechaInicio,

                fecha_limite:
                    fechaLimite,

                tiene_fecha_limite:
                    tieneFechaLimite,

                activa:
                    true,

                notas:
                    notas || null
            };


            const { error } =
                await supabaseClient
                    .from("deudas")
                    .insert(datos);


            if (error) {
                throw error;
            }


            mostrarMensajeDeuda(
                "Deuda registrada correctamente.",
                "exito"
            );
        }


        cerrarModalDeuda();

        await cargarDeudas();


    } catch (error) {

        console.error(
            "Deudas: error guardando deuda:",
            error
        );

        mostrarMensajeDeuda(
            "No se pudo guardar la deuda: " +
            (error.message || error),
            "error"
        );

    } finally {

        if (boton) {
            boton.disabled = false;
            boton.textContent =
                textoOriginal || "Guardar deuda";
        }
    }
}


// ============================================================
// FECHA LÍMITE
// ============================================================

function configurarFechaLimite() {

    const checkbox =
        document.getElementById(
            "tieneFechaLimite"
        );

    if (!checkbox) {
        return;
    }


    checkbox.addEventListener(
        "change",
        cambiarFechaLimite
    );
}


function cambiarFechaLimite() {

    const checkbox =
        document.getElementById(
            "tieneFechaLimite"
        );

    const grupo =
        document.getElementById(
            "grupoFechaLimite"
        );

    if (!grupo) {
        return;
    }


    if (checkbox?.checked) {

        grupo.hidden = false;
        grupo.style.display = "";

    } else {

        grupo.hidden = true;
        grupo.style.display = "none";

        const fecha =
            document.getElementById(
                "fechaLimiteDeuda"
            );

        if (fecha) {
            fecha.value = "";
        }
    }
}


// ============================================================
// ABRIR ABONO
// ============================================================

function abrirAbono(id) {

    const deuda =
        deudasActuales.find(
            item => item.id === id
        );

    if (!deuda) {

        console.error(
            "No se encontró la deuda:",
            id
        );

        return;
    }


    if (!deuda.activa ||
        Number(deuda.saldo_pendiente) <= 0) {

        mostrarMensajeDeuda(
            "Esta deuda ya está liquidada.",
            "error"
        );

        return;
    }


    establecerValor(
        "abonoDeudaId",
        deuda.id
    );

    establecerValor(
        "abonoNombreDeuda",
        deuda.nombre
    );

    establecerValor(
        "abonoSaldoActual",
        formatearMoneda(
            deuda.saldo_pendiente
        )
    );

    establecerValor(
        "importeAbono",
        ""
    );

    establecerValor(
        "fechaAbono",
        obtenerFechaHoy()
    );

    establecerValor(
        "conceptoAbono",
        ""
    );

    establecerValor(
        "notasAbono",
        ""
    );


    abrirModal("modalAbono");
}


// ============================================================
// REGISTRAR ABONO
// ============================================================

async function registrarAbono() {

    if (!usuarioActualDeudas) {

        mostrarMensajeDeuda(
            "No hay un usuario autenticado.",
            "error"
        );

        return;
    }


    const deudaId =
        obtenerValor("abonoDeudaId");

    const importe =
        Number(obtenerValor("importeAbono"));

    const fecha =
        obtenerValor("fechaAbono") ||
        obtenerFechaHoy();

    const concepto =
        obtenerValor("conceptoAbono").trim();

    const notas =
        obtenerValor("notasAbono").trim();


    if (!deudaId) {

        mostrarMensajeDeuda(
            "No se identificó la deuda.",
            "error"
        );

        return;
    }


    if (!Number.isFinite(importe) || importe <= 0) {

        mostrarMensajeDeuda(
            "El importe del abono debe ser mayor que cero.",
            "error"
        );

        return;
    }


    const deuda =
        deudasActuales.find(
            item => item.id === deudaId
        );

    if (!deuda) {

        mostrarMensajeDeuda(
            "No se encontró la deuda.",
            "error"
        );

        return;
    }


    const saldoActual =
        Number(deuda.saldo_pendiente || 0);


    if (importe > saldoActual) {

        mostrarMensajeDeuda(
            "El abono no puede ser mayor al saldo pendiente.",
            "error"
        );

        return;
    }


    const nuevoSaldo =
        Math.max(
            0,
            saldoActual - importe
        );


    const nuevaActiva =
        nuevoSaldo > 0;


    const boton =
        document.getElementById(
            "btnRegistrarAbono"
        );

    const textoOriginal =
        boton ? boton.textContent : "";


    if (boton) {
        boton.disabled = true;
        boton.textContent = "Registrando...";
    }


    try {

        // ==================================================
        // 1. REGISTRAR ABONO
        // ==================================================

        const { error: errorAbono } =
            await supabaseClient
                .from("abonos_deuda")
                .insert({

                    usuario_id:
                        usuarioActualDeudas.id,

                    deuda_id:
                        deudaId,

                    importe:
                        importe,

                    fecha:
                        fecha,

                    concepto:
                        concepto || null,

                    notas:
                        notas || null
                });


        if (errorAbono) {
            throw errorAbono;
        }


        // ==================================================
        // 2. ACTUALIZAR SALDO
        // ==================================================

        const { error: errorDeuda } =
            await supabaseClient
                .from("deudas")
                .update({

                    saldo_pendiente:
                        nuevoSaldo,

                    activa:
                        nuevaActiva,

                    actualizado_en:
                        new Date().toISOString()
                })
                .eq("id", deudaId)
                .eq(
                    "usuario_id",
                    usuarioActualDeudas.id
                );


        if (errorDeuda) {
            throw errorDeuda;
        }


        cerrarModalAbono();


        if (nuevoSaldo === 0) {

            mostrarMensajeDeuda(
                "Abono registrado. La deuda quedó liquidada.",
                "exito"
            );

        } else {

            mostrarMensajeDeuda(
                "Abono registrado correctamente.",
                "exito"
            );
        }


        await cargarDeudas();


    } catch (error) {

        console.error(
            "Deudas: error registrando abono:",
            error
        );

        mostrarMensajeDeuda(
            "No se pudo registrar el abono: " +
            (error.message || error),
            "error"
        );

    } finally {

        if (boton) {

            boton.disabled = false;

            boton.textContent =
                textoOriginal ||
                "Registrar abono";
        }
    }
}


// ============================================================
// HISTORIAL
// ============================================================

function verHistorialDeuda(id) {

    const deuda =
        deudasActuales.find(
            item => item.id === id
        );

    if (!deuda) {
        return;
    }


    const abonos =
        abonosActuales
            .filter(
                abono =>
                    abono.deuda_id === id
            )
            .sort(
                (a, b) =>
                    new Date(b.fecha) -
                    new Date(a.fecha)
            );


    if (abonos.length === 0) {

        alert(
            "No hay abonos registrados para esta deuda."
        );

        return;
    }


    let texto =
        `Historial de: ${deuda.nombre}\n\n`;


    abonos.forEach(
        (abono, indice) => {

            texto +=
                `${indice + 1}. ` +
                `${formatearFecha(abono.fecha)} — ` +
                `${formatearMoneda(abono.importe)}`;

            if (abono.concepto) {

                texto +=
                    ` — ${abono.concepto}`;
            }

            texto += "\n";
        }
    );


    texto +=
        `\nTotal abonado: ` +
        `${formatearMoneda(
            abonos.reduce(
                (total, abono) =>
                    total +
                    Number(abono.importe || 0),
                0
            )
        )}`;


    alert(texto);
}


// ============================================================
// ELIMINAR DEUDA
// ============================================================

async function eliminarDeuda(id) {

    const deuda =
        deudasActuales.find(
            item => item.id === id
        );

    if (!deuda) {
        return;
    }


    const confirmar =
        confirm(
            `¿Deseas eliminar la deuda "${deuda.nombre}"?\n\n` +
            `También se eliminarán sus abonos registrados.`
        );


    if (!confirmar) {
        return;
    }


    try {

        const { error } =
            await supabaseClient
                .from("deudas")
                .delete()
                .eq("id", id)
                .eq(
                    "usuario_id",
                    usuarioActualDeudas.id
                );


        if (error) {
            throw error;
        }


        mostrarMensajeDeuda(
            "Deuda eliminada correctamente.",
            "exito"
        );


        await cargarDeudas();


    } catch (error) {

        console.error(
            "Deudas: error eliminando:",
            error
        );

        mostrarMensajeDeuda(
            "No se pudo eliminar la deuda: " +
            (error.message || error),
            "error"
        );
    }
}


// ============================================================
// MODALES
// ============================================================

function abrirModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {

        console.error(
            "No existe el modal:",
            id
        );

        return;
    }


    // Importante:
    // usamos display directamente para evitar
    // conflictos con la clase .oculto

    modal.style.display = "flex";

    document.body.style.overflow = "hidden";
}


function cerrarModalDeuda() {

    const modal =
        document.getElementById(
            "modalDeuda"
        );

    if (modal) {
        modal.style.display = "none";
    }

    document.body.style.overflow = "";

}


function cerrarModalAbono() {

    const modal =
        document.getElementById(
            "modalAbono"
        );

    if (modal) {
        modal.style.display = "none";
    }

    document.body.style.overflow = "";
}


// ============================================================
// LIMPIAR FORMULARIO
// ============================================================

function limpiarFormularioDeuda() {

    establecerValor(
        "deudaId",
        ""
    );

    establecerValor(
        "nombreDeuda",
        ""
    );

    establecerValor(
        "descripcionDeuda",
        ""
    );

    establecerValor(
        "tipoDeuda",
        "prestamo"
    );

    establecerValor(
        "montoDeuda",
        ""
    );

    establecerValor(
        "fechaInicioDeuda",
        obtenerFechaHoy()
    );

    establecerValor(
        "fechaLimiteDeuda",
        ""
    );

    establecerValor(
        "notasDeuda",
        ""
    );


    const checkbox =
        document.getElementById(
            "tieneFechaLimite"
        );

    if (checkbox) {
        checkbox.checked = false;
    }


    cambiarFechaLimite();
}


// ============================================================
// FECHAS INICIALES
// ============================================================

function establecerFechasDeudas() {

    const fechaInicio =
        document.getElementById(
            "fechaInicioDeuda"
        );

    if (
        fechaInicio &&
        !fechaInicio.value
    ) {
        fechaInicio.value =
            obtenerFechaHoy();
    }


    const fechaAbono =
        document.getElementById(
            "fechaAbono"
        );

    if (
        fechaAbono &&
        !fechaAbono.value
    ) {
        fechaAbono.value =
            obtenerFechaHoy();
    }
}


// ============================================================
// MENSAJES
// ============================================================

function mostrarMensajeDeuda(
    mensaje,
    tipo = "exito"
) {

    const elemento =
        document.getElementById(
            "mensajeDeudas"
        );

    if (!elemento) {

        console.log(
            `[${tipo}] ${mensaje}`
        );

        return;
    }


    elemento.textContent =
        mensaje;

    elemento.className =
        "mensaje " +
        (
            tipo === "error"
                ? "mensaje-error"
                : "mensaje-exito"
        );


    elemento.style.display =
        "block";


    clearTimeout(
        mostrarMensajeDeuda.timeout
    );


    mostrarMensajeDeuda.timeout =
        setTimeout(() => {

            elemento.style.display =
                "none";

        }, 5000);
}


// ============================================================
// ESTADO DE CONEXIÓN
// ============================================================

function actualizarEstadoConexion(conectado) {

    const elemento =
        document.getElementById(
            "estadoConexion"
        );

    if (!elemento) {
        return;
    }


    if (conectado) {

        elemento.textContent =
            "● Conectado";

        elemento.style.color =
            "#198754";

    } else {

        elemento.textContent =
            "● Sin conexión";

        elemento.style.color =
            "#dc3545";
    }
}


// ============================================================
// UTILIDADES
// ============================================================

function obtenerValor(id) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {
        return "";
    }

    return elemento.value ?? "";
}


function establecerValor(
    id,
    valor
) {

    const elemento =
        document.getElementById(id);

    if (!elemento) {
        return;
    }

    elemento.value =
        valor ?? "";
}


function obtenerFechaHoy() {

    const ahora =
        new Date();

    const año =
        ahora.getFullYear();

    const mes =
        String(
            ahora.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            ahora.getDate()
        ).padStart(2, "0");


    return `${año}-${mes}-${dia}`;
}


function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }


    const partes =
        String(fecha).split("-");


    if (partes.length === 3) {

        return (
            partes[2] +
            "/" +
            partes[1] +
            "/" +
            partes[0]
        );
    }


    return fecha;
}


function fechaEsPasada(fecha) {

    if (!fecha) {
        return false;
    }


    const hoy =
        obtenerFechaHoy();


    return fecha < hoy;
}


function formatearMoneda(valor) {

    const numero =
        Number(valor || 0);


    return numero.toLocaleString(
        "es-MX",
        {
            style: "currency",
            currency: "MXN"
        }
    );
}


function obtenerTextoTipoDeuda(tipo) {

    const tipos = {

        prestamo:
            "Préstamo",

        personal:
            "Personal",

        familiar:
            "Familiar",

        otro:
            "Otro"
    };


    return tipos[tipo] ||
        tipo ||
        "Otro";
}


function escaparHTML(valor) {

    if (
        valor === null ||
        valor === undefined
    ) {
        return "";
    }


    return String(valor)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// ============================================================
// FIN DEL MÓDULO
// ============================================================

console.log(
    "Deudas: archivo cargado correctamente."
);

