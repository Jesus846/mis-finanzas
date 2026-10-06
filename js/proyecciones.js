const estadoProyeccion = {

fecha: new Date(),

ingresos: [],

gastos: [],

comprasTarjeta: [],

deudas: [],

abonosDeuda: [],

recomendacionesAbiertas: false

};



console.log("proyecciones.js cargado");



document.addEventListener("DOMContentLoaded", function () {

configurarEventosProyecciones();

cargarProyeccion();

});



function configurarEventosProyecciones() {



const btnAnterior = document.getElementById("btnMesAnterior");

const btnSiguiente = document.getElementById("btnMesSiguiente");

const btnRecomendaciones = document.getElementById("btnMostrarRecomendaciones");



if (btnAnterior) {

    btnAnterior.addEventListener("click", function () {

        estadoProyeccion.fecha.setMonth(

            estadoProyeccion.fecha.getMonth() - 1

        );



        cargarProyeccion();

    });

}



if (btnSiguiente) {

    btnSiguiente.addEventListener("click", function () {

        estadoProyeccion.fecha.setMonth(

            estadoProyeccion.fecha.getMonth() + 1

        );



        cargarProyeccion();

    });

}



if (btnRecomendaciones) {

    btnRecomendaciones.addEventListener("click", function () {



        const panel = document.getElementById("panelRecomendaciones");



        if (!panel) {

            return;

        }



        estadoProyeccion.recomendacionesAbiertas =

            !estadoProyeccion.recomendacionesAbiertas;



        if (estadoProyeccion.recomendacionesAbiertas) {



            panel.style.display = "block";



            btnRecomendaciones.textContent =

                "▲ Ocultar recomendaciones";



            renderizarOportunidadesAbono();



            setTimeout(function () {

                panel.scrollIntoView({

                    behavior: "smooth",

                    block: "start"

                });

            }, 100);



        } else {



            panel.style.display = "none";



            btnRecomendaciones.textContent =

                "💡 Mis recomendaciones";

        }

    });

}



}



async function cargarProyeccion() {



try {



    await cargarDatosProyeccion();



    actualizarTituloMes();

    renderizarResumen();

    renderizarQuincenas();

    renderizarDetalle();

    renderizarDeudas();



    if (estadoProyeccion.recomendacionesAbiertas) {

        renderizarOportunidadesAbono();

    }



} catch (error) {



    console.error(

        "Error cargando proyección:",

        error

    );

}



}



