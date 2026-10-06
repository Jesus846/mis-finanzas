// ============================================
// AUTENTICACIÓN
// MIS FINANZAS
// ============================================


// ============================================
// MOSTRAR LOGIN
// ============================================

function mostrarLogin() {

    document.getElementById("loginForm").style.display = "block";
    document.getElementById("registerForm").style.display = "none";

}


// ============================================
// MOSTRAR REGISTRO
// ============================================

function mostrarRegistro() {

    document.getElementById("loginForm").style.display = "none";
    document.getElementById("registerForm").style.display = "block";

}


// ============================================
// INICIAR SESIÓN
// ============================================

async function iniciarSesion() {

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;


    const mensaje =
        document.getElementById("loginMessage");


    mensaje.textContent = "";


    if (!email || !password) {

        mensaje.textContent =
            "Escribe tu correo y contraseña.";

        return;
    }


    mensaje.textContent =
        "Iniciando sesión...";


    const { data, error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });


    if (error) {

        console.error(error);

        mensaje.textContent =
            "Error: " + error.message;

        return;
    }


    console.log("Sesión iniciada:", data);


    window.location.href =
        "index.html";

}


// ============================================
// REGISTRAR USUARIO
// ============================================

async function registrarUsuario() {

    const nombre =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const password2 =
        document.getElementById("registerPassword2").value;


    const mensaje =
        document.getElementById("registerMessage");


    mensaje.textContent = "";


    if (!nombre) {

        mensaje.textContent =
            "Escribe tu nombre.";

        return;
    }


    if (!email) {

        mensaje.textContent =
            "Escribe tu correo.";

        return;
    }


    if (password.length < 6) {

        mensaje.textContent =
            "La contraseña debe tener al menos 6 caracteres.";

        return;
    }


    if (password !== password2) {

        mensaje.textContent =
            "Las contraseñas no coinciden.";

        return;
    }


    mensaje.textContent =
        "Creando cuenta...";


    const { data, error } =
        await supabaseClient.auth.signUp({

            email: email,

            password: password,

            options: {

                data: {

                    nombre: nombre

                }

            }

        });


    if (error) {

        console.error(error);

        mensaje.textContent =
            "Error: " + error.message;

        return;
    }


    console.log("Usuario registrado:", data);


    mensaje.textContent =
        "Cuenta creada correctamente. Revisa tu correo para confirmar la cuenta.";

}


// ============================================
// CERRAR SESIÓN
// ============================================

async function cerrarSesion() {

    const { error } =
        await supabaseClient.auth.signOut();


    if (error) {

        console.error(
            "Error al cerrar sesión:",
            error
        );

        return;
    }


    window.location.href =
        "login.html";

}