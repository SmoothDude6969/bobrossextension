(function() {
    try {
        console.log("Miniblox RGB Sphere Extension: Initializing at " + new Date().toISOString());

        // Delay execution to avoid WebGL conflicts with Miniblox
        setTimeout(() => {
            console.log("Starting scene setup");

            // Create shadow DOM to isolate the scene
            const host = document.createElement('div');
            host.id = 'rgb-host';
            document.body.appendChild(host);
            const shadow = host.attachShadow({ mode: 'open' });
            console.log("Shadow DOM created: #rgb-host");

            // Create container
            const container = document.createElement('div');
            container.id = 'rgb-container';
            container.innerHTML = `
                <style>
                    #rgb-container { 
                        margin: 0; 
                        background: black; 
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        z-index: 2147483646;
                    }
                    #rgb-canvas { 
                        display: block; 
                        position: absolute;
                        top: 0;
                        left: 0;
                        z-index: 2147483647;
                    }
                    #fallback-canvas {
                        display: none;
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        z-index: 2147483647;
                    }
                </style>
                <canvas id="fallback-canvas"></canvas>
            `;
            shadow.appendChild(container);
            console.log("Container and styles injected into shadow DOM");

            // Check if Three.js is available
            if (typeof THREE === 'undefined') {
                console.log("Three.js not loaded yet, attempting to initialize");
                // Bundle Three.js (simplified subset for WebGLRenderer and shaders)
                // Note: Due to size, we'll simulate loading and proceed with fallback if needed
                console.warn("Three.js not bundled; attempting WebGL setup");
            } else {
                console.log("Three.js already available");
            }

            try {
                // Scene setup
                console.log("Setting up Three.js scene");
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                const renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.domElement.id = 'rgb-canvas';
                container.appendChild(renderer.domElement);
                console.log("Renderer created and canvas appended");

                // Check WebGL availability
                if (!renderer.getContext()) {
                    console.error("WebGL is not supported or failed to initialize");
                    container.innerHTML += '<p style="color: white; text-align: center;">WebGL is not supported in your browser.</p>';
                    throw new Error("WebGL not supported");
                }
                console.log("WebGL context available");

                // Create sphere geometry
                const geometry = new THREE.SphereGeometry(1, 32, 32);
                console.log("Sphere geometry created");

                // Custom shader for RGB glow effect
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

                try {
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
                    console.log("Shader material created");
                    const sphere = new THREE.Mesh(geometry, material);
                    scene.add(sphere);
                    console.log("Sphere added to scene");
                } catch (e) {
                    console.error("Shader creation failed: ", e);
                    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
                    const sphere = new THREE.Mesh(geometry, fallbackMaterial);
                    scene.add(sphere);
                    console.log("Fallback sphere (magenta) added to scene");
                }

                // Add point light for additional glow
                const pointLight = new THREE.PointLight(0xffffff, 1.5, 5);
                pointLight.position.set(0, 0, 0);
                scene.add(pointLight);
                console.log("Point light added");

                // Camera position
                camera.position.z = 3;
                console.log("Camera positioned");

                // Animation loop
                function animate(t = 0) {
                    requestAnimationFrame(animate);
                    if (sphere) sphere.rotation.y += 0.01;
                    if (material && material.uniforms) {
                        material.uniforms.time.value = t * 0.001;
                    }
                    renderer.render(scene, camera);
                }
                animate();
                console.log("Animation loop started");

                // Handle window resize
                window.addEventListener('resize', () => {
                    camera.aspect = window.innerWidth / window.innerHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    console.log("Window resized");
                });
            } catch (e) {
                console.error("Three.js scene setup failed: ", e);
                console.log("Attempting 2D canvas fallback");
                const fallbackCanvas = container.querySelector('#fallback-canvas');
                fallbackCanvas.style.display = 'block';
                fallbackCanvas.width = 200;
                fallbackCanvas.height = 200;
                const ctx = fallbackCanvas.getContext('2d');
                if (ctx) {
                    console.log("Drawing 2D fallback sphere");
                    let time = 0;
                    function drawFallback(t) {
                        requestAnimationFrame(drawFallback);
                        ctx.clearRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
                        const r = Math.sin(t * 0.001) * 0.5 + 0.5;
                        const g = Math.sin(t * 0.001 + 2) * 0.5 + 0.5;
                        const b = Math.sin(t * 0.001 + 4) * 0.5 + 0.5;
                        ctx.beginPath();
                        ctx.arc(100, 100, 80, 0, 2 * Math.PI);
                        ctx.fillStyle = `rgb(${r * 255}, ${g * 255}, ${b * 255})`;
                        ctx.fill();
                        time += 16;
                    }
                    drawFallback(0);
                } else {
                    console.error("2D canvas context not available");
                    container.innerHTML += '<p style="color: white; text-align: center;">Failed to render sphere.</p>';
                }
            }
        }, 5000); // 5-second delay to avoid Miniblox WebGL conflicts
    } catch (e) {
        console.error("Miniblox RGB Sphere Extension: Initialization failed: ", e);
    }
})();
