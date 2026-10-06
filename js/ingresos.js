let ingresoEditandoId = null;


// =====================================================
// INICIO
// =====================================================

document.addEventListener("DOMContentLoaded", async () => {

    mostrarFechaIngresos();

    await cargarIngresos();

    await cargarCuentasIngreso();

});


// =====================================================
// FECHA
// =====================================================

function mostrarFechaIngresos() {

    const elemento = document.getElementById("fechaActual");

    if (!elemento) return;

    const fecha = new Date();

    elemento.textContent =
        fecha.toLocaleDateString("es-MX", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        });

}


// =====================================================
// USUARIO
// =====================================================

async function obtenerUsuarioIngreso() {

    const {
        data: {
            user
        },
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


// =====================================================
// CUENTAS
// =====================================================

async function cargarCuentasIngreso() {

    const usuario =
        await obtenerUsuarioIngreso();

    if (!usuario) return;


    const select =
        document.getElementById("ingresoCuenta");

    if (!select) return;


    const {
        data,
        error
    } = await supabaseClient
        .from("cuentas")
        .select(`
            id,
            nombre,
            tipo,
            saldo,
            activa
        `)
        .eq("usuario_id", usuario.id)
        .eq("activa", true)
        .order("nombre");


    if (error) {

        console.error(
            "Error cargando cuentas:",
            error
        );

        return;
    }


    select.innerHTML =
        `<option value="">
            Selecciona una cuenta
        </option>`;


    (data || []).forEach(cuenta => {

        const option =
            document.createElement("option");

        option.value = cuenta.id;

        option.textContent =
            `${cuenta.nombre} - ${formatearMonedaIngreso(cuenta.saldo)}`;

        select.appendChild(option);

    });

}


// =====================================================
// CARGAR INGRESOS
// =====================================================

async function cargarIngresos() {

    const usuario =
        await obtenerUsuarioIngreso();

    if (!usuario) return;


    const {
        data,
        error
    } = await supabaseClient
        .from("ingresos")
        .select(`
            id,
            usuario_id,
            cuenta_id,
            concepto,
            importe,
            fecha,
            frecuencia,
            activo
        `)
        .eq("usuario_id", usuario.id)
        .eq("activo", true)
        .order("fecha", {
            ascending: false
        });


    if (error) {

        console.error(
            "Error cargando ingresos:",
            error
        );

        mostrarMensajeListaIngresos(
            "No fue posible cargar los ingresos."
        );

        return;
    }


    console.log(
        "Ingresos encontrados:",
        data
    );


    mostrarIngresos(data || []);

}


// =====================================================
// MOSTRAR INGRESOS
// =====================================================

function mostrarIngresos(ingresos) {

    const lista =
        document.getElementById("listaIngresos");

    if (!lista) return;


    const total =
        ingresos.reduce(
            (suma, ingreso) =>
                suma + Number(ingreso.importe || 0),
            0
        );


    const cantidad =
        ingresos.length;


    const totalElemento =
        document.getElementById(
            "totalIngresosSeccion"
        );

    if (totalElemento) {

        totalElemento.textContent =
            formatearMonedaIngreso(total);

    }


    const cantidadElemento =
        document.getElementById(
            "cantidadIngresos"
        );

    if (cantidadElemento) {

        cantidadElemento.textContent =
            cantidad;

    }


    if (ingresos.length === 0) {

        lista.innerHTML = `
            <div class="sin-datos">
                No tienes ingresos registrados.
            </div>
        `;

        return;
    }


    lista.innerHTML = "";


    ingresos.forEach(ingreso => {

        const tarjeta =
            document.createElement("div");

        tarjeta.className =
            "ingreso-card";


        const fecha =
            formatearFechaIngreso(
                ingreso.fecha
            );


        const frecuencia =
            ingreso.frecuencia
                ? ingreso.frecuencia
                : "No especificada";


        tarjeta.innerHTML = `

            <div class="ingreso-info">

                <div class="ingreso-concepto">

                    ${escaparHTMLIngreso(
                        ingreso.concepto
                    )}

                </div>

                <div class="ingreso-detalle">

                    📅 ${fecha}

                    &nbsp;•&nbsp;

                    🔄 ${escaparHTMLIngreso(
                        frecuencia
                    )}

                </div>

            </div>


            <div class="ingreso-importe">

                ${formatearMonedaIngreso(
                    ingreso.importe
                )}

            </div>


            <div class="ingreso-acciones">

                <button
                    type="button"
                    class="btn-small"
                    onclick="editarIngreso('${ingreso.id}')">

                    ✏️ Editar

                </button>


                <button
                    type="button"
                    class="btn-small btn-danger"
                    onclick="desactivarIngreso('${ingreso.id}')">

                    🗑️ Eliminar

                </button>

            </div>

        `;


        lista.appendChild(tarjeta);

    });

}


// =====================================================
// NUEVO INGRESO
// =====================================================

function nuevoIngreso() {

    ingresoEditandoId = null;


    const titulo =
        document.getElementById(
            "modalIngresoTitulo"
        );

    if (titulo) {

        titulo.textContent =
            "Nuevo ingreso";

    }


    limpiarFormularioIngreso();


    const modal =
        document.getElementById(
            "modalIngreso"
        );

    if (modal) {

        modal.style.display = "flex";

    }

}


// =====================================================
// CERRAR MODAL
// =====================================================

function cerrarModalIngreso() {

    const modal =
        document.getElementById(
            "modalIngreso"
        );

    if (modal) {

        modal.style.display = "none";

    }


    limpiarFormularioIngreso();

    ingresoEditandoId = null;

}


// =====================================================
// LIMPIAR FORMULARIO
// =====================================================

function limpiarFormularioIngreso() {

    const concepto =
        document.getElementById(
            "ingresoConcepto"
        );

    const importe =
        document.getElementById(
            "ingresoImporte"
        );

    const fecha =
        document.getElementById(
            "ingresoFecha"
        );

    const frecuencia =
        document.getElementById(
            "ingresoFrecuencia"
        );


    if (concepto) concepto.value = "";

    if (importe) importe.value = "";

    if (fecha) {

        fecha.value =
            obtenerFechaLocalIngreso();

    }

    if (frecuencia) {

        frecuencia.value =
            "quincenal";

    }


    const cuenta =
        document.getElementById(
            "ingresoCuenta"
        );

    if (cuenta) {

        cuenta.value = "";

    }


    mostrarMensajeIngreso("");

}


// =====================================================
// GUARDAR INGRESO
// =====================================================

async function guardarIngreso() {

    const usuario =
        await obtenerUsuarioIngreso();

    if (!usuario) return;


    const concepto =
        document.getElementById(
            "ingresoConcepto"
        )?.value.trim();


    const importe =
        Number(
            document.getElementById(
                "ingresoImporte"
            )?.value
        );


    const fecha =
        document.getElementById(
            "ingresoFecha"
        )?.value;


    const frecuencia =
        document.getElementById(
            "ingresoFrecuencia"
        )?.value;


    const cuentaId =
        document.getElementById(
            "ingresoCuenta"
        )?.value;


    if (!concepto) {

        mostrarMensajeIngreso(
            "Escribe el concepto del ingreso."
        );

        return;
    }


    if (!importe || importe <= 0) {

        mostrarMensajeIngreso(
            "Escribe un importe válido."
        );

        return;
    }


    if (!fecha) {

        mostrarMensajeIngreso(
            "Selecciona una fecha."
        );

        return;
    }


    if (!cuentaId) {

        mostrarMensajeIngreso(
            "Selecciona la cuenta donde recibiste el dinero."
        );

        return;
    }


    const boton =
        document.getElementById(
            "btnGuardarIngreso"
        );


    if (boton) {

        boton.disabled = true;

        boton.textContent =
            "Guardando...";

    }


    try {

        if (ingresoEditandoId) {

            await actualizarIngresoExistente(
                usuario,
                importe,
                concepto,
                fecha,
                frecuencia,
                cuentaId
            );

        } else {

            await crearNuevoIngreso(
                usuario,
                importe,
                concepto,
                fecha,
                frecuencia,
                cuentaId
            );

        }

    } finally {

        if (boton) {

            boton.disabled = false;

            boton.textContent =
                "Guardar ingreso";

        }

    }

}


// =====================================================
// CREAR INGRESO
// =====================================================

async function crearNuevoIngreso(
    usuario,
    importe,
    concepto,
    fecha,
    frecuencia,
    cuentaId
) {

    const {

        data: ingreso,

        error

    } = await supabaseClient
        .from("ingresos")
        .insert({

            usuario_id: usuario.id,

            cuenta_id: cuentaId,

            concepto: concepto,

            importe: importe,

            fecha: fecha,

            frecuencia:
                frecuencia || null,

            activo: true

        })
        .select()
        .single();


    if (error) {

        console.error(
            "Error creando ingreso:",
            error
        );

        mostrarMensajeIngreso(
            "No fue posible guardar el ingreso."
        );

        return;
    }


    // Agregar el ingreso al saldo de la cuenta

    const actualizado =
        await modificarSaldoCuentaIngreso(
            cuentaId,
            importe
        );


    if (!actualizado) {

        // Si falló la actualización de saldo,
        // eliminamos el ingreso recién creado.

        await supabaseClient
            .from("ingresos")
            .delete()
            .eq("id", ingreso.id)
            .eq("usuario_id", usuario.id);


        mostrarMensajeIngreso(
            "El ingreso se guardó, pero no fue posible actualizar el saldo de la cuenta."
        );

        return;
    }


    cerrarModalIngreso();

    await cargarCuentasIngreso();

    await cargarIngresos();

}


// =====================================================
// ACTUALIZAR INGRESO
// =====================================================

async function actualizarIngresoExistente(
    usuario,
    nuevoImporte,
    nuevoConcepto,
    nuevaFecha,
    nuevaFrecuencia,
    nuevaCuentaId
) {

    // Primero obtenemos el ingreso anterior

    const {
        data: anterior,
        error: errorAnterior
    } = await supabaseClient
        .from("ingresos")
        .select(`
            id,
            cuenta_id,
            importe
        `)
        .eq("id", ingresoEditandoId)
        .eq("usuario_id", usuario.id)
        .single();


    if (errorAnterior || !anterior) {

        console.error(
            "Error obteniendo ingreso anterior:",
            errorAnterior
        );

        mostrarMensajeIngreso(
            "No fue posible obtener el ingreso original."
        );

        return;
    }


    const importeAnterior =
        Number(anterior.importe || 0);


    const cuentaAnteriorId =
        anterior.cuenta_id;


    // Si cambió la cuenta

    if (
        cuentaAnteriorId !==
        nuevaCuentaId
    ) {

        // Quitar ingreso anterior

        const quitarAnterior =
            await modificarSaldoCuentaIngreso(
                cuentaAnteriorId,
                -importeAnterior
            );


        if (!quitarAnterior) {

            mostrarMensajeIngreso(
                "No fue posible actualizar el saldo de la cuenta anterior."
            );

            return;
        }


        // Agregar nuevo ingreso

        const agregarNuevo =
            await modificarSaldoCuentaIngreso(
                nuevaCuentaId,
                nuevoImporte
            );


        if (!agregarNuevo) {

            // Intentar restaurar cuenta anterior

            await modificarSaldoCuentaIngreso(
                cuentaAnteriorId,
                importeAnterior
            );


            mostrarMensajeIngreso(
                "No fue posible actualizar el saldo de la nueva cuenta."
            );

            return;
        }

    } else {

        // Misma cuenta:
        // solo aplicamos la diferencia

        const diferencia =
            nuevoImporte -
            importeAnterior;


        if (diferencia !== 0) {

            const actualizado =
                await modificarSaldoCuentaIngreso(
                    nuevaCuentaId,
                    diferencia
                );


            if (!actualizado) {

                mostrarMensajeIngreso(
                    "No fue posible actualizar el saldo de la cuenta."
                );

                return;
            }

        }

    }


    // Actualizar el mismo registro

    const {
        error
    } = await supabaseClient
        .from("ingresos")
        .update({

            cuenta_id:
                nuevaCuentaId,

            concepto:
                nuevoConcepto,

            importe:
                nuevoImporte,

            fecha:
                nuevaFecha,

            frecuencia:
                nuevaFrecuencia || null

        })
        .eq("id", ingresoEditandoId)
        .eq("usuario_id", usuario.id);


    if (error) {

        console.error(
            "Error actualizando ingreso:",
            error
        );

        mostrarMensajeIngreso(
            "No fue posible actualizar el ingreso."
        );

        return;
    }


    cerrarModalIngreso();

    await cargarCuentasIngreso();

    await cargarIngresos();

}


// =====================================================
// MODIFICAR SALDO DE CUENTA
// =====================================================

async function modificarSaldoCuentaIngreso(
    cuentaId,
    cantidad
) {

    if (!cuentaId) return false;


    const {
        data: cuenta,
        error: errorCuenta
    } = await supabaseClient
        .from("cuentas")
        .select("id, saldo")
        .eq("id", cuentaId)
        .single();


    if (errorCuenta || !cuenta) {

        console.error(
            "Error obteniendo cuenta:",
            errorCuenta
        );

        return false;
    }


    const saldoActual =
        Number(cuenta.saldo || 0);


    const nuevoSaldo =
        saldoActual +
        Number(cantidad);


    const {
        error
    } = await supabaseClient
        .from("cuentas")
        .update({

            saldo: nuevoSaldo

        })
        .eq("id", cuentaId);


    if (error) {

        console.error(
            "Error actualizando saldo:",
            error
        );

        return false;
    }


    return true;

}


// =====================================================
// EDITAR INGRESO
// =====================================================

async function editarIngreso(id) {

    const usuario =
        await obtenerUsuarioIngreso();

    if (!usuario) return;


    const {
        data: ingreso,
        error
    } = await supabaseClient
        .from("ingresos")
        .select(`
            id,
            cuenta_id,
            concepto,
            importe,
            fecha,
            frecuencia
        `)
        .eq("id", id)
        .eq("usuario_id", usuario.id)
        .single();


    if (error || !ingreso) {

        console.error(
            "Error obteniendo ingreso:",
            error
        );

        return;
    }


    ingresoEditandoId =
        ingreso.id;


    const titulo =
        document.getElementById(
            "modalIngresoTitulo"
        );

    if (titulo) {

        titulo.textContent =
            "Editar ingreso";

    }


    const concepto =
        document.getElementById(
            "ingresoConcepto"
        );

    const importe =
        document.getElementById(
            "ingresoImporte"
        );

    const fecha =
        document.getElementById(
            "ingresoFecha"
        );

    const frecuencia =
        document.getElementById(
            "ingresoFrecuencia"
        );

    const cuenta =
        document.getElementById(
            "ingresoCuenta"
        );


    if (concepto)
        concepto.value =
            ingreso.concepto || "";


    if (importe)
        importe.value =
            ingreso.importe || "";


    if (fecha)
        fecha.value =
            ingreso.fecha || "";


    if (frecuencia)
        frecuencia.value =
            ingreso.frecuencia || "quincenal";


    if (cuenta)
        cuenta.value =
            ingreso.cuenta_id || "";


    const modal =
        document.getElementById(
            "modalIngreso"
        );

    if (modal) {

        modal.style.display =
            "flex";

    }

}


// =====================================================
// DESACTIVAR INGRESO
// =====================================================

async function desactivarIngreso(id) {

    const confirmar =
        confirm(
            "¿Quieres eliminar este ingreso?"
        );


    if (!confirmar) return;


    const usuario =
        await obtenerUsuarioIngreso();

    if (!usuario) return;


    const {
        data: ingreso,
        error: errorIngreso
    } = await supabaseClient
        .from("ingresos")
        .select(`
            id,
            cuenta_id,
            importe
        `)
        .eq("id", id)
        .eq("usuario_id", usuario.id)
        .single();


    if (errorIngreso || !ingreso) {

        console.error(
            "Error obteniendo ingreso:",
            errorIngreso
        );

        return;
    }


    // Primero regresamos el saldo
    // de la cuenta

    const actualizado =
        await modificarSaldoCuentaIngreso(
            ingreso.cuenta_id,
            -Number(ingreso.importe || 0)
        );


    if (!actualizado) {

        alert(
            "No fue posible actualizar el saldo de la cuenta."
        );

        return;
    }


    // Después desactivamos el ingreso

    const {
        error
    } = await supabaseClient
        .from("ingresos")
        .update({

            activo: false

        })
        .eq("id", id)
        .eq("usuario_id", usuario.id);


    if (error) {

        console.error(
            "Error desactivando ingreso:",
            error
        );

        // Intentar regresar el saldo

        await modificarSaldoCuentaIngreso(
            ingreso.cuenta_id,
            Number(ingreso.importe || 0)
        );


        alert(
            "No fue posible eliminar el ingreso."
        );

        return;
    }


    await cargarCuentasIngreso();

    await cargarIngresos();

}


// =====================================================
// MENSAJES
// =====================================================

function mostrarMensajeIngreso(mensaje) {

    const elemento =
        document.getElementById(
            "mensajeIngresoModal"
        );

    if (!elemento) return;

    elemento.textContent =
        mensaje || "";

}


function mostrarMensajeListaIngresos(
    mensaje
) {

    const lista =
        document.getElementById(
            "listaIngresos"
        );

    if (!lista) return;

    lista.innerHTML = `

        <div class="mensaje-modal">

            ${escaparHTMLIngreso(
                mensaje
            )}

        </div>

    `;

}


// =====================================================
// FORMATEAR MONEDA
// =====================================================

function formatearMonedaIngreso(valor) {

    return Number(
        valor || 0
    ).toLocaleString(
        "es-MX",
        {
            style: "currency",
            currency: "MXN"
        }
    );

}


// =====================================================
// FORMATEAR FECHA
// =====================================================

function formatearFechaIngreso(
    fecha
) {

    if (!fecha) return "";

    const partes =
        fecha.split("-");

    if (partes.length !== 3) {

        return fecha;

    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


// =====================================================
// FECHA LOCAL
// =====================================================

function obtenerFechaLocalIngreso() {

    const fecha =
        new Date();


    const año =
        fecha.getFullYear();


    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(2, "0");


    const dia =
        String(
            fecha.getDate()
        ).padStart(2, "0");


    return `${año}-${mes}-${dia}`;

}


// =====================================================
// ESCAPAR HTML
// =====================================================

function escaparHTMLIngreso(
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