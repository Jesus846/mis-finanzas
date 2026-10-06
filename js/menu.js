// ======================================================
// MENÚ PRINCIPAL
// MIS FINANZAS
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    crearMenu();

});


// ======================================================
// CREAR MENÚ
// ======================================================

function crearMenu() {

    const contenedor =
        document.getElementById("menuPrincipal");

    if (!contenedor) {
        return;
    }

    const paginaActual =
        window.location.pathname
            .split("/")
            .pop() || "index.html";

    contenedor.innerHTML = `

        <div class="menu-lateral">

            <div class="menu-logo">
                <div class="menu-logo-icono">💰</div>

                <div>
                    <strong>Mis Finanzas</strong>
                    <small>Control financiero</small>
                </div>
            </div>


            <nav class="menu-navegacion">

                <a href="index.html"
                   class="menu-item ${paginaActual === "index.html" ? "activo" : ""}">
                    <span>🏠</span>
                    <span>Inicio</span>
                </a>


                <a href="ingresos.html"
                   class="menu-item ${paginaActual === "ingresos.html" ? "activo" : ""}">
                    <span>💰</span>
                    <span>Ingresos</span>
                </a>


                <a href="gastos.html"
                   class="menu-item ${paginaActual === "gastos.html" ? "activo" : ""}">
                    <span>💸</span>
                    <span>Gastos</span>
                </a>


                <a href="tarjetas.html"
                   class="menu-item ${paginaActual === "tarjetas.html" ? "activo" : ""}">
                    <span>💳</span>
                    <span>Tarjetas</span>
                </a>


                <a href="deudas.html"
                   class="menu-item ${paginaActual === "deudas.html" ? "activo" : ""}">
                    <span>💰</span>
                    <span>Deudas</span>
                </a>


                <a href="calendario.html"
                   class="menu-item ${paginaActual === "calendario.html" ? "activo" : ""}">
                    <span>📅</span>
                    <span>Calendario</span>
                </a>


                <a href="proyecciones.html"
                   class="menu-item ${paginaActual === "proyecciones.html" ? "activo" : ""}">
                    <span>📊</span>
                    <span>Proyecciones</span>
                </a>


                <a href="configuracion.html"
                   class="menu-item ${paginaActual === "configuracion.html" ? "activo" : ""}">
                    <span>⚙️</span>
                    <span>Configuración</span>
                </a>

            </nav>


            <div class="menu-abajo">

                <button
                    type="button"
                    class="menu-cerrar-sesion"
                    onclick="cerrarSesionMenu()">

                    <span>🚪</span>
                    <span>Cerrar sesión</span>

                </button>

            </div>

        </div>


        <div class="menu-movil-barra">

            <button
                type="button"
                onclick="abrirMenuMovil()">

                ☰

            </button>

            <strong>Mis Finanzas</strong>

            <div></div>

        </div>


        <div
            id="menuMovilOverlay"
            class="menu-movil-overlay"
            onclick="cerrarMenuMovil()">

        </div>


        <div
            id="menuMovil"
            class="menu-movil">

            <div class="menu-movil-cabecera">

                <strong>💰 Mis Finanzas</strong>

                <button
                    type="button"
                    onclick="cerrarMenuMovil()">

                    ✕

                </button>

            </div>


            <nav>

                <a href="index.html">
                    🏠 Inicio
                </a>

                <a href="ingresos.html">
                    💰 Ingresos
                </a>

                <a href="gastos.html">
                    💸 Gastos
                </a>

                <a href="tarjetas.html">
                    💳 Tarjetas
                </a>

                <a href="deudas.html">
                    💰 Deudas
                </a>

                <a href="calendario.html">
                    📅 Calendario
                </a>

                <a href="proyecciones.html">
                    📊 Proyecciones
                </a>

                <a href="configuracion.html">
                    ⚙️ Configuración
                </a>

            </nav>

        </div>

    `;

}


// ======================================================
// MENÚ MÓVIL
// ======================================================

function abrirMenuMovil() {

    const menu =
        document.getElementById("menuMovil");

    const overlay =
        document.getElementById("menuMovilOverlay");

    if (menu) {
        menu.classList.add("abierto");
    }

    if (overlay) {
        overlay.classList.add("visible");
    }

}


function cerrarMenuMovil() {

    const menu =
        document.getElementById("menuMovil");

    const overlay =
        document.getElementById("menuMovilOverlay");

    if (menu) {
        menu.classList.remove("abierto");
    }

    if (overlay) {
        overlay.classList.remove("visible");
    }

}


// ======================================================
// CERRAR SESIÓN
// ======================================================

async function cerrarSesionMenu() {

    try {

        if (typeof supabaseClient !== "undefined") {

            await supabaseClient.auth.signOut();

        }

    } catch (error) {

        console.error(
            "Error cerrando sesión:",
            error
        );

    }

    window.location.href = "login.html";

}