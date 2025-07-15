(function () {
  // Create container for the sphere and text
  const container = document.createElement('div');
  container.id = 'rainbow-sphere-container';
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.left = '0';
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.zIndex = '1000000';
  container.style.pointerEvents = 'none'; // Allow clicks to pass through to the page

  // Add HTML for title and credits
  container.innerHTML = `
    <div id="rainbow-title" style="
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 2em;
      text-align: center;
      z-index: 1000002;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      cursor: pointer;
      animation: wobble 2s ease-in-out infinite;
      transition: transform 0.3s ease;
      pointer-events: auto;
    ">Rainbow Client</div>
    <div id="rainbow-credits" style="
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-family: Arial, sans-serif;
      font-size: 1.2em;
      text-align: center;
      z-index: 1000002;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
      pointer-events: none;
    ">Made by SmoothDude, Mystic, Jouda</div>
  `;

  // Add CSS for wobble and hover effects
  const style = document.createElement('style');
  style.textContent = `
    @keyframes wobble {
      0% { transform: translateX(-50%) rotate(0deg); }
      25% { transform: translateX(-50%) rotate(2deg); }
      75% { transform: translateX(-50%) rotate(-2deg); }
      100% { transform: translateX(-50%) rotate(0deg); }
    }
    #rainbow-title:hover {
      transform: translateX(-50%) scale(1.2);
    }
    .hidden {
      display: none !important;
    }
    #rainbow-canvas {
      position: absolute;
      top: 0;
      left: 0;
      z-index: 1000001;
    }
  `;
  document.head.appendChild(style);

  // Load Three.js
  const threeScript = document.createElement('script');
  threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
  threeScript.onload = () => {
    // Three.js scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    const canvas = renderer.domElement;
    canvas.id = 'rainbow-canvas';
    container.appendChild(canvas);
    document.body.appendChild(container);

    // Check WebGL availability
    if (!renderer.getContext()) {
      console.error("WebGL is not supported or failed to initialize.");
      container.innerHTML += '<p style="color: white; text-align: center; z-index: 1000002;">WebGL is not supported in your browser.</p>';
      return;
    }

    // Create sphere geometry
    const geometry = new THREE.SphereGeometry(1, 32, 32);

    // Custom shader for rainbow glow effect
    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float time;
      uniform float glowIntensity;
      void main() {
        vec3 color = vec3(
          sin(vPosition.x + time) * 0.5 + 0.5,
          sin(vPosition.y + time + 2.0) * 0.5 + 0.5,
          sin(vPosition.z + time + 4.0) * 0.5 + 0.5
        );
        float intensity = pow(0.6 - dot(vNormal, normalize(-vPosition)), 2.0) * glowIntensity;
        gl_FragColor = vec4(color * intensity, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        time: { value: 0.0 },
        glowIntensity: { value: 1.5 }
      },
      transparent: true,
      side: THREE.FrontSide
    });

    // Create sphere mesh
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Add point light for additional glow
    const pointLight = new THREE.PointLight(0xffffff, 1.5, 5);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);

    // Camera position
    camera.position.z = 3;

    // Animation loop
    function animate(t = 0) {
      requestAnimationFrame(animate);
      sphere.rotation.y += 0.01;
      material.uniforms.time.value = t * 0.001;
      renderer.render(scene, camera);
    }
    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Click event to hide everything
    const title = document.getElementById('rainbow-title');
    title.addEventListener('click', () => {
      container.classList.add('hidden');
      scene.children.forEach(child => scene.remove(child));
    });
  };
  threeScript.onerror = () => {
    console.error("Failed to load Three.js script.");
    container.innerHTML += '<p style="color: white; text-align: center; z-index: 1000002;">Failed to load Three.js.</p>';
  };
  document.head.appendChild(threeScript);
})();
