// api/db.js
export default async function handler(req, res) {
    
    // 1. RECOGER VARIABLES DE ENTORNO
    const url = process.env.SUPABASE_URL;
    const anonKey = process.env.SUPABASE_ANON_KEY;
    const claveMaestra = process.env.CLAVE_MAESTRA; 

    // 2. VALIDACIÓN DE SEGURIDAD
    // Comprobamos si el cliente nos envía la clave correcta en las cabeceras
    const claveRecibida = req.headers['x-api-key'];

    if (!claveRecibida || claveRecibida !== claveMaestra) {
        return res.status(401).json({ 
            error: "Acceso no autorizado. La clave de seguridad es incorrecta o no se ha proporcionado." 
        });
    }

    // 3. CONFIGURACIÓN DE CABECERAS PARA SUPABASE
    const headers = {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    try {
        // --- (POST) ---
        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            
            const fetchRes = await fetch(`${url}/rest/v1/lista-partidas`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });
            
            const result = await fetchRes.json();
            return res.status(200).json(result);
        }

        // --- (GET) ---
        if (req.method === 'GET') {
            const nombre = req.query.nombre;
            if (!nombre) {
                return res.status(400).json({ error: "Falta el nombre de la obra para realizar la búsqueda." });
            }

            const fetchRes = await fetch(`${url}/rest/v1/lista-partidas?nombre_obra=eq.${encodeURIComponent(nombre)}&select=*&order=created_at.desc&limit=1`, {
                headers: headers
            });
            
            const result = await fetchRes.json();
            return res.status(200).json(result);
        }

        // If not POST or GET
        return res.status(405).json({ error: "Método no permitido" });

    } catch (error) {
        console.error("Error en el servidor:", error);
        return res.status(500).json({ error: "Error interno del servidor: " + error.message });
    }
}