// ============================================
// MÓDULO DE CUENTAS
// MIS FINANZAS
// ============================================

let cuentaEditando = null;


// ============================================
// OBTENER USUARIO ACTUAL
// ============================================

async function obtenerUsuarioActual() {

    const {
        data: { user },
        error
    } = await supabaseClient.auth.getUser();

    if (error) {

        console.error(
            "Error obteniendo usuario:",
            error
        );

        return null;
    }

    return user;
}


// ============================================
// CARGAR CUENTAS
// ============================================

async function cargarCuentas() {

    const usuario = await obtenerUsuarioActual();

    if (!usuario) {

        console.error(
            "No hay usuario autenticado."
        );

        return;
    }

    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("cuentas")

            .select(
                "id, usuario_id, nombre, tipo, saldo, activa"
            )

            .eq(
                "usuario_id",
                usuario.id
            )

            .eq(
                "activa",
                true
            );


        if (error) {

            console.error(
                "Error cargando cuentas:",
                error
            );

            document.getElementById(
                "listaCuentas"
            ).innerHTML = `

                <div class="mensaje-error">

                    Error al cargar las cuentas:<br>

                    ${escapeHtml(error.message)}

                </div>

            `;

            return;
        }


        console.log(
            "Cuentas cargadas:",
            data
        );


        mostrarCuentas(data);

    }

    catch (error) {

        console.error(
            "Error inesperado cargando cuentas:",
            error
        );

        document.getElementById(
            "listaCuentas"
        ).innerHTML = `

            <div class="mensaje-error">

                Error inesperado al cargar las cuentas.

            </div>

        `;

    }

}


// ============================================
// MOSTRAR CUENTAS
// ============================================

function mostrarCuentas(cuentas) {

    const contenedor =
        document.getElementById(
            "listaCuentas"
        );

    const totalElemento =
        document.getElementById(
            "totalDinero"
        );


    if (!contenedor) return;


    contenedor.innerHTML = "";


    let total = 0;


    if (
        !cuentas ||
        cuentas.length === 0
    ) {

        contenedor.innerHTML = `

            <div class="empty-state">

                <div class="empty-icon">
                    💰
                </div>

                <h3>
                    No tienes cuentas registradas
                </h3>

                <p>
                    Agrega tu primera cuenta para
                    comenzar a controlar tu dinero.
                </p>

            </div>

        `;

    }


    cuentas.forEach(cuenta => {

        const saldo =
            Number(cuenta.saldo) || 0;


        total += saldo;


        let icono = "💰";


        if (
            cuenta.tipo === "efectivo"
        ) {

            icono = "💵";

        }

        else if (
            cuenta.tipo === "debito"
        ) {

            icono = "💳";

        }

        else if (
            cuenta.tipo === "ahorro"
        ) {

            icono = "🏦";

        }

        else {

            icono = "💰";

        }


        const tarjeta =
            document.createElement("div");


        tarjeta.className =
            "cuenta-card";


        tarjeta.innerHTML = `

            <div class="cuenta-icono">
                ${icono}
            </div>


            <div class="cuenta-info">

                <h3>
                    ${escapeHtml(
                        cuenta.nombre
                    )}
                </h3>

                <span>
                    ${obtenerNombreTipo(
                        cuenta.tipo
                    )}
                </span>

            </div>


            <div class="cuenta-saldo">

                <strong>
                    ${formatearMoneda(
                        saldo
                    )}
                </strong>


                <div class="cuenta-acciones">

                    <button
                        type="button"
                        onclick="editarCuenta('${cuenta.id}')"
                        title="Editar"
                    >
                        ✏️
                    </button>


                    <button
                        type="button"
                        onclick="desactivarCuenta('${cuenta.id}')"
                        title="Desactivar"
                    >
                        🗑️
                    </button>

                </div>

            </div>

        `;


        contenedor.appendChild(
            tarjeta
        );

    });


    if (totalElemento) {

        totalElemento.textContent =
            formatearMoneda(total);

    }

}


// ============================================
// NOMBRE DEL TIPO
// ============================================

function obtenerNombreTipo(tipo) {

    switch (tipo) {

        case "efectivo":
            return "Efectivo";

        case "debito":
            return "Cuenta de débito";

        case "ahorro":
            return "Ahorro";

        case "otro":
            return "Otra cuenta";

        default:
            return tipo;

    }

}


// ============================================
// FORMATEAR MONEDA
// ============================================

function formatearMoneda(valor) {

    return new Intl.NumberFormat(
        "es-MX",
        {
            style: "currency",
            currency: "MXN"
        }
    ).format(valor);

}


// ============================================
// ABRIR MODAL NUEVA CUENTA
// ============================================

function nuevaCuenta() {

    cuentaEditando = null;


    document.getElementById(
        "modalTitulo"
    ).textContent =
        "Nueva cuenta";


    document.getElementById(
        "cuentaNombre"
    ).value = "";


    document.getElementById(
        "cuentaTipo"
    ).value =
        "efectivo";


    document.getElementById(
        "cuentaSaldo"
    ).value = "";


    document.getElementById(
        "modalCuenta"
    ).style.display =
        "flex";

}


// ============================================
// CERRAR MODAL
// ============================================

function cerrarModalCuenta() {

    document.getElementById(
        "modalCuenta"
    ).style.display =
        "none";

}


