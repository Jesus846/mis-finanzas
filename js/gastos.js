// ======================================================
// GASTOS
// MIS FINANZAS
// ======================================================

let gastoEditandoId = null;


// ======================================================
// OBTENER USUARIO ACTUAL
// ======================================================

async function obtenerUsuarioGasto() {

    try {

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

    } catch (error) {

        console.error(
            "Error obteniendo usuario:",
            error
        );

        return null;
    }

}


// ======================================================
// CARGAR GASTOS
// ======================================================

async function cargarGastos() {

    const usuario =
        await obtenerUsuarioGasto();

    if (!usuario) {
        return;
    }


    const lista =
        document.getElementById(
            "listaGastos"
        );

    if (!lista) {
        return;
    }


    lista.innerHTML = `
        <div class="loading">
            Cargando gastos...
        </div>
    `;


    try {

        const {
            data,
            error
        } = await supabaseClient

            .from("gastos")

            .select(`
                id,
                usuario_id,
                cuenta_id,
                categoria_id,
                concepto,
                importe,
                fecha,
                tipo,
                metodo_pago,
                recurrente,
                activo
            `)

            .eq(
                "usuario_id",
                usuario.id
            )

            .eq(
                "activo",
                true
            )

            .order(
                "fecha",
                {
                    ascending: false
                }
            );


        if (error) {

            console.error(
                "Error cargando gastos:",
                error
            );

            lista.innerHTML = `
                <div class="mensaje-error">
                    Error cargando gastos.
                    <br>
                    ${escaparHTMLGasto(
                        error.message
                    )}
                </div>
            `;

            return;
        }


        await mostrarGastos(
            data || []
        );


    } catch (error) {

        console.error(
            "Error inesperado cargando gastos:",
            error
        );

        lista.innerHTML = `
            <div class="mensaje-error">
                No fue posible cargar los gastos.
            </div>
        `;

    }

}


// ======================================================
// MOSTRAR GASTOS
// ======================================================

