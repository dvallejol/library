// Intercambio de formularios en la interfaz gráfica
const loginBox = document.getElementById('loginBox');
const registerBox = document.getElementById('registerBox');
const toRegister = document.getElementById('toRegister');
const toLogin = document.getElementById('toLogin');

toRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginBox.classList.add('hidden');
    registerBox.classList.remove('hidden');
});

toLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerBox.classList.add('hidden');
    loginBox.classList.remove('hidden');
});

// --- CONSUMO DE LA API DESDE EL BACKEND ---

// 1. Manejo del Formulario de Registro
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const correo = document.getElementById('regCorreo').value.trim();
    const password = document.getElementById('regPassword').value;

    // Validación básica en frontend
    if (password.length < 6) {
        Swal.fire({
            icon: 'warning',
            title: 'Contraseña muy corta',
            text: 'La contraseña debe tener al menos 6 caracteres.',
            confirmButtonColor: '#007bff'
        });
        return;
    }

    try {
        // 🚀 CORREGIDO: Usando ruta relativa para Vercel
        const response = await fetch('/api/usuarios/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, correo, password })
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Registro Exitoso!',
                text: 'Usuario registrado con éxito. Ya puedes iniciar sesión.',
                confirmButtonColor: '#007bff'
            }).then(() => {
                document.getElementById('registerForm').reset();
                toLogin.click(); // Redirige automáticamente al Login
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error de Registro',
                text: data.error || 'Error al registrar usuario.',
                confirmButtonColor: '#007bff'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'Hubo un problema de conexión con el servidor.',
            confirmButtonColor: '#007bff'
        });
    }
});

// 2. Manejo del Formulario de Login
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const correo = document.getElementById('loginCorreo').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
        // 🚀 CORREGIDO: Usando ruta relativa para Vercel
        const response = await fetch('/api/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ correo, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Guardamos temporalmente el nombre del usuario en la sesión del navegador
            sessionStorage.setItem('usuarioLogueado', JSON.stringify(data.usuario));
            
            Swal.fire({
                icon: 'success',
                title: `¡Bienvenido, ${data.usuario.nombre}!`,
                text: 'Ingresando al sistema de gestión...',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'dashboard.html'; 
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Acceso Denegado',
                text: data.error || 'Credenciales incorrectas.',
                confirmButtonColor: '#007bff'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'Hubo un problema de conexión con el servidor.',
            confirmButtonColor: '#007bff'
        });
    }
});

// --- LÓGICA UNIFICADA PARA MOSTRAR / OCULTAR CONTRASEÑAS ---

// Control del ojo para el LOGIN
document.getElementById('toggleLoginPassword').addEventListener('click', function () {
    const loginPasswordInput = document.getElementById('loginPassword');
    
    if (loginPasswordInput.type === 'password') {
        loginPasswordInput.type = 'text';
        this.textContent = '🙈';
    } else {
        loginPasswordInput.type = 'password';
        this.textContent = '👁️';
    }
});

// Control del ojo para el REGISTRO
document.getElementById('toggleRegPassword').addEventListener('click', function () {
    const regPasswordInput = document.getElementById('regPassword');
    
    if (regPasswordInput.type === 'password') {
        regPasswordInput.type = 'text';
        this.textContent = '🙈';
    } else {
        regPasswordInput.type = 'password';
        this.textContent = '👁️';
    }
});