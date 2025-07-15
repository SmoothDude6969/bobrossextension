(function() {
    try {
        console.log("Miniblox Gradient Extension: Initializing at " + new Date().toISOString());

        // Delay execution to avoid WebGL conflicts with Miniblox
        setTimeout(() => {
            console.log("Starting scene setup");

            // Create shadow DOM to isolate the scene
            const host = document.createElement('div');
            host.id = 'gradient-host';
            document.body.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            console.log("Shadow DOM created: #gradient-host");

            // Create container with styles, font, and text
            const container = document.createElement('div');
            container.id = 'gradient-container';
            container.innerHTML = `
                <style>
                    #gradient-container { 
                        margin: 0; 
                        background: black; 
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 2147483645;
                    }
                    #gradient-canvas { 
                        display: block; 
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 2147483646;
                    }
                    #gradient-title {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        color: white;
                        font-family: 'Press Start 2P', cursive, monospace;
                        font-size: 1.5em;
                        text-align: center;
                        z-index: 2147483647;
                        text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
                        cursor: pointer;
                        animation: wobble 2s ease-in-out infinite;
                        transition: transform 0.3s ease;
                    }
                    #gradient-title:hover {
                        transform: translate(-50%, -50%) scale(1.2);
                    }
                    @keyframes wobble {
                        0% { transform: translate(-50%, -50%) rotate(0deg); }
                        25% { transform: translate(-50%, -50%) rotate(2deg); }
                        75% { transform: translate(-50%, -50%) rotate(-2deg); }
                        100% { transform: translate(-50%, -50%) rotate(0deg); }
                    }
                    .hidden {
                        display: none !important;
                    }
                </style>
                <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet" id="font-link">
                <div id="gradient-title">Rainbow Client</div>
                <canvas id="gradient-canvas"></canvas>
            `;
            shadow.appendChild(container);
            console.log("Container, styles, text, and canvas injected into shadow DOM");

            // Monitor font loading
            const fontLink = container.querySelector('#font-link');
            fontLink.onload = () => console.log("Font loaded successfully");
            fontLink.onerror = () => {
                console.error("Failed to load Google Fonts");
                const title = container.querySelector('#gradient-title');
                if (title) title.style.fontFamily = 'monospace';
                console.log("Fallback to monospace font");
            };

            // Three.js script (using CDN for brevity, bundle in production)
            const threeScript = document.createElement('script');
            threeScript.src = 'https://cdn.jsdelivr.net/npm/three@0.134.0/build/three.min.js';
            threeScript.onload = function() {
                console.log("Three.js loaded successfully");
                try {
                    // Scene setup
                    console.log("Setting up Three.js scene");
                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                    const renderer = new THREE.WebGLRenderer({
                        canvas: container.querySelector('#gradient-canvas'),
                        antialias: true
                    });
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    console.log("Renderer created and canvas configured");

                    // Check WebGL availability
                    if (!renderer.getContext()) {
                        console.error("WebGL is not supported or failed to initialize");
                        // Fallback to 2D canvas
                        const canvas = container.querySelector('#gradient-canvas');
                        const ctx = canvas.getContext('2d');
                        canvas.width = window.innerWidth;
                        canvas.height = window.innerHeight;
                        let time = 0;
                        function draw2DFallback() {
                            time += 0.01;
                            const gradient = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
                            gradient.addColorStop(0, `rgb(${Math.sin(time) * 127 + 128}, ${Math.sin(time + 2) * 127 + 128}, ${Math.sin(time + 4) * 127 + 128})`);
                            gradient.addColorStop(1, `rgb(${Math.sin(time + 1) * 127 + 128}, ${Math.sin(time + 3) * 127 + 128}, ${Math.sin(time + 5) * 127 + 128})`);
                            ctx.fillStyle = gradient;
                            ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
                            requestAnimationFrame(draw2DFallback);
                        }
                        draw2DFallback();
                        console.log("2D canvas fallback started");
                        return;
                    }
                    console.log("WebGL context available");

                    // Create full-screen plane geometry
                    const aspect = window.innerWidth / window.innerHeight;
                    const geometry = new THREE.PlaneGeometry(2 * aspect, 2);
                    console.log("Full-screen plane geometry created");

                    // Custom shader for gradient effect
                    const vertexShader = `
                        varying vec2 vUv;
                        void main() {
                            vUv = uv;
                            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                        }
                    `;

                    const fragmentShader = `
                        varying vec2 vUv;
                        uniform float time;
                        void main() {
                            vec3 color1 = vec3(
                                sin(time) * 0.5 + 0.5,
                                sin(time + 2.0) * 0.5 + 0.5,
                                sin(time + 4.0) * 0.5 + 0.5
                            );
                            vec3 color2 = vec3(
                                sin(time + 1.0) * 0.5 + 0.5,
                                sin(time + 3.0) * 0.5 + 0.5,
                                sin(time + 5.0) * 0.5 + 0.5
                            );
                            vec3 color = mix(color1, color2, vUv.x);
                            gl_FragColor = vec4(color, 1.0);
                        }
                    `;

                    let material;
                    try {
                        material = new THREE.ShaderMaterial({
                            vertexShader: vertexShader,
                            fragmentShader: fragmentShader,
                            uniforms: {
                                time: { value: 0.0 }
                            }
                        });
                        console.log("Shader material created");
                    } catch (e) {
                        console.error("Shader creation failed: ", e);
                        material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
                        console.log("Fallback to magenta material");
                    }

                    const square = new THREE.Mesh(geometry, material);
                    scene.add(square);
                    console.log("Square added to scene");

                    // Camera position
                    camera.position.z = 1;
                    console.log("Camera positioned");

                    // Animation loop
                    function animate(t = 0) {
                        requestAnimationFrame(animate);
                        if (square) square.rotation.z += 0.005;
                        if (material && material.uniforms) {
                            material.uniforms.time.value = t * 0.001;
                        }
                        renderer.render(scene, camera);
                    }
                    animate();
                    console.log("Animation loop started");

                    // Handle window resize
                    window.addEventListener('resize', () => {
                        const canvas = container.querySelector('#gradient-canvas');
                        if (canvas) {
                            const aspect = window.innerWidth / window.innerHeight;
                            square.scale.set(aspect, 1, 1);
                            camera.aspect = aspect;
                            camera.updateProjectionMatrix();
                            renderer.setSize(window.innerWidth, window.innerHeight);
                            canvas.width = window.innerWidth;
                            canvas.height = window.innerHeight;
                            console.log("Window resized");
                        }
                    });

                    // Click event to hide everything
                    const title = container.querySelector('#gradient-title');
                    if (title) {
                        title.addEventListener('click', () => {
                            console.log("Title clicked, hiding container");
                            container.classList.add('hidden');
                        }, { once: true });
                        console.log("Click event listener added to title");
                    } else {
                        console.error("Title element not found");
                    }
                } catch (e) {
                    console.error("Error setting up Three.js scene: ", e);
                    container.innerHTML += '<p style="color: white; text-align: center;">Failed to set up 3D scene.</p>';
                }
            };
            threeScript.onerror = () => {
                console.error("Failed to load Three.js from CDN");
                container.innerHTML += '<p style="color: white; text-align: center;">Failed to load Three.js library.</p>';
                // Fallback to 2D canvas
                const canvas = container.querySelector('#gradient-canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                let time = 0;
                function draw2DFallback() {
                    time += 0.01;
                    const gradient = ctx.createLinearGradient(0, 0, window.innerWidth, window.innerHeight);
                    gradient.addColorStop(0, `rgb(${Math.sin(time) * 127 + 128}, ${Math.sin(time + 2) * 127 + 128}, ${Math.sin(time + 4) * 127 + 128})`);
                    gradient.addColorStop(1, `rgb(${Math.sin(time + 1) * 127 + 128}, ${Math.sin(time + 3) * 127 + 128}, ${Math.sin(time + 5) * 127 + 128})`);
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
                    requestAnimationFrame(draw2DFallback);
                }
                draw2DFallback();
                console.log("2D canvas fallback started due to Three.js failure");
            };
            container.appendChild(threeScript);
            console.log("Three.js script injected");
        }, 4000); // 4-second delay to avoid Miniblox WebGL conflicts
    } catch (e) {
        console.error("Miniblox Gradient Extension: Initialization failed: ", e);
    }
})();