async function mostrarGastos(
    gastos
) {

    const lista =
        document.getElementById(
            "listaGastos"
        );


    const totalSeccion =
        document.getElementById(
            "totalGastosSeccion"
        );


    const totalResumen =
        document.getElementById(
            "totalGastosResumen"
        );


    const cantidad =
        document.getElementById(
            "cantidadGastos"
        );


    if (!lista) {
        return;
    }


    // ==================================================
    // SIN GASTOS
    // ==================================================

    if (!gastos.length) {

        lista.innerHTML = `
            <div class="loading">
                Todavía no tienes gastos registrados.
            </div>
        `;


        if (totalSeccion) {

            totalSeccion.textContent =
                formatearMonedaGasto(0);

        }


        if (totalResumen) {

            totalResumen.textContent =
                formatearMonedaGasto(0);

        }


        if (cantidad) {

            cantidad.textContent =
                "0";

        }


        return;
    }


    // ==================================================
    // IDS DE CUENTAS
    // ==================================================

    const idsCuentas =
        [
            ...new Set(
                gastos
                    .map(
                        gasto =>
                            gasto.cuenta_id
                    )
                    .filter(Boolean)
            )
        ];


    // ==================================================
    // IDS DE CATEGORÍAS
    // ==================================================

    const idsCategorias =
        [
            ...new Set(
                gastos
                    .map(
                        gasto =>
                            gasto.categoria_id
                    )
                    .filter(Boolean)
            )
        ];


    let cuentas = [];
    let categorias = [];


    // ==================================================
    // CUENTAS
    // ==================================================

    if (idsCuentas.length) {

        const {
            data,
            error
        } = await supabaseClient

            .from("cuentas")

            .select(
                "id, nombre, tipo"
            )

            .in(
                "id",
                idsCuentas
            );


        if (!error) {

            cuentas =
                data || [];

        } else {

            console.error(
                "Error cargando cuentas de gastos:",
                error
            );

        }

    }


    // ==================================================
    // CATEGORÍAS
    // ==================================================

    if (idsCategorias.length) {

        const {
            data,
            error
        } = await supabaseClient

            .from("categorias_gastos")

            .select(
                "id, nombre, icono, tipo"
            )

            .in(
                "id",
                idsCategorias
            );


        if (!error) {

            categorias =
                data || [];

        } else {

            console.error(
                "Error cargando categorías:",
                error
            );

        }

    }


    // ==================================================
    // MAPA CUENTAS
    // ==================================================

    const mapaCuentas = {};

    cuentas.forEach(
        cuenta => {

            mapaCuentas[
                cuenta.id
            ] = cuenta;

        }
    );


    // ==================================================
    // MAPA CATEGORÍAS
    // ==================================================

    const mapaCategorias = {};

    categorias.forEach(
        categoria => {

            mapaCategorias[
                categoria.id
            ] = categoria;

        }
    );


    // ==================================================
    // TOTAL
    // ==================================================

    const total =
        gastos.reduce(
            (suma, gasto) =>
                suma +
                Number(
                    gasto.importe || 0
                ),
            0
        );


    if (totalSeccion) {

        totalSeccion.textContent =
            formatearMonedaGasto(total);

    }


    if (totalResumen) {

        totalResumen.textContent =
            formatearMonedaGasto(total);

    }


    if (cantidad) {

        cantidad.textContent =
            String(
                gastos.length
            );

    }


    // ==================================================
    // SEPARAR GASTOS FIJOS Y GASTOS NORMALES
    // ==================================================

    const gastosFijos =
        gastos.filter(
            gasto =>
                gasto.tipo === "fijo" ||
                gasto.recurrente === true
        );

    const gastosNormales =
        gastos.filter(
            gasto =>
                gasto.tipo !== "fijo" &&
                gasto.recurrente !== true
        );


    // ==================================================
    // GENERAR TARJETA
    // ==================================================

    function generarTarjetaGasto(gasto) {

        const cuenta =
            mapaCuentas[
                gasto.cuenta_id
            ];

        const categoria =
            mapaCategorias[
                gasto.categoria_id
            ];

        const nombreCuenta =
            cuenta
                ? cuenta.nombre
                : "Sin cuenta";

        const nombreCategoria =
            categoria
                ? categoria.nombre
                : "Sin categoría";

        const icono =
            categoria?.icono ||
            "💸";

        const metodo =
            obtenerNombreMetodoPago(
                gasto.metodo_pago
            );

        const cuentaTexto =
            gasto.cuenta_id
                ? ` · ${escaparHTMLGasto(
                    nombreCuenta
                )}`
                : "";

        return `
            <div class="gasto-card">

                <div class="gasto-icono">
                    ${escaparHTMLGasto(
                        icono
                    )}
                </div>

                <div class="gasto-info">

                    <h3>
                        ${escaparHTMLGasto(
                            gasto.concepto ||
                            "Gasto"
                        )}
                    </h3>

                    <span>
                        ${formatearFechaGasto(
                            gasto.fecha
                        )}
                    </span>

                    <small>
                        ${escaparHTMLGasto(
                            nombreCategoria
                        )}
                        ·
                        ${obtenerNombreTipoGasto(
                            gasto.tipo
                        )}
                    </small>

                    <small>
                        ${metodo}
                        ${cuentaTexto}
                    </small>

                    ${
                        gasto.recurrente
                            ? `
                                <small>
                                    🔄 Recurrente
                                </small>
                            `
                            : ""
                    }

                </div>

                <div class="gasto-derecha">

                    <strong>
                        -${formatearMonedaGasto(
                            gasto.importe
                        )}
                    </strong>

                    <div class="gasto-acciones">

                        <button
                            type="button"
                            title="Editar"
                            onclick="editarGasto('${gasto.id}')"
                        >
                            ✏️
                        </button>

                        <button
                            type="button"
                            title="Eliminar"
                            onclick="desactivarGasto('${gasto.id}')"
                        >
                            🗑️
                        </button>

                    </div>

                </div>

            </div>
        `;
    }


    // ==================================================
    // GASTOS FIJOS
    // ==================================================

    const htmlGastosFijos =
        gastosFijos.length > 0
            ? gastosFijos
                .map(
                    generarTarjetaGasto
                )
                .join("")
            : `
                <div class="loading">
                    🏠
                    <br><br>
                    No tienes gastos fijos registrados.
                </div>
            `;


    // ==================================================
    // GASTOS NORMALES
    // ==================================================

    const htmlGastosNormales =
        gastosNormales.length > 0
            ? gastosNormales
                .map(
                    generarTarjetaGasto
                )
                .join("")
            : `
                <div class="loading">
                    💸
                    <br><br>
                    No tienes gastos normales registrados.
                </div>
            `;


    // ==================================================
    // MOSTRAR GASTOS
    // GASTOS FIJOS ARRIBA
    // GASTOS NORMALES ABAJO
    // ==================================================

    lista.innerHTML = `

        <section style="margin-bottom:35px;">

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    margin-bottom:18px;
                "
            >

                <div>
                    <h3 style="margin:0;font-size:1.2rem;">
                        🏠 Gastos fijos
                    </h3>

                    <small>
                        Gastos que se repiten cada mes
                    </small>
                </div>

                <strong>
                    ${gastosFijos.length}
                </strong>

            </div>

            ${htmlGastosFijos}

        </section>


        <div
            style="
                height:1px;
                background:#e5e7eb;
                margin:10px 0 35px 0;
            "
        ></div>


        <section>

            <div
                style="
                    display:flex;
                    align-items:center;
                    justify-content:space-between;
                    margin-bottom:18px;
                "
            >

                <div>
                    <h3 style="margin:0;font-size:1.2rem;">
                        💸 Gastos
                    </h3>

                    <small>
                        Gastos variables y extraordinarios
                    </small>
                </div>

                <strong>
                    ${gastosNormales.length}
                </strong>

            </div>

            ${htmlGastosNormales}

        </section>

    `;


}