// ============================================
// GUARDAR CUENTA
// ============================================

async function guardarCuenta() {

    const usuario =
        await obtenerUsuarioActual();


    if (!usuario) {

        window.location.href =
            "login.html";

        return;

    }


    const nombre =
        document.getElementById(
            "cuentaNombre"
        ).value.trim();


    const tipo =
        document.getElementById(
            "cuentaTipo"
        ).value;


    const saldoTexto =
        document.getElementById(
            "cuentaSaldo"
        ).value;


    const saldo =
        Number(saldoTexto);


    // ========================================
    // VALIDACIONES
    // ========================================

    if (!nombre) {

        mostrarMensajeCuenta(
            "Escribe el nombre de la cuenta.",
            "error"
        );

        return;

    }


    if (
        saldoTexto === "" ||
        isNaN(saldo)
    ) {

        mostrarMensajeCuenta(
            "Escribe un saldo válido.",
            "error"
        );

        return;

    }


    const boton =
        document.getElementById(
            "btnGuardarCuenta"
        );


    if (boton) {

        boton.disabled = true;

        boton.textContent =
            "Guardando...";

    }


    let error = null;


    // ========================================
    // EDITAR CUENTA
    // ========================================

    if (cuentaEditando) {

        const resultado =
            await supabaseClient

                .from("cuentas")

                .update({

                    nombre:
                        nombre,

                    tipo:
                        tipo,

                    saldo:
                        saldo

                })

                .eq(
                    "id",
                    cuentaEditando
                )

                .eq(
                    "usuario_id",
                    usuario.id
                );


        error =
            resultado.error;

    }


    // ========================================
    // CREAR CUENTA
    // ========================================

    else {

        const resultado =
            await supabaseClient

                .from("cuentas")

                .insert({

                    usuario_id:
                        usuario.id,

                    nombre:
                        nombre,

                    tipo:
                        tipo,

                    saldo:
                        saldo,

                    activa:
                        true

                });


        error =
            resultado.error;

    }


    // ========================================
    // RESTAURAR BOTÓN
    // ========================================

    if (boton) {

        boton.disabled = false;

        boton.textContent =
            "Guardar cuenta";

    }


    // ========================================
    // MOSTRAR ERROR
    // ========================================

    if (error) {

        console.error(
            "Error guardando cuenta:",
            error
        );


        mostrarMensajeCuenta(

            "No se pudo guardar la cuenta: " +
            error.message,

            "error"

        );

        return;

    }


    // ========================================
    // CERRAR Y RECARGAR
    // ========================================

    cerrarModalCuenta();

    cuentaEditando = null;

    await cargarCuentas();

}


// ============================================
// EDITAR CUENTA
// ============================================

async function editarCuenta(id) {

    const usuario =
        await obtenerUsuarioActual();


    if (!usuario) {

        window.location.href =
            "login.html";

        return;

    }


    const {
        data,
        error
    } = await supabaseClient

        .from("cuentas")

        .select(
            "id, usuario_id, nombre, tipo, saldo, activa"
        )

        .eq(
            "id",
            id
        )

        .eq(
            "usuario_id",
            usuario.id
        )

        .single();


    if (error) {

        console.error(
            "Error obteniendo cuenta:",
            error
        );


        mostrarMensajeCuenta(

            "No se pudo obtener la cuenta: " +
            error.message,

            "error"

        );

        return;

    }


    cuentaEditando =
        data.id;


    document.getElementById(
        "modalTitulo"
    ).textContent =
        "Editar cuenta";


    document.getElementById(
        "cuentaNombre"
    ).value =
        data.nombre;


    document.getElementById(
        "cuentaTipo"
    ).value =
        data.tipo;


    document.getElementById(
        "cuentaSaldo"
    ).value =
        data.saldo;


    document.getElementById(
        "modalCuenta"
    ).style.display =
        "flex";

}


// ============================================
// DESACTIVAR CUENTA
// ============================================

async function desactivarCuenta(id) {

    const confirmar =
        confirm(
            "¿Quieres desactivar esta cuenta?"
        );


    if (!confirmar) return;


    const usuario =
        await obtenerUsuarioActual();


    if (!usuario) {

        window.location.href =
            "login.html";

        return;

    }


    const {
        error
    } = await supabaseClient

        .from("cuentas")

        .update({

            activa:
                false

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
            "Error desactivando cuenta:",
            error
        );


        mostrarMensajeCuenta(

            "No se pudo desactivar la cuenta: " +
            error.message,

            "error"

        );

        return;

    }


    await cargarCuentas();

}


// ============================================
// MENSAJES
// ============================================

function mostrarMensajeCuenta(
    mensaje,
    tipo = "info"
) {

    const modal =
        document.getElementById(
            "mensajeCuentaModal"
        );

    const general =
        document.getElementById(
            "mensajeCuenta"
        );


    if (modal) {

        modal.textContent =
            mensaje;

        modal.className =
            "message " + tipo;


        setTimeout(() => {

            modal.textContent =
                "";

        }, 4000);

    }

    else if (general) {

        general.textContent =
            mensaje;

        general.className =
            "message " + tipo;

    }

    else {

        alert(mensaje);

    }

}


// ============================================
// SEGURIDAD HTML
// ============================================

function escapeHtml(texto) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        texto;

    return div.innerHTML;

}