async function cargarDatosProyeccion() {



const usuario = await obtenerUsuarioActual();



if (!usuario) {

    console.error("No hay usuario autenticado");

    return;

}



const inicioMes = obtenerInicioMes();

const finMes = obtenerFinMes();



const [

    ingresosResult,

    gastosResult,

    comprasResult,

    deudasResult,

    abonosResult

] = await Promise.all([



    supabaseClient

        .from("ingresos")

        .select("\*")

        .eq("usuario_id", usuario.id)

        .eq("activo", true),



    supabaseClient

        .from("gastos")

        .select("\*")

        .eq("usuario_id", usuario.id)

        .eq("activo", true),



    supabaseClient

        .from("compras_tarjeta")

        .select(`

            \*,

            tarjetas (

                id,

                nombre,

                banco,

                dia_corte,

                dia_pago

            )

        `)

        .eq("usuario_id", usuario.id)

        .eq("activa", true),



    supabaseClient

        .from("deudas")

        .select("\*")

        .eq("usuario_id", usuario.id)

        .eq("activa", true),



    supabaseClient

        .from("abonos_deuda")

        .select("\*")

        .eq("usuario_id", usuario.id)

        .gte(

            "fecha",

            formatearFechaSQL(inicioMes)

        )

        .lte(

            "fecha",

            formatearFechaSQL(finMes)

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



if (deudasResult.error) {

    throw deudasResult.error;

}



if (abonosResult.error) {

    throw abonosResult.error;

}



estadoProyeccion.ingresos =

    ingresosResult.data || [];



estadoProyeccion.gastos =

    gastosResult.data || [];



estadoProyeccion.comprasTarjeta =

    comprasResult.data || [];



estadoProyeccion.deudas =

    deudasResult.data || [];



estadoProyeccion.abonosDeuda =

    abonosResult.data || [];



}



async function obtenerUsuarioActual() {



const {

    data,

    error

} = await supabaseClient.auth.getUser();



if (error) {



    console.error(

        "Error obteniendo usuario:",

        error

    );



    return null;

}



return data.user;



}



function obtenerInicioMes() {



return new Date(

    estadoProyeccion.fecha.getFullYear(),

    estadoProyeccion.fecha.getMonth(),

    1

);



}



function obtenerFinMes() {



return new Date(

    estadoProyeccion.fecha.getFullYear(),

    estadoProyeccion.fecha.getMonth() + 1,

    0

);



}



function formatearFechaSQL(fecha) {



const año = fecha.getFullYear();



const mes = String(

    fecha.getMonth() + 1

).padStart(2, "0");



const dia = String(

    fecha.getDate()

).padStart(2, "0");



return `${año}-${mes}-${dia}`;



}



function formatearFecha(fecha) {



if (!fecha) {

    return "";

}



const partes =

    String(fecha).split("-");



if (partes.length !== 3) {

    return fecha;

}



return `${partes[2]}/${partes[1]}/${partes[0]}`;



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



function obtenerNombreMes() {



return estadoProyeccion.fecha.toLocaleDateString(

    "es-MX",

    {

        month: "long",

        year: "numeric"

    }

);



}



function actualizarTituloMes() {



const elemento =

    document.getElementById("mesProyeccion");



if (!elemento) {

    return;

}



const texto =

    obtenerNombreMes();



elemento.textContent =

    texto.charAt(0).toUpperCase() +

    texto.slice(1);



}



function esFechaDelMes(fecha) {



if (!fecha) {

    return false;

}



const fechaObjeto =

    convertirFecha(fecha);



if (!fechaObjeto) {

    return false;

}



const inicio =

    obtenerInicioMes();



const fin =

    obtenerFinMes();



return (

    fechaObjeto >= inicio &&

    fechaObjeto <= fin

);



}



function convertirFecha(fecha) {



if (!fecha) {

    return null;

}



if (fecha instanceof Date) {



    return new Date(

        fecha.getFullYear(),

        fecha.getMonth(),

        fecha.getDate()

    );

}



const texto =

    String(fecha);



if (texto.includes("T")) {



    const parte =

        texto.split("T")[0];



    const partes =

        parte.split("-");



    if (partes.length === 3) {



        return new Date(

            Number(partes[0]),

            Number(partes[1]) - 1,

            Number(partes[2])

        );

    }

}



const partes =

    texto.split("-");



if (partes.length === 3) {



    return new Date(

        Number(partes[0]),

        Number(partes[1]) - 1,

        Number(partes[2])

    );

}



return null;



}



function obtenerFechaIngreso(ingreso) {



return convertirFecha(

    ingreso.fecha

);



}



function obtenerIngresosMes() {



const resultado = [];



estadoProyeccion.ingresos.forEach(

    function (ingreso) {



        if (!ingreso.activo) {

            return;

        }



        const fechaBase =

            obtenerFechaIngreso(ingreso);



        if (!fechaBase) {

            return;

        }



        if (ingreso.frecuencia === "quincenal") {



            agregarIngresoQuincenal(

                ingreso,

                fechaBase,

                resultado

            );



            return;

        }



        if (ingreso.frecuencia === "mensual") {



            agregarIngresoMensual(

                ingreso,

                fechaBase,

                resultado

            );



            return;

        }



        if (ingreso.frecuencia === "semanal") {



            agregarIngresoSemanal(

                ingreso,

                fechaBase,

                resultado

            );



            return;

        }



        if (ingreso.frecuencia === "diario") {



            agregarIngresoDiario(

                ingreso,

                fechaBase,

                resultado

            );



            return;

        }



        if (esFechaDelMes(ingreso.fecha)) {



            resultado.push({

                fecha: formatearFechaSQL(fechaBase),

                concepto:

                    ingreso.concepto ||

                    "Ingreso",

                importe:

                    Number(

                        ingreso.importe || 0

                    ),

                tipo: "Ingreso"

            });

        }

    }

);



return resultado;



}



function agregarIngresoQuincenal(

ingreso,

fechaBase,

resultado

) {



const año =

    estadoProyeccion.fecha.getFullYear();



const mes =

    estadoProyeccion.fecha.getMonth();



const fecha1 =

    new Date(año, mes, 15);



const fecha2 =

    new Date(año, mes + 1, 0);



if (fecha1 >= fechaBase) {



    resultado.push({

        fecha:

            formatearFechaSQL(fecha1),

        concepto:

            ingreso.concepto ||

            "Ingreso",

        importe:

            Number(

                ingreso.importe || 0

            ),

        tipo: "Ingreso"

    });

}



if (fecha2 >= fechaBase) {



    resultado.push({

        fecha:

            formatearFechaSQL(fecha2),

        concepto:

            ingreso.concepto ||

            "Ingreso",

        importe:

            Number(

                ingreso.importe || 0

            ),

        tipo: "Ingreso"

    });

}



}



function agregarIngresoMensual(

ingreso,

fechaBase,

resultado

) {



const año =

    estadoProyeccion.fecha.getFullYear();



const mes =

    estadoProyeccion.fecha.getMonth();



const dia =

    Math.min(

        fechaBase.getDate(),

        new Date(

            año,

            mes + 1,

            0

        ).getDate()

    );



const fecha =

    new Date(

        año,

        mes,

        dia

    );



if (fecha >= fechaBase) {



    resultado.push({

        fecha:

            formatearFechaSQL(fecha),

        concepto:

            ingreso.concepto ||

            "Ingreso",

        importe:

            Number(

                ingreso.importe || 0

            ),

        tipo: "Ingreso"

    });

}



}



function agregarIngresoSemanal(

ingreso,

fechaBase,

resultado

) {



const inicio =

    obtenerInicioMes();



const fin =

    obtenerFinMes();



let fecha =

    new Date(fechaBase);



while (fecha < inicio) {



    fecha.setDate(

        fecha.getDate() + 7

    );

}



while (fecha <= fin) {



    resultado.push({

        fecha:

            formatearFechaSQL(fecha),

        concepto:

            ingreso.concepto ||

            "Ingreso",

        importe:

            Number(

                ingreso.importe || 0

            ),

        tipo: "Ingreso"

    });



    fecha.setDate(

        fecha.getDate() + 7

    );

}



}



function agregarIngresoDiario(

ingreso,

fechaBase,

resultado

) {



const inicio =

    obtenerInicioMes();



const fin =

    obtenerFinMes();



let fecha =

    new Date(fechaBase);



if (fecha < inicio) {

    fecha =

        new Date(inicio);

}



while (fecha <= fin) {



    resultado.push({

        fecha:

            formatearFechaSQL(fecha),

        concepto:

            ingreso.concepto ||

            "Ingreso",

        importe:

            Number(

                ingreso.importe || 0

            ),

        tipo: "Ingreso"

    });



    fecha.setDate(

        fecha.getDate() + 1

    );

}



}



function obtenerGastosMes() {



return estadoProyeccion.gastos

    .filter(function (gasto) {



        return (

            gasto.activo &&

            esFechaDelMes(gasto.fecha)

        );

    })

    .map(function (gasto) {



        return {

            fecha: gasto.fecha,

            concepto:

                gasto.concepto ||

                "Gasto",

            importe:

                Number(

                    gasto.importe || 0

                ),

            tipo: "Gasto",

            metodo:

                gasto.metodo_pago || ""

        };

    });



}



function obtenerPagosTarjetaMes() {



const resultado = [];



estadoProyeccion.comprasTarjeta

    .forEach(function (compra) {



        const totalMeses =

            Number(

                compra.meses_totales || 1

            );



        const mesesPagados =

            Number(

                compra.meses_pagados || 0

            );



        const mensualidad =

            Number(

                compra.mensualidad || 0

            );



        const saldo =

            Number(

                compra.saldo_pendiente || 0

            );



        if (saldo <= 0) {

            return;

        }



        if (

            mesesPagados >=

            totalMeses

        ) {

            return;

        }



        const fechaPago =

            obtenerFechaPagoProyectado(

                compra

            );



        if (!fechaPago) {

            return;

        }



        if (

            !esFechaDelMes(

                formatearFechaSQL(

                    fechaPago

                )

            )

        ) {

            return;

        }



        const importe =

            Math.min(

                mensualidad,

                saldo

            );



        if (importe <= 0) {

            return;

        }



        const tarjeta =

            compra.tarjetas || {};



        resultado.push({

            fecha:

                formatearFechaSQL(

                    fechaPago

                ),

            concepto:

                compra.concepto ||

                "Compra con tarjeta",

            importe: importe,

            tipo: "Tarjeta",

            tarjeta:

                tarjeta.nombre ||

                "Tarjeta",

            banco:

                tarjeta.banco || "",

            numeroPago:

                mesesPagados + 1,

            totalPagos:

                totalMeses,

            compraId:

                compra.id

        });

    });



return resultado;



}



function obtenerFechaPagoProyectado(compra) {



if (compra.fecha_primer_pago) {



    const fechaRegistrada =

        convertirFecha(

            compra.fecha_primer_pago

        );



    if (fechaRegistrada) {

        return fechaRegistrada;

    }

}



const tarjeta =

    compra.tarjetas;



if (!tarjeta) {



    return convertirFecha(

        compra.fecha_compra

    );

}



const fechaCompra =

    convertirFecha(

        compra.fecha_compra

    );



if (!fechaCompra) {

    return null;

}



const corte =

    Number(

        tarjeta.dia_corte || 0

    );



const pago =

    Number(

        tarjeta.dia_pago || 0

    );



if (!corte || !pago) {

    return fechaCompra;

}



let mes =

    fechaCompra.getMonth();



const año =

    fechaCompra.getFullYear();



if (

    fechaCompra.getDate() >

    corte

) {

    mes++;

}



return new Date(

    año,

    mes,

    pago

);



}



function obtenerAbonosDeudaMes() {



return estadoProyeccion.abonosDeuda

    .filter(function (abono) {



        return esFechaDelMes(

            abono.fecha

        );

    })

    .map(function (abono) {



        const deuda =

            estadoProyeccion.deudas.find(

                function (item) {

                    return (

                        item.id ===

                        abono.deuda_id

                    );

                }

            );



        return {

            fecha: abono.fecha,

            concepto:

                abono.concepto ||

                "Abono a deuda",

            importe:

                Number(

                    abono.importe || 0

                ),

            tipo: "Deuda",

            deuda:

                deuda

                    ? deuda.nombre

                    : "Deuda"

        };

    });



}



function obtenerResumenMes() {



const ingresos =

    obtenerIngresosMes();



const gastos =

    obtenerGastosMes();



const tarjetas =

    obtenerPagosTarjetaMes();



const deudas =

    obtenerAbonosDeudaMes();



const totalIngresos =

    sumarMovimientos(

        ingresos

    );



const totalGastos =

    sumarMovimientos(

        gastos

    );



const totalTarjetas =

    sumarMovimientos(

        tarjetas

    );



const totalDeudas =

    sumarMovimientos(

        deudas

    );



const compromisos =

    totalGastos +

    totalTarjetas +

    totalDeudas;



const restante =

    totalIngresos -

    compromisos;



return {

    ingresos,

    gastos,

    tarjetas,

    deudas,

    totalIngresos,

    totalGastos,

    totalTarjetas,

    totalDeudas,

    compromisos,

    restante

};



}



function sumarMovimientos(movimientos) {



return movimientos.reduce(

    function (total, movimiento) {



        return (

            total +

            Number(

                movimiento.importe || 0

            )

        );

    },

    0

);



}



function esIngresoRecibido(fecha) {



const fechaIngreso =

    convertirFecha(fecha);



if (!fechaIngreso) {

    return false;

}



const hoy =

    new Date();



const fechaHoy =

    new Date(

        hoy.getFullYear(),

        hoy.getMonth(),

        hoy.getDate()

    );



return fechaIngreso <= fechaHoy;



}



function obtenerIngresosRecibidos() {



return obtenerIngresosMes()

    .filter(function (ingreso) {



        return esIngresoRecibido(

            ingreso.fecha

        );

    });



}



function obtenerIngresosPorRecibir() {



return obtenerIngresosMes()

    .filter(function (ingreso) {



        return !esIngresoRecibido(

            ingreso.fecha

        );

    });



}



function renderizarResumen() {



const resumen =

    obtenerResumenMes();



const ingresos =

    document.getElementById(

        "proyeccionIngresos"

    );



const gastos =

    document.getElementById(

        "proyeccionGastos"

    );



const tarjetas =

    document.getElementById(

        "proyeccionTarjetas"

    );



const deudas =

    document.getElementById(

        "proyeccionDeudas"

    );



const compromisos =

    document.getElementById(

        "proyeccionCompromisos"

    );



const restante =

    document.getElementById(

        "proyeccionRestante"

    );



const recibidos =

    document.getElementById(

        "proyeccionIngresosRecibidos"

    );



const pendientes =

    document.getElementById(

        "proyeccionIngresosPendientes"

    );



if (ingresos) {



    ingresos.textContent =

        formatearMoneda(

            resumen.totalIngresos

        );

}



if (gastos) {



    gastos.textContent =

        formatearMoneda(

            resumen.totalGastos

        );

}



if (tarjetas) {



    tarjetas.textContent =

        formatearMoneda(

            resumen.totalTarjetas

        );

}



if (deudas) {



    deudas.textContent =

        formatearMoneda(

            resumen.totalDeudas

        );

}



if (compromisos) {



    compromisos.textContent =

        formatearMoneda(

            resumen.compromisos

        );

}



if (restante) {



    restante.textContent =

        formatearMoneda(

            resumen.restante

        );

}



const totalRecibido =

    sumarMovimientos(

        obtenerIngresosRecibidos()

    );



const totalPendiente =

    sumarMovimientos(

        obtenerIngresosPorRecibir()

    );



if (recibidos) {



    recibidos.textContent =

        formatearMoneda(

            totalRecibido

        );

}



if (pendientes) {



    pendientes.textContent =

        formatearMoneda(

            totalPendiente

        );

}



}



function obtenerQuincena(fecha) {



const objeto =

    convertirFecha(fecha);



if (!objeto) {

    return 0;

}



return objeto.getDate() <= 15

    ? 1

    : 2;



}



function obtenerQuincenaActual() {



const hoy =

    new Date();



const mismoMes =

    hoy.getFullYear() ===

        estadoProyeccion.fecha.getFullYear() &&

    hoy.getMonth() ===

        estadoProyeccion.fecha.getMonth();



if (mismoMes) {



    return hoy.getDate() <= 15

        ? 1

        : 2;

}



return 1;



}



function obtenerDatosQuincenas() {



const resumen =

    obtenerResumenMes();



const quincenas = [



    {

        numero: 1,

        nombre: "1ª quincena",

        ingresos: 0,

        gastos: 0,

        tarjetas: 0,

        deudas: 0

    },



    {

        numero: 2,

        nombre: "2ª quincena",

        ingresos: 0,

        gastos: 0,

        tarjetas: 0,

        deudas: 0

    }

];



resumen.ingresos.forEach(

    function (item) {



        const q =

            obtenerQuincena(

                item.fecha

            );



        if (q) {



            quincenas[q - 1]

                .ingresos +=

                Number(

                    item.importe || 0

                );

        }

    }

);



resumen.gastos.forEach(

    function (item) {



        const q =

            obtenerQuincena(

                item.fecha

            );



        if (q) {



            quincenas[q - 1]

                .gastos +=

                Number(

                    item.importe || 0

                );

        }

    }

);



resumen.tarjetas.forEach(

    function (item) {



        const q =

            obtenerQuincena(

                item.fecha

            );



        if (q) {



            quincenas[q - 1]

                .tarjetas +=

                Number(

                    item.importe || 0

                );

        }

    }

);



resumen.deudas.forEach(

    function (item) {



        const q =

            obtenerQuincena(

                item.fecha

            );



        if (q) {



            quincenas[q - 1]

                .deudas +=

                Number(

                    item.importe || 0

                );

        }

    }

);



quincenas.forEach(

    function (q) {



        q.totalCubrir =

            q.gastos +

            q.tarjetas +

            q.deudas;



        q.resultado =

            q.ingresos -

            q.totalCubrir;

    }

);



return quincenas;



}



function renderizarQuincenas() {



const tabla =

    document.getElementById(

        "tablaQuincenas"

    );



if (!tabla) {

    return;

}



const quincenas =

    obtenerDatosQuincenas();



tabla.innerHTML =

    quincenas.map(

        function (q) {



            return `

                \<tr>

                    \<td>${q.nombre}\</td>

                    \<td>${formatearMoneda(q.ingresos)}\</td>

                    \<td>${formatearMoneda(q.gastos)}\</td>

                    \<td>${formatearMoneda(q.tarjetas)}\</td>

                    \<td>${formatearMoneda(q.deudas)}\</td>

                    \<td>${formatearMoneda(q.totalCubrir)}\</td>

                    \<td>${formatearMoneda(q.resultado)}\</td>

                \</tr>

            `;

        }

    ).join("");



}



function renderizarDetalle() {



const tabla =

    document.getElementById(

        "tablaDetalle"

    );



if (!tabla) {

    return;

}



const resumen =

    obtenerResumenMes();



const movimientos = [];



resumen.ingresos.forEach(

    function (item) {



        const recibido =

            esIngresoRecibido(

                item.fecha

            );



        movimientos.push({

            fecha: item.fecha,

            tipo: "Ingreso",

            concepto: item.concepto,

            importe: item.importe,

            origen:

                recibido

                    ? "Ingreso recibido"

                    : "Ingreso por recibir"

        });

    }

);



resumen.gastos.forEach(

    function (item) {



        movimientos.push({

            fecha: item.fecha,

            tipo: "Gasto",

            concepto: item.concepto,

            importe: item.importe,

            origen:

                item.metodo ||

                "Gasto"

        });

    }

);



resumen.tarjetas.forEach(

    function (item) {



        movimientos.push({

            fecha: item.fecha,

            tipo: "Tarjeta",

            concepto:

                `${item.concepto} (${item.numeroPago}/${item.totalPagos})`,

            importe: item.importe,

            origen:

                `TARJETA DE CREDITO ${item.tarjeta}`

        });

    }

);



resumen.deudas.forEach(

    function (item) {



        movimientos.push({

            fecha: item.fecha,

            tipo: "Deuda",

            concepto: item.concepto,

            importe: item.importe,

            origen: item.deuda

        });

    }

);



movimientos.sort(

    function (a, b) {



        return (

            convertirFecha(a.fecha) -

            convertirFecha(b.fecha)

        );

    }

);



if (!movimientos.length) {



    tabla.innerHTML = `

        \<tr>

            \<td colspan="5">

                No hay movimientos proyectados para este mes.

            \</td>

        \</tr>

    `;



    return;

}



tabla.innerHTML =

    movimientos.map(

        function (item) {



            return `

                \<tr>

                    \<td>${formatearFecha(item.fecha)}\</td>

                    \<td>${item.tipo}\</td>

                    \<td>${item.concepto}\</td>

                    \<td>${formatearMoneda(item.importe)}\</td>

                    \<td>${item.origen}\</td>

                \</tr>

            `;

        }

    ).join("");



}



function renderizarDeudas() {



const tabla =

    document.getElementById(

        "tablaDeudasProyeccion"

    );



if (!tabla) {

    return;

}



const deudas =

    estadoProyeccion.deudas

        .filter(function (deuda) {



            return (

                deuda.activa &&

                Number(

                    deuda.saldo_pendiente || 0

                ) > 0

            );

        })

        .sort(function (a, b) {



            return (

                Number(

                    a.saldo_pendiente || 0

                ) -

                Number(

                    b.saldo_pendiente || 0

                )

            );

        });



if (!deudas.length) {



    tabla.innerHTML = `

        \<div

            style="

                padding:20px;

                text-align:center;

                color:#707070;

            "

        >

            No tienes deudas activas con saldo pendiente.

        \</div>

    `;



    return;

}



tabla.innerHTML = `

    \<div class="tabla-contenedor">

        \<table>

            \<thead>

                \<tr>

                    \<th>Deuda\</th>

                    \<th>Tipo\</th>

                    \<th>Saldo\</th>

                    \<th>Fecha límite\</th>

                    \<th>Situación\</th>

                \</tr>

            \</thead>



            \<tbody>



                ${deudas.map(

                    function (deuda) {



                        const saldo =

                            Number(

                                deuda.saldo_pendiente || 0

                            );



                        const fechaLimite =

                            deuda.tiene_fecha_limite

                                ? formatearFecha(

                                    deuda.fecha_limite

                                )

                                : "Sin fecha límite";



                        return `

                            \<tr>

                                \<td>${deuda.nombre || "Deuda"}\</td>

                                \<td>${deuda.tipo || "Otro"}\</td>

                                \<td>${formatearMoneda(saldo)}\</td>

                                \<td>${fechaLimite}\</td>

                                \<td>

                                    ${

                                        deuda.tiene_fecha_limite

                                            ? "Con fecha límite"

                                            : "Flexible"

                                    }

                                \</td>

                            \</tr>

                        `;

                    }

                ).join("")}



            \</tbody>

        \</table>

    \</div>

`;



}



function obtenerCombinaciones(

deudas,

disponible

) {



const resultado = [];



if (

    !deudas.length ||

    disponible <= 0

) {

    return resultado;

}



const lista =

    deudas.slice(0, 18);



function buscar(

    indice,

    seleccion,

    total

) {



    if (

        seleccion.length >= 2 &&

        total > 0 &&

        total <= disponible

    ) {



        resultado.push({

            deudas:

                seleccion.slice(),

            total:

                total,

            restante:

                disponible - total

        });

    }



    if (

        seleccion.length >= 5

    ) {

        return;

    }



    for (

        let i = indice;

        i < lista.length;

        i++

    ) {



        const saldo =

            Number(

                lista[i].saldo_pendiente || 0

            );



        if (saldo <= 0) {

            continue;

        }



        const nuevoTotal =

            total + saldo;



        if (

            nuevoTotal >

            disponible

        ) {

            continue;

        }



        seleccion.push(

            lista[i]

        );



        buscar(

            i + 1,

            seleccion,

            nuevoTotal

        );



        seleccion.pop();

    }

}



buscar(

    0,

    [],

    0

);



resultado.sort(

    function (a, b) {



        const diferenciaA =

            disponible -

            a.total;



        const diferenciaB =

            disponible -

            b.total;



        if (

            diferenciaA !==

            diferenciaB

        ) {



            return (

                diferenciaA -

                diferenciaB

            );

        }



        return (

            b.deudas.length -

            a.deudas.length

        );

    }

);



const unicas = [];

const claves = new Set();



resultado.forEach(

    function (combinacion) {



        const clave =

            combinacion.deudas

                .map(function (deuda) {

                    return deuda.id;

                })

                .sort()

                .join("|");



        if (

            !claves.has(clave)

        ) {



            claves.add(clave);



            unicas.push(

                combinacion

            );

        }

    }

);



return unicas.slice(

    0,

    10

);



}



function obtenerDineroQuincenaActual() {



const quincenas =

    obtenerDatosQuincenas();



const numero =

    obtenerQuincenaActual();



const quincena =

    quincenas[numero - 1];



if (!quincena) {



    return {

        numero: numero,

        nombre:

            numero === 1

                ? "1ª quincena"

                : "2ª quincena",

        ingresos: 0,

        gastos: 0,

        tarjetas: 0,

        deudas: 0,

        totalCubrir: 0,

        resultado: 0

    };

}



return quincena;



}



function obtenerSaldoCompraRecomendacion(compra) {
    const saldo = Number(compra.saldo_pendiente || 0);
    if (saldo > 0) return saldo;
    const original = Number(compra.monto_original || 0);
    const mensualidad = Number(compra.mensualidad || 0);
    const pagados = Number(compra.meses_pagados || 0);
    return original > 0 ? Math.max(0, original - mensualidad * pagados) : 0;
}

function obtenerDatosRecomendacionCompra(compra) {
    const saldo = obtenerSaldoCompraRecomendacion(compra);
    const mensualidad = Math.max(0, Number(compra.mensualidad || 0));
    const total = Math.max(0, Number(compra.meses_totales || 0));
    const pagados = Math.max(0, Number(compra.meses_pagados || 0));
    let pagosRestantes = Math.max(0, total - pagados);
    if (pagosRestantes === 0 && saldo > 0 && mensualidad > 0) {
        pagosRestantes = Math.ceil(saldo / mensualidad);
    }
    return {
        compra,
        id: compra.id,
        concepto: compra.concepto || compra.descripcion || "Compra con tarjeta",
        tarjeta: compra.tarjetas?.nombre || "Tarjeta",
        saldo,
        mensualidad,
        pagosRestantes,
        fechaFin: compra.fecha_fin || ""
    };
}

function obtenerOportunidadesComprasProyeccion() {
    return estadoProyeccion.comprasTarjeta
        .filter(function (compra) {
            return compra && compra.activa !== false;
        })
        .map(obtenerDatosRecomendacionCompra)
        .filter(function (item) {
            return item.saldo > 0;
        });
}

function obtenerOportunidadesDeudasProyeccion() {
    return estadoProyeccion.deudas
        .filter(function (deuda) {
            return deuda && deuda.activa !== false && Number(deuda.saldo_pendiente || 0) > 0;
        })
        .map(function (deuda) {
            return {
                deuda,
                id: deuda.id,
                concepto: deuda.nombre || deuda.concepto || deuda.descripcion || "Deuda pendiente",
                tarjeta: "Deuda registrada",
                saldo: Number(deuda.saldo_pendiente || 0),
                mensualidad: Number(deuda.mensualidad || deuda.pago_mensual || deuda.abono_mensual || 0),
                pagosRestantes: Number(deuda.pagos_restantes || deuda.meses_restantes || 0),
                fechaLimite: deuda.fecha_limite || ""
            };
        });
}

function ordenarRecomendacionesPorLiberacion(lista) {
    return [...lista].sort(function (a, b) {
        const aScore = a.mensualidad * Math.max(1, a.pagosRestantes);
        const bScore = b.mensualidad * Math.max(1, b.pagosRestantes);
        if (aScore !== bScore) return bScore - aScore;
        return a.saldo - b.saldo;
    });
}

function obtenerCombinacionesRecomendacion(lista) {
    const ordenadas = [...lista].sort((a, b) => a.saldo - b.saldo).slice(0, 10);
    const resultado = [];
    function buscar(indice, seleccion, total) {
        if (seleccion.length >= 2) resultado.push({items:[...seleccion], total});
        if (seleccion.length >= 4) return;
        for (let i = indice; i < ordenadas.length; i++) {
            const item = ordenadas[i];
            const nuevoTotal = total + item.saldo;
            if (nuevoTotal > 5000) continue;
            buscar(i + 1, [...seleccion, item], nuevoTotal);
        }
    }
    buscar(0, [], 0);
    const unicas = new Map();
    resultado.forEach(function (combo) {
        const clave = combo.items.map(item => item.id).sort().join("|");
        if (!unicas.has(clave)) unicas.set(clave, combo);
    });
    return [...unicas.values()]
        .sort((a,b) => a.items.length !== b.items.length ? b.items.length - a.items.length : a.total - b.total)
        .slice(0, 5);
}
function escaparHtmlProyeccion(valor) {

    return String(valor ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}
function renderizarOportunidadesAbono() {
    const contenedor = document.getElementById("contenidoOportunidadesAbono");
    if (!contenedor) return;

    // Este módulo es independiente de ingresos y del dinero disponible.
    const compras = obtenerOportunidadesComprasProyeccion();
    const deudas = obtenerOportunidadesDeudasProyeccion();
    const obligaciones = [...compras, ...deudas];

    if (!obligaciones.length) {
        contenedor.innerHTML = `
            <div style="padding:20px;text-align:center;color:#707070;">
                <h3>🎉 No encontré obligaciones pendientes</h3>
                <p>No hay compras de tarjeta ni deudas activas con saldo pendiente para analizar.</p>
            </div>`;
        return;
    }

    const pequenas = [...obligaciones].sort((a,b) => a.saldo - b.saldo).slice(0,6);
    const mayorLiberacion = ordenarRecomendacionesPorLiberacion(obligaciones)
        .filter(item => item.mensualidad > 0).slice(0,5);
    const proximasATerminar = [...compras]
        .filter(item => item.pagosRestantes > 0)
        .sort((a,b) => a.pagosRestantes !== b.pagosRestantes ? a.pagosRestantes - b.pagosRestantes : a.saldo - b.saldo)
        .slice(0,5);
    const combinaciones = obtenerCombinacionesRecomendacion(obligaciones);
    const principal = pequenas[0];

    let html = `
        <div style="padding:18px;border-radius:16px;background:linear-gradient(135deg,#eef8f1,#f8fbff);border:1px solid #dfe8e2;margin-bottom:20px;">
            <div style="font-size:13px;color:#65706a;margin-bottom:6px;">🧠 ASISTENTE FINANCIERO</div>
            <h3 style="margin:0 0 8px 0;">Recomendaciones para liberarte más rápido</h3>
            <p style="margin:0;color:#626b66;line-height:1.5;">Analizo tus compras y deudas pendientes sin tomar en cuenta tus ingresos. Busco obligaciones pequeñas, pagos que puedas adelantar y compromisos cuya liquidación pueda liberar una mensualidad importante.</p>
        </div>`;

    if (principal) {
        const esCompra = !!principal.compra;
        const motivo = esCompra && principal.pagosRestantes > 1 && principal.mensualidad > 0
            ? `Es una obligación pequeña de ${formatearMoneda(principal.saldo)} y todavía tiene ${principal.pagosRestantes} pagos de aproximadamente ${formatearMoneda(principal.mensualidad)}.`
            : `Es una de las obligaciones con menor saldo pendiente: ${formatearMoneda(principal.saldo)}.`;
        html += `
            <div style="padding:18px;border-radius:14px;background:#fff;border:2px solid #b9dfc5;margin-bottom:22px;box-shadow:0 4px 12px rgba(0,0,0,.04);">
                <div style="font-weight:700;font-size:17px;margin-bottom:8px;">⭐ Mi primera recomendación</div>
                <div style="font-size:20px;font-weight:700;margin-bottom:5px;">${escaparHtmlProyeccion(principal.concepto)}</div>
                <div style="color:#68716b;margin-bottom:12px;">${escaparHtmlProyeccion(principal.tarjeta)}</div>
                <div style="display:flex;gap:14px;flex-wrap:wrap;margin-bottom:12px;">
                    <span><strong>Saldo:</strong> ${formatearMoneda(principal.saldo)}</span>
                    ${esCompra ? `<span><strong>Pagos restantes:</strong> ${principal.pagosRestantes}</span>` : ""}
                    ${principal.mensualidad > 0 ? `<span><strong>Pago:</strong> ${formatearMoneda(principal.mensualidad)}</span>` : ""}
                </div>
                <div style="padding:12px;border-radius:10px;background:#f4faf5;line-height:1.5;"><strong>💡 ¿Por qué?</strong><br>${motivo}<br><br>Si tu objetivo es reducir el número de obligaciones, esta es una de las primeras que tendría sentido revisar para una posible liquidación.</div>
            </div>`;
    }

    html += `<div style="margin-bottom:22px;padding:14px 16px;border-radius:12px;background:#fff8e8;color:#6d6250;line-height:1.5;">📌 <strong>Importante:</strong> estas son oportunidades matemáticas, no órdenes de pago. No utilizan tus ingresos ni modifican ninguna deuda.</div>`;

    if (pequenas.length) {
        html += `
            <div style="margin-bottom:24px;">
                <h3>🟢 1. Las pequeñas que podrías quitarte primero</h3>
                <p style="color:#68716b;line-height:1.5;">Si tu objetivo es disminuir rápidamente el número de obligaciones, aquí están las de menor saldo pendiente.</p>
                <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;"><thead><tr>
                    <th style="text-align:left;padding:9px;">Obligación</th><th style="text-align:left;padding:9px;">Origen</th><th style="text-align:right;padding:9px;">Saldo</th><th style="text-align:right;padding:9px;">Pagos</th><th style="text-align:right;padding:9px;">Pago periódico</th>
                </tr></thead><tbody>
                ${pequenas.map(item => `<tr>
                    <td style="padding:9px;border-top:1px solid #eee;"><strong>${escaparHtmlProyeccion(item.concepto)}</strong></td>
                    <td style="padding:9px;border-top:1px solid #eee;">${escaparHtmlProyeccion(item.tarjeta)}</td>
                    <td style="padding:9px;border-top:1px solid #eee;text-align:right;">${formatearMoneda(item.saldo)}</td>
                    <td style="padding:9px;border-top:1px solid #eee;text-align:right;">${item.pagosRestantes > 0 ? item.pagosRestantes : "—"}</td>
                    <td style="padding:9px;border-top:1px solid #eee;text-align:right;">${item.mensualidad > 0 ? formatearMoneda(item.mensualidad) : "—"}</td>
                </tr>`).join("")}
                </tbody></table></div>
            </div>`;
    }

    if (mayorLiberacion.length) {
        html += `
            <div style="margin-bottom:24px;"><h3>💰 2. Las que más dinero periódico podrían liberar</h3>
            <p style="color:#68716b;line-height:1.5;">Aquí priorizamos las compras que tienen una mensualidad importante.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;">
            ${mayorLiberacion.map(item => `<div style="padding:14px;border:1px solid #e4e7e5;border-radius:12px;background:#fff;">
                <strong>${escaparHtmlProyeccion(item.concepto)}</strong><div style="font-size:13px;color:#737a76;margin:5px 0 10px;">${escaparHtmlProyeccion(item.tarjeta)}</div>
                <div style="font-size:18px;font-weight:700;">${formatearMoneda(item.mensualidad)}</div>
                <div style="font-size:13px;color:#68716b;margin-top:4px;">que podrías dejar de arrastrar por periodo</div>
                <div style="font-size:13px;color:#68716b;margin-top:8px;">Saldo registrado: ${formatearMoneda(item.saldo)}</div>
                <div style="font-size:13px;color:#68716b;margin-top:3px;">${item.pagosRestantes} pago${item.pagosRestantes === 1 ? "" : "s"} restante${item.pagosRestantes === 1 ? "" : "s"}</div>
            </div>`).join("")}</div></div>`;
    }

    if (proximasATerminar.length) {
        html += `
            <div style="margin-bottom:24px;"><h3>⚡ 3. Pagos que podrías adelantar</h3>
            <p style="color:#68716b;line-height:1.5;">No siempre necesitas liquidar todo. Puedes considerar adelantar uno o más pagos para reducir el tiempo que una compra seguirá apareciendo.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;">
            ${proximasATerminar.map(item => {
                const unPago = item.mensualidad > 0 ? Math.min(item.saldo,item.mensualidad) : item.saldo;
                const dosPagos = item.mensualidad > 0 ? Math.min(item.saldo,item.mensualidad*2) : item.saldo;
                return `<div style="padding:14px;border:1px solid #e4e7e5;border-radius:12px;background:#fff;"><strong>${escaparHtmlProyeccion(item.concepto)}</strong><div style="font-size:13px;color:#737a76;margin:5px 0 10px;">${escaparHtmlProyeccion(item.tarjeta)}</div><div style="line-height:1.55;">Te quedan <strong>${item.pagosRestantes}</strong> pagos.<br>Adelantar 1: <strong>${formatearMoneda(unPago)}</strong>${item.pagosRestantes > 1 ? `<br>Adelantar 2: <strong>${formatearMoneda(dosPagos)}</strong>` : ""}</div></div>`;
            }).join("")}</div></div>`;
    }

    if (combinaciones.length) {
        html += `
            <div style="margin-bottom:24px;"><h3>🚀 4. Combinaciones para quitarte varias pequeñas</h3>
            <p style="color:#68716b;line-height:1.5;">Son escenarios de referencia para ver cuánto tendrías que destinar para eliminar varias obligaciones pequeñas al mismo tiempo.</p>
            ${combinaciones.map((combo,indice) => `<div style="padding:14px;margin-bottom:10px;border:1px solid #e4e7e5;border-radius:12px;background:#fff;"><strong>Opción ${indice+1}</strong><div style="margin-top:8px;">${combo.items.map(item => `<span style="display:inline-block;margin:3px 5px 3px 0;padding:6px 9px;border-radius:8px;background:#f4f6f5;">${escaparHtmlProyeccion(item.concepto)} · ${formatearMoneda(item.saldo)}</span>`).join("")}</div><div style="margin-top:8px;"><strong>Total para liquidarlas: ${formatearMoneda(combo.total)}</strong></div></div>`).join("")}</div>`;
    }

    if (deudas.length) {
        html += `
            <div style="margin-bottom:24px;"><h3>💳 5. Deudas personales que también puedes revisar</h3>
            <p style="color:#68716b;line-height:1.5;">Se muestran separadas de las compras de tarjeta.</p>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:12px;">
            ${deudas.slice(0,6).map(item => `<div style="padding:14px;border:1px solid #e4e7e5;border-radius:12px;background:#fff;"><strong>${escaparHtmlProyeccion(item.concepto)}</strong><div style="font-size:19px;font-weight:700;margin-top:8px;">${formatearMoneda(item.saldo)}</div><div style="font-size:13px;color:#68716b;margin-top:5px;">${item.fechaLimite ? "Fecha límite: " + escaparHtmlProyeccion(item.fechaLimite) : "Sin fecha límite registrada"}</div></div>`).join("")}</div></div>`;
    }

    html += `<div style="margin-top:20px;padding:16px;border-radius:12px;background:#f8f8f8;color:#707070;line-height:1.5;"><strong>ℹ️ Nota sobre las recomendaciones</strong><br>El sistema analiza los saldos y pagos registrados. No realiza pagos automáticamente. Antes de liquidar una compra, confirma con la institución el monto exacto de liquidación, porque puede existir una diferencia respecto al saldo registrado.</div>`;

    contenedor.innerHTML = html;
}


function renderizarListaDeudasInformativa(

deudas,

dineroQuincena

) {



let html = `



    \<div

        style="

            margin-top:25px;

        "

    >



        \<h3>

            📋 Todas tus deudas, de menor a mayor

        \</h3>



        \<p>

            Esta lista es informativa y te permite ver

            qué tan cerca estás de poder liquidar cada deuda.

        \</p>



        \<div class="tabla-contenedor">



            \<table>



                \<thead>



                    \<tr>

                        \<th>Orden\</th>

                        \<th>Deuda\</th>

                        \<th>Saldo\</th>

                        \<th>Situación\</th>

                        \<th>Abono máximo proyectado\</th>

                    \</tr>



                \</thead>



                \<tbody>



`;



deudas.forEach(

    function (deuda, indice) {



        const saldo =

            Number(

                deuda.saldo_pendiente || 0

            );



        let situacion =

            "No alcanza para liquidarla";



        if (

            dineroQuincena > 0 &&

            saldo <= dineroQuincena

        ) {



            situacion =

                "Podría liquidarse";



        } else if (

            dineroQuincena > 0

        ) {



            situacion =

                "Podría recibir un abono";

        }



        const abono =

            Math.min(

                saldo,

                dineroQuincena

            );



        html += `



            \<tr>



                \<td>

                    ${indice + 1}

                \</td>



                \<td>

                    \<strong>

                        ${deuda.nombre}

                    \</strong>

                \</td>



                \<td>

                    ${formatearMoneda(saldo)}

                \</td>



                \<td>

                    ${situacion}

                \</td>



                \<td>

                    ${formatearMoneda(abono)}

                \</td>



            \</tr>



        `;

    }

);



html += `



                \</tbody>



            \</table>



        \</div>



    \</div>



`;



return html;



}