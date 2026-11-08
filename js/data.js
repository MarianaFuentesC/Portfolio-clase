/* =========================================================
   TODO EL CONTENIDO DEL PORTAFOLIO VIVE AQUÍ
   - Cambia tus datos en `profile`.
   - Cada capítulo = un objeto 3D + los trabajos que aparecen con él.
   - Para un trabajo: pon `image` (o `video`) con la ruta del archivo.
     Si lo dejas vacío se ve un placeholder de color.
   - Cuando tengas tu modelo de Blender, pon `model: 'assets/models/laptop.glb'`
     y las partículas tomarán la forma de tu modelo.
   ========================================================= */

export const profile = {
  firstName: 'Mariana',
  lastName: 'Fuentes',
  initials: 'MF',
  role: 'Creación Digital',
  disciplines: ['UI/UX', 'Posters', 'Contenido', '3D'],
  bio: 'Estudio Creación Digital en la Universidad El Bosque. Diseño todo lo que vive en una pantalla: interfaces, piezas gráficas, contenido y objetos 3D.',
  location: 'Bogotá, CO',
  email: 'marianafc05@icloud.com',
  phone: '302 312 9387',
  photo: 'assets/img/mariana.jpg',
  // parte de la foto que se vuelve partículas al inicio: [x, y, ancho, alto] en fracciones (0–1)
  photoCrop: [0.31, 0.29, 0.36, 0.3],
  socials: [],
};

// shape: laptop | poster | phone | camera | light  (formas incluidas)
export const chapters = [
  {
    id: 'web',
    shape: 'laptop',
    object: 'Computador',
    title: 'UI/UX & Web',
    line: 'Interfaces que se entienden sin manual.',
    model: null,
    works: [
      { title: 'KidVault', type: 'UX/UI · TriaLab × Global Seguros', year: 2026, ratio: '16/9', tone: '#06122a', full: true, image: 'assets/img/web-kidvault.jpg', link: '' },
      { title: 'Portafolio interactivo', type: 'Web · Three.js', year: 2026, ratio: '4/3', tone: '#4a4a46', image: '', link: '' },
      { title: 'Rediseño e-commerce', type: 'UX research · Prototipo', year: 2025, ratio: '16/10', tone: '#5b3d34', image: '', link: '' },
    ],
  },
  {
    id: 'posters',
    shape: 'poster',
    object: 'Poster',
    title: 'Posters & Publicidad',
    line: 'Una idea, una imagen, un segundo para atraparte.',
    model: null,
    works: [
      { title: 'Olivia Rodrigo · Estéreo Picnic', type: 'Rediseño de poster', year: 2026, ratio: '1587/2245', tone: '#d9b8ee', full: true, image: 'assets/img/poster-olivia-estereo.jpg', link: '' },
      { title: 'Coca-Cola Lima', type: 'Publicidad · Ilustración', year: 2026, ratio: '16/9', tone: '#eef5e4', full: true, image: 'assets/img/publicidad-cocacola.jpg', link: '' },
      { title: 'Flowers Shop', type: 'Poster', year: 2026, ratio: '1610/2400', tone: '#f6ebe3', full: true, image: 'assets/img/poster-flower-shop.jpg', link: '' },
    ],
  },
  {
    id: 'contenido',
    shape: 'phone',
    object: 'Celular',
    title: 'Creación de contenido',
    line: 'Historias pensadas para el scroll.',
    model: null,
    works: [
      { title: 'Reels de marca', type: 'Video vertical', year: 2026, ratio: '9/16', tone: '#3c2f4d', image: '', link: '' },
      { title: 'Carrusel educativo', type: 'Social media', year: 2025, ratio: '4/5', tone: '#2e4a48', image: '', link: '' },
      { title: 'Motion para stories', type: 'Animación', year: 2025, ratio: '9/16', tone: '#4d3a2c', image: '', link: '' },
    ],
  },
  {
    id: 'foto-video',
    shape: 'camera',
    object: 'Cámara',
    title: 'Foto & Video',
    line: 'Mirar antes de diseñar.',
    model: null,
    works: [
      { title: 'Retrato urbano', type: 'Fotografía', year: 2026, ratio: '4/5', tone: '#3a3a3a', image: '', link: '' },
      { title: 'Producto en estudio', type: 'Foto de producto', year: 2025, ratio: '1/1', tone: '#55483a', image: '', link: '' },
      { title: 'Corto', type: 'Video · Edición', year: 2026, ratio: '16/9', tone: '#28323a', full: true, video: 'assets/videos/corto.mp4', image: '', link: '' },
    ],
  },
  {
    id: '3d',
    shape: 'light',
    object: 'Luz de estudio',
    title: '3D & Render',
    line: 'Objetos que no existen, iluminados como si sí.',
    model: null,
    works: [
      { title: 'Graduación', type: 'Blender · Render', year: 2026, ratio: '1/1', tone: '#b4b4b4', image: 'assets/img/3d-birrete.jpg', link: '' },
      { title: 'Animación de producto', type: 'Blender · Animación', year: 2026, ratio: '16/9', tone: '#4b3232', image: '', link: '' },
      { title: 'Social en 3D', type: 'Blender · Render', year: 2026, ratio: '4/5', tone: '#b4b4b4', image: 'assets/img/3d-celular.jpg', link: '' },
    ],
  },
];