// ======================================================
// NUEVO GASTO
// ======================================================

async function nuevoGasto() {

    gastoEditandoId = null;


    const titulo =
        document.getElementById(
            "modalGastoTitulo"
        );


    const boton =
        document.getElementById(
            "btnGuardarGasto"
        );


    if (titulo) {

        titulo.textContent =
            "Nuevo gasto";

    }


    if (boton) {

        boton.textContent =
            "Guardar gasto";

    }


    limpiarFormularioGasto();


    await cargarCuentasGasto();

    await cargarCategoriasGasto();


    actualizarVisibilidadCuentaGasto();


    const modal =
        document.getElementById(
            "modalGasto"
        );


    if (modal) {

        modal.style.display =
            "flex";

    }

}


// ======================================================
// CARGAR CUENTAS
// ======================================================

async function cargarCuentasGasto(
    cuentaSeleccionada = ""
) {

    const usuario =
        await obtenerUsuarioGasto();


    if (!usuario) {
        return;
    }


    const select =
        document.getElementById(
            "gastoCuenta"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Selecciona una cuenta
        </option>
    `;


    const {
        data,
        error
    } = await supabaseClient

        .from("cuentas")

        .select(
            "id, nombre, tipo, saldo"
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

        console.error(
            "Error cargando cuentas:",
            error
        );

        return;

    }


    (data || []).forEach(
        cuenta => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                cuenta.id;


            option.textContent =
                `${cuenta.nombre} — ${formatearMonedaGasto(
                    cuenta.saldo
                )}`;


            if (
                cuenta.id ===
                cuentaSeleccionada
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );

}


// ======================================================
// CARGAR CATEGORÍAS
// ======================================================

async function cargarCategoriasGasto(
    categoriaSeleccionada = ""
) {

    const usuario =
        await obtenerUsuarioGasto();


    if (!usuario) {
        return;
    }


    const select =
        document.getElementById(
            "gastoCategoria"
        );


    if (!select) {
        return;
    }


    select.innerHTML = `
        <option value="">
            Selecciona una categoría
        </option>
    `;


    const {
        data,
        error
    } = await supabaseClient

        .from("categorias_gastos")

        .select(
            "id, nombre, icono, tipo, usuario_id"
        )

        .or(
            `usuario_id.eq.${usuario.id},usuario_id.is.null`
        )

        .eq(
            "activo",
            true
        );


    if (error) {

        console.error(
            "Error cargando categorías:",
            error
        );

        return;

    }


    (data || []).forEach(
        categoria => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                categoria.id;


            option.textContent =
                `${categoria.icono || "💸"} ${categoria.nombre}`;


            if (
                categoria.id ===
                categoriaSeleccionada
            ) {

                option.selected =
                    true;

            }


            select.appendChild(
                option
            );

        }
    );

}


// ======================================================
// MOSTRAR / OCULTAR CUENTA
// ======================================================

function actualizarVisibilidadCuentaGasto() {

    const metodo =
        document.getElementById(
            "gastoMetodoPago"
        )?.value;


    const contenedor =
        document.getElementById(
            "contenedorGastoCuenta"
        );


    if (!contenedor) {
        return;
    }


    /*
     * Para débito y transferencia necesitamos
     * saber de qué cuenta salió el dinero.
     *
     * Efectivo y otro no modifican directamente
     * el saldo bancario.
     */

    if (
        metodo === "debito" ||
        metodo === "transferencia"
    ) {

        contenedor.style.display =
            "block";

    } else {

        contenedor.style.display =
            "none";

    }

}


// ======================================================
// EVENTO MÉTODO DE PAGO
// ======================================================

document.addEventListener(
    "change",
    event => {

        if (
            event.target &&
            event.target.id ===
            "gastoMetodoPago"
        ) {

            actualizarVisibilidadCuentaGasto();

        }

    }
);


// ======================================================
// GUARDAR GASTO
// ======================================================

async function guardarGasto() {

    const usuario =
        await obtenerUsuarioGasto();


    if (!usuario) {

        mostrarMensajeGasto(
            "No hay una sesión activa.",
            true
        );

        return;

    }


    const concepto =
        document.getElementById(
            "gastoConcepto"
        ).value.trim();


    const importe =
        Number(
            document.getElementById(
                "gastoImporte"
            ).value
        );


    const fecha =
        document.getElementById(
            "gastoFecha"
        ).value;


    const tipo =
        document.getElementById(
            "gastoTipo"
        ).value;


    const metodoPago =
        document.getElementById(
            "gastoMetodoPago"
        ).value;


    const cuentaId =
        document.getElementById(
            "gastoCuenta"
        ).value ||
        null;


    const categoriaId =
        document.getElementById(
            "gastoCategoria"
        ).value ||
        null;


    const recurrente =
        document.getElementById(
            "gastoRecurrente"
        )?.checked ||
        false;


    // ==================================================
    // VALIDACIONES
    // ==================================================

    if (!concepto) {

        mostrarMensajeGasto(
            "Escribe el concepto del gasto.",
            true
        );

        return;

    }


    if (
        !importe ||
        importe <= 0
    ) {

        mostrarMensajeGasto(
            "El importe debe ser mayor a cero.",
            true
        );

        return;

    }


    if (!fecha) {

        mostrarMensajeGasto(
            "Selecciona la fecha del gasto.",
            true
        );

        return;

    }


    if (!tipo) {

        mostrarMensajeGasto(
            "Selecciona el tipo de gasto.",
            true
        );

        return;

    }


    if (!metodoPago) {

        mostrarMensajeGasto(
            "Selecciona el método de pago.",
            true
        );

        return;

    }


    /*
     * Solo estos métodos necesitan una cuenta
     * bancaria.
     */

    const requiereCuenta =
        metodoPago === "debito" ||
        metodoPago === "transferencia";


    if (
        requiereCuenta &&
        !cuentaId
    ) {

        mostrarMensajeGasto(
            "Selecciona la cuenta utilizada.",
            true
        );

        return;

    }


    if (!categoriaId) {

        mostrarMensajeGasto(
            "Selecciona una categoría.",
            true
        );

        return;

    }


    const boton =
        document.getElementById(
            "btnGuardarGasto"
        );


    if (boton) {

        boton.disabled =
            true;

        boton.textContent =
            "Guardando...";

    }


    try {

        // ==================================================
        // NUEVO GASTO
        // ==================================================

        if (!gastoEditandoId) {

            /*
             * Verificar saldo únicamente cuando
             * el gasto sale de una cuenta bancaria.
             */

            if (requiereCuenta) {

                await verificarSaldoCuentaGasto(
                    cuentaId,
                    importe
                );

            }


            const {
                data: gasto,
                error: errorGasto
            } = await supabaseClient

                .from("gastos")

                .insert({

                    usuario_id:
                        usuario.id,

                    cuenta_id:
                        cuentaId,

                    categoria_id:
                        categoriaId,

                    concepto:
                        concepto,

                    importe:
                        importe,

                    fecha:
                        fecha,

                    tipo:
                        tipo,

                    metodo_pago:
                        metodoPago,

                    recurrente:
                        recurrente,

                    activo:
                        true

                })

                .select()
                .single();


            if (errorGasto) {
                throw errorGasto;
            }


            /*
             * Solo débito y transferencia
             * modifican el saldo de la cuenta.
             */

            if (requiereCuenta) {

                await modificarSaldoCuentaGasto(
                    cuentaId,
                    -importe
                );

            }


            console.log(
                "Gasto creado:",
                gasto
            );


            cerrarModalGasto();


            await cargarGastos();


            if (
                typeof cargarCuentas ===
                "function"
            ) {

                await cargarCuentas();

            }


            mostrarMensajePrincipalGasto(
                "Gasto registrado correctamente."
            );


            return;

        }


        // ==================================================
        // EDITAR GASTO
        // ==================================================

        const {
            data: gastoAnterior,
            error: errorConsulta
        } = await supabaseClient

            .from("gastos")

            .select(`
                id,
                cuenta_id,
                importe,
                metodo_pago,
                activo
            `)

            .eq(
                "id",
                gastoEditandoId
            )

            .eq(
                "usuario_id",
                usuario.id
            )

            .single();


        if (errorConsulta) {
            throw errorConsulta;
        }


        if (
            !gastoAnterior ||
            !gastoAnterior.activo
        ) {

            throw new Error(
                "El gasto que intentas editar ya no está activo."
            );

        }


        const importeAnterior =
            Number(
                gastoAnterior.importe || 0
            );


        const metodoAnterior =
            gastoAnterior.metodo_pago;


        const cuentaAnteriorId =
            gastoAnterior.cuenta_id;


        const metodoAnteriorAfectaCuenta =
            metodoAnterior === "debito" ||
            metodoAnterior === "transferencia";


        const nuevoMetodoAfectaCuenta =
            requiereCuenta;


        // ==================================================
        // VERIFICAR NUEVO SALDO
        // ==================================================

        /*
         * Si el gasto seguirá saliendo de una cuenta,
         * calculamos correctamente el dinero disponible.
         */

        if (nuevoMetodoAfectaCuenta) {

            if (
                metodoAnteriorAfectaCuenta &&
                cuentaAnteriorId === cuentaId
            ) {

                const diferencia =
                    importe -
                    importeAnterior;


                if (diferencia > 0) {

                    await verificarSaldoCuentaGasto(
                        cuentaId,
                        diferencia
                    );

                }

            } else {

                await verificarSaldoCuentaGasto(
                    cuentaId,
                    importe
                );

            }

        }


        // ==================================================
        // REVERSAR MOVIMIENTO ANTERIOR
        // ==================================================

        if (
            metodoAnteriorAfectaCuenta &&
            cuentaAnteriorId
        ) {

            await modificarSaldoCuentaGasto(
                cuentaAnteriorId,
                importeAnterior
            );

        }


        // ==================================================
        // APLICAR NUEVO MOVIMIENTO
        // ==================================================

        if (
            nuevoMetodoAfectaCuenta &&
            cuentaId
        ) {

            await modificarSaldoCuentaGasto(
                cuentaId,
                -importe
            );

        }


        // ==================================================
        // ACTUALIZAR REGISTRO
        // ==================================================

        const {
            data: gastoActualizado,
            error: errorUpdate
        } = await supabaseClient

            .from("gastos")

            .update({

                cuenta_id:
                    cuentaId,

                categoria_id:
                    categoriaId,

                concepto:
                    concepto,

                importe:
                    importe,

                fecha:
                    fecha,

                tipo:
                    tipo,

                metodo_pago:
                    metodoPago,

                recurrente:
                    recurrente

            })

            .eq(
                "id",
                gastoEditandoId
            )

            .eq(
                "usuario_id",
                usuario.id
            )

            .select()
            .single();


        if (errorUpdate) {

            /*
             * Intentar restaurar los saldos si
             * Supabase rechaza la actualización.
             */

            if (
                nuevoMetodoAfectaCuenta &&
                cuentaId
            ) {

                await modificarSaldoCuentaGasto(
                    cuentaId,
                    importe
                );

            }


            if (
                metodoAnteriorAfectaCuenta &&
                cuentaAnteriorId
            ) {

                await modificarSaldoCuentaGasto(
                    cuentaAnteriorId,
                    -importeAnterior
                );

            }


            throw errorUpdate;
        }


        console.log(
            "Gasto actualizado:",
            gastoActualizado
        );


        cerrarModalGasto();


        await cargarGastos();


        if (
            typeof cargarCuentas ===
            "function"
        ) {

            await cargarCuentas();

        }


        mostrarMensajePrincipalGasto(
            "Gasto actualizado correctamente."
        );


    } catch (error) {

        console.error(
            "Error guardando gasto:",
            error
        );


        mostrarMensajeGasto(
            "No fue posible guardar el gasto: " +
            error.message,
            true
        );


    } finally {

        if (boton) {

            boton.disabled =
                false;

            boton.textContent =
                gastoEditandoId
                    ? "Guardar cambios"
                    : "Guardar gasto";

        }

    }

}


// ======================================================
// VERIFICAR SALDO
// ======================================================

async function verificarSaldoCuentaGasto(
    cuentaId,
    importe
) {

    if (!cuentaId) {

        throw new Error(
            "No se especificó la cuenta."
        );

    }


    const {
        data: cuenta,
        error
    } = await supabaseClient

        .from("cuentas")

        .select(
            "id, saldo"
        )

        .eq(
            "id",
            cuentaId
        )

        .single();


    if (error) {
        throw error;
    }


    if (!cuenta) {

        throw new Error(
            "No se encontró la cuenta."
        );

    }


    const saldo =
        Number(
            cuenta.saldo || 0
        );


    const cantidad =
        Number(
            importe || 0
        );


    if (
        saldo < cantidad
    ) {

        throw new Error(
            `Saldo insuficiente. Disponible: ${formatearMonedaGasto(
                saldo
            )}. Necesitas: ${formatearMonedaGasto(
                cantidad
            )}.`
        );

    }

}


// ======================================================
// MODIFICAR SALDO
// ======================================================

async function modificarSaldoCuentaGasto(
    cuentaId,
    diferencia
) {

    if (!cuentaId) {

        throw new Error(
            "No se especificó la cuenta."
        );

    }


    const {
        data: cuenta,
        error: errorConsulta
    } = await supabaseClient

        .from("cuentas")

        .select(
            "id, saldo"
        )

        .eq(
            "id",
            cuentaId
        )

        .single();


    if (errorConsulta) {
        throw errorConsulta;
    }


    if (!cuenta) {

        throw new Error(
            "No se encontró la cuenta."
        );

    }


    const saldoActual =
        Number(
            cuenta.saldo || 0
        );


    const nuevoSaldo =
        saldoActual +
        Number(
            diferencia
        );


    if (
        nuevoSaldo < 0
    ) {

        throw new Error(
            "El saldo de la cuenta no puede quedar negativo."
        );

    }


    const {
        error: errorUpdate
    } = await supabaseClient

        .from("cuentas")

        .update({

            saldo:
                nuevoSaldo

        })

        .eq(
            "id",
            cuentaId
        );


    if (errorUpdate) {
        throw errorUpdate;
    }


    console.log(
        "Saldo actualizado:",
        saldoActual,
        "→",
        nuevoSaldo
    );

}


// ======================================================
// EDITAR GASTO
// ======================================================

async function editarGasto(
    id
) {

    try {

        const usuario =
            await obtenerUsuarioGasto();


        if (!usuario) {
            return;
        }


        const {
            data: gasto,
            error
        } = await supabaseClient

            .from("gastos")

            .select(`
                id,
                cuenta_id,
                categoria_id,
                concepto,
                importe,
                fecha,
                tipo,
                metodo_pago,
                recurrente,
                activo
            `)

            .eq(
                "id",
                id
            )

            .eq(
                "usuario_id",
                usuario.id
            )

            .eq(
                "activo",
                true
            )

            .single();


        if (error) {
            throw error;
        }


        if (!gasto) {

            throw new Error(
                "No se encontró el gasto."
            );

        }


        gastoEditandoId =
            gasto.id;


        document.getElementById(
            "gastoConcepto"
        ).value =
            gasto.concepto || "";


        document.getElementById(
            "gastoImporte"
        ).value =
            gasto.importe;


        document.getElementById(
            "gastoFecha"
        ).value =
            gasto.fecha;


        document.getElementById(
            "gastoTipo"
        ).value =
            gasto.tipo || "variable";


        document.getElementById(
            "gastoMetodoPago"
        ).value =
            gasto.metodo_pago || "efectivo";


        const recurrente =
            document.getElementById(
                "gastoRecurrente"
            );


        if (recurrente) {

            recurrente.checked =
                Boolean(
                    gasto.recurrente
                );

        }


        await cargarCuentasGasto(
            gasto.cuenta_id || ""
        );


        await cargarCategoriasGasto(
            gasto.categoria_id || ""
        );


        actualizarVisibilidadCuentaGasto();


        const titulo =
            document.getElementById(
                "modalGastoTitulo"
            );


        if (titulo) {

            titulo.textContent =
                "Editar gasto";

        }


        const boton =
            document.getElementById(
                "btnGuardarGasto"
            );


        if (boton) {

            boton.textContent =
                "Guardar cambios";

        }


        const modal =
            document.getElementById(
                "modalGasto"
            );


        if (modal) {

            modal.style.display =
                "flex";

        }


    } catch (error) {

        console.error(
            "Error editando gasto:",
            error
        );


        alert(
            "No fue posible abrir el gasto:\n\n" +
            error.message
        );

    }

}


// ======================================================
// ELIMINAR GASTO
// ======================================================

async function desactivarGasto(
    id
) {

    const confirmar =
        confirm(
            "¿Quieres eliminar este gasto?\n\n" +
            "Si salió de una cuenta bancaria, el importe será devuelto a esa cuenta."
        );


    if (!confirmar) {
        return;
    }


    try {

        const usuario =
            await obtenerUsuarioGasto();


        if (!usuario) {
            return;
        }


        const {
            data: gasto,
            error: errorConsulta
        } = await supabaseClient

            .from("gastos")

            .select(
                "id, cuenta_id, importe, metodo_pago, activo"
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


        if (errorConsulta) {
            throw errorConsulta;
        }


        if (
            !gasto ||
            !gasto.activo
        ) {

            throw new Error(
                "El gasto ya no está activo."
            );

        }


        const afectaCuenta =
            gasto.metodo_pago === "debito" ||
            gasto.metodo_pago === "transferencia";


        // ==================================================
        // DESACTIVAR PRIMERO
        // ==================================================

        const {
            error: errorUpdate
        } = await supabaseClient

            .from("gastos")

            .update({

                activo:
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


        if (errorUpdate) {
            throw errorUpdate;
        }


        // ==================================================
        // DEVOLVER SALDO
        // ==================================================

        if (
            afectaCuenta &&
            gasto.cuenta_id
        ) {

            await modificarSaldoCuentaGasto(
                gasto.cuenta_id,
                Number(
                    gasto.importe
                )
            );

        }


        await cargarGastos();


        if (
            typeof cargarCuentas ===
            "function"
        ) {

            await cargarCuentas();

        }


        mostrarMensajePrincipalGasto(
            "Gasto eliminado correctamente."
        );


    } catch (error) {

        console.error(
            "Error eliminando gasto:",
            error
        );


        alert(
            "No fue posible eliminar el gasto:\n\n" +
            error.message
        );

    }

}


// ======================================================
// CERRAR MODAL
// ======================================================

function cerrarModalGasto() {

    const modal =
        document.getElementById(
            "modalGasto"
        );


    if (modal) {

        modal.style.display =
            "none";

    }


    gastoEditandoId =
        null;


    limpiarFormularioGasto();

}


// ======================================================
// LIMPIAR FORMULARIO
// ======================================================

function limpiarFormularioGasto() {

    const concepto =
        document.getElementById(
            "gastoConcepto"
        );


    const importe =
        document.getElementById(
            "gastoImporte"
        );


    const fecha =
        document.getElementById(
            "gastoFecha"
        );


    const tipo =
        document.getElementById(
            "gastoTipo"
        );


    const metodo =
        document.getElementById(
            "gastoMetodoPago"
        );


    const cuenta =
        document.getElementById(
            "gastoCuenta"
        );


    const categoria =
        document.getElementById(
            "gastoCategoria"
        );


    const recurrente =
        document.getElementById(
            "gastoRecurrente"
        );


    if (concepto) {
        concepto.value = "";
    }


    if (importe) {
        importe.value = "";
    }


    if (fecha) {

        fecha.value =
            obtenerFechaHoyGasto();

    }


    if (tipo) {

        tipo.value =
            "variable";

    }


    /*
     * IMPORTANTE:
     *
     * El valor válido en Supabase es
     * "debito", NO "cuenta".
     */

    if (metodo) {

        metodo.value =
            "debito";

    }


    if (cuenta) {

        cuenta.value =
            "";

    }


    if (categoria) {

        categoria.value =
            "";

    }


    if (recurrente) {

        recurrente.checked =
            false;

    }


    actualizarVisibilidadCuentaGasto();


    const mensaje =
        document.getElementById(
            "mensajeGastoModal"
        );


    if (mensaje) {

        mensaje.textContent =
            "";

        mensaje.style.display =
            "none";

        mensaje.classList.remove(
            "mensaje-error"
        );

    }

}


// ======================================================
// FECHA ACTUAL
// ======================================================

function obtenerFechaHoyGasto() {

    const fecha =
        new Date();


    const año =
        fecha.getFullYear();


    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const dia =
        String(
            fecha.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${año}-${mes}-${dia}`;

}


// ======================================================
// FORMATEAR FECHA
// ======================================================

function formatearFechaGasto(
    fecha
) {

    if (!fecha) {
        return "";
    }


    const partes =
        fecha.split("-");


    if (
        partes.length !== 3
    ) {

        return fecha;

    }


    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


// ======================================================
// NOMBRE DEL TIPO
// ======================================================

function obtenerNombreTipoGasto(
    tipo
) {

    const nombres = {

        fijo:
            "Fijo",

        variable:
            "Variable",

        extraordinario:
            "Extraordinario",

        recurrente:
            "Recurrente"

    };


    return nombres[
        tipo
    ] || tipo || "";

}


// ======================================================
// NOMBRE DEL MÉTODO DE PAGO
// ======================================================

function obtenerNombreMetodoPago(
    metodo
) {

    const nombres = {

        debito:
            "🏦 Cuenta bancaria",

        efectivo:
            "💵 Efectivo",

        transferencia:
            "🔄 Transferencia",

        otro:
            "💳 Otro"

    };


    return nombres[
        metodo
    ] || "Método no especificado";

}


// ======================================================
// FORMATEAR MONEDA
// ======================================================

function formatearMonedaGasto(
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
// ESCAPAR HTML
// ======================================================

function escaparHTMLGasto(
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
// MENSAJE DEL MODAL
// ======================================================

function mostrarMensajeGasto(
    mensaje,
    error = false
) {

    const elemento =
        document.getElementById(
            "mensajeGastoModal"
        );


    if (!elemento) {
        return;
    }


    elemento.textContent =
        mensaje;


    elemento.style.display =
        "block";


    if (error) {

        elemento.classList.add(
            "mensaje-error"
        );

    } else {

        elemento.classList.remove(
            "mensaje-error"
        );

    }

}


// ======================================================
// MENSAJE PRINCIPAL
// ======================================================

function mostrarMensajePrincipalGasto(
    mensaje
) {

    const elemento =
        document.getElementById(
            "mensajeCuenta"
        );


    if (!elemento) {

        console.log(
            mensaje
        );

        return;

    }


    elemento.textContent =
        mensaje;


    elemento.style.display =
        "block";


    setTimeout(
        () => {

            elemento.textContent =
                "";

            elemento.style.display =
                "";

        },
        3000
    );

}


// ======================================================
// CERRAR MODAL AL HACER CLICK FUERA
// ======================================================

document.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "modalGasto"
            );


        if (!modal) {
            return;
        }


        if (
            event.target ===
            modal
        ) {

            cerrarModalGasto();

        }

    }
);


// ======================================================
// INICIAR
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        cargarGastos();

    }
);