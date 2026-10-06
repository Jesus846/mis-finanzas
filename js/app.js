// ======================================================
// APLICACIÓN
// MIS FINANZAS
// ======================================================

document.addEventListener("DOMContentLoaded", async () => {

    mostrarFecha();

    comprobarConexion();

    // CARGAR CUENTAS
    if (typeof cargarCuentas === "function") {
        cargarCuentas();
    }

    // CARGAR INGRESOS
    if (typeof cargarIngresos === "function") {
        cargarIngresos();
    }

    // CARGAR TARJETAS
    if (typeof cargarTarjetas === "function") {
        cargarTarjetas();
    }

});


// ======================================================
// FECHA ACTUAL
// ======================================================

function mostrarFecha() {

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

async function comprobarConexion() {

    const estado =
        document.getElementById("estadoConexion");

    if (!estado) {
        return;
    }

    try {

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

            estado.textContent =
                "Supabase respondió, pero hubo un problema al consultar.";

            return;
        }

        estado.textContent =
            "✅ Conexión con Supabase funcionando correctamente.";

    } catch (error) {

        console.error(
            "Error de conexión:",
            error
        );

        estado.textContent =
            "❌ No fue posible conectar con Supabase.";
    }
}